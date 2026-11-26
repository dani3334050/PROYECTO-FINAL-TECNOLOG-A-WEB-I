import fs from 'node:fs';
import { db } from './src/config/db.js';

async function fetchStreetRoute(waypoints) {
  // waypoints: [[lng, lat], [lng, lat], ...]
  const coordString = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.routes || !data.routes[0]) {
    throw new Error('No se pudo calcular la ruta con OSRM: ' + JSON.stringify(data));
  }

  const geoJsonCoords = data.routes[0].geometry.coordinates; // [[lng, lat], ...]
  const distanceKm = Math.round((data.routes[0].distance / 1000) * 10) / 10;

  // Convertir a [lat, lng] para Leaflet
  const leafletCoords = geoJsonCoords.map(([lng, lat]) => [
    Math.round(lat * 100000) / 100000,
    Math.round(lng * 100000) / 100000
  ]);

  return { leafletCoords, distanceKm };
}

async function main() {
  console.log('🛣️ Obteniendo trazados reales calle por calle para Santa Cruz...');

  // 1. Línea 11: Villa 1ro de Mayo -> Centro
  console.log('Calculando Línea 11...');
  const l11Waypoints = [
    [-63.1378, -17.7946], // Parada Villa 1ro de Mayo
    [-63.1550, -17.7935], // Av. Cumavi
    [-63.1700, -17.7900], // Av. Brasil
    [-63.1765, -17.7875], // Arenales / 2do Anillo
    [-63.1821, -17.7833]  // Centro (Plaza 24 de Septiembre)
  ];
  const l11Route = await fetchStreetRoute(l11Waypoints);
  console.log(`✓ Línea 11 lista: ${l11Route.leafletCoords.length} puntos exactos en calles (${l11Route.distanceKm} km)`);

  // 2. Línea 122: Los Lotes -> Radial 13 -> Santos Dumont -> Centro
  console.log('Calculando Línea 122...');
  const l122Waypoints = [
    [-63.1750, -17.8420], // Parada Los Lotes (Radial 13)
    [-63.1770, -17.8250], // Radial 13 y 5to Anillo
    [-63.1785, -17.8100], // Radial 13 y 4to Anillo
    [-63.1800, -17.7950], // Santos Dumont y 2do Anillo
    [-63.1821, -17.7833]  // Centro (Plaza 24 de Septiembre)
  ];
  const l122Route = await fetchStreetRoute(l122Waypoints);
  console.log(`✓ Línea 122 lista: ${l122Route.leafletCoords.length} puntos exactos en calles (${l122Route.distanceKm} km)`);

  // 3. Línea 72: Circuito 2do Anillo (Parque Industrial -> Grigotá -> Santos Dumont)
  console.log('Calculando Línea 72...');
  const l72Waypoints = [
    [-63.1550, -17.7650], // 2do Anillo Parque Industrial
    [-63.1720, -17.7710], // 2do Anillo El Cristo
    [-63.1865, -17.7810], // 2do Anillo Av. Busch
    [-63.1880, -17.7910], // 2do Anillo Av. San Martín
    [-63.1810, -17.7980]  // 2do Anillo Santos Dumont
  ];
  const l72Route = await fetchStreetRoute(l72Waypoints);
  console.log(`✓ Línea 72 lista: ${l72Route.leafletCoords.length} puntos exactos en calles (${l72Route.distanceKm} km)`);

  // Guardar en la base de datos
  db.prepare(`
    UPDATE lines 
    SET route_coordinates = ?, distance_km = ?, origin_lat = ?, origin_lng = ?, destination_lat = ?, destination_lng = ?
    WHERE line_number = '11'
  `).run(
    JSON.stringify(l11Route.leafletCoords),
    l11Route.distanceKm,
    l11Route.leafletCoords[0][0],
    l11Route.leafletCoords[0][1],
    l11Route.leafletCoords[l11Route.leafletCoords.length - 1][0],
    l11Route.leafletCoords[l11Route.leafletCoords.length - 1][1]
  );

  db.prepare(`
    UPDATE lines 
    SET route_coordinates = ?, distance_km = ?, origin_lat = ?, origin_lng = ?, destination_lat = ?, destination_lng = ?
    WHERE line_number = '122'
  `).run(
    JSON.stringify(l122Route.leafletCoords),
    l122Route.distanceKm,
    l122Route.leafletCoords[0][0],
    l122Route.leafletCoords[0][1],
    l122Route.leafletCoords[l122Route.leafletCoords.length - 1][0],
    l122Route.leafletCoords[l122Route.leafletCoords.length - 1][1]
  );

  db.prepare(`
    UPDATE lines 
    SET route_coordinates = ?, distance_km = ?, origin_lat = ?, origin_lng = ?, destination_lat = ?, destination_lng = ?
    WHERE line_number = '72'
  `).run(
    JSON.stringify(l72Route.leafletCoords),
    l72Route.distanceKm,
    l72Route.leafletCoords[0][0],
    l72Route.leafletCoords[0][1],
    l72Route.leafletCoords[l72Route.leafletCoords.length - 1][0],
    l72Route.leafletCoords[l72Route.leafletCoords.length - 1][1]
  );

  // Actualizar posiciones de los micros en tránsito para que estén exactamente en su ruta
  // Micro 24 (Línea 11): En punto intermedio de la ruta de la L11
  const m11Mid = l11Route.leafletCoords[Math.floor(l11Route.leafletCoords.length * 0.45)];
  db.prepare('UPDATE micros SET current_lat = ?, current_lng = ? WHERE internal_number = 24').run(m11Mid[0], m11Mid[1]);

  // Micro 15 (Línea 122): En punto intermedio de la ruta de la L122
  const m122Mid = l122Route.leafletCoords[Math.floor(l122Route.leafletCoords.length * 0.5)];
  db.prepare('UPDATE micros SET current_lat = ?, current_lng = ? WHERE internal_number = 15').run(m122Mid[0], m122Mid[1]);

  // Micro 14 (Línea 72): En punto intermedio de la ruta de la L72
  const m72Mid = l72Route.leafletCoords[Math.floor(l72Route.leafletCoords.length * 0.4)];
  db.prepare('UPDATE micros SET current_lat = ?, current_lng = ? WHERE internal_number = 14').run(m72Mid[0], m72Mid[1]);

  console.log('✅ Base de datos actualizada con trazados de calle exactos y posiciones en ruta.');

  // Guardar archivo JSON con los trazados para persistirlos en el seed
  const exportData = {
    l11: l11Route,
    l122: l122Route,
    l72: l72Route
  };
  fs.writeFileSync('./backend/src/utils/real_routes.json', JSON.stringify(exportData, null, 2));
  console.log('✅ Archivo real_routes.json guardado para persistencia.');
}

main().catch(console.error);
