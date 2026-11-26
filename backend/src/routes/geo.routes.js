import { Router } from 'express';
import { db } from '../config/db.js';
import { filterMicrosByRadius } from '../utils/haversine.js';

const router = Router();

/**
 * GET /api/geo/nearby
 * Devuelve únicamente los micros activos dentro de un radio de 5 km respecto al usuario (RF-07)
 * Query params: lat, lng, radius (opcional, default 5.0 km)
 */
router.get('/nearby', (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 5.0; // 5 km por defecto
    const lineFilter = req.query.line ? String(req.query.line).trim() : null;
    const showAll = req.query.all === 'true' || !!lineFilter;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Las coordenadas del usuario (lat y lng) son obligatorias.'
      });
    }

    // Traer todos los micros que estén actualmente en estado activo o en ruta con su Chofer asignado
    let query = `
      SELECT m.id, m.line_id, m.internal_number, m.license_plate, m.vehicle_model, m.year,
             m.capacity_max, m.current_passengers,
             m.status, m.current_lat, m.current_lng, m.updated_at,
             l.line_number, l.name as line_name, l.color as line_color,
             l.route_coordinates, l.origin_name, l.destination_name,
             u.id as driver_id, u.full_name as driver_name, u.phone as driver_phone,
             u.license_number as driver_license, u.ci as driver_ci, u.photo_url as driver_photo,
             u.experience_years as driver_experience, u.rating as driver_rating
      FROM micros m
      JOIN lines l ON m.line_id = l.id
      LEFT JOIN users u ON m.driver_id = u.id
      WHERE m.status IN ('ACTIVO', 'EN_RUTA') AND l.active = 1
    `;
    const params = [];

    if (lineFilter) {
      query += ` AND (l.line_number = ? OR CAST(l.id AS TEXT) = ?)`;
      params.push(lineFilter, lineFilter);
    }

    const activeMicros = db.prepare(query).all(...params);

    // Calcular distancias con Haversine
    let microsWithDistance = [];
    if (showAll) {
      // Calcular distancia para todos sin descartar
      microsWithDistance = filterMicrosByRadius(activeMicros, lat, lng, 100.0);
    } else {
      // Filtrar en radio
      microsWithDistance = filterMicrosByRadius(activeMicros, lat, lng, radius);
    }

    res.json({
      success: true,
      user_location: { lat, lng },
      search_radius_km: showAll ? null : radius,
      line_filter: lineFilter,
      total_found: microsWithDistance.length,
      micros: microsWithDistance
    });

  } catch (error) {
    console.error('Error en /nearby:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
