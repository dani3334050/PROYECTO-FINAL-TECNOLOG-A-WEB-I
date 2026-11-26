import session from 'express-session';
import { db } from './db.js';

/**
 * SQLite Store para express-session
 * Guarda las sesiones en la tabla `sessions` de SQLite para que sobrevivan a reinicios del servidor.
 */
class SQLiteSessionStore extends session.Store {
  constructor() {
    super();
    // Limpieza periódica de sesiones vencidas cada 15 minutos
    setInterval(() => this.cleanupExpired(), 15 * 60 * 1000);
  }

  get(sid, callback) {
    try {
      const stmt = db.prepare('SELECT sess, expire FROM sessions WHERE sid = ?');
      const row = stmt.get(sid);
      if (!row) return callback(null, null);

      if (new Date(row.expire) < new Date()) {
        this.destroy(sid, () => {});
        return callback(null, null);
      }

      const sessionData = JSON.parse(row.sess);
      callback(null, sessionData);
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sessionData, callback) {
    try {
      const maxAge = sessionData.cookie?.maxAge || 24 * 60 * 60 * 1000;
      const expire = new Date(Date.now() + maxAge).toISOString();
      const sessJson = JSON.stringify(sessionData);

      const stmt = db.prepare(`
        INSERT INTO sessions (sid, sess, expire)
        VALUES (?, ?, ?)
        ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expire = excluded.expire
      `);
      stmt.run(sid, sessJson, expire);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      const stmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
      stmt.run(sid);
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }

  cleanupExpired() {
    try {
      const now = new Date().toISOString();
      const stmt = db.prepare('DELETE FROM sessions WHERE expire < ?');
      stmt.run(now);
    } catch (err) {
      console.error('Error al limpiar sesiones expiradas en SQLite:', err);
    }
  }
}

/**
 * Middleware de sesión configurado con Cookies seguras
 */
export const sessionMiddleware = session({
  store: new SQLiteSessionStore(),
  name: 'rutabol.sid', // Nombre distintivo de la cookie
  secret: process.env.SESSION_SECRET || 'rutabol_super_secret_session_key_2026',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Renueva la expiración de la cookie con cada petición
  cookie: {
    httpOnly: true, // Protege contra ataques XSS
    secure: process.env.NODE_ENV === 'production', // true solo en HTTPS
    sameSite: 'lax', // Protección CSRF y soporte para navegación normal
    maxAge: 24 * 60 * 60 * 1000 // 24 horas de duración
  }
});
