import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 60 números de línea únicos del 1 al 100
export const LINE_NUMBERS = [
  1, 2, 3, 5, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 
  20, 21, 22, 23, 24, 25, 27, 28, 29, 30, 32, 34, 35, 38, 40, 
  41, 42, 44, 45, 47, 50, 51, 53, 55, 58, 60, 63, 64, 66, 68, 
  70, 72, 73, 75, 76, 77, 78, 80, 81, 84, 85, 88, 90, 94, 99
];

export const COLORS = [
  '#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4',
  '#3B82F6', '#14B8A6', '#6366F1', '#D97706', '#E11D48', '#0284C7',
  '#059669', '#7C3AED', '#B45309', '#BE123C', '#0369A1', '#047857',
  '#6D28D9', '#92400E', '#9F1239', '#075985', '#065F46', '#5B21B6',
  '#78350F', '#881337', '#0C4A6E', '#064E3B', '#4C1D95', '#713F12',
  '#38BDF8', '#34D399', '#A78BFA', '#FBBF24', '#F472B6', '#22D3EE',
  '#60A5FA', '#2DD4BF', '#818CF8', '#F59E0B', '#FB7185', '#38BDF8',
  '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#3B82F6',
  '#14B8A6', '#6366F1', '#D97706', '#E11D48', '#0284C7', '#059669',
  '#7C3AED', '#B45309', '#BE123C', '#0369A1', '#047857', '#6D28D9'
];

export const FIRST_NAMES = [
  'Carlos', 'Mario', 'Juan', 'David', 'Jorge', 'Roberto', 'Luis', 'Hugo', 'Víctor', 'Ramiro',
  'Gonzalo', 'Fernando', 'Eduardo', 'Alejandro', 'Walter', 'Ángel', 'Raúl', 'Oscar', 'Ernesto', 'Javier',
  'Rubén', 'Guillermo', 'Marcelo', 'Gustavo', 'Jaime', 'Rolando', 'Freddy', 'Edgar', 'Boris', 'Mauricio'
];

export const LAST_NAMES = [
  'Flores', 'Terrazas', 'Antelo', 'Vaca', 'Justiniano', 'Pedraza', 'Saucedo', 'Roca', 'Chávez', 'Suárez',
  'Mendoza', 'Guzmán', 'Mamani', 'Quispe', 'Rojas', 'Torrico', 'Aguilera', 'Hurtado', 'Morales', 'Pinto',
  'Salvatierra', 'Zabala', 'Ribera', 'Cuéllar', 'Sandoval', 'Mercado', 'Montaño', 'Peña', 'Vargas', 'Osinaga'
];

export function generateDenseStreetCoords(waypoints, stepsPerSegment = 6) {
  const result = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    for (let s = 0; s < stepsPerSegment; s++) {
      const t = s / stepsPerSegment;
      const lat = p1[0] + (p2[0] - p1[0]) * t;
      const lng = p1[1] + (p2[1] - p1[1]) * t;
      result.push([Math.round(lat * 100000) / 100000, Math.round(lng * 100000) / 100000]);
    }
  }
  result.push(waypoints[waypoints.length - 1]);
  return result;
}

