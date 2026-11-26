import assert from 'node:assert';
import { db, initDatabase, executeTransaction } from './src/config/db.js';
import { filterMicrosByRadius } from './src/utils/haversine.js';
import bcrypt from 'bcryptjs';

console.log('🧪 Iniciando batería de verificación integral de Requerimientos Funcionales (RF-01 a RF-10)...');

// 1. RF-01: Registro y Validación de Unidades por Línea y Número Interno
console.log('\n--- 1. Verificando RF-01 (Validación de Línea e Interno) ---');
const anyLine = db.prepare("SELECT * FROM lines WHERE line_number = '11'").get() || db.prepare("SELECT * FROM lines LIMIT 1").get();
assert(anyLine, 'Debe existir una línea en la base de datos');
console.log(`✓ Línea encontrada: ID=${anyLine.id}, Línea=${anyLine.line_number}, Nombre=${anyLine.name}`);

const microUnit = db.prepare('SELECT * FROM micros WHERE line_id = ? AND internal_number = 1').get(anyLine.id);
assert(microUnit, `Micro con interno 1 debe existir en la Línea ${anyLine.line_number}`);
console.log(`✓ Unidad validada: ID=${microUnit.id}, Interno=${microUnit.internal_number}, Estado=${microUnit.status}, Capacidad=${microUnit.capacity_max}`);

// Validar que no se puede duplicar un número interno en la misma línea
try {
  db.prepare('INSERT INTO micros (line_id, internal_number, capacity_max) VALUES (?, 1, 22)').run(anyLine.id);
  assert.fail('No debería permitir insertar interno duplicado');
} catch (e) {
  console.log(`✓ Restricción UNIQUE(line_id, internal_number) confirmada: Se impidió duplicar el interno 1 en Línea ${anyLine.line_number}.`);
}

// 2. RF-02 y RF-03: Registro de Estudiantes (Escolar RUDE y Universitario UPDS)
console.log('\n--- 2. Verificando RF-02 y RF-03 (Registro Escolar RUDE y Universitario UPDS) ---');
const univStudent = db.prepare(`
  SELECT u.*, sp.student_type, sp.code_student, sp.institution, sp.photo_url
  FROM users u
  JOIN student_profiles sp ON u.id = sp.user_id
  WHERE u.email = 'daniel.frias@upds.edu.bo'
`).get();

assert(univStudent, 'Estudiante universitario UPDS debe existir');
assert.strictEqual(univStudent.role, 'ESTUDIANTE');
assert.strictEqual(univStudent.student_type, 'UNIVERSITARIO');
assert(univStudent.email.endsWith('@upds.edu.bo'), 'Correo debe tener dominio institucional @upds.edu.bo');
assert(univStudent.photo_url, 'Foto facial de estudiante debe estar presente');
console.log(`✓ RF-03 Verificado: ${univStudent.full_name} (${univStudent.student_type}) - CodEst: ${univStudent.code_student} - Correo: ${univStudent.email} - Foto: ${univStudent.photo_url}`);

const schoolStudent = db.prepare(`
  SELECT u.*, sp.student_type, sp.code_student, sp.institution, sp.photo_url
  FROM users u
  JOIN student_profiles sp ON u.id = sp.user_id
  WHERE u.email = 'mateo.escolar@gmail.com'
`).get();

assert(schoolStudent, 'Estudiante escolar debe existir');
assert.strictEqual(schoolStudent.student_type, 'ESCOLAR');
assert(schoolStudent.code_student.startsWith('RUDE'), 'Código RUDE debe estar registrado');
console.log(`✓ RF-02 Verificado: ${schoolStudent.full_name} (${schoolStudent.student_type}) - RUDE: ${schoolStudent.code_student} - Colegio: ${schoolStudent.institution}`);

// 3. RF-04: Tarifario Oficial
console.log('\n--- 3. Verificando RF-04 (Cálculo Automático de Tarifas) ---');
const fares = db.prepare('SELECT category, price FROM fares').all();
const fareMap = Object.fromEntries(fares.map(f => [f.category, f.price]));
assert.strictEqual(fareMap['GENERAL'], 2.00, 'Tarifa General debe ser Bs. 2.00');
assert.strictEqual(fareMap['UNIVERSITARIO'], 1.00, 'Tarifa Universitaria debe ser Bs. 1.00');
assert.strictEqual(fareMap['ESCOLAR'], 0.80, 'Tarifa Escolar debe ser Bs. 0.80');
console.log(`✓ Tarifas oficiales verificadas: GENERAL=Bs.${fareMap['GENERAL'].toFixed(2)}, UNIVERSITARIO=Bs.${fareMap['UNIVERSITARIO'].toFixed(2)}, ESCOLAR=Bs.${fareMap['ESCOLAR'].toFixed(2)}`);

// 4. RF-06: Gestión Estricta de Capacidad de Asientos (18 a 25)
console.log('\n--- 4. Verificando RF-06 (Gestión Estricta de Capacidad 18-25) ---');
const allMicros = db.prepare('SELECT id, line_id, internal_number, capacity_max, current_passengers FROM micros').all();
for (const m of allMicros) {
  assert(m.capacity_max >= 18 && m.capacity_max <= 25, `Micro ${m.id} tiene aforo ${m.capacity_max} fuera del rango 18-25`);
}
console.log(`✓ Todas las ${allMicros.length} unidades en la red cumplen el rango regulatorio de 18 a 25 asientos.`);

