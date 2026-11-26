import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, initDatabase, executeTransaction } from '../config/db.js';
import { build60LinesCatalog, FIRST_NAMES, LAST_NAMES } from '../../generate_60_lines.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colección de fotos realistas para conductores de transporte urbano
const DRIVER_PORTRAITS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80'
];

export async function runSeed() {
  console.log('🌱 Iniciando semillado unificado de 60 líneas, 120 choferes y flota con fichas completas...');

  // Dropear tablas de manera limpia y segura para reconstruir índices y constraints
  db.exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS rounds;
    DROP TABLE IF EXISTS transfers;
    DROP TABLE IF EXISTS tickets;
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS student_profiles;
    DROP TABLE IF EXISTS micros;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS lines;
    DROP TABLE IF EXISTS fares;
    PRAGMA foreign_keys = ON;
  `);

  initDatabase();

  const salt = await bcrypt.genSalt(10);
  const hashPass = (p) => bcrypt.hashSync(p, salt);

  // Obtener el catálogo oficial de las 60 líneas sin repetición (1-100)
  const linesCatalog = build60LinesCatalog();

  executeTransaction((txn) => {
    // 1. Tarifario Oficial (RF-04)
    const fareStmt = txn.prepare('INSERT INTO fares (category, price) VALUES (?, ?)');
    fareStmt.run('GENERAL', 2.00);
    fareStmt.run('UNIVERSITARIO', 1.00);
    fareStmt.run('ESCOLAR', 0.80);

    // 2. Sentencias preparadas para inserciones de alta velocidad
    const lineStmt = txn.prepare(`
      INSERT INTO lines (
        line_number, name, color, commission_percentage, 
        origin_name, origin_lat, origin_lng, 
        destination_name, destination_lat, destination_lng, 
        route_coordinates, distance_km, active
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const userStmt = txn.prepare(`
      INSERT INTO users (
        line_id, email, password_hash, role, full_name, phone, license_number,
        ci, photo_url, experience_years, rating
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const microStmt = txn.prepare(`
      INSERT INTO micros (
        line_id, internal_number, license_plate, vehicle_model, year, 
        driver_id, capacity_max, current_passengers, tracking_active, 
        status, current_lat, current_lng
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const roundStmt = txn.prepare(`
      INSERT INTO rounds (micro_id, driver_id, round_number, start_time, end_time, passengers_count, total_collected, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETADA')
    `);

    const paymentStmt = txn.prepare(`
      INSERT INTO payments (user_id, micro_id, amount, fare_category, card_last4, status, created_at)
      VALUES (NULL, ?, ?, 'GENERAL', '4532', 'COMPLETADO', datetime('now', '-1 hour'))
    `);

    // 3. Administrador General del Sistema (Unificado)
    userStmt.run(
      null, 'superadmin@rutabol.com', hashPass('admin123'), 'SUPERADMIN',
      'Administrador General del Sistema', '77000001', 'LIC-SCZ-ADMIN',
      '4920194 SC', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      12, 5.0
    );

    // Estudiante Universitario UPDS (RF-03, Tarifa Bs. 1.00)
    const danielUserId = Number(userStmt.run(
      null, 'daniel.frias@upds.edu.bo', hashPass('upds123'), 'ESTUDIANTE',
      'Daniel Frias Vargas (UPDS)', '78099881', null,
      '6291048 SC', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      0, 5.0
    ).lastInsertRowid);

    // Estudiante Escolar (RF-02, Tarifa Bs. 0.80)
    const mateoUserId = Number(userStmt.run(
      null, 'mateo.escolar@gmail.com', hashPass('escolar123'), 'ESTUDIANTE',
      'Mateo Justiniano (Colegio Florida)', '78011223', null,
      '7918234 SC', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
      0, 5.0
    ).lastInsertRowid);

    // Pasajero General (RF-04, Tarifa Bs. 2.00)
    userStmt.run(
      null, 'pasajero@gmail.com', hashPass('pasajero123'), 'PASAJERO',
      'Carlos Andrés Suárez (Pasajero General)', '77088991', null,
      '5192837 SC', null, 0, 5.0
    );

    // Perfiles Estudiantiles
    const studentStmt = txn.prepare(`
      INSERT INTO student_profiles (user_id, student_type, code_student, institution, institutional_email, photo_url, verified)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    studentStmt.run(
      danielUserId,
      'UNIVERSITARIO',
      'UPDS-2024-8891',
      'Universidad Privada Domingo Savio (UPDS - Santa Cruz)',
      'daniel.frias@upds.edu.bo',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
    );

    studentStmt.run(
      mateoUserId,
      'ESCOLAR',
      'RUDE-81920034-SCZ',
      'Colegio Nacional Florida',
      null,
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80'
    );

    // 4. Semillar las 60 Líneas de Transporte Urbano con Choferes (Datos inventados completos) y Micros
    let nameIdx = 0;

    linesCatalog.forEach((lineDef, idx) => {
      const lineId = Number(lineStmt.run(
        lineDef.lineNumber,
        lineDef.name,
        lineDef.color,
        10.0,
        lineDef.originName,
        lineDef.originLat,
        lineDef.originLng,
        lineDef.destinationName,
        lineDef.destinationLat,
        lineDef.destinationLng,
        JSON.stringify(lineDef.routeCoordinates),
        lineDef.distanceKm
      ).lastInsertRowid);

      // 4.1 Chofer 1 (En Ruta Activa): Datos personales completos y realistas
      const fn1 = FIRST_NAMES[(nameIdx * 2) % FIRST_NAMES.length];
      const ln1 = LAST_NAMES[(nameIdx * 2 + 1) % LAST_NAMES.length];
      const driver1Name = `${fn1} ${ln1} Terrazas`;
      const driver1Email = `chofer${lineDef.lineNumber}_1@rutabol.com`;
      const driver1Ci = `${5200000 + (idx * 31415 + 1021) % 4000000} SC`;
      const driver1License = `LIC-SCZ-${lineDef.lineNumber}01 (Cat. C Profesional)`;
      const driver1Phone = `781${String(lineDef.lineNumber).padStart(2, '0')}${idx % 9}1`;
      const driver1Photo = DRIVER_PORTRAITS[idx % DRIVER_PORTRAITS.length];
      const driver1Exp = 4 + ((idx * 2) % 15); // de 4 a 18 años de experiencia
      const driver1Rating = Math.round((4.7 + ((idx * 3) % 4) * 0.1) * 10) / 10;

      const chofer1Id = Number(userStmt.run(
        lineId, driver1Email, hashPass('chofer123'), 'CHOFER', driver1Name,
        driver1Phone, driver1License, driver1Ci, driver1Photo, driver1Exp, driver1Rating
      ).lastInsertRowid);

      // 4.2 Chofer 2 (En Descanso / Terminal): Datos personales completos
      const fn2 = FIRST_NAMES[(nameIdx * 2 + 7) % FIRST_NAMES.length];
      const ln2 = LAST_NAMES[(nameIdx * 2 + 8) % LAST_NAMES.length];
      const driver2Name = `${fn2} ${ln2} Aguilera`;
      const driver2Email = `chofer${lineDef.lineNumber}_2@rutabol.com`;
      const driver2Ci = `${5500000 + (idx * 27182 + 2033) % 4000000} SC`;
      const driver2License = `LIC-SCZ-${lineDef.lineNumber}02 (Cat. C Profesional)`;
      const driver2Phone = `781${String(lineDef.lineNumber).padStart(2, '0')}${idx % 9}2`;
      const driver2Photo = DRIVER_PORTRAITS[(idx + 5) % DRIVER_PORTRAITS.length];
      const driver2Exp = 5 + ((idx * 3) % 13);
      const driver2Rating = Math.round((4.6 + ((idx * 2) % 5) * 0.1) * 10) / 10;

      const chofer2Id = Number(userStmt.run(
        lineId, driver2Email, hashPass('chofer123'), 'CHOFER', driver2Name,
        driver2Phone, driver2License, driver2Ci, driver2Photo, driver2Exp, driver2Rating
      ).lastInsertRowid);

      nameIdx++;

      // 4.3 Dos Micros por Línea con Ficha Técnica:
      // - Micro 1: En Ruta activa transitando a lo largo del recorrido
      // - Micro 2: En Descanso esperando en la salida / terminal de la línea (listo para ser despachado)
      const coords = lineDef.routeCoordinates;
      const midPointIdx = Math.floor(coords.length * 0.35);
      const midPoint = coords[midPointIdx] || [lineDef.originLat, lineDef.originLng];

      const initialPassengers = 6 + (idx % 12); // entre 6 y 17 pasajeros
      const m1Plate = `${1500 + idx * 23}-ABC`;
      const m1Model = idx % 2 === 0 ? 'Toyota Coaster' : 'Mercedes Benz Sprinter';
      const m1Year = 2020 + (idx % 4);

      const m1Id = Number(microStmt.run(
        lineId,
        1, // Interno #1
        m1Plate,
        m1Model,
        m1Year,
        chofer1Id,
        22,
        initialPassengers,
        1, // tracking activo
        'EN_RUTA',
        midPoint[0],
        midPoint[1]
      ).lastInsertRowid);

      const m2Plate = `${2500 + idx * 31}-XYZ`;
      const m2Model = idx % 3 === 0 ? 'Nissan Civilian' : 'Hyundai County';
      const m2Year = 2021 + (idx % 3);

      const m2Id = Number(microStmt.run(
        lineId,
        2, // Interno #2
        m2Plate,
        m2Model,
        m2Year,
        chofer2Id,
        22,
        0, // Sin pasajeros en terminal
        0, // tracking inactivo hasta su salida
        'EN_DESCANSO',
        lineDef.originLat,
        lineDef.originLng
      ).lastInsertRowid);

      // Registrar historial de rondas previas y pagos para las primeras líneas
      if (idx < 5) {
        roundStmt.run(m1Id, chofer1Id, 1, '2026-11-24 07:00:00', '2026-11-24 08:30:00', 21, 42.00);
        roundStmt.run(m1Id, chofer1Id, 2, '2026-11-24 08:45:00', '2026-11-24 10:15:00', 22, 44.00);
        paymentStmt.run(m1Id, 2.00);
        paymentStmt.run(m1Id, 2.00);
      }
    });
  });

  console.log(`✅ Base de datos semillada con éxito: 60 Líneas, 120 Choferes con datos completos y 120 Micros listos.`);
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
