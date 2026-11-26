import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio de datos
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'rutabol.db');
export const db = new DatabaseSync(dbPath);

// Habilitar claves foráneas y modo WAL
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Inicialización y migración del esquema relacional en SQLite
 * (Sin tablas ni dependencias de estudiantes)
 */
export function initDatabase() {
  db.exec(`
    -- 1. Líneas de Transporte Urbano (con puntos de salida, llegada y trazado de ruta)
    CREATE TABLE IF NOT EXISTS lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_number TEXT UNIQUE NOT NULL, -- ej: '122', '11', '72'
      name TEXT NOT NULL,
      color TEXT DEFAULT '#334155',
      commission_percentage REAL DEFAULT 10.0, -- Comisión dinámica para el Superadmin
      origin_name TEXT, -- Nombre de la parada de salida (ej: Parada Los Lotes)
      origin_lat REAL,
      origin_lng REAL,
      destination_name TEXT, -- Nombre de la parada de llegada (ej: Av. Cristo Redentor)
      destination_lat REAL,
      destination_lng REAL,
      route_coordinates TEXT, -- Arreglo JSON de puntos [[lat, lng], ...]
      distance_km REAL, -- Distancia del recorrido en kilómetros
      active INTEGER DEFAULT 1
    );

    -- 2. Tabla de Usuarios (Superadmin, Choferes, Estudiantes y Pasajeros)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_id INTEGER, -- Asignado para CHOFER o Administrador
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('SUPERADMIN', 'ADMIN_LINEA', 'CHOFER', 'PASAJERO', 'ESTUDIANTE', 'ADMIN')),
      full_name TEXT NOT NULL,
      phone TEXT,
      license_number TEXT, -- Para choferes
      ci TEXT,             -- Cédula de Identidad con extensión (ej: 5892341 SC)
      photo_url TEXT,      -- Fotografía / Avatar del chofer o usuario
      experience_years INTEGER DEFAULT 5, -- Años de experiencia en conducción
      rating REAL DEFAULT 4.9,            -- Calificación del chofer
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (line_id) REFERENCES lines(id) ON DELETE SET NULL
    );

    -- 2.1 Perfiles Estudiantiles (RF-02 Escolar RUDE, RF-03 Universitario UPDS)
    CREATE TABLE IF NOT EXISTS student_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      student_type TEXT NOT NULL CHECK(student_type IN ('ESCOLAR', 'UNIVERSITARIO')),
      code_student TEXT NOT NULL, -- RUDE para escolar o CodEst para universitario
      institution TEXT NOT NULL,  -- Colegio o UPDS
      institutional_email TEXT,  -- @upds.edu.bo para universitario
      photo_url TEXT NOT NULL,   -- Foto facial del estudiante para validación visual (RF-10)
      verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 3. Unidades de Transporte (Micros con Placa, Ficha Técnica y Activación de Rastreo)
    CREATE TABLE IF NOT EXISTS micros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_id INTEGER NOT NULL,
      internal_number INTEGER NOT NULL,
      license_plate TEXT, -- Placa del micro
      vehicle_model TEXT, -- Modelo ej: Toyota Coaster
      year INTEGER,
      driver_id INTEGER UNIQUE,
      capacity_max INTEGER NOT NULL CHECK(capacity_max BETWEEN 18 AND 25),
      current_passengers INTEGER DEFAULT 0 CHECK(current_passengers >= 0),
      tracking_active INTEGER DEFAULT 0, -- 1 = Rastreo activo para App Móvil, 0 = Inactivo
      status TEXT DEFAULT 'INACTIVO' CHECK(status IN ('ACTIVO', 'EN_RUTA', 'EN_DESCANSO', 'EMERGENCIA', 'MANTENIMIENTO', 'INACTIVO')),
      current_lat REAL DEFAULT -17.7833,
      current_lng REAL DEFAULT -63.1821,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(line_id, internal_number),
      FOREIGN KEY (line_id) REFERENCES lines(id) ON DELETE CASCADE,
      FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 4. Rondas / Vueltas Operativas Realizadas por los Micros
    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      micro_id INTEGER NOT NULL,
      driver_id INTEGER,
      round_number INTEGER NOT NULL,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      passengers_count INTEGER DEFAULT 0,
      total_collected REAL DEFAULT 0.0,
      status TEXT DEFAULT 'COMPLETADA' CHECK(status IN ('EN_CURSO', 'COMPLETADA')),
      FOREIGN KEY (micro_id) REFERENCES micros(id) ON DELETE CASCADE,
      FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 5. Tarifario Oficial
    CREATE TABLE IF NOT EXISTS fares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT UNIQUE NOT NULL,
      price REAL NOT NULL
    );

    -- 6. Transacciones de Pagos
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      micro_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      fare_category TEXT DEFAULT 'GENERAL',
      card_last4 TEXT NOT NULL,
      card_brand TEXT DEFAULT 'VISA',
      status TEXT DEFAULT 'COMPLETADO',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (micro_id) REFERENCES micros(id)
    );

    -- 7. Boletos Digitales Emitidos
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_code TEXT UNIQUE NOT NULL,
      payment_id INTEGER,
      user_id INTEGER,
      micro_id INTEGER NOT NULL,
      original_micro_id INTEGER,
      fare_category TEXT DEFAULT 'GENERAL',
      status TEXT DEFAULT 'ACTIVO' CHECK(status IN ('ACTIVO', 'USADO', 'TRASBORDADO', 'CANCELADO')),
      is_transfer INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (payment_id) REFERENCES payments(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (micro_id) REFERENCES micros(id)
    );

    -- 8. Trazabilidad de Trasbordos
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_type TEXT NOT NULL CHECK(transfer_type IN ('RELEVO', 'EMERGENCIA')),
      source_micro_id INTEGER NOT NULL,
      target_micro_id INTEGER,
      ticket_id INTEGER NOT NULL,
      passenger_id INTEGER,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_micro_id) REFERENCES micros(id),
      FOREIGN KEY (target_micro_id) REFERENCES micros(id),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    );

    -- 9. Sesiones para express-session
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire DATETIME NOT NULL
    );

    -- 10. Buzón de Reportes e Incidencias Estudiantiles (ODS 11)
    CREATE TABLE IF NOT EXISTS incident_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_code TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      micro_id INTEGER,
      line_number TEXT,
      internal_number INTEGER,
      driver_name TEXT,
      incident_type TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'REGISTRADO' CHECK(status IN ('REGISTRADO', 'EN_REVISION', 'SANCIONADO', 'ARCHIVADO')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (micro_id) REFERENCES micros(id) ON DELETE SET NULL
    );

    -- 11. Líneas Favoritas de Estudiantes y Pasajeros
    CREATE TABLE IF NOT EXISTS user_favorite_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      line_number TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, line_number),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migraciones automáticas no destructivas para rutas en líneas
  const lineColumns = [
    'origin_name TEXT',
    'origin_lat REAL',
    'origin_lng REAL',
    'destination_name TEXT',
    'destination_lat REAL',
    'destination_lng REAL',
    'route_coordinates TEXT',
    'distance_km REAL'
  ];

  for (const col of lineColumns) {
    try {
      db.exec(`ALTER TABLE lines ADD COLUMN ${col};`);
    } catch (e) {
      // Columna ya existe
    }
  }

  // Migraciones automáticas para campos enriquecidos de Choferes
  const userColumns = [
    'ci TEXT',
    'photo_url TEXT',
    'experience_years INTEGER DEFAULT 5',
    'rating REAL DEFAULT 4.9'
  ];

  for (const col of userColumns) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${col};`);
    } catch (e) {
      // Columna ya existe
    }
  }

  console.log('✅ Base de datos SQLite inicializada (Esquema completo con soporte integral de Estudiantes, Choferes y Admins).');
}

export function executeTransaction(callback) {
  db.exec('BEGIN TRANSACTION;');
  try {
    const result = callback(db);
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