// Genera la lista completa de las 60 líneas
export function build60LinesCatalog() {
  // Cargar real_routes si existe para Línea 11, 122, 72
  let realRoutes = null;
  const routesJsonPath = path.resolve(__dirname, 'src/utils/real_routes.json');
  if (fs.existsSync(routesJsonPath)) {
    try {
      realRoutes = JSON.parse(fs.readFileSync(routesJsonPath, 'utf8'));
    } catch (e) {
      // ignorar
    }
  }

  // 60 configuraciones de corredores urbanos
  const rawDefinitions = [
    { num: 1, name: 'Línea 1 - Plan 3000 / Terminal Bimodal / Centro', orig: 'Rotonda El Mechero (Plan 3000)', dest: 'Mercado Nuevo / Centro', wp: [[-17.8280, -63.1330], [-17.8180, -63.1420], [-17.8050, -63.1550], [-17.7950, -63.1650], [-17.7900, -63.1670], [-17.7870, -63.1750], [-17.7833, -63.1821]] },
    { num: 2, name: 'Línea 2 - Pampa de la Isla / Virgen de Cotoca / La Ramada', orig: 'Pampa de la Isla (6to Anillo)', dest: 'Mercado La Ramada (Grigotá)', wp: [[-17.7720, -63.1250], [-17.7750, -63.1400], [-17.7780, -63.1550], [-17.7800, -63.1680], [-17.7833, -63.1780], [-17.7880, -63.1820], [-17.7920, -63.1850]] },
    { num: 3, name: 'Línea 3 - Villa 1ro de Mayo / 3er Anillo / Campus UAGRM', orig: 'Villa 1ro de Mayo (Av. Cumavi)', dest: 'Campus UAGRM (Av. Busch)', wp: [[-17.7946, -63.1378], [-17.7930, -63.1550], [-17.7850, -63.1650], [-17.7750, -63.1750], [-17.7710, -63.1850], [-17.7750, -63.1990]] },
    { num: 5, name: 'Línea 5 - Los Lotes / Santos Dumont / Parque El Arenal', orig: 'Parada Los Lotes (Radial 13)', dest: 'Parque El Arenal (Centro)', wp: [[-17.8420, -63.1750], [-17.8250, -63.1770], [-17.8100, -63.1785], [-17.7950, -63.1805], [-17.7880, -63.1810], [-17.7800, -63.1790]] },
    { num: 8, name: 'Línea 8 - Doble Vía La Guardia / Km 6 / Terminal Bimodal', orig: 'Doble Vía a La Guardia (Km 6)', dest: 'Terminal Bimodal', wp: [[-17.8350, -63.2200], [-17.8200, -63.2080], [-17.8050, -63.1950], [-17.7950, -63.1850], [-17.7900, -63.1750], [-17.7900, -63.1670]] },
    { num: 9, name: 'Línea 9 - Zona Norte / Av. Banzer / Cristo / Centro', orig: 'Valle Sánchez / 8vo Anillo Norte', dest: 'Plaza 24 de Septiembre', wp: [[-17.7150, -63.1680], [-17.7350, -63.1700], [-17.7550, -63.1710], [-17.7710, -63.1720], [-17.7780, -63.1790], [-17.7833, -63.1821]] },
    { num: 10, name: 'Línea 10 - Radial 26 / Av. Beni / Mercado Abasto', orig: 'Radial 26 y 5to Anillo', dest: 'Mercado Abasto (3er Anillo)', wp: [[-17.7550, -63.1850], [-17.7680, -63.1860], [-17.7780, -63.1880], [-17.7880, -63.1920], [-17.8010, -63.1980]] },
    { num: 11, name: 'Línea 11 - Villa 1ro de Mayo / Centro / Mercado Nuevo', orig: 'Parada Villa 1ro de Mayo', dest: 'Centro / Mercado Nuevo', wp: [[-17.7946, -63.1378], [-17.7935, -63.1550], [-17.7900, -63.1700], [-17.7875, -63.1765], [-17.7833, -63.1821]] },
    { num: 12, name: 'Línea 12 - Plan 3000 / Tres Pasos al Frente / Parque Industrial', orig: 'Plan 3000 (Av. Paurito)', dest: 'Parque Industrial (4to Anillo)', wp: [[-17.8350, -63.1280], [-17.8150, -63.1380], [-17.7950, -63.1450], [-17.7800, -63.1460], [-17.7650, -63.1450]] },
    { num: 14, name: 'Línea 14 - Radial 10 / Guaracachi / Centro', orig: 'Radial 10 y 5to Anillo', dest: 'Calle Arenales (Centro)', wp: [[-17.8080, -63.1420], [-17.8000, -63.1520], [-17.7920, -63.1650], [-17.7850, -63.1800]] },
    { num: 15, name: 'Línea 15 - San Aurelio / 4to Anillo / Mercado La Ramada', orig: 'Av. San Aurelio (6to Anillo)', dest: 'Mercado La Ramada', wp: [[-17.8250, -63.1580], [-17.8120, -63.1650], [-17.8020, -63.1750], [-17.7920, -63.1850]] },
    { num: 16, name: 'Línea 16 - Pampa de la Isla / Av. Montecristo / Bimodal', orig: 'Pampa de la Isla (Montecristo)', dest: 'Terminal Bimodal', wp: [[-17.7680, -63.1180], [-17.7720, -63.1350], [-17.7780, -63.1500], [-17.7900, -63.1670]] },
    { num: 17, name: 'Línea 17 - Radial 17 y Medio / Piraí / La Ramada', orig: 'Radial 17 y Medio (5to Anillo)', dest: 'Av. Grigotá (1er Anillo)', wp: [[-17.8180, -63.2080], [-17.8080, -63.2010], [-17.7980, -63.1920], [-17.7910, -63.1860]] },
    { num: 18, name: 'Línea 18 - Palmar del Oratorio / Santos Dumont / Centro', orig: 'Palmar del Oratorio (8vo Anillo)', dest: 'Plaza 24 de Septiembre', wp: [[-17.8650, -63.1600], [-17.8350, -63.1700], [-17.8100, -63.1780], [-17.7950, -63.1810], [-17.7833, -63.1821]] },
    { num: 19, name: 'Línea 19 - Radial 19 / Roca y Coronado / FEXPOCRUZ / Centro', orig: 'Radial 19 (5to Anillo)', dest: 'Centro (Calle Sucre)', wp: [[-17.7950, -63.2200], [-17.7890, -63.2080], [-17.7850, -63.1950], [-17.7840, -63.1820]] },
    { num: 20, name: 'Línea 20 - Circunvalación 1er Anillo', orig: '1er Anillo / Av. Cañoto y Busch', dest: '1er Anillo / Av. Irala y Grigotá', wp: [[-17.7810, -63.1900], [-17.7760, -63.1850], [-17.7780, -63.1770], [-17.7850, -63.1750], [-17.7890, -63.1850]] },
    { num: 21, name: 'Línea 21 - Villa 1ro de Mayo / Tres Pasos al Frente / Los Pozos', orig: 'Villa 1ro de Mayo (Primavera)', dest: 'Mercado Los Pozos', wp: [[-17.7980, -63.1310], [-17.7940, -63.1480], [-17.7890, -63.1630], [-17.7820, -63.1720], [-17.7790, -63.1780]] },
    { num: 22, name: 'Línea 22 - Plan 3000 / Los Lotes / Santos Dumont', orig: 'Plan 3000 (San Martín)', dest: 'Radial 13 y 4to Anillo', wp: [[-17.8380, -63.1380], [-17.8300, -63.1550], [-17.8200, -63.1680], [-17.8100, -63.1785]] },
    { num: 23, name: 'Línea 23 - Equipetrol / Av. San Martín / Centro', orig: 'Equipetrol Norte (4to Anillo)', dest: 'Plaza 24 de Septiembre', wp: [[-17.7580, -63.1950], [-17.7680, -63.1920], [-17.7750, -63.1880], [-17.7800, -63.1840], [-17.7833, -63.1821]] },
    { num: 24, name: 'Línea 24 - Radial 27 / Campus UPDS / Cristo / Bimodal', orig: 'Radial 27 (6to Anillo)', dest: 'Terminal Bimodal', wp: [[-17.7480, -63.1820], [-17.7650, -63.1850], [-17.7765, -63.1950], [-17.7710, -63.1720], [-17.7800, -63.1680], [-17.7900, -63.1670]] },
    { num: 25, name: 'Línea 25 - Av. Moscú / Abasto / Centro', orig: 'Av. Moscú y 7mo Anillo', dest: 'Centro (Calle Colón)', wp: [[-17.8450, -63.2080], [-17.8250, -63.2020], [-17.8050, -63.1950], [-17.7920, -63.1870], [-17.7840, -63.1825]] },
    { num: 27, name: 'Línea 27 - Los Lotes / Radial 12 / Mercado La Ramada', orig: 'Los Lotes (Sector Mercado)', dest: 'Mercado La Ramada', wp: [[-17.8450, -63.1700], [-17.8280, -63.1730], [-17.8100, -63.1760], [-17.7980, -63.1810], [-17.7920, -63.1850]] },
    { num: 28, name: 'Línea 28 - Av. Alemana / 5to Anillo / Mutualista / Centro', orig: 'Av. Alemana y 6to Anillo', dest: 'Mercado Nuevo (Centro)', wp: [[-17.7450, -63.1680], [-17.7600, -63.1700], [-17.7710, -63.1720], [-17.7780, -63.1780], [-17.7833, -63.1821]] },
    { num: 29, name: 'Línea 29 - Doble Vía La Guardia / 3er Anillo / Equipetrol', orig: 'Doble Vía a La Guardia (Km 4)', dest: 'Equipetrol (Av. San Martín)', wp: [[-17.8200, -63.2120], [-17.8050, -63.2050], [-17.7900, -63.2020], [-17.7750, -63.1980], [-17.7680, -63.1920]] },
    { num: 30, name: 'Línea 30 - Pampa de la Isla / Virgen de Luján / Centro', orig: 'Virgen de Luján (7mo Anillo)', dest: 'Plaza del Estudiante', wp: [[-17.7600, -63.1150], [-17.7680, -63.1350], [-17.7750, -63.1550], [-17.7820, -63.1750], [-17.7850, -63.1840]] },
    { num: 32, name: 'Línea 32 - Plan 3000 / Curva de la Muerte / Abasto', orig: 'Plan 3000 (Barrio San Luis)', dest: 'Mercado Abasto Mayorista', wp: [[-17.8420, -63.1250], [-17.8250, -63.1450], [-17.8100, -63.1680], [-17.8010, -63.1980]] },
    { num: 34, name: 'Línea 34 - Radial 21 / Av. Centenario / Campus UAGRM', orig: 'Radial 21 y 5to Anillo', dest: 'Campus Universitario (Busch)', wp: [[-17.7850, -63.2150], [-17.7820, -63.2080], [-17.7780, -63.2020], [-17.7750, -63.1990]] },
    { num: 35, name: 'Línea 35 - Los Lotes / Santos Dumont / Campus UPDS', orig: 'Los Lotes (Parada Final)', dest: 'Campus UPDS (3er Anillo)', wp: [[-17.8500, -63.1720], [-17.8250, -63.1760], [-17.8000, -63.1800], [-17.7850, -63.1880], [-17.7765, -63.1950]] },
    { num: 38, name: 'Línea 38 - Av. Beni / 4to Anillo / Parque Industrial / Bimodal', orig: 'Av. Beni y 5to Anillo', dest: 'Terminal Bimodal', wp: [[-17.7520, -63.1750], [-17.7600, -63.1650], [-17.7680, -63.1550], [-17.7800, -63.1600], [-17.7900, -63.1670]] },
    { num: 40, name: 'Línea 40 - Radial 13 / Mercado Santa Rosa / Centro', orig: 'Radial 13 y 6to Anillo', dest: 'Centro (Calle Beni)', wp: [[-17.8300, -63.1760], [-17.8120, -63.1780], [-17.7950, -63.1810], [-17.7810, -63.1810]] },
    { num: 41, name: 'Línea 41 - Villa 1ro de Mayo / Barrio 23 Diciembre / La Ramada', orig: 'Barrio 23 de Diciembre', dest: 'Mercado La Ramada', wp: [[-17.8050, -63.1280], [-17.7980, -63.1450], [-17.7920, -63.1650], [-17.7920, -63.1850]] },
    { num: 42, name: 'Línea 42 - Pampa de la Isla / Av. Guapay / El Cristo', orig: 'Pampa de la Isla (Av. Guapay)', dest: 'Monumento El Cristo', wp: [[-17.7650, -63.1300], [-17.7680, -63.1480], [-17.7700, -63.1600], [-17.7710, -63.1720]] },
    { num: 44, name: 'Línea 44 - Plan 3000 / Los Pocitos / Bimodal', orig: 'Los Pocitos (Plan 3000)', dest: 'Terminal Bimodal', wp: [[-17.8350, -63.1200], [-17.8200, -63.1350], [-17.8050, -63.1500], [-17.7900, -63.1670]] },
    { num: 45, name: 'Línea 45 - Av. Busch / 4to Anillo / Mercado Nuevo / Centro', orig: 'Av. Busch y 4to Anillo', dest: 'Plaza 24 de Septiembre', wp: [[-17.7750, -63.2020], [-17.7800, -63.1920], [-17.7820, -63.1860], [-17.7833, -63.1821]] },
    { num: 47, name: 'Línea 47 - Radial 17 y Medio / 6to Anillo / Centro', orig: 'Radial 17 y Medio (6to Anillo)', dest: 'Centro (Calle Ballivián)', wp: [[-17.8280, -63.2120], [-17.8100, -63.2000], [-17.7950, -63.1900], [-17.7840, -63.1815]] },
    { num: 50, name: 'Línea 50 - Circunvalación 3er Anillo Interno', orig: '3er Anillo Interno / Cristo', dest: '3er Anillo / Santos Dumont', wp: [[-17.7680, -63.1780], [-17.7720, -63.1600], [-17.7850, -63.1580], [-17.8000, -63.1800]] },
    { num: 51, name: 'Línea 51 - Plan 3000 / Av. Arroyito / Centro', orig: 'El Arroyito (Plan 3000)', dest: 'Plaza del Estudiante', wp: [[-17.8450, -63.1300], [-17.8250, -63.1420], [-17.8050, -63.1600], [-17.7900, -63.1750], [-17.7850, -63.1840]] },
    { num: 53, name: 'Línea 53 - Villa 1ro de Mayo / Guapurú / Mercado Abasto', orig: 'Guapurú (Villa)', dest: 'Mercado Abasto', wp: [[-17.8020, -63.1250], [-17.8000, -63.1480], [-17.8000, -63.1750], [-17.8010, -63.1980]] },
    { num: 55, name: 'Línea 55 - Radial 26 / 4to Anillo / Av. Banzer / Centro', orig: 'Radial 26 y 4to Anillo', dest: 'Plaza 24 de Septiembre', wp: [[-17.7600, -63.1880], [-17.7710, -63.1780], [-17.7780, -63.1800], [-17.7833, -63.1821]] },
    { num: 58, name: 'Línea 58 - Pampa de la Isla / Av. Virgen de Cotoca / Bimodal', orig: 'Pampa de la Isla (Trinchera)', dest: 'Terminal Bimodal', wp: [[-17.7700, -63.1200], [-17.7760, -63.1380], [-17.7820, -63.1550], [-17.7900, -63.1670]] },
    { num: 60, name: 'Línea 60 - Los Lotes / Radial 13 / Mercado Los Pozos', orig: 'Los Lotes (Palma)', dest: 'Mercado Los Pozos', wp: [[-17.8480, -63.1740], [-17.8200, -63.1770], [-17.7950, -63.1800], [-17.7790, -63.1780]] },
    { num: 63, name: 'Línea 63 - Plan 3000 / Che Guevara / Parque Urbano / Centro', orig: 'Rotonda Plan 3000', dest: 'Parque Urbano / Centro', wp: [[-17.8280, -63.1330], [-17.8120, -63.1480], [-17.7980, -63.1620], [-17.7860, -63.1740]] },
    { num: 64, name: 'Línea 64 - Doble Vía La Guardia / Km 8 / La Ramada', orig: 'Doble Vía a La Guardia (Km 8)', dest: 'Mercado La Ramada', wp: [[-17.8500, -63.2350], [-17.8250, -63.2120], [-17.8050, -63.1950], [-17.7920, -63.1850]] },
    { num: 66, name: 'Línea 66 - Radial 10 / El Gallito / Bimodal', orig: 'Barrio El Gallito (Radial 10)', dest: 'Terminal Bimodal', wp: [[-17.8120, -63.1380], [-17.8020, -63.1520], [-17.7950, -63.1620], [-17.7900, -63.1670]] },
    { num: 68, name: 'Línea 68 - Av. Alemana / 8vo Anillo / El Cristo / Centro', orig: 'Av. Alemana (8vo Anillo)', dest: 'Centro (Calle 21 de Mayo)', wp: [[-17.7320, -63.1650], [-17.7550, -63.1690], [-17.7710, -63.1720], [-17.7833, -63.1821]] },
    { num: 70, name: 'Línea 70 - Circunvalación 2do Anillo (Anti-horario)', orig: '2do Anillo y Santos Dumont', dest: '2do Anillo y Av. Cristo Redentor', wp: [[-17.7980, -63.1810], [-17.7920, -63.1680], [-17.7780, -63.1650], [-17.7710, -63.1720]] },
    { num: 72, name: 'Línea 72 - 2do Anillo / Parque Industrial / Santos Dumont', orig: 'Parque Industrial (2do Anillo)', dest: 'Santos Dumont (2do Anillo)', wp: [[-17.7650, -63.1550], [-17.7710, -63.1720], [-17.7810, -63.1865], [-17.7910, -63.1880], [-17.7980, -63.1810]] },
    { num: 73, name: 'Línea 73 - Circunvalación 2do Anillo (Sector Oeste / Equipetrol)', orig: '2do Anillo y Grigotá', dest: '2do Anillo y Av. Mutualista', wp: [[-17.7950, -63.1855], [-17.7860, -63.1885], [-17.7770, -63.1830], [-17.7710, -63.1720], [-17.7670, -63.1610]] },
    { num: 75, name: 'Línea 75 - Plan 3000 / Av. San Aurelio / Mercado Abasto', orig: 'Plan 3000 (Copacabana)', dest: 'Mercado Abasto Mayorista', wp: [[-17.8420, -63.1350], [-17.8220, -63.1550], [-17.8080, -63.1750], [-17.8010, -63.1980]] },
    { num: 76, name: 'Línea 76 - Radial 19 / Urubó / Puente Foianini / Centro', orig: 'Puente Urubó (4to Anillo)', dest: 'Plaza 24 de Septiembre', wp: [[-17.7700, -63.2100], [-17.7750, -63.2000], [-17.7800, -63.1900], [-17.7833, -63.1821]] },
    { num: 77, name: 'Línea 77 - Av. Piraí / 5to Anillo / Barrio Urbarí / Centro', orig: 'Av. Piraí y 5to Anillo', dest: 'Centro (Calle Aroma)', wp: [[-17.8080, -63.2100], [-17.7980, -63.2000], [-17.7900, -63.1900], [-17.7860, -63.1830]] },
    { num: 78, name: 'Línea 78 - Villa 1ro de Mayo / 4to Anillo / Campus UPDS', orig: 'Villa 1ro de Mayo (5to Anillo)', dest: 'Campus UPDS (3er Anillo)', wp: [[-17.7920, -63.1280], [-17.7800, -63.1450], [-17.7680, -63.1650], [-17.7710, -63.1850], [-17.7765, -63.1950]] },
    { num: 80, name: 'Línea 80 - Los Lotes / Radial 13 / UAGRM Campus Busch', orig: 'Parada Los Lotes', dest: 'Campus UAGRM (Busch)', wp: [[-17.8420, -63.1750], [-17.8180, -63.1780], [-17.7950, -63.1850], [-17.7850, -63.1920], [-17.7750, -63.1990]] },
    { num: 81, name: 'Línea 81 - Pampa de la Isla / Virgen de Cotoca / Los Pozos', orig: 'Pampa de la Isla (KM 9)', dest: 'Mercado Los Pozos', wp: [[-17.7650, -63.1120], [-17.7720, -63.1350], [-17.7780, -63.1580], [-17.7790, -63.1780]] },
    { num: 84, name: 'Línea 84 - Plan 3000 / Radial 10 / Bimodal / Centro', orig: 'Plan 3000 (San Jorge)', dest: 'Plaza 24 de Septiembre', wp: [[-17.8380, -63.1320], [-17.8150, -63.1480], [-17.7950, -63.1650], [-17.7833, -63.1821]] },
    { num: 85, name: 'Línea 85 - Doble Vía La Guardia / Grigotá / Mercado Nuevo', orig: 'Doble Vía a La Guardia (Km 7)', dest: 'Mercado Nuevo (Centro)', wp: [[-17.8400, -63.2280], [-17.8150, -63.2050], [-17.7950, -63.1880], [-17.7833, -63.1821]] },
    { num: 88, name: 'Línea 88 - Radial 26 / Av. Mutualista / Parque Industrial', orig: 'Radial 26 y 6to Anillo', dest: 'Parque Industrial (4to Anillo)', wp: [[-17.7450, -63.1820], [-17.7550, -63.1700], [-17.7600, -63.1550], [-17.7650, -63.1450]] },
    { num: 90, name: 'Línea 90 - Santos Dumont / 6to Anillo / Mercado Abasto', orig: 'Santos Dumont y 7mo Anillo', dest: 'Mercado Abasto Mayorista', wp: [[-17.8350, -63.1780], [-17.8180, -63.1800], [-17.8050, -63.1900], [-17.8010, -63.1980]] },
    { num: 94, name: 'Línea 94 - Villa 1ro de Mayo / Cumavi / Cristo Redentor', orig: 'Parada Villa 1ro de Mayo', dest: 'Av. Cristo Redentor y 4to Anillo', wp: [[-17.7946, -63.1378], [-17.7850, -63.1550], [-17.7720, -63.1650], [-17.7620, -63.1710]] },
    { num: 99, name: 'Línea 99 - Plan 3000 / Tres Pasos al Frente / Campus UPDS', orig: 'Plan 3000 (Victoria)', dest: 'Campus UPDS (3er Anillo)', wp: [[-17.8480, -63.1250], [-17.8200, -63.1450], [-17.7950, -63.1650], [-17.7765, -63.1950]] }
  ];

  return rawDefinitions.map((def, idx) => {
    // Si tenemos OSRM de alta densidad para L11, L122 o L72, usarlo prioritariamente
    let denseCoords = null;
    let distKm = 8.5 + (idx % 7) * 0.8;

    if (def.num === 11 && realRoutes?.l11) {
      denseCoords = realRoutes.l11.leafletCoords;
      distKm = realRoutes.l11.distanceKm;
    } else if (def.num === 72 && realRoutes?.l72) {
      denseCoords = realRoutes.l72.leafletCoords;
      distKm = realRoutes.l72.distanceKm;
    } else {
      denseCoords = generateDenseStreetCoords(def.wp, 7);
    }

    const color = COLORS[idx % COLORS.length];

    return {
      lineNumber: String(def.num),
      name: def.name,
      color,
      originName: def.orig,
      destinationName: def.dest,
      originLat: denseCoords[0][0],
      originLng: denseCoords[0][1],
      destinationLat: denseCoords[denseCoords.length - 1][0],
      destinationLng: denseCoords[denseCoords.length - 1][1],
      distanceKm: Math.round(distKm * 10) / 10,
      routeCoordinates: denseCoords
    };
  });
}
