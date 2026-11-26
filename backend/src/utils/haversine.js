/**
 * Cálculo de Distancia Geoespacial mediante la Fórmula del Semiverseno (Haversine)
 * Permite filtrar micros en un radio de 5 km sin necesidad de extensiones externas en SQLite.
 */

const EARTH_RADIUS_KM = 6371.0;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calcula la distancia en kilómetros entre dos coordenadas GPS (latitud y longitud)
 * @param {number} lat1 
 * @param {number} lng1 
 * @param {number} lat2 
 * @param {number} lng2 
 * @returns {number} Distancia en kilómetros con 2 decimales
 */
export function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(radLat1) * Math.cos(radLat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Filtra y enriquece una lista de micros que se encuentren dentro del radio dado (por defecto 5 km)
 * @param {Array} micros 
 * @param {number} userLat 
 * @param {number} userLng 
 * @param {number} maxRadiusKm 
 * @returns {Array} Micros ordenados de más cercano a más lejano
 */
export function filterMicrosByRadius(micros, userLat, userLng, maxRadiusKm = 5.0) {
  return micros
    .map((micro) => {
      const distance = calculateHaversineDistance(userLat, userLng, micro.current_lat, micro.current_lng);
      return {
        ...micro,
        distance_km: distance,
        available_seats: Math.max(0, micro.capacity_max - micro.current_passengers)
      };
    })
    .filter((micro) => micro.distance_km <= maxRadiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
}
