import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, executeTransaction } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export function createSuperadminRoutes(io) {
  const router = Router();

  // Todos los endpoints de este router requieren rol SUPERADMIN o ADMIN
  router.use(requireAuth, requireRole('SUPERADMIN', 'ADMIN', 'ADMIN_LINEA'));

  /**
   * GET /api/superadmin/kpis
   * Métricas operativas consolidadas de la red urbana (Flota, Líneas y Choferes)
   */
  router.get('/kpis', (req, res) => {
    try {
      const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM micros').get().count;
      const totalDrivers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'CHOFER'").get().count;
      const totalLines = db.prepare('SELECT COUNT(*) as count FROM lines WHERE active = 1').get().count;
      const activeMicros = db.prepare("SELECT COUNT(*) as count FROM micros WHERE status IN ('EN_RUTA', 'ACTIVO')").get().count;
      const restingMicros = db.prepare("SELECT COUNT(*) as count FROM micros WHERE status = 'EN_DESCANSO'").get().count;

      res.json({
        success: true,
        kpis: {
          totalVehicles,
          totalDrivers,
          totalLines,
          activeMicros,
          restingMicros
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/superadmin/lines
   * Listar todas las líneas con conteo de vehículos y choferes
   */
  router.get('/lines', (req, res) => {
    try {
      const lines = db.prepare(`
        SELECT l.*,
               (SELECT COUNT(*) FROM micros WHERE line_id = l.id) as vehicle_count,
               (SELECT COUNT(*) FROM users WHERE line_id = l.id AND role = 'CHOFER') as driver_count
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
   * POST /api/superadmin/lines
   * Dar de alta una nueva Línea de Transporte
   */
  router.post('/lines', async (req, res) => {
    try {
      const {
        line_number,
        name,
        color,
        origin_name,
        origin_lat,
        origin_lng,
        destination_name,
        destination_lat,
        destination_lng,
        route_coordinates,
        distance_km
      } = req.body;

      if (!line_number || !name) {
        return res.status(400).json({
          success: false,
          error: 'Número de línea y nombre de la línea son obligatorios.'
        });
      }

      // Validar si la línea ya existe
      const lineExists = db.prepare('SELECT id FROM lines WHERE line_number = ?').get(String(line_number).trim());
      if (lineExists) {
        return res.status(409).json({ success: false, error: `La Línea ${line_number} ya se encuentra registrada.` });
      }

      const routeJson = route_coordinates 
        ? (typeof route_coordinates === 'string' ? route_coordinates : JSON.stringify(route_coordinates))
        : null;

      const result = db.prepare(`
        INSERT INTO lines (
          line_number, name, color, commission_percentage, 
          origin_name, origin_lat, origin_lng, 
          destination_name, destination_lat, destination_lng, 
          route_coordinates, distance_km, active
        )
        VALUES (?, ?, ?, 10.0, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(
        String(line_number).trim(),
        name.trim(),
        color || '#2563EB',
        origin_name ? origin_name.trim() : 'Terminal de Salida',
        origin_lat ? parseFloat(origin_lat) : -17.7833,
        origin_lng ? parseFloat(origin_lng) : -63.1821,
        destination_name ? destination_name.trim() : 'Terminal de Destino',
        destination_lat ? parseFloat(destination_lat) : -17.7833,
        destination_lng ? parseFloat(destination_lng) : -63.1821,
        routeJson,
        distance_km ? parseFloat(distance_km) : 8.5
      );

      res.status(201).json({
        success: true,
        message: `Línea ${line_number} creada exitosamente.`,
        lineId: Number(result.lastInsertRowid)
      });
    } catch (error) {
      console.error('Error al crear línea:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/superadmin/drivers
   * Obtener todos los choferes registrados con los datos completos de su vehículo y línea
   */
  router.get('/drivers', (req, res) => {
    try {
      const drivers = db.prepare(`
        SELECT u.id as driver_id, u.full_name as driver_name, u.email as driver_email,
               u.phone as driver_phone, u.license_number as driver_license,
               u.ci as driver_ci, u.photo_url as driver_photo,
               u.experience_years as driver_experience, u.rating as driver_rating,
               u.created_at,
               l.id as line_id, l.line_number, l.name as line_name, l.color as line_color,
               m.id as micro_id, m.internal_number, m.license_plate, m.vehicle_model,
               m.year, m.capacity_max, m.current_passengers, m.status as micro_status
        FROM users u
        LEFT JOIN lines l ON u.line_id = l.id
        LEFT JOIN micros m ON m.driver_id = u.id
        WHERE u.role = 'CHOFER'
        ORDER BY CAST(l.line_number AS INTEGER) ASC, m.internal_number ASC
      `).all();

      res.json({ success: true, count: drivers.length, drivers });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/superadmin/drivers
   * Crear simultáneamente un Chofer y asignarle su Vehículo para una Línea
   */
  router.post('/drivers', async (req, res) => {
    try {
      const {
        line_id,
        full_name,
        ci,
        license_number,
        phone,
        email,
        password,
        photo_url,
        experience_years,
        // Datos del Vehículo
        internal_number,
        license_plate,
        vehicle_model,
        year,
        capacity_max
      } = req.body;

      if (!line_id || !full_name || !ci || !internal_number) {
        return res.status(400).json({
          success: false,
          error: 'Línea, Nombre del Chofer, C.I. y Número Interno del vehículo son requeridos.'
        });
      }

      // Validar si la línea existe
      const line = db.prepare('SELECT * FROM lines WHERE id = ?').get(line_id);
      if (!line) {
        return res.status(404).json({ success: false, error: 'La línea seleccionada no existe.' });
      }

      // Validar si el número interno ya existe para esta línea
      const microExists = db.prepare('SELECT id FROM micros WHERE line_id = ? AND internal_number = ?').get(line_id, internal_number);
      if (microExists) {
        return res.status(409).json({ success: false, error: `El Interno #${internal_number} ya está registrado en la Línea ${line.line_number}.` });
      }

      const driverEmail = email ? email.toLowerCase().trim() : `chofer${line.line_number}_${Date.now()}@rutabol.com`;
      const driverPass = password || 'chofer123';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(driverPass, salt);

      const avatar = photo_url || `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(full_name)}`;
      const exp = parseInt(experience_years) || 6;
      const cap = parseInt(capacity_max) || 22;
      const yr = parseInt(year) || 2022;

      const created = executeTransaction((txn) => {
        // 1. Insertar Chofer en users
        const userStmt = txn.prepare(`
          INSERT INTO users (
            line_id, email, password_hash, role, full_name, phone, license_number,
            ci, photo_url, experience_years, rating
          )
          VALUES (?, ?, ?, 'CHOFER', ?, ?, ?, ?, ?, ?, 4.9)
        `);
        const userRes = userStmt.run(
          line_id,
          driverEmail,
          passwordHash,
          full_name.trim(),
          phone ? phone.trim() : '78000000',
          license_number ? license_number.trim() : `LIC-SCZ-${line.line_number}99`,
          ci.trim(),
          avatar,
          exp
        );
        const driverId = Number(userRes.lastInsertRowid);

        // 2. Insertar Micro en micros asignado a este chofer
        const microStmt = txn.prepare(`
          INSERT INTO micros (
            line_id, internal_number, license_plate, vehicle_model, year,
            driver_id, capacity_max, current_passengers, tracking_active,
            status, current_lat, current_lng
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 'EN_DESCANSO', ?, ?)
        `);
        const microRes = microStmt.run(
          line_id,
          parseInt(internal_number),
          license_plate ? license_plate.trim() : `${3000 + Math.floor(Math.random() * 6000)}-SCZ`,
          vehicle_model ? vehicle_model.trim() : 'Toyota Coaster',
          yr,
          driverId,
          cap,
          line.origin_lat || -17.7833,
          line.origin_lng || -63.1821
        );
        const microId = Number(microRes.lastInsertRowid);

        return {
          driverId,
          microId,
          driverName: full_name.trim(),
          lineNumber: line.line_number,
          internalNumber: internal_number
        };
      });

      res.status(201).json({
        success: true,
        message: `Chofer ${created.driverName} y Micro #${created.internalNumber} creados y asignados exitosamente a la Línea ${created.lineNumber}.`,
        created
      });
    } catch (error) {
      console.error('Error al registrar chofer y vehículo:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * DELETE /api/superadmin/drivers/:id
   * Dar de baja a un chofer y desvincular o eliminar su unidad
   */
  router.delete('/drivers/:id', (req, res) => {
    try {
      const driverId = Number(req.params.id);

      executeTransaction((txn) => {
        txn.prepare('DELETE FROM micros WHERE driver_id = ?').run(driverId);
        txn.prepare('DELETE FROM users WHERE id = ? AND role = \'CHOFER\'').run(driverId);
      });

      res.json({ success: true, message: 'Chofer y unidad asociada removidos con éxito.' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
