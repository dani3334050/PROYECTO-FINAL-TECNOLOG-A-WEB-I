import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, RotateCcw, Navigation, CheckCircle2 } from 'lucide-react';

export default function RouteMapPicker({
  originName,
  setOriginName,
  destinationName,
  setDestinationName,
  onRouteChange
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  const [originPos, setOriginPos] = useState(null); // { lat, lng }
  const [destPos, setDestPos] = useState(null); // { lat, lng }
  const [routeDistance, setRouteDistance] = useState(null);
  const [isRouting, setIsRouting] = useState(false);

  // Inicializar Leaflet centrado en Santa Cruz de la Sierra
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-17.7833, -63.1821], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors | RUTABOL-SCZ'
    }).addTo(map);

    // Evento de clic en el mapa para fijar puntos de salida y llegada
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;

      setOriginPos((prevOrigin) => {
        if (!prevOrigin) {
          // 1er Clic: Punto de Salida
          return { lat, lng };
        } else {
          // Si ya hay salida, evaluar llegada
          setDestPos((prevDest) => {
            if (!prevDest) {
              // 2do Clic: Punto de Llegada
              return { lat, lng };
            }
            // Si ya existen ambos, reemplazar salida
            return prevDest;
          });
          return prevOrigin;
        }
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Iconos personalizados sobrios para Salida y Llegada
  const createIcon = (label, color) => {
    return L.divIcon({
      className: 'custom-route-marker',
      html: `
        <div style="
          background-color: ${color};
          color: white;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 3px;
        ">
          <span>${label}</span>
        </div>
      `,
      iconSize: [60, 22],
      iconAnchor: [30, 11]
    });
  };

  // Manejar marcadores y trazado de ruta en el mapa
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // 1. Marcador de Salida
    if (originPos) {
      if (originMarkerRef.current) {
        originMarkerRef.current.setLatLng([originPos.lat, originPos.lng]);
      } else {
        const marker = L.marker([originPos.lat, originPos.lng], {
          icon: createIcon('🟢 Salida', '#0f172a'),
          draggable: true
        }).addTo(map);

        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          setOriginPos({ lat: pos.lat, lng: pos.lng });
        });

        originMarkerRef.current = marker;
      }
    } else if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    // 2. Marcador de Llegada
    if (destPos) {
      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng([destPos.lat, destPos.lng]);
      } else {
        const marker = L.marker([destPos.lat, destPos.lng], {
          icon: createIcon('🏁 Llegada', '#334155'),
          draggable: true
        }).addTo(map);

        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          setDestPos({ lat: pos.lat, lng: pos.lng });
        });

        destMarkerRef.current = marker;
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    // 3. Trazado de Ruta cuando ambos puntos existen
    if (originPos && destPos) {
      setIsRouting(true);

      // Consultar el servicio libre OSRM para trazar las calles reales
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originPos.lng},${originPos.lat};${destPos.lng},${destPos.lat}?overview=full&geometries=geojson`;

      fetch(osrmUrl)
        .then((res) => res.json())
        .then((data) => {
          let coords = [];
          let distKm = 0;

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            distKm = Math.round((route.distance / 1000) * 10) / 10;
            // OSRM devuelve [lng, lat], Leaflet necesita [lat, lng]
            coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          } else {
            // Fallback si no hay red: Línea directa
            coords = [
              [originPos.lat, originPos.lng],
              [destPos.lat, destPos.lng]
            ];
            const directDist = map.distance(
              [originPos.lat, originPos.lng],
              [destPos.lat, destPos.lng]
            );
            distKm = Math.round((directDist / 1000) * 10) / 10;
          }

          setRouteDistance(distKm);

          // Dibujar la línea de la ruta
          if (routeLineRef.current) {
            routeLineRef.current.setLatLngs(coords);
          } else {
            routeLineRef.current = L.polyline(coords, {
              color: '#0f172a',
              weight: 4,
              opacity: 0.85,
              dashArray: '8, 6'
            }).addTo(map);
          }

          // Ajustar zoom del mapa a la ruta
          map.fitBounds(L.latLngBounds(coords), { padding: [30, 30] });

          if (onRouteChange) {
            onRouteChange({
              originPos,
              destPos,
              routeCoordinates: coords,
              distanceKm: distKm
            });
          }
        })
        .catch(() => {
          // Fallback silencioso a línea recta
          const coords = [
            [originPos.lat, originPos.lng],
            [destPos.lat, destPos.lng]
          ];
          const distKm =
            Math.round(
              (map.distance([originPos.lat, originPos.lng], [destPos.lat, destPos.lng]) / 1000) * 10
            ) / 10;
          setRouteDistance(distKm);

          if (routeLineRef.current) {
            routeLineRef.current.setLatLngs(coords);
          } else {
            routeLineRef.current = L.polyline(coords, {
              color: '#0f172a',
              weight: 4,
              opacity: 0.85
            }).addTo(map);
          }

          if (onRouteChange) {
            onRouteChange({
              originPos,
              destPos,
              routeCoordinates: coords,
              distanceKm: distKm
            });
          }
        })
        .finally(() => {
          setIsRouting(false);
        });
    } else {
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      setRouteDistance(null);
    }
  }, [originPos, destPos]);

  const handleResetPoints = () => {
    setOriginPos(null);
    setDestPos(null);
    setRouteDistance(null);
    if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
    if (onRouteChange) {
      onRouteChange(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-slate-700" />
          <span>Trazado del Recorrido (Haz clic en el mapa)</span>
        </span>
        {(originPos || destPos) && (
          <button
            type="button"
            onClick={handleResetPoints}
            className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reiniciar Puntos</span>
          </button>
        )}
      </div>

      {/* Instrucciones Rápidas */}
      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!originPos ? (
            <span className="font-medium text-slate-800">
              👉 <strong>Paso 1:</strong> Haz clic en el mapa para fijar el <strong>Punto de Salida</strong>.
            </span>
          ) : !destPos ? (
            <span className="font-medium text-slate-800">
              👉 <strong>Paso 2:</strong> Haz clic en el mapa para fijar el <strong>Punto de Llegada</strong>.
            </span>
          ) : (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ruta trazada exitosamente
            </span>
          )}
        </div>

        {routeDistance && (
          <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900 text-[10px]">
            {routeDistance} km aprox.
          </span>
        )}
      </div>

      {/* Contenedor del Mapa Leaflet */}
      <div className="w-full h-56 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Nombres descriptivos de las paradas */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            🟢 Nombre Parada de Salida
          </label>
          <input
            type="text"
            required={!!originPos}
            placeholder="Ej: Parada Los Lotes / Radial 13"
            value={originName}
            onChange={(e) => setOriginName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            🏁 Nombre Parada de Llegada
          </label>
          <input
            type="text"
            required={!!destPos}
            placeholder="Ej: Av. Cristo Redentor / 4to Anillo"
            value={destinationName}
            onChange={(e) => setDestinationName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>
    </div>
  );
}
