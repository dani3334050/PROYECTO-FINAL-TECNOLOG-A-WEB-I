import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { X, MapPin, Navigation, Bus } from 'lucide-react';

export default function RouteViewerModal({ line, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || !line) return;

    // Centrado inicial
    const initialLat = line.origin_lat || -17.7833;
    const initialLng = line.origin_lng || -63.1821;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap | RUTABOL-SCZ'
    }).addTo(map);

    let bounds = [];

    // Marcador de salida
    if (line.origin_lat && line.origin_lng) {
      const originIcon = L.divIcon({
        className: 'route-marker-origin',
        html: `
          <div style="background:#0f172a; color:white; padding:3px 8px; border-radius:9999px; font-size:10px; font-weight:700; white-space:nowrap; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
            🟢 Salida: ${line.origin_name || 'Inicio'}
          </div>
        `,
        iconSize: [60, 22],
        iconAnchor: [30, 11]
      });

      L.marker([line.origin_lat, line.origin_lng], { icon: originIcon }).addTo(map);
      bounds.push([line.origin_lat, line.origin_lng]);
    }

    // Marcador de llegada
    if (line.destination_lat && line.destination_lng) {
      const destIcon = L.divIcon({
        className: 'route-marker-dest',
        html: `
          <div style="background:#334155; color:white; padding:3px 8px; border-radius:9999px; font-size:10px; font-weight:700; white-space:nowrap; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
            🏁 Llegada: ${line.destination_name || 'Fin'}
          </div>
        `,
        iconSize: [60, 22],
        iconAnchor: [30, 11]
      });

      L.marker([line.destination_lat, line.destination_lng], { icon: destIcon }).addTo(map);
      bounds.push([line.destination_lat, line.destination_lng]);
    }

    // Trazado de ruta
    if (line.route_coordinates) {
      try {
        const coords = typeof line.route_coordinates === 'string'
          ? JSON.parse(line.route_coordinates)
          : line.route_coordinates;

        if (Array.isArray(coords) && coords.length > 0) {
          L.polyline(coords, {
            color: '#0f172a',
            weight: 4,
            opacity: 0.85
          }).addTo(map);

          coords.forEach((c) => bounds.push(c));
        }
      } catch (e) {
        console.error('Error al parsear coordenadas de ruta:', e);
      }
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [line]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bus className="w-5 h-5 text-slate-300" />
            <div>
              <h3 className="font-bold text-sm">
                Recorrido de Línea {line.line_number} — {line.name}
              </h3>
              <p className="text-[11px] text-slate-400">
                {line.origin_name || 'Salida'} ➔ {line.destination_name || 'Llegada'}
                {line.distance_km ? ` (${line.distance_km} km)` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 relative z-0">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="font-semibold block text-slate-800">🟢 Parada de Salida:</span>
              <span className="text-[11px] text-slate-600">{line.origin_name || 'No especificada'}</span>
              {line.origin_lat && (
                <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                  ({line.origin_lat.toFixed(4)}, {line.origin_lng.toFixed(4)})
                </span>
              )}
            </div>

            <div>
              <span className="font-semibold block text-slate-800">🏁 Parada de Llegada:</span>
              <span className="text-[11px] text-slate-600">{line.destination_name || 'No especificada'}</span>
              {line.destination_lat && (
                <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                  ({line.destination_lat.toFixed(4)}, {line.destination_lng.toFixed(4)})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
}
