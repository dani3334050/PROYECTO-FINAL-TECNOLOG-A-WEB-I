import { Router } from 'express';
import crypto from 'node:crypto';
import { db, executeTransaction } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

export function createPaymentRoutes(io) {
  const router = Router();

  /**
   * GET /api/payments/fares
   * Listar tarifas vigentes por categoría (RF-04)
   */
  router.get('/fares', (req, res) => {
    try {
      const fares = db.prepare('SELECT * FROM fares').all();
      res.json({ success: true, fares });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/payments/pay-ticket
   * Procesamiento de pasaje vía pasarela de tarjeta de crédito (RF-04, RF-05, RF-06, RNF-03, RNF-04)
   */
  router.post('/pay-ticket', requireAuth, (req, res) => {
    try {
      const userId = req.session.user.id;
      const { micro_id, card_number, card_holder, expiry, cvv } = req.body;

      if (!micro_id || !card_number) {
        return res.status(400).json({ success: false, error: 'Debe especificar el micro y datos de tarjeta de crédito.' });
      }

      // 1. Determinar categoría del usuario y tarifa automáticamente (RF-04)
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      let category = 'GENERAL';

      if (user.role === 'ESTUDIANTE') {
        const student = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(userId);
        if (student) {
          category = student.student_type; // 'UNIVERSITARIO' o 'ESCOLAR'
        }
      }

      // Buscar el importe exacto para la categoría (el chofer no puede alterarlo RF-04)
      const fareRow = db.prepare('SELECT price FROM fares WHERE category = ?').get(category);
      const amount = fareRow ? fareRow.price : (category === 'ESCOLAR' ? 0.80 : category === 'UNIVERSITARIO' ? 1.00 : 2.00);

      // 2. Validación de tarjeta de crédito (simulación segura con tokenización RNF-04)
      const cleanCard = String(card_number).replace(/\s+/g, '');
      if (cleanCard.length < 13 || cleanCard.length > 19) {
        return res.status(400).json({ success: false, error: 'Número de tarjeta de crédito inválido.' });
      }
      const cardLast4 = cleanCard.slice(-4);

      // 3. Ejecución atómica ACID de aforo y emisión de boleto (RNF-03, RF-06)
      const ticketResult = executeTransaction((txn) => {
        // Consultar el micro actual y bloquear fila con SELECT para consistencia
        const micro = txn.prepare('SELECT * FROM micros WHERE id = ?').get(micro_id);
        if (!micro) {
          throw new Error('La unidad seleccionada no existe.');
        }

        if (micro.status !== 'ACTIVO' && micro.status !== 'EN_RUTA') {
          throw new Error(`La unidad no está en servicio activo (Estado actual: ${micro.status}).`);
        }

        // RF-06: Validar aforo actual contra capacidad máxima (18 a 25 personas)
        if (micro.current_passengers >= micro.capacity_max) {
          throw new Error('CAPACIDAD MÁXIMA ALCANZADA: La unidad se encuentra llena. No se admiten más pasajes.');
        }

        // Registrar el pago
        const paymentStmt = txn.prepare(`
          INSERT INTO payments (user_id, micro_id, amount, fare_category, card_last4, card_brand, status)
          VALUES (?, ?, ?, ?, ?, 'VISA', 'COMPLETADO')
        `);
        const paymentRes = paymentStmt.run(userId, micro_id, amount, category, cardLast4);
        const paymentId = Number(paymentRes.lastInsertRowid);

        // Incrementar aforo en la unidad
        const newPassengerCount = micro.current_passengers + 1;
        txn.prepare(`
          UPDATE micros 
          SET current_passengers = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newPassengerCount, micro_id);

        // Generar código de boleto digital único
        const ticketCode = `RB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        // Insertar boleto
        const ticketStmt = txn.prepare(`
          INSERT INTO tickets (ticket_code, payment_id, user_id, micro_id, original_micro_id, fare_category, status)
          VALUES (?, ?, ?, ?, ?, ?, 'ACTIVO')
        `);
        const ticketRes = ticketStmt.run(ticketCode, paymentId, userId, micro_id, micro_id, category);
        const ticketId = Number(ticketRes.lastInsertRowid);

        return {
          ticketId,
          ticketCode,
          amount,
          category,
          cardLast4,
          newPassengerCount,
          capacityMax: micro.capacity_max,
          microId: micro.id
        };
      });

      // 4. Emitir evento WebSocket en tiempo real de ocupación y abordaje (RNF-02, RF-10)
      io.emit('micro:occupancy_updated', {
        microId: ticketResult.microId,
        currentPassengers: ticketResult.newPassengerCount,
        capacityMax: ticketResult.capacityMax,
        isFull: ticketResult.newPassengerCount >= ticketResult.capacityMax
      });

      // Notificar al panel del chofer con datos del pasajero para validación visual (RF-10)
      const studentDetails = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(userId);
      io.emit(`driver:${ticketResult.microId}:passenger_boarded`, {
        ticketCode: ticketResult.ticketCode,
        category: ticketResult.category,
        amount: ticketResult.amount,
        passengerName: user.full_name,
        photoUrl: studentDetails ? studentDetails.photo_url : null,
        codeStudent: studentDetails ? studentDetails.code_student : null,
        institution: studentDetails ? studentDetails.institution : null,
        currentPassengers: ticketResult.newPassengerCount,
        capacityMax: ticketResult.capacityMax,
        boardedAt: new Date().toLocaleTimeString('es-BO')
      });

      return res.status(201).json({
        success: true,
        message: 'Pasaje pagado y emitido con éxito.',
        ticket: ticketResult
      });

    } catch (error) {
      console.error('Error al procesar boleto:', error.message);
      return res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/payments/my-tickets
   * Obtener historial de boletos del usuario autenticado (Cookie session)
   */
  router.get('/my-tickets', requireAuth, (req, res) => {
    try {
      const userId = req.session.user.id;
      const tickets = db.prepare(`
        SELECT t.*, p.amount, p.card_last4, 
               m.internal_number, l.line_number, l.name as line_name,
               om.internal_number as original_internal_number
        FROM tickets t
        LEFT JOIN payments p ON t.payment_id = p.id
        JOIN micros m ON t.micro_id = m.id
        JOIN lines l ON m.line_id = l.id
        LEFT JOIN micros om ON t.original_micro_id = om.id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC
      `).all(userId);

      res.json({ success: true, tickets });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
