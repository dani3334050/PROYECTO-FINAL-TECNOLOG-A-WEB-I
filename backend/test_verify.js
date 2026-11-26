import bcrypt from 'bcryptjs';
import { db } from './src/config/db.js';

console.log('--- 1. VERIFICACIÓN DE ESTRUCTURA Y ROLES ADMINISTRATIVOS ---');
const superAdmin = db.prepare("SELECT * FROM users WHERE role = 'SUPERADMIN'").get();
console.log('Superadmin:', superAdmin.full_name, `[Email: ${superAdmin.email}]`);

const admin122 = db.prepare("SELECT * FROM users WHERE role = 'ADMIN_LINEA' AND email = 'admin122@rutabol.com'").get();
console.log('Admin Línea 122:', admin122.full_name, `[Line ID: ${admin122.line_id}]`);

const driver122 = db.prepare("SELECT * FROM users WHERE role = 'CHOFER' AND email = 'chofer122@rutabol.com'").get();
console.log('Chofer Línea 122 (para App Móvil):', driver122.full_name, `[Licencia: ${driver122.license_number}]`);
const driverPassMatch = bcrypt.compareSync('chofer123', driver122.password_hash);
console.log('Autenticación de Chofer con contraseña:', driverPassMatch ? 'EXITOSA (Bcrypt)' : 'FALLIDA');

// Verificar que student_profiles ya no existe
const studentTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='student_profiles'").get();
console.log('Tabla student_profiles existe en SQLite?:', studentTable ? 'SÍ' : 'NO (Eliminada correctamente)');

console.log('\n--- 2. VERIFICACIÓN DE VEHÍCULOS Y RASTREO PARA APP MÓVIL ---');
const microsL122 = db.prepare(`
  SELECT m.id, m.internal_number, m.license_plate, m.vehicle_model, m.capacity_max, m.tracking_active, m.status,
         u.full_name as driver_name
  FROM micros m
  LEFT JOIN users u ON m.driver_id = u.id
  WHERE m.line_id = ?
`).all(admin122.line_id);

console.log(`Vehículos registrados en Línea 122: ${microsL122.length}`);
microsL122.forEach((m) => {
  console.log(`• Interno #${m.internal_number} | Placa: ${m.license_plate} | Modelo: ${m.vehicle_model} | Rastreo App: ${m.tracking_active === 1 ? 'ACTIVO' : 'PAUSADO'} | Chofer: ${m.driver_name || 'Sin asignar'}`);
});

console.log('\n--- 3. VERIFICACIÓN FINANCIERA (COMISIÓN 10%) ---');
const line122 = db.prepare('SELECT * FROM lines WHERE id = ?').get(admin122.line_id);
const rounds = db.prepare('SELECT COUNT(*) as count, SUM(total_collected) as sum FROM rounds WHERE micro_id IN (SELECT id FROM micros WHERE line_id = ?)').get(admin122.line_id);
const payments = db.prepare('SELECT COALESCE(SUM(amount), 0) as sum FROM payments WHERE micro_id IN (SELECT id FROM micros WHERE line_id = ?)').get(admin122.line_id);

const gross = (rounds.sum || 0) + payments.sum;
const commissionRate = line122.commission_percentage;
const commissionAmount = gross * (commissionRate / 100);
const net = gross - commissionAmount;

console.log(`Línea 122 - Vueltas registradas: ${rounds.count}`);
console.log(`Recaudación Bruta: Bs. ${gross.toFixed(2)}`);
console.log(`Comisión Plataforma (${commissionRate}%): Bs. ${commissionAmount.toFixed(2)}`);
console.log(`Ganancia Neta Línea: Bs. ${net.toFixed(2)}`);

console.log('\n--- 4. VERIFICACIÓN DE APP MÓVIL (CHOFER Y ESTUDIANTE) ---');
const studentUser = db.prepare("SELECT * FROM users WHERE email = 'daniel.frias@upds.edu.bo'").get();
if (studentUser) {
  const studentPassMatch = bcrypt.compareSync('upds123', studentUser.password_hash);
  console.log(`Estudiante UPDS: ${studentUser.full_name} [Rol: ${studentUser.role}]`);
  console.log(`Autenticación de Estudiante (Bcrypt): ${studentPassMatch ? 'EXITOSA' : 'FALLIDA'}`);
} else {
  console.log('Usuario de estudiante no encontrado.');
}

const activeTrackingMicros = db.prepare(`
  SELECT m.id, m.internal_number, m.license_plate, l.line_number, m.capacity_max, m.current_passengers
  FROM micros m
  JOIN lines l ON m.line_id = l.id
  WHERE m.tracking_active = 1
`).all();
console.log(`Micros visibles en radar móvil para estudiantes (tracking_active = 1): ${activeTrackingMicros.length}`);
activeTrackingMicros.forEach(m => {
  console.log(`• Línea ${m.line_number} - Interno #${m.internal_number} (${m.license_plate}) | Aforo: ${m.current_passengers}/${m.capacity_max}`);
});

console.log('\n✅ VERIFICACIÓN DE BASE DE DATOS COMPLETADA CON ÉXITO.');
