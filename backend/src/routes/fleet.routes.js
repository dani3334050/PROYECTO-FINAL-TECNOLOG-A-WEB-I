import { Router } from 'express';
import { db, executeTransaction } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getSimulationStatus, dispatchNextMicro } from '../utils/simulator.js';

export function createFleetRoutes(io) {
  const router = Router();

  /**
   * GET /api/fleet/simulation/status
   * Estado y cuenta regresiva de la simulación de salidas de terminal
   */
  router.get('/simulation/status', (req, res) => {
    try {
      const status = getSimulationStatus();
      res.json({ success: true, ...status });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/fleet/simulation/dispatch-now
   * Disparar manualmente una salida de chofer/micro desde terminal
   */
  router.post('/simulation/dispatch-now', (req, res) => {
    try {
      const dispatched = dispatchNextMicro(io);
      if (!dispatched) {
        return res.status(400).json({ success: false, message: 'No hay unidades disponibles para salida' });
      }
      res.json({ success: true, dispatched });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/fleet/active-tracking
   * Endpoint para la App Móvil: Devuelve micros con rastreo activo en ruta
   */
  router.get('/active-tracking', (req, res) => {
    try {
      const activeMicros = db.prepare(`
        SELECT m.id, m.line_id, m.internal_number, m.license_plate, m.vehicle_model, m.year,
               m.capacity_max, m.current_passengers, m.tracking_active, m.status,
               m.current_lat, m.current_lng, m.updated_at,
               l.line_number, l.name as line_name, l.color as line_color,
               u.id as driver_id, u.full_name as driver_name, u.phone as driver_phone,
               u.license_number as driver_license, u.ci as driver_ci, u.photo_url as driver_photo,
               u.experience_years as driver_experience, u.rating as driver_rating
        FROM micros m
        JOIN lines l ON m.line_id = l.id
        LEFT JOIN users u ON m.driver_id = u.id
        WHERE m.tracking_active = 1
        ORDER BY l.line_number ASC, m.internal_number ASC
      `).all();

      res.json({ success: true, count: activeMicros.length, micros: activeMicros });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/fleet/lines
   * Listado de líneas activas con aforo y conteo de micros en ruta
   */
  router.get('/lines', (req, res) => {
    try {
      const lines = db.prepare(`
        SELECT l.*,
               (SELECT COUNT(*) FROM micros m WHERE m.line_id = l.id AND m.status IN ('ACTIVO', 'EN_RUTA')) as active_micros_count,
               (SELECT COUNT(*) FROM micros m WHERE m.line_id = l.id) as total_micros_count
        FROM lines l 
        WHERE l.active = 1 
        ORDER BY CAST(l.line_number AS INTEGER) ASC
      `).all();
      res.json({ success: true, lines });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/fleet/micros
   * Listar todos los micros con su línea y chofer actual
   */
  router.get('/micros', (req, res) => {
    try {
      const micros = db.prepare(`
        SELECT m.*, l.line_number, l.name as line_name, l.color as line_color,
               u.id as driver_id, u.full_name as driver_name, u.phone as driver_phone,
               u.license_number as driver_license, u.ci as driver_ci, u.photo_url as driver_photo,
               u.experience_years as driver_experience, u.rating as driver_rating
        FROM micros m
        JOIN lines l ON m.line_id = l.id
        LEFT JOIN users u ON m.driver_id = u.id
        ORDER BY l.line_number ASC, m.internal_number ASC
      `).all();

      const enriched = micros.map(m => ({
        ...m,
        available_seats: Math.max(0, m.capacity_max - m.current_passengers)
      }));

      res.json({ success: true, micros: enriched });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/fleet/micros
   * Registrar o dar de alta un micro (RF-01, Admin)
   */
  router.post('/micros', requireAuth, requireRole('ADMIN'), (req, res) => {
    try {
      const { line_id, internal_number, capacity_max, driver_id } = req.body;

      if (!line_id || !internal_number) {
        return res.status(400).json({ success: false, error: 'Línea y número interno son requeridos.' });
      }

      const capacity = Number(capacity_max) || 22;
      if (capacity < 18 || capacity > 25) {
        return res.status(400).json({ success: false, error: 'El aforo máximo debe estar entre 18 y 25 personas (RF-06).' });
      }

      // Validar si ya existe este número interno en la línea
      const exists = db.prepare('SELECT id FROM micros WHERE line_id = ? AND internal_number = ?').get(line_id, internal_number);
      if (exists) {
        return res.status(409).json({ success: false, error: `El interno ${internal_number} ya está registrado para esta línea.` });
      }

      const result = db.prepare(`
        INSERT INTO micros (line_id, internal_number, capacity_max, driver_id, status)
        VALUES (?, ?, ?, ?, 'INACTIVO')
      `).run(line_id, internal_number, capacity, driver_id || null);

      res.status(201).json({ success: true, message: 'Micro registrado exitosamente', microId: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/fleet/driver/start-shift
   * Iniciar turno del chofer validando Línea e Interno (RF-01, RF-10)
   */
  router.post('/driver/start-shift', requireAuth, requireRole('CHOFER'), (req, res) => {
    try {
      const { line_id, internal_number } = req.body;
      const driverId = req.session.user.id;

      if (!line_id || !internal_number) {
        return res.status(400).json({ success: false, error: 'Debe indicar Línea y Número Interno para iniciar recorrido.' });
      }

      const micro = db.prepare('SELECT * FROM micros WHERE line_id = ? AND internal_number = ?').get(line_id, internal_number);
      if (!micro) {
        return res.status(404).json({ success: false, error: 'No se encontró la unidad especificada (Línea + Interno no registrado).' });
      }

      // Actualizar chofer y activar micro
      executeTransaction((txn) => {
        // Liberar otros micros que pudiera tener este chofer
        txn.prepare("UPDATE micros SET driver_id = NULL, status = 'INACTIVO' WHERE driver_id = ?").run(driverId);

        // Asignar micro y poner en estado ACTIVO
        txn.prepare(`
          UPDATE micros 
          SET driver_id = ?, status = 'ACTIVO', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(driverId, micro.id);
      });

      const updatedMicro = db.prepare(`
        SELECT m.*, l.line_number, l.name as line_name 
        FROM micros m 
        JOIN lines l ON m.line_id = l.id 
        WHERE m.id = ?
      `).get(micro.id);

      req.session.user.assignedMicro = updatedMicro;

      // Notificar por WebSocket a pasajeros y administradores
      io.emit('micro:status_changed', {
        microId: micro.id,
        status: 'ACTIVO',
        micro: updatedMicro
      });

      res.json({
        success: true,
        message: `Turno iniciado con éxito en la Línea ${updatedMicro.line_number} - Interno ${updatedMicro.internal_number}.`,
        micro: updatedMicro
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/fleet/micro/:id/location
   * Actualizar coordenadas GPS en tiempo real de un micro (RF-07, RNF-02)
   */
  router.post('/micro/:id/location', requireAuth, (req, res) => {
    try {
      const microId = Number(req.params.id);
      const { lat, lng } = req.body;

      if (lat === undefined || lng === undefined) {
        return res.status(400).json({ success: false, error: 'Latitud y longitud requeridas' });
      }

      db.prepare(`
        UPDATE micros 
        SET current_lat = ?, current_lng = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(lat, lng, microId);

      const micro = db.prepare(`
        SELECT m.*, l.line_number, l.name as line_name 
        FROM micros m 
        JOIN lines l ON m.line_id = l.id 
        WHERE m.id = ?
      `).get(microId);

      // Difundir actualización geoespacial inmediata por WebSocket
      io.emit('micro:location_updated', {
        microId,
        lat,
        lng,
        lineNumber: micro.line_number,
        internalNumber: micro.internal_number,
        availableSeats: Math.max(0, micro.capacity_max - micro.current_passengers)
      });

      res.json({ success: true, micro });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/fleet/favorites
   * Obtener las líneas favoritas del usuario autenticado
   */
  router.get('/favorites', requireAuth, (req, res) => {
    try {
      const user = req.user || req.session?.user;
      const rows = db.prepare(`
        SELECT line_number FROM user_favorite_lines WHERE user_id = ?
      `).all(user.id);
      const favoriteLines = rows.map((r) => String(r.line_number));
      res.json({ success: true, favorites: favoriteLines });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/fleet/favorites/toggle
   * Agregar o quitar una línea de favoritas
   */
  router.post('/favorites/toggle', requireAuth, (req, res) => {
    try {
      const { line_number } = req.body;
      if (!line_number) {
        return res.status(400).json({ success: false, error: 'Número de línea requerido' });
      }

      const user = req.user || req.session?.user;
      const strLine = String(line_number);
      const existing = db.prepare(`
        SELECT id FROM user_favorite_lines WHERE user_id = ? AND line_number = ?
      `).get(user.id, strLine);

      let isFavorite = false;
      if (existing) {
        db.prepare('DELETE FROM user_favorite_lines WHERE id = ?').run(existing.id);
        isFavorite = false;
      } else {
        db.prepare('INSERT INTO user_favorite_lines (user_id, line_number) VALUES (?, ?)').run(user.id, strLine);
        isFavorite = true;
      }

      const allFavs = db.prepare('SELECT line_number FROM user_favorite_lines WHERE user_id = ?').all(user.id);
      res.json({ success: true, isFavorite, favorites: allFavs.map((r) => String(r.line_number)) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/fleet/reports
   * Registrar reporte / denuncia ciudadana de estudiante (ODS 11)
   */
  router.post('/reports', requireAuth, (req, res) => {
    try {
      const { micro_id, line_number, internal_number, driver_name, incident_type, description } = req.body;
      if (!incident_type) {
        return res.status(400).json({ success: false, error: 'El tipo de incidente es obligatorio' });
      }

      const user = req.user || req.session?.user;
      const reportCode = `REP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      db.prepare(`
        INSERT INTO incident_reports (report_code, user_id, micro_id, line_number, internal_number, driver_name, incident_type, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        reportCode,
        user.id,
        micro_id || null,
        line_number ? String(line_number) : null,
        internal_number ? Number(internal_number) : null,
        driver_name || null,
        incident_type,
        description || ''
      );

      res.json({
        success: true,
        message: 'Reporte registrado exitosamente para revisión de supervisión urbana.',
        reportCode,
        status: 'REGISTRADO'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/fleet/reports
   * Listar reportes del estudiante o de todos si es superadmin
   */
  router.get('/reports', requireAuth, (req, res) => {
    try {
      const user = req.user || req.session?.user;
      let reports = [];
      if (user.role === 'SUPERADMIN' || user.role === 'ADMIN' || user.role === 'ADMIN_LINEA') {
        reports = db.prepare(`
          SELECT r.*, u.full_name as student_name, u.email as student_email, u.phone as student_phone
          FROM incident_reports r
          JOIN users u ON r.user_id = u.id
          ORDER BY r.created_at DESC
        `).all();
      } else {
        reports = db.prepare(`
          SELECT * FROM incident_reports WHERE user_id = ? ORDER BY created_at DESC
        `).all(user.id);
      }
      res.json({ success: true, reports });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
