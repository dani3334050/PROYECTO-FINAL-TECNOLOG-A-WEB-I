import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

import { initDatabase, db } from './config/db.js';
import { sessionMiddleware } from './config/session.js';
import { runSeed } from './utils/seed.js';
import { initSimulationEngine } from './utils/simulator.js';

import authRoutes from './routes/auth.routes.js';
import { createFleetRoutes } from './routes/fleet.routes.js';
import geoRoutes from './routes/geo.routes.js';
import { createPaymentRoutes } from './routes/payment.routes.js';
import { createTransferRoutes } from './routes/transfer.routes.js';
import { createSuperadminRoutes } from './routes/superadmin.routes.js';
import { createLineAdminRoutes } from './routes/lineadmin.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Configuración de CORS con credenciales (esencial para Cookies y Sesión)
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (como apps móviles nativas, Postman) o si coincide con la lista
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(null, true); // En desarrollo permitir acceso fluido desde red local móvil
    }
  },
  credentials: true, // Permite transmitir cookies HTTP-only entre frontend y backend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// 2. Parsers de petición
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. Middleware de Sesiones en SQLite con Cookie 'rutabol.sid'
app.use(sessionMiddleware);

// 4. Servir carpeta de subida de fotos
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// 5. Configurar Socket.io para tiempo real (RNF-02, RF-07, RF-10)
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true); // Permitir conexiones WebSocket desde frontend web y app móvil
    },
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado vía WebSocket: ${socket.id}`);

  // El chofer emite su nueva ubicación GPS en movimiento
  socket.on('driver:stream_location', ({ microId, lat, lng }) => {
    try {
      db.prepare(`
        UPDATE micros 
        SET current_lat = ?, current_lng = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(lat, lng, microId);

      const micro = db.prepare(`
        SELECT m.*, l.line_number, l.name as line_name 
        FROM micros m JOIN lines l ON m.line_id = l.id WHERE m.id = ?
      `).get(microId);

      io.emit('micro:location_updated', {
        microId,
        lat,
        lng,
        lineNumber: micro ? micro.line_number : '??',
        internalNumber: micro ? micro.internal_number : '??',
        availableSeats: micro ? Math.max(0, micro.capacity_max - micro.current_passengers) : 0,
        currentPassengers: micro ? micro.current_passengers : 0,
        capacityMax: micro ? micro.capacity_max : 22
      });
    } catch (err) {
      console.error('Error al actualizar streaming de ubicación:', err);
    }
  });

  // El chofer actualiza conteo de pasajeros en abordaje/descenso
  socket.on('micro:update_passengers', ({ microId, currentPassengers }) => {
    try {
      db.prepare(`
        UPDATE micros 
        SET current_passengers = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(currentPassengers, microId);

      const micro = db.prepare(`
        SELECT m.*, l.line_number, l.name as line_name 
        FROM micros m JOIN lines l ON m.line_id = l.id WHERE m.id = ?
      `).get(microId);

      io.emit('micro:occupancy_updated', {
        microId,
        currentPassengers,
        capacityMax: micro ? micro.capacity_max : 22,
        availableSeats: micro ? Math.max(0, micro.capacity_max - currentPassengers) : 0
      });
    } catch (err) {
      console.error('Error al actualizar conteo de pasajeros:', err);
    }
  });

  // El chofer emite alerta de contingencia o desperfecto técnico
  socket.on('micro:emergency_declared', ({ microId, reason }) => {
    try {
      db.prepare(`
        UPDATE micros 
        SET status = 'EMERGENCIA', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(microId);

      const micro = db.prepare(`
        SELECT m.*, l.line_number 
        FROM micros m JOIN lines l ON m.line_id = l.id WHERE m.id = ?
      `).get(microId);

      io.emit('micro:emergency', {
        microId,
        lineNumber: micro ? micro.line_number : '??',
        internalNumber: micro ? micro.internal_number : '??',
        reason: reason || 'Falla mecánica en ruta',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error al emitir alerta de emergencia:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// 6. Registro de Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/fleet', createFleetRoutes(io));
app.use('/api/geo', geoRoutes);
app.use('/api/payments', createPaymentRoutes(io));
app.use('/api/transfers', createTransferRoutes(io));
app.use('/api/superadmin', createSuperadminRoutes(io));
app.use('/api/line-admin', createLineAdminRoutes(io));

// Endpoint de estado y comprobación rápida
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    system: 'SISTEMA RUTABOL-SCZ API',
    database: 'SQLite (rutabol.db)',
    sessionActive: !!req.session?.user,
    user: req.session?.user || null
  });
});

// 7. Inicialización de la BD y arranque del servidor
initDatabase();

// Semillar automáticamente si la base de datos está vacía
try {
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!usersCount || usersCount.count === 0) {
    console.log('📌 Base de datos vacía detectada. Ejecutando seed inicial...');
    runSeed();
  }
} catch (e) {
  console.error('Error al verificar conteo inicial:', e);
}

server.listen(PORT, () => {
  console.log(`🚀 Servidor RUTABOL-SCZ Backend corriendo en http://localhost:${PORT}`);
  console.log(`🍪 Manejo de sesiones y cookies activado`);
  console.log(`📍 WebSockets listos para GPS y Aforo en tiempo real`);

  // Inicializar Motor de Simulación en Tiempo Real de Micros y Salidas Periódicas de Terminal
  initSimulationEngine(io);
});
