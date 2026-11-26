import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { socket } from '../socket';
import { useAuth } from '../context/AuthContext';
import Map5Km from '../components/Map5Km';
import ReportIncidentModal from '../components/ReportIncidentModal';
import { 
  Bus, 
  Navigation, 
  MapPin, 
  RefreshCw, 
  GraduationCap, 
  School, 
  Layers,
  X,
  Filter,
  Clock,
  Send,
  Star,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Footprints,
  Sparkles,
  Bell,
  BellRing,
  BellOff,
  ShieldAlert,
  Volume2
} from 'lucide-react';

// Sonido sintético de alarma con Web Audio API (sin dependencias de archivos externos)
const playAlarmSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Tono 1 (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tono 2 (880 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.18);
    gain2.gain.setValueAtTime(0.3, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.7);
  } catch (e) {
    // Si el navegador bloquea audio antes de la primera interacción
  }
};

// Cálculo de tiempo estimado de llegada (ETA) y recomendación inteligente de salida
const getETA = (distKm) => {
  const dist = parseFloat(distKm) || 1.2;
  // Promedio urbano en Santa Cruz con paradas y semáforos: ~2.8 min por km
  return Math.max(1, Math.round(dist * 2.8));
};

const getDepartureAdvice = (minutes) => {
  if (minutes <= 4) {
    return {
      label: '¡Sal de casa ahora!',
      shortLabel: 'Sal ahora',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500 animate-pulse',
      desc: 'El micro está muy cerca de tu parada. Sal de casa ahora para no perderlo.'
    };
  }
  if (minutes <= 9) {
    return {
      label: 'Prepárate para salir',
      shortLabel: 'Prepárate',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
      desc: 'Alista tus pertenencias y comienza a caminar hacia tu parada en breve.'
    };
  }
  return {
    label: 'Puedes esperar en casa',
    shortLabel: 'Espera en casa',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
    desc: 'Aún tienes tiempo holgado antes de que la unidad se aproxime.'
  };
};

