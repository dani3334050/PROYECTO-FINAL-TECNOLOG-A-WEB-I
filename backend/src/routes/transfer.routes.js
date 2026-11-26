import { Router } from 'express';
import { db, executeTransaction } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export function createTransferRoutes(io) {
  const router = Router();

  /**
   * POST /api/transfers/relief
   * RF-08: Trasbordo por descanso / relevo operativo (Transacción ACID RNF-03)
   * El micro saliente retiene su recaudación contable y el micro entrante asume a los pasajeros sin cobrarles
   */
  router.post('/relief', requireAuth, requireRole('CHOFER', 'ADMIN'), (req, res) => {
    try {
      const { source_micro_id, target_micro_id } = req.body;

      if (!source_micro_id || !target_micro_id) {
        return res.status(400).json({ success: false, error: 'Debe especificar el micro que descansa y el micro de relevo.' });
      }

      if (source_micro_id === target_micro_id) {
        return res.status(400).json({ success: false, error: 'El micro de relevo debe ser una unidad distinta.' });
      }

      const transferResult = executeTransaction((txn) => {
        const sourceMicro = txn.prepare('SELECT * FROM micros WHERE id = ?').get(source_micro_id);
        const targetMicro = txn.prepare('SELECT * FROM micros WHERE id = ?').get(target_micro_id);

        if (!sourceMicro || !targetMicro) {
          throw new Error('Una de las unidades no existe.');
        }

        // Obtener todos los boletos activos en el micro saliente
        const activeTickets = txn.prepare(`
          SELECT * FROM tickets 
          WHERE micro_id = ? AND status = 'ACTIVO'
        `).all(source_micro_id);

        const passengersToTransfer = activeTickets.length;

        // Validar si el micro de relevo tiene capacidad suficiente para absorber a los pasajeros
        const targetAvailableSeats = targetMicro.capacity_max - targetMicro.current_passengers;
        if (passengersToTransfer > targetAvailableSeats) {
          throw new Error(
            `El micro de relevo no tiene suficiente capacidad. Requiere ${passengersToTransfer} cupos pero solo tiene ${targetAvailableSeats} libres.`
          );
        }

        // Transferir cada boleto al nuevo micro manteniendo la referencia contable original
        for (const ticket of activeTickets) {
          // Actualizar micro actual del ticket
          txn.prepare(`
            UPDATE tickets 
            SET micro_id = ?, is_transfer = 1, status = 'ACTIVO'
            WHERE id = ?
          `).run(target_micro_id, ticket.id);

          // Registrar en auditoría de trasbordos
          txn.prepare(`
            INSERT INTO transfers (transfer_type, source_micro_id, target_micro_id, ticket_id, passenger_id, reason)
            VALUES ('RELEVO', ?, ?, ?, ?, 'Relevo programado por descanso operativo')
          `).run(source_micro_id, target_micro_id, ticket.id, ticket.user_id);
        }

        // Poner micro saliente en descanso y resetear su aforo a 0 (pero sus pagos quedan intactos en payments)
        txn.prepare(`
          UPDATE micros 
          SET status = 'EN_DESCANSO', current_passengers = 0, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(source_micro_id);

        // Aumentar aforo del micro entrante con los pasajeros transferidos
        const newTargetCount = targetMicro.current_passengers + passengersToTransfer;
        txn.prepare(`
          UPDATE micros 
          SET current_passengers = ?, status = 'ACTIVO', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newTargetCount, target_micro_id);

        return {
          transferredCount: passengersToTransfer,
          sourceMicroId: source_micro_id,
          targetMicroId: target_micro_id,
          newTargetCount
        };
      });

      // Notificaciones WebSocket en tiempo real
      io.emit('transfer:relief_executed', transferResult);
      io.emit('micro:status_changed', { microId: source_micro_id, status: 'EN_DESCANSO' });
      io.emit('micro:occupancy_updated', {
        microId: target_micro_id,
        currentPassengers: transferResult.newTargetCount
      });

      res.json({
        success: true,
        message: `Trasbordo por relevo completado exitosamente. Se transfirieron ${transferResult.transferredCount} pasajeros sin costo adicional.`,
        details: transferResult
      });

    } catch (error) {
      console.error('Error en trasbordo por relevo:', error.message);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/transfers/emergency
   * RF-09: Botón de contingencia por falla mecánica o emergencia del chofer (RNF-07)
   */
  router.post('/emergency', requireAuth, requireRole('CHOFER', 'ADMIN'), (req, res) => {
    try {
      const { micro_id, reason } = req.body;

      if (!micro_id) {
        return res.status(400).json({ success: false, error: 'Identificador del micro requerido.' });
      }

      const emergencyResult = executeTransaction((txn) => {
        const micro = txn.prepare('SELECT * FROM micros WHERE id = ?').get(micro_id);
        if (!micro) throw new Error('Unidad no encontrada.');

        // Inhabilitar micro y marcar en EMERGENCIA
        txn.prepare(`
          UPDATE micros 
          SET status = 'EMERGENCIA', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(micro_id);

        // Obtener todos los pasajeros activos
        const activeTickets = txn.prepare(`
          SELECT * FROM tickets 
          WHERE micro_id = ? AND status = 'ACTIVO'
        `).all(micro_id);

        // Convertir cada boleto activo en un 'Pase de Trasbordo de Emergencia Gratuito'
        for (const ticket of activeTickets) {
          txn.prepare(`
            UPDATE tickets 
            SET is_transfer = 1 
            WHERE id = ?
          `).run(ticket.id);

          txn.prepare(`
            INSERT INTO transfers (transfer_type, source_micro_id, target_micro_id, ticket_id, passenger_id, reason)
            VALUES ('EMERGENCIA', ?, NULL, ?, ?, ?)
          `).run(micro_id, ticket.id, ticket.user_id, reason || 'Falla mecánica en ruta');
        }

        return {
          microId: micro_id,
          affectedPassengers: activeTickets.length,
          status: 'EMERGENCIA'
        };
      });

      // Difundir alerta inmediata a toda la red por WebSocket (< 2 segundos RNF-07)
      io.emit('micro:emergency_declared', {
        microId: micro_id,
        reason: reason || 'Falla mecánica / Contingencia del conductor',
        message: 'Unidad fuera de servicio por emergencia. Se han emitido pases de trasbordo gratuitos a los pasajeros a bordo.'
      });

      res.json({
        success: true,
        message: 'Alerta de emergencia declarada. La unidad fue retirada del mapa y los pasajeros cuentan con pase de trasbordo libre.',
        emergency: emergencyResult
      });

    } catch (error) {
      console.error('Error al declarar emergencia:', error.message);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/transfers/passenger-alight
   * RF-06, RF-10: Decrementar aforo cuando un pasajero desciende del micro
   */
  router.post('/passenger-alight', requireAuth, requireRole('CHOFER'), (req, res) => {
    try {
      const { micro_id } = req.body;
      const driverId = req.session.user.id;

      const micro = db.prepare('SELECT * FROM micros WHERE id = ?').get(micro_id);
      if (!micro) return res.status(404).json({ success: false, error: 'Micro no encontrado' });

      if (micro.current_passengers <= 0) {
        return res.status(400).json({ success: false, error: 'El micro ya se encuentra vacío (0 pasajeros).' });
      }

      const updatedCount = micro.current_passengers - 1;
      db.prepare('UPDATE micros SET current_passengers = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(updatedCount, micro_id);

      io.emit('micro:occupancy_updated', {
        microId: micro.id,
        currentPassengers: updatedCount,
        capacityMax: micro.capacity_max,
        isFull: false
      });

      res.json({
        success: true,
        currentPassengers: updatedCount,
        availableSeats: micro.capacity_max - updatedCount
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
