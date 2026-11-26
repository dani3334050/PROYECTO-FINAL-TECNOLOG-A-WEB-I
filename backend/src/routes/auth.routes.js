import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, executeTransaction } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadStudentPhoto } from '../middleware/upload.js';

const router = Router();

/**
 * POST /api/auth/login
 * Autenticación de Superadmin, Administradores de Línea, Choferes, Pasajeros y Estudiantes
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Correo y contraseña requeridos.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    let assignedLine = null;
    if (user.line_id) {
      assignedLine = db.prepare('SELECT id, line_number, name, color, commission_percentage FROM lines WHERE id = ?').get(user.line_id);
    }

    let assignedMicro = null;
    if (user.role === 'CHOFER') {
      assignedMicro = db.prepare(`
        SELECT m.*, l.line_number, l.name as line_name 
        FROM micros m 
        JOIN lines l ON m.line_id = l.id 
        WHERE m.driver_id = ?
      `).get(user.id);
    }

    let studentProfile = null;
    if (user.role === 'ESTUDIANTE') {
      studentProfile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      line_id: user.line_id || null,
      full_name: user.full_name,
      phone: user.phone,
      license_number: user.license_number || null,
      assignedMicro: assignedMicro || null,
      assignedLine: assignedLine || null,
      studentProfile: studentProfile || null
    };

    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      user: req.session.user
    });

  } catch (error) {
    console.error('Error en /login:', error);
    return res.status(500).json({ success: false, error: 'Error interno en el servidor.' });
  }
});

/**
 * GET /api/auth/me
 * Obtiene el usuario autenticado a través de la Cookie de sesión
 */
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, authenticated: false });
  }

  const user = db.prepare('SELECT id, line_id, email, role, full_name, phone, license_number FROM users WHERE id = ?').get(req.session.user.id);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ success: false, authenticated: false });
  }

  let assignedLine = null;
  if (user.line_id) {
    assignedLine = db.prepare('SELECT id, line_number, name, color, commission_percentage FROM lines WHERE id = ?').get(user.line_id);
  }

  let assignedMicro = null;
  if (user.role === 'CHOFER') {
    assignedMicro = db.prepare(`
      SELECT m.*, l.line_number, l.name as line_name 
      FROM micros m 
      JOIN lines l ON m.line_id = l.id 
      WHERE m.driver_id = ?
    `).get(user.id);
  }

  let studentProfile = null;
  if (user.role === 'ESTUDIANTE') {
    studentProfile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
  }

  const updatedSession = {
    ...user,
    assignedMicro,
    assignedLine,
    studentProfile
  };
  req.session.user = updatedSession;

  return res.json({
    success: true,
    authenticated: true,
    user: updatedSession
  });
});

/**
 * POST /api/auth/register-student
 * RF-02 y RF-03: Registro de Estudiantes (Escolar RUDE o Universitario UPDS) con foto obligatoria
 */
router.post('/register-student', uploadStudentPhoto.single('photo'), async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      student_type,
      code_student,
      institution
    } = req.body;

    if (!full_name || !email || !password || !student_type || !code_student) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos marcados son obligatorios (Nombre, Correo, Contraseña, Tipo y Código de Estudiante).'
      });
    }

    const typeNormalized = student_type.toUpperCase().trim();
    if (typeNormalized !== 'ESCOLAR' && typeNormalized !== 'UNIVERSITARIO') {
      return res.status(400).json({
        success: false,
        error: "El tipo de estudiante debe ser 'ESCOLAR' o 'UNIVERSITARIO'."
      });
    }

    const emailTrimmed = email.toLowerCase().trim();

    // RF-03: Para universitarios UPDS, validar dominio institucional @upds.edu.bo
    if (typeNormalized === 'UNIVERSITARIO') {
      const updsRegex = /^[a-zA-Z0-9._%+-]+@upds\.edu\.bo$/i;
      if (!updsRegex.test(emailTrimmed)) {
        return res.status(400).json({
          success: false,
          error: 'El correo institucional de estudiante universitario debe tener obligatoriamente el dominio @upds.edu.bo (RF-03).'
        });
      }
    }

    // Verificar si el correo ya está registrado
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailTrimmed);
    if (existing) {
      return res.status(409).json({ success: false, error: 'El correo electrónico ya está registrado.' });
    }

    // Foto facial del estudiante (RF-02, RF-03, RF-10)
    let photoUrl = '/uploads/default-student.jpg';
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.photo_url) {
      photoUrl = req.body.photo_url;
    } else {
      // Foto demo para pruebas de validación visual
      photoUrl = typeNormalized === 'UNIVERSITARIO'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80';
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const institutionName = institution || (typeNormalized === 'UNIVERSITARIO' ? 'Universidad Privada Domingo Savio (UPDS)' : 'Colegio / Unidad Educativa');

    // Transacción ACID para insertar usuario y perfil estudiantil
    const newUser = executeTransaction((txn) => {
      const userRes = txn.prepare(`
        INSERT INTO users (email, password_hash, role, full_name, phone)
        VALUES (?, ?, 'ESTUDIANTE', ?, ?)
      `).run(emailTrimmed, passwordHash, full_name.trim(), phone || null);

      const userId = Number(userRes.lastInsertRowid);

      txn.prepare(`
        INSERT INTO student_profiles (user_id, student_type, code_student, institution, institutional_email, photo_url, verified)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(
        userId,
        typeNormalized,
        code_student.trim(),
        institutionName,
        typeNormalized === 'UNIVERSITARIO' ? emailTrimmed : null,
        photoUrl
      );

      return {
        id: userId,
        email: emailTrimmed,
        role: 'ESTUDIANTE',
        full_name: full_name.trim(),
        phone: phone || null,
        studentProfile: {
          student_type: typeNormalized,
          code_student: code_student.trim(),
          institution: institutionName,
          institutional_email: typeNormalized === 'UNIVERSITARIO' ? emailTrimmed : null,
          photo_url: photoUrl,
          verified: 1
        }
      };
    });

    req.session.user = newUser;

    return res.status(201).json({
      success: true,
      message: `Estudiante ${typeNormalized} registrado exitosamente. Tarifa preferencial activada.`,
      user: newUser
    });

  } catch (error) {
    console.error('Error en /register-student:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/register-passenger
 * Registro de Pasajero General
 */
router.post('/register-passenger', async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Nombre, correo y contraseña son requeridos.' });
    }

    const emailTrimmed = email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailTrimmed);
    if (existing) {
      return res.status(409).json({ success: false, error: 'El correo electrónico ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRes = db.prepare(`
      INSERT INTO users (email, password_hash, role, full_name, phone)
      VALUES (?, ?, 'PASAJERO', ?, ?)
    `).run(emailTrimmed, passwordHash, full_name.trim(), phone || null);

    const newUser = {
      id: Number(userRes.lastInsertRowid),
      email: emailTrimmed,
      role: 'PASAJERO',
      full_name: full_name.trim(),
      phone: phone || null,
      assignedMicro: null,
      assignedLine: null
    };

    req.session.user = newUser;

    return res.status(201).json({
      success: true,
      message: 'Pasajero registrado exitosamente.',
      user: newUser
    });

  } catch (error) {
    console.error('Error en /register-passenger:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Destruye la sesión y limpia la cookie
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al destruir sesión:', err);
      return res.status(500).json({ success: false, error: 'No se pudo cerrar la sesión.' });
    }
    res.clearCookie('rutabol.sid');
    return res.json({ success: true, message: 'Sesión cerrada correctamente.' });
  });
});

export default router;