export default function PassengerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const lineQueryParam = searchParams.get('line') || '';

  // Coordenadas base en Santa Cruz de la Sierra (Campus UPDS)
  const [userLocation, setUserLocation] = useState({ lat: -17.7765, lng: -63.1950 });
  const [micros, setMicros] = useState([]);
  const [lines, setLines] = useState([]);
  const [selectedLineNumber, setSelectedLineNumber] = useState(lineQueryParam);
  const [loading, setLoading] = useState(true);
  const [selectedMicro, setSelectedMicro] = useState(null);

  // Estados de la simulación de salidas de terminal
  const [dispatchToast, setDispatchToast] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Punto 2: Líneas Favoritas de Estudiantes
  const [favorites, setFavorites] = useState([]);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'FAVORITES'

  // Punto 3: Alarma / Alerta de Proximidad ("Avísame cuando esté a 4 min")
  const [proximityAlert, setProximityAlert] = useState(null); // { microId, lineNumber, internalNumber, notified }
  const [alarmModalData, setAlarmModalData] = useState(null);

  // Punto 4: Modal de Reporte Ciudadano Estudiantil (ODS 11)
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetMicro, setReportTargetMicro] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 4000);
  };

  // Cargar favoritas del usuario desde API o localStorage
  const fetchFavorites = async () => {
    try {
      if (user) {
        const res = await api.get('/fleet/favorites');
        if (res.success && Array.isArray(res.favorites)) {
          setFavorites(res.favorites);
          return;
        }
      }
      const cached = JSON.parse(localStorage.getItem('rutabol_guest_favs') || '[]');
      setFavorites(cached);
    } catch (e) {
      const cached = JSON.parse(localStorage.getItem('rutabol_guest_favs') || '[]');
      setFavorites(cached);
    }
  };

  // Alternar línea favorita (optimista + sincronizado)
  const handleToggleFavorite = async (lineNumber, e) => {
    if (e) e.stopPropagation();
    const strLine = String(lineNumber);

    let willBeFavorite = false;
    setFavorites((prev) => {
      const exists = prev.includes(strLine);
      willBeFavorite = !exists;
      const updated = exists ? prev.filter((x) => x !== strLine) : [...prev, strLine];
      localStorage.setItem('rutabol_guest_favs', JSON.stringify(updated));
      return updated;
    });

    showToast(
      willBeFavorite
        ? `Línea ${strLine} agregada a tus favoritas ★`
        : `Línea ${strLine} removida de favoritas`
    );

    if (user) {
      try {
        const res = await api.post('/fleet/favorites/toggle', { line_number: strLine });
        if (res.success && Array.isArray(res.favorites)) {
          setFavorites(res.favorites);
        }
      } catch (err) {
        console.error('Error al cambiar favorita:', err);
      }
    }
  };

  // Punto 3: Alternar Alarma de Proximidad
  const handleToggleProximityAlert = (micro, e) => {
    if (e) e.stopPropagation();
    if (!micro) return;

    if (proximityAlert?.microId === micro.id) {
      setProximityAlert(null);
      showToast(`Alerta cancelada para Interno #${micro.internal_number}`);
    } else {
      setProximityAlert({
        microId: micro.id,
        lineNumber: micro.line_number,
        internalNumber: micro.internal_number,
        driverName: micro.driver_name,
        notified: false
      });
      showToast(`🔔 Alarma fijada: Te avisaremos cuando Línea ${micro.line_number} (#${micro.internal_number}) esté a 4 minutos.`);
    }
  };

  // Punto 4: Abrir Modal de Reporte Ciudadano
  const handleOpenReport = (micro, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setReportTargetMicro(micro);
    setReportModalOpen(true);
  };

  // Monitorear micro vigilado por la alarma de proximidad
  useEffect(() => {
    if (!proximityAlert || proximityAlert.notified) return;

    const monitored = micros.find((m) => m.id === proximityAlert.microId);
    if (monitored) {
      const eta = getETA(monitored.distance_km);
      if (eta <= 4) {
        playAlarmSound();
        setProximityAlert((prev) => ({ ...prev, notified: true }));
        setAlarmModalData({
          micro: monitored,
          eta,
          dist: monitored.distance_km
        });
        setSelectedMicro(monitored);
      }
    }
  }, [micros, proximityAlert]);

  // Sincronizar parámetro de URL si cambia externamente
  useEffect(() => {
    setSelectedLineNumber(lineQueryParam);
  }, [lineQueryParam]);

  // Cargar líneas registradas para el filtro
  const fetchLines = async () => {
    try {
      const res = await api.get('/fleet/lines');
      if (res.success) {
        setLines(res.lines || []);
      }
    } catch (err) {
      console.error('Error al cargar líneas:', err);
    }
  };

  // Obtener micros activos en el mapa (filtrables por línea opcional)
  const fetchMicros = async (loc = userLocation, lineNum = selectedLineNumber) => {
    try {
      setLoading(true);
      let endpoint = `/geo/nearby?lat=${loc.lat}&lng=${loc.lng}&all=true`;
      if (lineNum) {
        endpoint += `&line=${lineNum}`;
      }
      const res = await api.get(endpoint);
      if (res.success) {
        setMicros(res.micros || []);
        if (selectedMicro) {
          const fresh = (res.micros || []).find((m) => m.id === selectedMicro.id);
          if (fresh) setSelectedMicro(fresh);
        }
      }
    } catch (err) {
      console.error('Error al consultar micros:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar estado inicial de la simulación
  const fetchSimStatus = async () => {
    try {
      const res = await api.get('/fleet/simulation/status');
      if (res.success && res.nextDispatchSeconds !== undefined) {
        setCountdown(res.nextDispatchSeconds);
      }
    } catch (err) {
      // Ignorar si falla
    }
  };

  // Temporizador de cuenta regresiva de despacho periódico
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sincronizar favoritas cuando el usuario autenticado cargue
  useEffect(() => {
    fetchFavorites();
  }, [user]);

  useEffect(() => {
    fetchLines();
    fetchFavorites();
    fetchMicros(userLocation, selectedLineNumber);
    fetchSimStatus();

    // Intentar geolocalización real del navegador si está permitida
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(newLoc);
          fetchMicros(newLoc, selectedLineNumber);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    // Escuchar actualización por lote del motor de simulación
    socket.on('micros:batch_updated', (batchList) => {
      if (!Array.isArray(batchList)) return;
      const updateMap = new Map();
      batchList.forEach((item) => updateMap.set(item.microId, item));

      setMicros((prev) =>
        prev.map((m) => {
          const update = updateMap.get(m.id);
          if (update) {
            return {
              ...m,
              current_lat: update.lat,
              current_lng: update.lng,
              current_passengers: update.currentPassengers,
              capacity_max: update.capacityMax || m.capacity_max,
              available_seats: update.availableSeats,
              driver_name: update.driverName || m.driver_name,
              driver_phone: update.driverPhone || m.driver_phone,
              driver_license: update.driverLicense || m.driver_license,
              driver_ci: update.driverCi || m.driver_ci,
              driver_photo: update.driverPhoto || m.driver_photo,
              driver_experience: update.driverExperience || m.driver_experience,
              driver_rating: update.driverRating || m.driver_rating,
              license_plate: update.licensePlate || m.license_plate,
              vehicle_model: update.vehicleModel || m.vehicle_model
            };
          }
          return m;
        })
      );
    });

    // Escuchar actualización individual
    socket.on('micro:location_updated', (data) => {
      setMicros((prev) =>
        prev.map((m) =>
          m.id === data.microId
            ? {
                ...m,
                current_lat: data.lat,
                current_lng: data.lng,
                available_seats: data.availableSeats,
                driver_name: data.driverName || m.driver_name,
                driver_ci: data.driverCi || m.driver_ci,
                driver_license: data.driverLicense || m.driver_license,
                driver_photo: data.driverPhoto || m.driver_photo
              }
            : m
        )
      );
    });

    // Escuchar actualización de aforo
    socket.on('micro:occupancy_updated', (data) => {
      setMicros((prev) =>
        prev.map((m) =>
          m.id === data.microId
            ? {
                ...m,
                current_passengers: data.currentPassengers,
                capacity_max: data.capacityMax || m.capacity_max,
                available_seats: Math.max(0, (data.capacityMax || m.capacity_max) - data.currentPassengers)
              }
            : m
        )
      );
    });

    // Escuchar evento de salida de terminal
    socket.on('line:micro_dispatched', (dispatchData) => {
      setDispatchToast(dispatchData);
      setCountdown(30);

      setTimeout(() => {
        setDispatchToast((current) => (current?.timestamp === dispatchData.timestamp ? null : current));
      }, 6000);

      fetchMicros(userLocation, selectedLineNumber);
    });

    socket.on('micro:status_changed', () => {
      fetchMicros(userLocation, selectedLineNumber);
    });

    return () => {
      socket.off('micros:batch_updated');
      socket.off('micro:location_updated');
      socket.off('micro:occupancy_updated');
      socket.off('line:micro_dispatched');
      socket.off('micro:status_changed');
    };
  }, [selectedLineNumber]);

  // Manejar cambio de filtro de línea
  const handleLineFilterChange = (newLineNum) => {
    setSelectedLineNumber(newLineNum);
    setSelectedMicro(null);
    if (newLineNum) {
      setSearchParams({ line: newLineNum });
    } else {
      setSearchParams({});
    }
  };

  const handleSelectMicro = (micro) => {
    setSelectedMicro(micro);
  };

  // Disparar manualmente salida de terminal desde la simulación
  const handleDispatchNow = async () => {
    try {
      setIsDispatching(true);
      const res = await api.post('/fleet/simulation/dispatch-now', {});
      if (res.success && res.dispatched) {
        setDispatchToast(res.dispatched);
        setCountdown(30);
        fetchMicros(userLocation, selectedLineNumber);
      }
    } catch (err) {
      console.error('Error al despachar salida:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  // Formateador limpio para evitar duplicaciones como "Línea 3 — Línea 3"
  const formatLineDisplayName = (line) => {
    if (!line || !line.name) return `Línea ${line?.line_number || ''}`;
    const cleaned = line.name.replace(/^Línea\s+\d+\s*[-—–]\s*/i, '').trim();
    return `Línea ${line.line_number} — ${cleaned}`;
  };

  // Filtrado de líneas según la pestaña activa (Todas vs Favoritas)
  const displayedLines = filterTab === 'FAVORITES'
    ? lines.filter((l) => favorites.includes(String(l.line_number)))
    : lines;

  // Filtrado de micros según pestaña favoritas
  const displayedMicros = (filterTab === 'FAVORITES' && !selectedLineNumber)
    ? micros.filter((m) => favorites.includes(String(m.line_number)))
    : micros;

  // Encontrar datos de la línea actualmente seleccionada
  const activeLineObject = lines.find((l) => String(l.line_number) === String(selectedLineNumber)) || null;

  // Pluralización correcta
  const unitCount = displayedMicros.length;
  const unitCountLabel = unitCount === 1 ? '1 micro activo' : `${unitCount} micros activos`;

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col lg:flex-row overflow-hidden bg-slate-50 font-sans">
      
      {/* PANEL LATERAL IZQUIERDO (Split-screen Desktop / Bottom-Sheet Mobile) */}
      <aside className="w-full lg:w-[410px] shrink-0 h-auto max-h-[48vh] lg:max-h-full lg:h-full bg-white border-b lg:border-b-0 lg:border-r border-slate-200/90 flex flex-col z-20 shadow-sm overflow-hidden">
        
        {/* Cabecera Compacta del Panel */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3 shrink-0">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-slate-900 tracking-tight">
                Red de Micros
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {unitCountLabel}
              </span>
            </div>

            {selectedLineNumber && (
              <button
                onClick={() => handleLineFilterChange('')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition flex items-center gap-1"
              >
                <span>Ver todas</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Pestañas de Filtro: Todas vs Favoritas (Punto 2) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/80 rounded-lg text-xs font-semibold border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setFilterTab('ALL');
              }}
              className={`py-1 px-2 rounded-md transition flex items-center justify-center gap-1.5 ${
                filterTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200/70'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todas ({lines.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterTab('FAVORITES');
              }}
              className={`py-1 px-2 rounded-md transition flex items-center justify-center gap-1.5 ${
                filterTab === 'FAVORITES'
                  ? 'bg-white text-amber-700 shadow-xs font-bold border border-amber-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${favorites.length > 0 ? 'fill-amber-400 text-amber-500' : ''}`} />
              <span>Favoritas ({favorites.length})</span>
            </button>
          </div>

          {/* Selector de Línea Limpio */}
          <div className="relative">
            <select
              value={selectedLineNumber}
              onChange={(e) => handleLineFilterChange(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 transition cursor-pointer appearance-none pr-8"
            >
              <option value="">
                {filterTab === 'FAVORITES' ? 'Tus Líneas Favoritas' : 'Todas las Líneas (60 líneas urbanas)'}
              </option>
              {displayedLines.map((l) => (
                <option key={l.id} value={l.line_number}>
                  {favorites.includes(String(l.line_number)) ? '★ ' : ''}{formatLineDisplayName(l)}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>

        </div>

        {/* Resumen de Ruta Seleccionada (Progreso Vertical Salida -> Llegada) */}
        {activeLineObject && (
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 shrink-0 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-md text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: activeLineObject.color || '#1D4ED8' }}
                >
                  L{activeLineObject.line_number}
                </span>
                <span className="font-display font-bold text-xs text-slate-900 truncate max-w-[170px]">
                  {activeLineObject.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Botón Guardar en Favoritas (Punto 2) */}
                <button
                  type="button"
                  onClick={(e) => handleToggleFavorite(activeLineObject.line_number, e)}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                    favorites.includes(String(activeLineObject.line_number))
                      ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-400 hover:text-amber-600 hover:border-slate-300'
                  }`}
                  title={favorites.includes(String(activeLineObject.line_number)) ? 'Quitar de favoritas' : 'Guardar en favoritas'}
                >
                  <Star className={`w-3.5 h-3.5 ${favorites.includes(String(activeLineObject.line_number)) ? 'fill-amber-400 text-amber-500' : ''}`} />
                  <span className="hidden sm:inline text-[11px]">
                    {favorites.includes(String(activeLineObject.line_number)) ? 'Favorita' : 'Guardar'}
                  </span>
                </button>

                <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                  {activeLineObject.distance_km || 9.0} km
                </span>
              </div>
            </div>

            {/* Trayecto Vertical con Línea de Progreso */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 shrink-0 ring-2 ring-emerald-100"></span>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Salida</span>
                  <p className="font-medium text-slate-800 truncate">{activeLineObject.origin_name || 'Terminal de Origen'}</p>
                </div>
              </div>

              <div className="ml-1 border-l-2 border-dashed border-slate-200 pl-4 h-2"></div>

              <div className="flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 mt-1 shrink-0 ring-2 ring-rose-100"></span>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Llegada</span>
                  <p className="font-medium text-slate-800 truncate">{activeLineObject.destination_name || 'Destino Final'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ficha Completa del Conductor y Asistente de Salida cuando se toca un Micro */}
        {selectedMicro && (() => {
          const etaMin = getETA(selectedMicro.distance_km);
          const advice = getDepartureAdvice(etaMin);
          const isFull = selectedMicro.current_passengers >= selectedMicro.capacity_max;
          const freeSeats = Math.max(0, selectedMicro.capacity_max - selectedMicro.current_passengers);
          const isAlertActive = proximityAlert?.microId === selectedMicro.id;

          return (
            <div className="p-4 bg-gradient-to-b from-blue-50/80 to-white border-b border-blue-200/80 shrink-0 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedMicro.driver_photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'}
                    alt={selectedMicro.driver_name}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-300 shadow-sm shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display font-bold text-sm text-slate-900 leading-tight">
                        {selectedMicro.driver_name || 'Conductor de Turno'}
                      </h3>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        <span>{selectedMicro.driver_rating || '4.9'}</span>
                      </span>
                    </div>
                    
                    <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                      C.I. <strong className="font-mono text-slate-800">{selectedMicro.driver_ci || '5892341 SC'}</strong> · Lic. {selectedMicro.driver_license || 'LIC-SCZ'}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {selectedMicro.vehicle_model || 'Toyota Coaster'} · Placa <strong className="font-mono text-slate-800">{selectedMicro.license_plate || '3412-ABC'}</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMicro(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded transition"
                  title="Cerrar ficha"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Módulo Asistente: ¿Cuándo salir de casa? */}
              <div className="p-3 bg-white rounded-xl border border-blue-200/70 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-700" strokeWidth={1.75} />
                    <span className="text-xs font-bold text-slate-900">
                      Llegada estimada: <span className="text-blue-700 font-display font-bold">~{etaMin} min</span>
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${advice.badgeClass} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${advice.dotClass}`}></span>
                    <span>{advice.label}</span>
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-tight">
                  {advice.desc}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Distancia: <strong className="text-slate-800 font-medium tabular-nums">{selectedMicro.distance_km || '1.2'} km</strong></span>
                  <span className="font-semibold text-emerald-700">{isFull ? 'Micro Lleno' : `${freeSeats} asientos libres`}</span>
                </div>
              </div>

              {/* Acciones del Estudiante: Alarma de Proximidad (Punto 3) y Reporte Ciudadano (Punto 4) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => handleToggleProximityAlert(selectedMicro, e)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 border shadow-xs ${
                    isAlertActive
                      ? 'bg-amber-100 border-amber-300 text-amber-900 animate-pulse'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {isAlertActive ? (
                    <>
                      <BellRing className="w-3.5 h-3.5 text-amber-600" />
                      <span>Alarma Activa</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5 text-blue-700" />
                      <span>Avisarme (4 min)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleOpenReport(selectedMicro, e)}
                  className="px-3 py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reportar Chofer</span>
                </button>
              </div>

              {/* Tarifa referencial regulada en efectivo */}
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  Tarifa regulada en efectivo:
                </span>
                <span className="font-bold text-slate-800">
                  {user?.role === 'ESTUDIANTE'
                    ? 'Bs. 1.00 UPDS'
                    : 'Bs. 2.00 General'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Lista de Micros en Tránsito (Scroll Interno Independiente) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Actualizando flota en tiempo real...</p>
            </div>
          ) : displayedMicros.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2 px-4">
              <p className="font-semibold text-slate-800 text-xs">
                {filterTab === 'FAVORITES' 
                  ? 'No hay micros circulando en tus líneas favoritas' 
                  : 'No hay micros activos para esta selección'}
              </p>
              <p className="text-[11px] text-slate-400">
                {filterTab === 'FAVORITES'
                  ? 'Agrega líneas a tus favoritas con la estrella (★) o cambia a la pestaña "Todas".'
                  : 'Selecciona otra línea en el desplegable o quita el filtro para ver todas las unidades.'}
              </p>
              {filterTab === 'FAVORITES' ? (
                <button
                  onClick={() => setFilterTab('ALL')}
                  className="mt-2 text-xs font-semibold text-blue-700 hover:underline"
                >
                  Ver todas las líneas
                </button>
              ) : selectedLineNumber && (
                <button
                  onClick={() => handleLineFilterChange('')}
                  className="mt-2 text-xs font-semibold text-blue-700 hover:underline"
                >
                  Ver todas las líneas
                </button>
              )}
            </div>
          ) : (
            displayedMicros.map((micro) => {
              const isFull = micro.current_passengers >= micro.capacity_max;
              const isSelected = selectedMicro?.id === micro.id;
              const freeSeats = Math.max(0, micro.capacity_max - micro.current_passengers);
              const occupancyPct = Math.min(100, Math.round((micro.current_passengers / micro.capacity_max) * 100));
              const isAlertActive = proximityAlert?.microId === micro.id;

              return (
                <div
                  key={micro.id}
                  onClick={() => handleSelectMicro(micro)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50/40 shadow-sm ring-1 ring-blue-700/20'
                      : 'border-slate-200/90 hover:border-slate-300 bg-white shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: micro.line_color || '#1D4ED8' }}
                      >
                        L{micro.line_number}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 truncate flex items-center gap-1.5">
                          <span className="truncate">Interno #{micro.internal_number} · {micro.driver_name?.split(' ')[0] || 'Chofer'}</span>
                          <button
                            type="button"
                            onClick={(e) => handleToggleFavorite(micro.line_number, e)}
                            className="text-slate-300 hover:text-amber-500 transition shrink-0 p-0.5"
                            title={favorites.includes(String(micro.line_number)) ? `Quitar Línea ${micro.line_number} de favoritas` : `Agregar Línea ${micro.line_number} a favoritas`}
                          >
                            <Star className={`w-3 h-3 ${favorites.includes(String(micro.line_number)) ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Navigation className="w-3 h-3 text-blue-600" strokeWidth={1.75} />
                          <span className="tabular-nums">A {micro.distance_km || '1.2'} km de ti</span>
                        </div>
                      </div>
                    </div>

                    {/* Badge de ocupación */}
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        isFull 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isFull ? 'LLENO' : `${freeSeats} libres`}
                      </span>
                    </div>
                  </div>

                  {/* Barra visual de aforo */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                      <span>Aforo: {micro.current_passengers}/{micro.capacity_max}</span>
                      <span className="tabular-nums font-mono">{occupancyPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isFull ? 'bg-rose-500' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Asistente de Salida y Acciones Rápidas */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-900 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-blue-700" strokeWidth={1.75} />
                        <span className="tabular-nums font-display">~{getETA(micro.distance_km)} min</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border truncate ${getDepartureAdvice(getETA(micro.distance_km)).badgeClass}`}>
                        {getDepartureAdvice(getETA(micro.distance_km)).shortLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Botón rápido de alarma (Punto 3) */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleProximityAlert(micro, e)}
                        className={`p-1.5 rounded-md border transition ${
                          isAlertActive
                            ? 'bg-amber-100 border-amber-300 text-amber-700 animate-pulse'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400 hover:text-amber-600'
                        }`}
                        title={isAlertActive ? 'Alarma activa para este micro' : 'Fijar alarma de llegada (4 min)'}
                      >
                        {isAlertActive ? (
                          <BellRing className="w-3.5 h-3.5" />
                        ) : (
                          <Bell className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMicro(micro);
                        }}
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 px-2.5 py-1 rounded-md transition flex items-center gap-1 shrink-0"
                      >
                        <Navigation className="w-3 h-3 text-blue-700" strokeWidth={1.75} />
                        <span>Rastrear</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </aside>

      {/* ÁREA DEL MAPA (Ocupa todo el espacio restante con controles flotantes minimalistas) */}
      <main className="flex-1 h-full relative overflow-hidden bg-slate-100">
        
        {/* Componente Leaflet de Pantalla Completa */}
        <Map5Km
          userLocation={userLocation}
          micros={displayedMicros}
          selectedMicro={selectedMicro}
          selectedLine={activeLineObject}
          onSelectMicro={handleSelectMicro}
        />

        {/* Banner Flotante de Alerta de Proximidad Activa (Punto 3) */}
        {proximityAlert && !proximityAlert.notified && (
          <div className="absolute top-16 left-4 z-[400] max-w-sm w-full animate-in fade-in slide-in-from-top-2">
            <div className="bg-white/95 backdrop-blur-md border border-amber-300 rounded-xl p-2.5 shadow-md flex items-center justify-between gap-2.5 text-slate-900 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"></span>
                <span className="truncate">
                  Alarma activa: <strong>Línea {proximityAlert.lineNumber} (Int #{proximityAlert.internalNumber})</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProximityAlert(null);
                  showToast('Alarma de proximidad cancelada');
                }}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold p-1"
                title="Desactivar alarma"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Toast Flotante de Despacho (Salida de Terminal) */}
        {dispatchToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4">
            <div className="bg-white border border-emerald-300 rounded-xl p-3 shadow-lg flex items-center justify-between gap-3 text-slate-900">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Bus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Salida de Terminal</span>
                    <span className="font-mono text-slate-500 font-normal">· {dispatchToast.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-700 truncate font-medium">
                    Chofer <strong>{dispatchToast.driverName}</strong> inició recorrido en Línea {dispatchToast.lineNumber}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDispatchToast(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Botones Flotantes Minimalistas en Esquina Superior Izquierda del Mapa */}
        <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2">
          
          {/* Indicador de Próxima Salida de Terminal */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg px-3 py-1.5 shadow-sm text-xs font-medium text-slate-700 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Salida cada 30m:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">00:{String(countdown).padStart(2, '0')}</span>
          </div>

          {/* Botón Flotante para Forzar Salida Manual de Demostración */}
          <button
            onClick={handleDispatchNow}
            disabled={isDispatching}
            className="bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
            title="Despachar un nuevo chofer desde terminal"
          >
            <Send className={`w-3.5 h-3.5 text-emerald-600 ${isDispatching ? 'animate-bounce' : ''}`} />
            <span>Salida Terminal</span>
          </button>

          {/* Botón Refrescar */}
          <button
            onClick={() => fetchMicros()}
            disabled={loading}
            className="bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 rounded-lg p-2 shadow-sm transition"
            title="Actualizar posiciones"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-700' : ''}`} />
          </button>

        </div>

        {/* Leyenda Flotante Minimalista en Esquina Inferior Derecha */}
        <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg px-3 py-2 shadow-sm text-[11px] font-medium text-slate-600 hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
            <span>Tu ubicación</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Micro disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <span>Lleno</span>
          </div>
        </div>

      </main>

      {/* Modal / Alarma en Pantalla Completa cuando el micro está a <= 4 min (Punto 3) */}
      {alarmModalData && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-in zoom-in-95">
          <div className="bg-white border-2 border-emerald-500 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm ring-4 ring-emerald-50">
              <BellRing className="w-8 h-8 animate-bounce text-emerald-600" strokeWidth={2} />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                ¡Llegada Inminente a tu Parada!
              </span>
              <h2 className="font-display font-bold text-2xl text-slate-900 pt-1">
                ¡Es momento de salir de casa!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                El micro <strong>Interno #{alarmModalData.micro.internal_number}</strong> de la <strong>Línea {alarmModalData.micro.line_number}</strong> está a solo <strong className="text-emerald-700">{alarmModalData.dist} km (~{alarmModalData.eta} min)</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 text-xs text-slate-600 flex items-center justify-between">
              <span>Asientos disponibles:</span>
              <strong className="text-emerald-700">
                {Math.max(0, alarmModalData.micro.capacity_max - alarmModalData.micro.current_passengers)} libres
              </strong>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAlarmModalData(null)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Entendido, saliendo hacia la parada</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reporte Ciudadano Estudiantil (Punto 4 - ODS 11) */}
      {reportModalOpen && reportTargetMicro && (
        <ReportIncidentModal
          micro={reportTargetMicro}
          user={user}
          onClose={() => {
            setReportModalOpen(false);
            setReportTargetMicro(null);
          }}
          onSuccess={(res) => {
            showToast(`Reporte ${res.reportCode} enviado a supervisión urbana.`);
          }}
        />
      )}

      {/* Toast Flotante de Acciones */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[990] animate-in fade-in slide-in-from-bottom-3">
          <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
}
