import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function Map5Km({ userLocation, micros, onSelectMicro, selectedMicro, selectedLine }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const routePointsLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Inicializar mapa centrado en la ubicación del usuario (o Santa Cruz UPDS)
    const initialLat = userLocation?.lat || -17.7765;
    const initialLng = userLocation?.lng || -63.1950;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false // Los controles de zoom estilizados van flotantes
    }).setView([initialLat, initialLng], 14);
    mapInstanceRef.current = map;

    // Control de zoom posicionado en la esquina superior derecha
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Tiles oficiales de OpenStreetMap (100% libres, sin marcas de agua ni API key requerida)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors · RUTABOL-SCZ',
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    // Marcador del usuario / estudiante (Punto azul cobalto con pulso suave)
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="background-color: #1D4ED8; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.25), 0 2px 6px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
          <div style="background-color: #FFFFFF; width: 4px; height: 4px; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    userMarkerRef.current = L.marker([initialLat, initialLng], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b style="font-size: 12px; color: #0F172A;">📍 Tu ubicación actual</b>');

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Actualizar posición del usuario si cambia
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    const { lat, lng } = userLocation;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    }
  }, [userLocation]);

  // Centrar suavemente el mapa si el usuario selecciona una unidad
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedMicro) return;
    const { current_lat, current_lng } = selectedMicro;
    if (current_lat && current_lng) {
      mapInstanceRef.current.panTo([current_lat, current_lng], {
        animate: true,
        duration: 0.8
      });
      // Abrir popup si existe marcador
      if (markersRef.current[selectedMicro.id]) {
        markersRef.current[selectedMicro.id].openPopup();
      }
    }
  }, [selectedMicro]);

  // Dibujar trazado de ruta de la Línea seleccionada con alto contraste
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Limpiar trazado anterior
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (routePointsLayerRef.current) {
      map.removeLayer(routePointsLayerRef.current);
      routePointsLayerRef.current = null;
    }

    if (!selectedLine || !selectedLine.route_coordinates) return;

    try {
      let coords = selectedLine.route_coordinates;
      if (typeof coords === 'string') {
        coords = JSON.parse(coords);
      }

      if (Array.isArray(coords) && coords.length > 0) {
        const lineColor = selectedLine.color || '#1D4ED8';

        // Capa de relieve blanco debajo del trazado para separarlo del mapa
        const casing = L.polyline(coords, {
          color: '#FFFFFF',
          weight: 7,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        });

        // Trazado principal de la polyline
        const polyline = L.polyline(coords, {
          color: lineColor,
          weight: 4.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        });

        const routeGroup = L.featureGroup([casing, polyline]).addTo(map);
        routeLayerRef.current = routeGroup;

        // Capa de pines inicio/fin
        const pointsGroup = L.layerGroup().addTo(map);
        routePointsLayerRef.current = pointsGroup;

        // Pin Salida (Punto verde esmeralda compacto)
        const startPoint = coords[0];
        const startIcon = L.divIcon({
          className: 'custom-start-marker',
          html: `
            <div style="background-color: #059669; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.4);"></div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        L.marker(startPoint, { icon: startIcon })
          .addTo(pointsGroup)
          .bindTooltip(`<b>🟢 Salida:</b> ${selectedLine.origin_name || 'Terminal de Salida'}`, {
            direction: 'top',
            offset: [0, -8],
            className: 'clean-map-tooltip'
          });

        // Pin Llegada (Punto rojo coral compacto)
        const endPoint = coords[coords.length - 1];
        const endIcon = L.divIcon({
          className: 'custom-end-marker',
          html: `
            <div style="background-color: #DC2626; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4);"></div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        L.marker(endPoint, { icon: endIcon })
          .addTo(pointsGroup)
          .bindTooltip(`<b>🏁 Llegada:</b> ${selectedLine.destination_name || 'Destino Final'}`, {
            direction: 'top',
            offset: [0, -8],
            className: 'clean-map-tooltip'
          });

        // Centrar y ajustar zoom del mapa a la ruta con padding
        map.fitBounds(routeGroup.getBounds(), { padding: [50, 50] });
      }
    } catch (err) {
      console.error('Error al procesar trazado de ruta:', err);
    }
  }, [selectedLine]);

  // Actualizar marcadores de los micros activos en el mapa con diseño Clean Urban Mobility
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Limpiar marcadores obsoletos
    const currentMicroIds = new Set(micros.map((m) => m.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentMicroIds.has(Number(id))) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Crear o actualizar marcadores circulares nítidos con número de línea
    micros.forEach((micro) => {
      const isFull = micro.current_passengers >= micro.capacity_max;
      const isSelected = selectedMicro?.id === micro.id;
      const markerColor = isFull ? '#DC2626' : micro.line_color || '#1D4ED8';
      const freeSeats = Math.max(0, micro.capacity_max - micro.current_passengers);

      const microIcon = L.divIcon({
        className: 'custom-clean-bus-marker',
        html: `
          <div style="
            background-color: ${markerColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2.5px solid ${isSelected ? '#0F172A' : '#FFFFFF'};
            box-shadow: 0 3px 8px rgba(15, 23, 42, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            font-weight: 700;
            transform: scale(${isSelected ? 1.2 : 1});
            transition: transform 0.15s ease;
            cursor: pointer;
            position: relative;
          ">
            <span>L${micro.line_number}</span>
            ${isFull ? `
              <span style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background-color: #DC2626; border: 1.5px solid #FFFFFF; border-radius: 50%;"></span>
            ` : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const driverPhotoUrl = micro.driver_photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120';
      const distKm = parseFloat(micro.distance_km) || 1.2;
      const etaMin = Math.max(1, Math.round(distKm * 2.8));
      const etaColor = etaMin <= 4 ? '#059669' : etaMin <= 9 ? '#D97706' : '#1D4ED8';
      const etaAdvice = etaMin <= 4 ? '🟢 ¡Sal de casa ahora!' : etaMin <= 9 ? '🟡 Prepárate para salir' : '🔵 Puedes esperar en casa';

      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; min-width: 230px; color: #0F172A; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 8px;">
            <img src="${driverPhotoUrl}" 
                 style="width: 42px; height: 42px; border-radius: 8px; object-fit: cover; border: 1.5px solid #CBD5E1;" />
            <div>
              <div style="font-size: 13px; font-weight: 700; color: #0F172A; line-height: 1.2;">
                ${micro.driver_name || 'Conductor de Turno'}
              </div>
              <div style="font-size: 11px; font-weight: 600; color: #1D4ED8; margin-top: 2px;">
                Línea ${micro.line_number} · Interno #${micro.internal_number}
              </div>
            </div>
          </div>
          
          <div style="font-size: 11px; line-height: 1.5; color: #475569;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #64748B;">Llegada estimada:</span>
              <strong style="color: ${etaColor}; font-weight: 700;">~${etaMin} min (${distKm} km)</strong>
            </div>
            <div style="font-size: 10.5px; font-weight: 700; color: ${etaColor}; margin-bottom: 6px; padding: 3px 6px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px;">
              ${etaAdvice}
            </div>
            <div><span style="color: #64748B;">C.I.:</span> <strong style="color: #0F172A;">${micro.driver_ci || '5892341 SC'}</strong></div>
            <div><span style="color: #64748B;">Vehículo:</span> ${micro.vehicle_model || 'Toyota Coaster'} · <span style="font-family: monospace;">${micro.license_plate || '3412-ABC'}</span></div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #64748B;">Aforo:</span>
              <strong style="color: ${isFull ? '#DC2626' : '#059669'}; font-weight: 700;">
                ${micro.current_passengers}/${micro.capacity_max} (${freeSeats} libres)
              </strong>
            </div>
          </div>
        </div>
      `;

      if (markersRef.current[micro.id]) {
        markersRef.current[micro.id].setLatLng([micro.current_lat, micro.current_lng]);
        markersRef.current[micro.id].setIcon(microIcon);
        markersRef.current[micro.id].setPopupContent(popupContent);
      } else {
        const marker = L.marker([micro.current_lat, micro.current_lng], { icon: microIcon })
          .addTo(map)
          .bindPopup(popupContent)
          .on('click', () => {
            if (onSelectMicro) onSelectMicro(micro);
          });

        markersRef.current[micro.id] = marker;
      }
    });
  }, [micros, selectedMicro]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-50">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
