import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, executeTransaction } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export function createLineAdminRoutes(io) {
  const router = Router();

  // Middleware: Requiere ser Administrador de Línea, Superadmin o Chofer (para registrar vueltas)
  router.use(requireAuth, requireRole('ADMIN_LINEA', 'SUPERADMIN', 'ADMIN', 'CHOFER'));

  // Helper para obtener el line_id del usuario actual (o por query si es Superadmin)
  const getTargetLineId = (req) => {
    if (req.session.user.role === 'ADMIN_LINEA' || req.session.user.role === 'CHOFER') {
      return req.session.user.line_id;
    }
    return req.query.line_id ? Number(req.query.line_id) : req.session.user.line_id;
  };

  /**
   * GET /api/line-admin/kpis
   * Métricas particulares de la Línea
   */
  router.get('/kpis', (req, res) => {
    try {
      const lineId = getTargetLineId(req);
      if (!lineId) {
        return res.status(400).json({ success: false, error: 'No se encontró línea asignada al usuario.' });
      }

      const line = db.prepare('SELECT * FROM lines WHERE id = ?').get(lineId);
      if (!line) {
        return res.status(404).json({ success: false, error: 'Línea no encontrada.' });
      }

      const vehicleCount = db.prepare('SELECT COUNT(*) as count FROM micros WHERE line_id = ?').get(lineId).count;
      const driverCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE line_id = ? AND role = 'CHOFER'").get(lineId).count;
      const trackingActiveCount = db.prepare('SELECT COUNT(*) as count FROM micros WHERE line_id = ? AND tracking_active = 1').get(lineId).count;

      // Recaudación en Rondas
      const roundsSum = db.prepare(`
        SELECT COALESCE(SUM(r.total_collected), 0) as sum, COUNT(r.id) as count 
        FROM rounds r 
        JOIN micros m ON r.micro_id = m.id 
        WHERE m.line_id = ?
      `).get(lineId);

      // Recaudación en Pagos Web
      const paymentsSum = db.prepare(`
        SELECT COALESCE(SUM(p.amount), 0) as sum 
        FROM payments p 
        JOIN micros m ON p.micro_id = m.id 
        WHERE m.line_id = ?
      `).get(lineId).sum;

      const gross = roundsSum.sum + paymentsSum;
      const commissionRate = line.commission_percentage || 10.0;
      const commissionAmount = gross * (commissionRate / 100);
      const net = gross - commissionAmount;

      res.json({
        success: true,
        line,
        kpis: {
          vehicleCount,
          driverCount,
          trackingActiveCount,
          totalRounds: roundsSum.count,
          grossRevenue: gross,
          commissionPercentage: commissionRate,
          commissionDeducted: commissionAmount,
          netRevenue: net
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/line-admin/vehicles
   * Listar todos los micros registrados en esta Línea
   */
  router.get('/vehicles', (req, res) => {
    try {
      const lineId = getTargetLineId(req);
      const vehicles = db.prepare(`
        SELECT m.*, u.full_name as driver_name, u.phone as driver_phone, u.license_number
        FROM micros m
        LEFT JOIN users u ON m.driver_id = u.id
        WHERE m.line_id = ?
        ORDER BY m.internal_number ASC
      `).all(lineId);

      res.json({ success: true, vehicles });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/line-admin/vehicles
   * Registrar nuevo micro para la línea (con placa, modelo y capacidad)
   */
  router.post('/vehicles', (req, res) => {
    try {
      const lineId = getTargetLineId(req);
      const { internal_number, license_plate, vehicle_model, year, capacity_max, driver_id } = req.body;

      if (!internal_number) {
        return res.status(400).json({ success: false, error: 'El número interno es obligatorio.' });
      }

      const capacity = Number(capacity_max) || 22;
      if (capacity < 18 || capacity > 25) {
        return res.status(400).json({ success: false, error: 'El aforo máximo debe estar entre 18 y 25 personas (RF-06).' });
      }

      const exists = db.prepare('SELECT id FROM micros WHERE line_id = ? AND internal_number = ?').get(lineId, internal_number);
      if (exists) {
        return res.status(409).json({ success: false, error: `El número interno ${internal_number} ya existe en tu línea.` });
      }

      const result = db.prepare(`
        INSERT INTO micros (line_id, internal_number, license_plate, vehicle_model, year, capacity_max, driver_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'INACTIVO')
      `).run(
        lineId,
        Number(internal_number),
        license_plate ? license_plate.trim().toUpperCase() : null,
        vehicle_model ? vehicle_model.trim() : 'Microbus Urbano',
        year ? Number(year) : 2020,
        capacity,
        driver_id || null
      );

      res.status(201).json({
        success: true,
        message: `Micro #${internal_number} registrado correctamente en la línea.`,
        vehicleId: result.lastInsertRowid
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PATCH /api/line-admin/vehicles/:id/tracking
   * Activar o pausar el rastreo de un micro (para que los estudiantes lo vean en la App Móvil)
   */
  router.patch('/vehicles/:id/tracking', (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      const { tracking_active } = req.body;
      const activeState = tracking_active ? 1 : 0;

      db.prepare(`
        UPDATE micros 
        SET tracking_active = ?, status = CASE WHEN ? = 1 THEN 'EN_RUTA' ELSE 'INACTIVO' END, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(activeState, activeState, vehicleId);

      const micro = db.prepare(`
        SELECT m.*, l.line_number 
        FROM micros m JOIN lines l ON m.line_id = l.id 
        WHERE m.id = ?
      `).get(vehicleId);

      // Notificar por WebSocket a la app móvil y clientes web
      io.emit('micro:tracking_status_changed', {
        microId: vehicleId,
        lineNumber: micro?.line_number,
        trackingActive: activeState,
        status: micro?.status
      });

      res.json({
        success: true,
        message: activeState === 1 ? 'Rastreo ACTIVADO. La unidad ahora es visible en la App Móvil.' : 'Rastreo DESACTIVADO.',
        micro
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/line-admin/drivers
   * Listar choferes creados para esta Línea
   */
  router.get('/drivers', (req, res) => {
    try {
      const lineId = getTargetLineId(req);
      const drivers = db.prepare(`
        SELECT u.id, u.full_name, u.email, u.phone, u.license_number, u.created_at,
               m.id as assigned_micro_id, m.internal_number as assigned_internal_number, m.license_plate
        FROM users u
        LEFT JOIN micros m ON m.driver_id = u.id
        WHERE u.line_id = ? AND u.role = 'CHOFER'
        ORDER BY u.full_name ASC
      `).all(lineId);

      res.json({ success: true, drivers });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/line-admin/drivers
   * Crear cuenta de Chofer para que pueda iniciar sesión en la App Móvil
   */
  router.post('/drivers', async (req, res) => {
    try {
      const lineId = getTargetLineId(req);
      const { full_name, email, password, phone, license_number, assign_micro_id } = req.body;

      if (!full_name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Nombre completo, correo de acceso y contraseña son requeridos para crear el chofer.'
        });
      }

      const emailExists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
      if (emailExists) {
        return res.status(409).json({ success: false, error: 'El correo electrónico ya se encuentra registrado.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const driverId = executeTransaction((txn) => {
        const stmt = txn.prepare(`
          INSERT INTO users (line_id, email, password_hash, role, full_name, phone, license_number)
          VALUES (?, ?, ?, 'CHOFER', ?, ?, ?)
        `);
        const result = stmt.run(
          lineId,
          email.toLowerCase().trim(),
          passwordHash,
          full_name.trim(),
          phone ? phone.trim() : null,
          license_number ? license_number.trim().toUpperCase() : null
        );
        const newDriverId = Number(result.lastInsertRowid);

        // Si se seleccionó asignar a un micro de la línea
        if (assign_micro_id) {
          txn.prepare('UPDATE micros SET driver_id = ? WHERE id = ? AND line_id = ?')
            .run(newDriverId, assign_micro_id, lineId);
        }

        return newDriverId;
      });

      res.status(201).json({
        success: true,
        message: `Conductor ${full_name} registrado exitosamente. Ya puede iniciar sesión en la App Móvil con su correo y contraseña.`,
        driverId
      });

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/line-admin/rounds
   * Listar rondas / vueltas de la línea
   */
  router.get('/rounds', (req, res) => {
    try {
      const lineId = getTargetLineId(req);
      const rounds = db.prepare(`
        SELECT r.*, m.internal_number, m.license_plate, u.full_name as driver_name
        FROM rounds r
        JOIN micros m ON r.micro_id = m.id
        LEFT JOIN users u ON r.driver_id = u.id
        WHERE m.line_id = ?
        ORDER BY r.start_time DESC
        LIMIT 50
      `).all(lineId);

      res.json({ success: true, rounds });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/line-admin/rounds
   * Registrar una nueva ronda / vuelta completada
   */
  router.post('/rounds', (req, res) => {
    try {
      const lineId = getTargetLineId(req);
      const { micro_id, driver_id, round_number, start_time, end_time, passengers_count, total_collected } = req.body;

      if (!micro_id || !round_number) {
        return res.status(400).json({ success: false, error: 'Micro y número de vuelta son requeridos.' });
      }

      const result = db.prepare(`
        INSERT INTO rounds (micro_id, driver_id, round_number, start_time, end_time, passengers_count, total_collected, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETADA')
      `).run(
        micro_id,
        driver_id || null,
        Number(round_number),
        start_time || new Date().toISOString(),
        end_time || new Date().toISOString(),
        Number(passengers_count) || 0,
        parseFloat(total_collected) || 0.0
      );

      res.status(201).json({
        success: true,
        message: 'Ronda registrada exitosamente en el historial de la línea.',
        roundId: result.lastInsertRowid
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
