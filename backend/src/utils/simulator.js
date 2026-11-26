import { db } from '../config/db.js';

let simulationInterval = null;
let dispatchInterval = null;
let microTrackers = new Map(); // microId -> { lineId, coords: [], currentIndex: number, direction: 1 | -1 }

// Intervalo de avance de micros (en milisegundos)
const TICK_MS = 2500;

// Intervalo de despacho de la simulación (30 segundos simulando la frecuencia de cada media hora de operación)
const SIMULATED_HALF_HOUR_MS = 30000;

let nextDispatchTime = Date.now() + SIMULATED_HALF_HOUR_MS;
let lineCoordsCache = new Map();
let cachedIo = null;

/**
 * Inicializa el motor de simulación de flota en tiempo real
 */
export function initSimulationEngine(io) {
  cachedIo = io;

  if (simulationInterval) {
    clearInterval(simulationInterval);
  }
  if (dispatchInterval) {
    clearInterval(dispatchInterval);
  }

  console.log('🚍 Inicializando Motor de Simulación de Flota en Tiempo Real (RUTABOL-SCZ)...');

  // 1. Cargar coordenadas de todas las líneas activas
  const lines = db.prepare('SELECT id, line_number, route_coordinates, origin_lat, origin_lng, origin_name FROM lines WHERE active = 1').all();
  lineCoordsCache.clear();

  for (const l of lines) {
    if (l.route_coordinates) {
      try {
        const parsed = JSON.parse(l.route_coordinates);
        if (Array.isArray(parsed) && parsed.length > 1) {
          lineCoordsCache.set(l.id, parsed);
        }
      } catch (e) {
        // Coordenadas no parseables
      }
    }
  }

  // 2. Cargar micros que se encuentran EN_RUTA con los datos completos del chofer
  const activeMicros = db.prepare(`
    SELECT m.id, m.line_id, m.internal_number, m.license_plate, m.vehicle_model, m.year,
           m.capacity_max, m.current_passengers, m.current_lat, m.current_lng, m.status, 
           l.line_number, l.name as line_name, l.color as line_color,
           u.id as driver_id, u.full_name as driver_name, u.phone as driver_phone,
           u.license_number as driver_license, u.ci as driver_ci, u.photo_url as driver_photo,
           u.experience_years as driver_experience, u.rating as driver_rating
    FROM micros m
    JOIN lines l ON m.line_id = l.id
    LEFT JOIN users u ON m.driver_id = u.id
    WHERE m.status IN ('EN_RUTA', 'ACTIVO')
  `).all();

  microTrackers.clear();

  for (const micro of activeMicros) {
    const coords = lineCoordsCache.get(micro.line_id);
    if (!coords || coords.length === 0) continue;

    // Buscar el índice de punto de coordenada más cercano a su ubicación actual
    let closestIdx = 0;
    let minD = Infinity;
    coords.forEach(([lat, lng], idx) => {
      const d = Math.hypot(lat - micro.current_lat, lng - micro.current_lng);
      if (d < minD) {
        minD = d;
        closestIdx = idx;
      }
    });

    microTrackers.set(micro.id, {
      microId: micro.id,
      lineId: micro.line_id,
      lineNumber: micro.line_number,
      lineName: micro.line_name,
      lineColor: micro.line_color,
      internalNumber: micro.internal_number,
      licensePlate: micro.license_plate,
      vehicleModel: micro.vehicle_model,
      year: micro.year,
      driverId: micro.driver_id,
      driverName: micro.driver_name || 'Conductor de Turno',
      driverPhone: micro.driver_phone || '78000000',
      driverLicense: micro.driver_license || 'LIC-SCZ',
      driverCi: micro.driver_ci || '5800000 SC',
      driverPhoto: micro.driver_photo,
      driverExperience: micro.driver_experience || 6,
      driverRating: micro.driver_rating || 4.9,
      capacityMax: micro.capacity_max,
      currentPassengers: micro.current_passengers,
      coords,
      currentIndex: closestIdx,
      direction: 1 // 1 hacia adelante, -1 retorno
    });
  }

  console.log(`✓ Simulación iniciada con ${microTrackers.size} micros en circulación simultánea.`);

  const updateMicroStmt = db.prepare(`
    UPDATE micros 
    SET current_lat = ?, current_lng = ?, current_passengers = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);

  // 3. Bucle de avance cinemático de los micros en ruta (Tick cada 2.5s)
  simulationInterval = setInterval(() => {
    try {
      if (microTrackers.size === 0) return;

      const batchUpdates = [];

      db.exec('BEGIN TRANSACTION;');
      try {
        microTrackers.forEach((tracker) => {
          const { coords } = tracker;
          if (!coords || coords.length < 2) return;

          // Calcular siguiente punto en la ruta
          let nextIdx = tracker.currentIndex + tracker.direction;

          // Si llega al final de la ruta, dar la vuelta para el viaje de retorno
          if (nextIdx >= coords.length) {
            tracker.direction = -1;
            nextIdx = coords.length - 2;
          } else if (nextIdx < 0) {
            tracker.direction = 1;
            nextIdx = 1;
          }

          tracker.currentIndex = nextIdx;
          const [newLat, newLng] = coords[nextIdx];

          // Simular leve variación de aforo de pasajeros en paradas (15% de probabilidad)
          if (Math.random() < 0.15) {
            const delta = Math.random() > 0.45 ? 1 : -1;
            tracker.currentPassengers = Math.max(0, Math.min(tracker.capacityMax, tracker.currentPassengers + delta));
          }

          // Actualizar en SQLite
          updateMicroStmt.run(newLat, newLng, tracker.currentPassengers, tracker.microId);

          const payload = {
            microId: tracker.microId,
            lat: newLat,
            lng: newLng,
            lineNumber: tracker.lineNumber,
            lineName: tracker.lineName,
            lineColor: tracker.lineColor,
            internalNumber: tracker.internalNumber,
            licensePlate: tracker.licensePlate,
            vehicleModel: tracker.vehicleModel,
            year: tracker.year,
            driverId: tracker.driverId,
            driverName: tracker.driverName,
            driverPhone: tracker.driverPhone,
            driverLicense: tracker.driverLicense,
            driverCi: tracker.driverCi,
            driverPhoto: tracker.driverPhoto,
            driverExperience: tracker.driverExperience,
            driverRating: tracker.driverRating,
            availableSeats: Math.max(0, tracker.capacityMax - tracker.currentPassengers),
            currentPassengers: tracker.currentPassengers,
            capacityMax: tracker.capacityMax
          };

          batchUpdates.push(payload);

          // Emitir actualización individual para componentes en escucha
          io.emit('micro:location_updated', payload);
        });
        db.exec('COMMIT;');
      } catch (err) {
        db.exec('ROLLBACK;');
        console.error('Error en transacción de coordenadas:', err.message);
      }

      // Emitir lote para optimización de alto rendimiento
      if (batchUpdates.length > 0) {
        io.emit('micros:batch_updated', batchUpdates);
      }

    } catch (err) {
      console.error('Error en loop de simulación:', err.message);
    }
  }, TICK_MS);

  // 4. Bucle de Salida Periódica de Terminal (Cada media hora simulada)
  nextDispatchTime = Date.now() + SIMULATED_HALF_HOUR_MS;

  dispatchInterval = setInterval(() => {
    dispatchNextMicro(io);
  }, SIMULATED_HALF_HOUR_MS);

  return {
    dispatchNextMicro: () => dispatchNextMicro(io),
    getStatus: getSimulationStatus
  };
}

/**
 * Despacha un nuevo chofer y micro desde la salida / terminal de la línea
 */
export function dispatchNextMicro(io = cachedIo) {
  try {
    nextDispatchTime = Date.now() + SIMULATED_HALF_HOUR_MS;

    // Buscar una unidad en descanso que tenga chofer asignado
    let candidateMicro = db.prepare(`
      SELECT m.*, l.line_number, l.name as line_name, l.color as line_color, l.origin_lat, l.origin_lng, l.origin_name,
             u.full_name as driver_name, u.license_number as driver_license, u.ci as driver_ci,
             u.photo_url as driver_photo, u.phone as driver_phone, u.experience_years as driver_experience,
             u.rating as driver_rating
      FROM micros m
      JOIN lines l ON m.line_id = l.id
      LEFT JOIN users u ON m.driver_id = u.id
      WHERE m.status = 'EN_DESCANSO' AND l.active = 1
      ORDER BY RANDOM()
      LIMIT 1
    `).get();

    // Si ya no quedan micros en descanso, tomar uno de los que llegaron a destino para nueva salida
    if (!candidateMicro) {
      candidateMicro = db.prepare(`
        SELECT m.*, l.line_number, l.name as line_name, l.color as line_color, l.origin_lat, l.origin_lng, l.origin_name,
               u.full_name as driver_name, u.license_number as driver_license, u.ci as driver_ci,
               u.photo_url as driver_photo, u.phone as driver_phone, u.experience_years as driver_experience,
               u.rating as driver_rating
        FROM micros m
        JOIN lines l ON m.line_id = l.id
        LEFT JOIN users u ON m.driver_id = u.id
        WHERE l.active = 1
        ORDER BY RANDOM()
        LIMIT 1
      `).get();
    }

    if (!candidateMicro) {
      console.warn('No hay micros disponibles para despachar en este momento.');
      return null;
    }

    const startLat = candidateMicro.origin_lat || -17.7833;
    const startLng = candidateMicro.origin_lng || -63.1821;

    // Transición a EN_RUTA e inicio de vuelta
    db.prepare(`
      UPDATE micros 
      SET status = 'EN_RUTA', tracking_active = 1, current_passengers = 0, 
          current_lat = ?, current_lng = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(startLat, startLng, candidateMicro.id);

    // Registrar inicio de ronda en la tabla rounds
    try {
      const prevRounds = db.prepare('SELECT COUNT(*) as count FROM rounds WHERE micro_id = ?').get(candidateMicro.id);
      const nextRoundNum = (prevRounds?.count || 0) + 1;
      db.prepare(`
        INSERT INTO rounds (micro_id, driver_id, round_number, start_time, passengers_count, total_collected, status)
        VALUES (?, ?, ?, datetime('now'), 0, 0.0, 'EN_CURSO')
      `).run(candidateMicro.id, candidateMicro.driver_id, nextRoundNum);
    } catch (e) {
      // Ronda creada
    }

    // Obtener ruta de coordenadas de la línea
    let coords = lineCoordsCache.get(candidateMicro.line_id);
    if (!coords) {
      const lineRow = db.prepare('SELECT route_coordinates FROM lines WHERE id = ?').get(candidateMicro.line_id);
      if (lineRow?.route_coordinates) {
        coords = JSON.parse(lineRow.route_coordinates);
        lineCoordsCache.set(candidateMicro.line_id, coords);
      }
    }

    // Integrar a la flota en movimiento
    if (coords && coords.length > 0) {
      microTrackers.set(candidateMicro.id, {
        microId: candidateMicro.id,
        lineId: candidateMicro.line_id,
        lineNumber: candidateMicro.line_number,
        lineName: candidateMicro.line_name,
        lineColor: candidateMicro.line_color,
        internalNumber: candidateMicro.internal_number,
        licensePlate: candidateMicro.license_plate,
        vehicleModel: candidateMicro.vehicle_model,
        year: candidateMicro.year,
        driverId: candidateMicro.driver_id,
        driverName: candidateMicro.driver_name || 'Conductor de Turno',
        driverPhone: candidateMicro.driver_phone || '78000000',
        driverLicense: candidateMicro.driver_license || 'LIC-SCZ',
        driverCi: candidateMicro.driver_ci || '5800000 SC',
        driverPhoto: candidateMicro.driver_photo,
        driverExperience: candidateMicro.driver_experience || 6,
        driverRating: candidateMicro.driver_rating || 4.9,
        capacityMax: candidateMicro.capacity_max,
        currentPassengers: 0,
        coords,
        currentIndex: 0,
        direction: 1
      });
    }

    const eventData = {
      microId: candidateMicro.id,
      lineNumber: candidateMicro.line_number,
      internalNumber: candidateMicro.internal_number,
      lineName: candidateMicro.line_name,
      licensePlate: candidateMicro.license_plate,
      vehicleModel: candidateMicro.vehicle_model,
      driverName: candidateMicro.driver_name || 'Conductor de Turno',
      driverLicense: candidateMicro.driver_license || 'LIC-SCZ',
      driverCi: candidateMicro.driver_ci || '5800000 SC',
      driverPhoto: candidateMicro.driver_photo,
      driverPhone: candidateMicro.driver_phone,
      driverExperience: candidateMicro.driver_experience || 6,
      driverRating: candidateMicro.driver_rating || 4.9,
      originName: candidateMicro.origin_name || 'Terminal de Salida',
      lat: startLat,
      lng: startLng,
      timestamp: new Date().toLocaleTimeString('es-BO'),
      message: `🚍 Salida de Terminal: Chofer ${candidateMicro.driver_name || 'Asignado'} inició recorrido en Línea ${candidateMicro.line_number} (Interno #${candidateMicro.internal_number}) desde ${candidateMicro.origin_name || 'Terminal'}`
    };

    if (io) {
      io.emit('line:micro_dispatched', eventData);
      io.emit('micro:status_changed', {
        microId: candidateMicro.id,
        status: 'EN_RUTA'
      });
    }

    console.log(`🚍 [SALIDA DE TERMINAL]: Chofer ${eventData.driverName} salió de ${eventData.originName} en Línea ${eventData.lineNumber} (Interno #${eventData.internalNumber}).`);

    return eventData;
  } catch (err) {
    console.error('Error al despachar micro desde salida de línea:', err.message);
    return null;
  }
}

/**
 * Obtiene el estado actual del motor de simulación
 */
export function getSimulationStatus() {
  const restingMicrosCount = db.prepare("SELECT COUNT(*) as c FROM micros WHERE status = 'EN_DESCANSO'").get()?.c || 0;
  const enRutaMicrosCount = db.prepare("SELECT COUNT(*) as c FROM micros WHERE status IN ('EN_RUTA', 'ACTIVO')").get()?.c || 0;

  return {
    running: !!simulationInterval,
    activeMovingMicros: microTrackers.size,
    enRutaMicrosCount,
    restingMicrosCount,
    tickMs: TICK_MS,
    dispatchIntervalMs: SIMULATED_HALF_HOUR_MS,
    nextDispatchSeconds: Math.max(0, Math.round((nextDispatchTime - Date.now()) / 1000)),
    simulatedFrequency: 'Salida de terminal cada 30 minutos de operación'
  };
}