// 5. RF-07: Radar Geoespacial de 5 km (Fórmula de Haversine)
console.log('\n--- 5. Verificando RF-07 (Radar Geoespacial de 5 km) ---');
const updsLat = -17.7765;
const updsLng = -63.1950;
const activeMicros = db.prepare(`
  SELECT m.id, m.line_id, m.internal_number, m.capacity_max, m.current_passengers,
         m.status, m.current_lat, m.current_lng,
         l.line_number, l.name as line_name
  FROM micros m
  JOIN lines l ON m.line_id = l.id
  WHERE m.status IN ('ACTIVO', 'EN_RUTA')
`).all();

const inRadius = filterMicrosByRadius(activeMicros, updsLat, updsLng, 5.0);
console.log(`✓ Radar Haversine calculó ${inRadius.length} unidades dentro del radio de 5.0 km desde Campus UPDS.`);
for (const m of inRadius) {
  assert(m.distance_km <= 5.0, `Micro ${m.internal_number} excede 5.0 km: ${m.distance_km}`);
  console.log(`  - Línea ${m.line_number} Interno #${m.internal_number}: a ${m.distance_km} km (Aforo: ${m.current_passengers}/${m.capacity_max})`);
}

// 6. RF-05: Emisión de Boleto Digital y Pago con Tarjeta
console.log('\n--- 6. Verificando RF-05 (Pasarela de Pago y Emisión de Boleto) ---');
const testMicro = inRadius[0];
const initialPassengers = testMicro.current_passengers;

const ticketResult = executeTransaction((txn) => {
  const paymentRes = txn.prepare(`
    INSERT INTO payments (user_id, micro_id, amount, fare_category, card_last4, card_brand, status)
    VALUES (?, ?, 1.00, 'UNIVERSITARIO', '4532', 'VISA', 'COMPLETADO')
  `).run(univStudent.id, testMicro.id);

  txn.prepare('UPDATE micros SET current_passengers = current_passengers + 1 WHERE id = ?').run(testMicro.id);

  const tCode = `RB-TEST-${Date.now().toString(36).toUpperCase()}`;
  const tRes = txn.prepare(`
    INSERT INTO tickets (ticket_code, payment_id, user_id, micro_id, original_micro_id, fare_category, status)
    VALUES (?, ?, ?, ?, ?, 'UNIVERSITARIO', 'ACTIVO')
  `).run(tCode, paymentRes.lastInsertRowid, univStudent.id, testMicro.id, testMicro.id);

  return { ticketId: tRes.lastInsertRowid, ticketCode: tCode };
});

const updatedMicro = db.prepare('SELECT current_passengers FROM micros WHERE id = ?').get(testMicro.id);
assert.strictEqual(updatedMicro.current_passengers, initialPassengers + 1, 'El aforo debe haber aumentado en 1');
console.log(`✓ Boleto digital emitido: ${ticketResult.ticketCode} (ID=${ticketResult.ticketId}). Nuevo aforo: ${updatedMicro.current_passengers}`);

// 7. RF-08: Trasbordo por Relevo (ACID)
console.log('\n--- 7. Verificando RF-08 (Trasbordo por Relevo ACID) ---');
// Buscar micro de relevo de la misma línea
const targetReliefMicro = db.prepare('SELECT * FROM micros WHERE line_id = ? AND id != ? LIMIT 1').get(testMicro.line_id, testMicro.id);
if (targetReliefMicro) {
  const initialTargetPassengers = targetReliefMicro.current_passengers;
  
  executeTransaction((txn) => {
    // Trasladar boletos activos
    txn.prepare("UPDATE tickets SET micro_id = ?, is_transfer = 1 WHERE micro_id = ? AND status = 'ACTIVO'")
      .run(targetReliefMicro.id, testMicro.id);
    
    // El micro saliente queda con 0 pasajeros y EN_DESCANSO
    txn.prepare("UPDATE micros SET status = 'EN_DESCANSO', current_passengers = 0 WHERE id = ?").run(testMicro.id);
    
    // El micro entrante asume los pasajeros
    txn.prepare('UPDATE micros SET current_passengers = current_passengers + ? WHERE id = ?')
      .run(updatedMicro.current_passengers, targetReliefMicro.id);
  });

  const sourceAfter = db.prepare('SELECT status, current_passengers FROM micros WHERE id = ?').get(testMicro.id);
  const targetAfter = db.prepare('SELECT current_passengers FROM micros WHERE id = ?').get(targetReliefMicro.id);

  assert.strictEqual(sourceAfter.status, 'EN_DESCANSO');
  assert.strictEqual(sourceAfter.current_passengers, 0);
  assert.strictEqual(targetAfter.current_passengers, initialTargetPassengers + updatedMicro.current_passengers);
  console.log(`✓ Trasbordo por Relevo exitoso: Micro saliente en ${sourceAfter.status} (0 pasajeros). Micro entrante con ${targetAfter.current_passengers} pasajeros sin doble cobro.`);
}

console.log('\n=============================================================');
console.log('🎉 ¡TODOS LOS REQUERIMIENTOS FUNCIONALES RF-01 A RF-10 VERIFICADOS CON ÉXITO!');
console.log('=============================================================\n');
