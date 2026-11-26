import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { socket } from '../socket';
import { useAuth } from '../context/AuthContext';
import { 
  Bus, 
  Users, 
  AlertTriangle, 
  RefreshCw, 
  UserCheck, 
  Play, 
  ArrowRightLeft, 
  ShieldAlert, 
  Navigation,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  School,
  Clock,
  Square,
  Minus,
  Plus
} from 'lucide-react';

export default function DriverPanel() {
  const { user, refreshUser } = useAuth();
  const [lines, setLines] = useState([]);
  const [micros, setMicros] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState('');
  const [internalNumber, setInternalNumber] = useState('');
  const [activeMicro, setActiveMicro] = useState(user?.assignedMicro || null);
  const [boardingFeed, setBoardingFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Estados para modal de relevo y emergencia
  const [showReliefModal, setShowReliefModal] = useState(false);
  const [reliefTargetId, setReliefTargetId] = useState('');
  const [isSimulatingGps, setIsSimulatingGps] = useState(false);

  // Cargar líneas y micros disponibles
  const loadFleetData = async () => {
    try {
      const [linesRes, microsRes] = await Promise.all([
        api.get('/fleet/lines'),
        api.get('/fleet/micros')
      ]);
      if (linesRes.success) setLines(linesRes.lines);
      if (microsRes.success) setMicros(microsRes.micros);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFleetData();
  }, []);

  // Escuchar eventos en vivo del micro asignado (RF-10)
  useEffect(() => {
    if (!activeMicro) return;

    const boardEvent = `driver:${activeMicro.id}:passenger_boarded`;
    socket.on(boardEvent, (data) => {
      setBoardingFeed((prev) => [data, ...prev.slice(0, 9)]);
      setActiveMicro((prev) => ({
        ...prev,
        current_passengers: data.currentPassengers,
        capacity_max: data.capacityMax
      }));
    });

    socket.on('micro:occupancy_updated', (data) => {
      if (data.microId === activeMicro.id) {
        setActiveMicro((prev) => ({
          ...prev,
          current_passengers: data.currentPassengers
        }));
      }
    });

    return () => {
      socket.off(boardEvent);
      socket.off('micro:occupancy_updated');
    };
  }, [activeMicro]);

  // RF-01: Iniciar turno de chofer validando Línea + Interno
  const handleStartShift = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post('/fleet/driver/start-shift', {
        line_id: Number(selectedLineId),
        internal_number: Number(internalNumber)
      });

      if (res.success && res.micro) {
        setActiveMicro(res.micro);
        setMessage(res.message);
        await refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar turno.');
    } finally {
      setLoading(false);
    }
  };

  // RF-06: Pasajero baja (decrementar aforo)
  const handlePassengerAlight = async () => {
    if (!activeMicro) return;
    try {
      const res = await api.post('/transfers/passenger-alight', { micro_id: activeMicro.id });
      if (res.success) {
        setActiveMicro((prev) => ({
          ...prev,
          current_passengers: res.currentPassengers
        }));
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar aforo.');
    }
  };

  // RF-08: Trasbordo por Relevo de Turno (Transacción ACID)
  const handleExecuteRelief = async () => {
    if (!activeMicro || !reliefTargetId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/transfers/relief', {
        source_micro_id: activeMicro.id,
        target_micro_id: Number(reliefTargetId)
      });

      if (res.success) {
        setMessage(res.message);
        setShowReliefModal(false);
        setActiveMicro((prev) => ({
          ...prev,
          status: 'EN_DESCANSO',
          current_passengers: 0
        }));
        await refreshUser();
      }
    } catch (err) {
      setError(err.message || 'No se pudo completar el trasbordo por relevo.');
    } finally {
      setLoading(false);
    }
  };

  // RF-09: Declarar Contingencia / Avería Mecánica
  const handleDeclareEmergency = async () => {
    if (!window.confirm('¿Está seguro de declarar FALLA MECÁNICA / CONTINGENCIA? La unidad será retirada del mapa público de pasajeros y se emitirán pases de trasbordo libre.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/transfers/emergency', {
        micro_id: activeMicro.id,
        reason: 'Avería mecánica en ruta (RF-09)'
      });

      if (res.success) {
        setMessage('Contingencia declarada. Unidad fuera de servicio en el mapa.');
        setActiveMicro((prev) => ({
          ...prev,
          status: 'EMERGENCIA'
        }));
      }
    } catch (err) {
      setError(err.message || 'Error al declarar emergencia.');
    } finally {
      setLoading(false);
    }
  };

  // Simulación de movimiento GPS para pruebas
  useEffect(() => {
    let interval = null;
    if (isSimulatingGps && activeMicro) {
      // Coordenadas simuladas en Santa Cruz (recorriendo anillo)
      let step = 0;
      const coords = [
        [-17.7850, -63.1810],
        [-17.7840, -63.1820],
        [-17.7833, -63.1830],
        [-17.7820, -63.1845],
        [-17.7800, -63.1860]
      ];

      interval = setInterval(() => {
        step = (step + 1) % coords.length;
        const [lat, lng] = coords[step];
        socket.emit('driver:stream_location', {
          microId: activeMicro.id,
          lat,
          lng
        });
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulatingGps, activeMicro]);

  const capacityMax = activeMicro?.capacity_max || 22;
  const currentCount = activeMicro?.current_passengers || 0;
  const isFull = currentCount >= capacityMax;
  const occupancyPercentage = Math.min(100, Math.round((currentCount / capacityMax) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Alertas */}
      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={1.75} />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-700 hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Si NO tiene micro activo: Formulario de Inicio de Turno (RF-01) */}
      {!activeMicro ? (
        <div className="max-w-xl mx-auto bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-xs">
              <Bus className="w-7 h-7" strokeWidth={1.75} />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Inicio de Turno de Chofer</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Validación obligatoria de Línea y Número Interno antes de operar y recaudar (RF-01).
            </p>
          </div>

          <form onSubmit={handleStartShift} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Línea de Transporte *
              </label>
              <select
                required
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              >
                <option value="">-- Selecciona tu Línea Asignada --</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    Línea {l.line_number} — {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Número Interno de Unidad (Micro) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={internalNumber}
                onChange={(e) => setInternalNumber(e.target.value)}
                placeholder="Ejemplo: 15"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition tabular-nums"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" strokeWidth={1.75} />
              <span>{loading ? 'Validando Unidad en Red...' : 'Validar Unidad e Iniciar Recorrido'}</span>
            </button>
          </form>
        </div>
      ) : (
        /* PANEL ACTIVO DEL CHOFER EN RUTA */
        <div className="space-y-6">
          
          {/* Cabecera de la Unidad Activa */}
          <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-xl text-white shadow-xs flex-shrink-0">
                <Bus className="w-7 h-7" strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
                    Línea {activeMicro.line_number || '122'} — Interno #{activeMicro.internal_number}
                  </h1>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      activeMicro.status === 'ACTIVO' || activeMicro.status === 'EN_RUTA'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : activeMicro.status === 'EMERGENCIA'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {activeMicro.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Conductor asignado: <strong className="text-slate-800">{user?.full_name}</strong> · Aforo máximo: <strong className="text-slate-800">{activeMicro.capacity_max} asientos</strong> (RF-06)
                </p>
              </div>
            </div>

            {/* Controles de Conductor */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Simulador GPS */}
              <button
                type="button"
                onClick={() => setIsSimulatingGps(!isSimulatingGps)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border ${
                  isSimulatingGps
                    ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{isSimulatingGps ? 'GPS Transmitiendo' : 'Simular GPS en Ruta'}</span>
              </button>

              {/* Botón de Relevo (RF-08) */}
              <button
                type="button"
                onClick={() => setShowReliefModal(true)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Trasbordo por Relevo</span>
              </button>

              {/* Botón de Emergencia (RF-09) */}
              <button
                type="button"
                onClick={handleDeclareEmergency}
                disabled={activeMicro.status === 'EMERGENCIA'}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Contingencia / Falla Mecánica</span>
              </button>
            </div>
          </div>

          {/* Cuadrícula: Aforo en Tiempo Real (RF-06) y Verificación Visual de Estudiantes (RF-10) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tarjeta de Aforo */}
            <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider">
                  Control de Aforo Físico (RF-06)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isFull ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {isFull ? 'CAPACIDAD MÁXIMA' : 'ASIENTOS DISPONIBLES'}
                </span>
              </div>

              {/* Medidor Numérico de Asientos */}
              <div className="text-center py-2">
                <div className="text-5xl font-bold font-display tracking-tight tabular-nums">
                  <span className={isFull ? 'text-rose-600' : 'text-slate-900'}>{currentCount}</span>
                  <span className="text-slate-400 text-3xl font-normal"> / {capacityMax}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {capacityMax - currentCount} asientos libres restantes
                </p>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    occupancyPercentage >= 100
                      ? 'bg-rose-500'
                      : occupancyPercentage > 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${occupancyPercentage}%` }}
                ></div>
              </div>

              {/* Botón de Descenso (-1 Pasajero) */}
              <button
                type="button"
                onClick={handlePassengerAlight}
                disabled={currentCount <= 0}
                className="w-full bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-semibold py-2.5 rounded-lg text-xs border border-slate-200 transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Minus className="w-4 h-4 text-rose-500" strokeWidth={1.75} />
                <span>Pasajero Desciende (-1 al Aforo)</span>
              </button>
            </div>

            {/* Módulo de Verificación Visual de Abordaje (RF-10) */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
                  <h3 className="font-display font-bold text-slate-900 text-sm">
                    Feed de Verificación Visual al Abordar (RF-10)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.75} />
                  Streaming en Tiempo Real
                </span>
              </div>

              {boardingFeed.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-center mx-auto text-slate-400">
                    <UserCheck className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <p className="font-semibold text-slate-700 text-sm">Esperando abordaje de pasajeros...</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Cuando un estudiante o usuario pague su boleto en la app web, se mostrará aquí su fotografía facial y datos de validación.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {boardingFeed.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-4 animate-in fade-in"
                    >
                      <div className="flex items-center gap-3">
                        {/* Foto facial del estudiante (RF-02, RF-03, RF-10) */}
                        <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex items-center justify-center border border-slate-200 shadow-xs flex-shrink-0">
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt="Foto Estudiante" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">👤</span>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.passengerName}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              item.category === 'UNIVERSITARIO'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : item.category === 'ESCOLAR'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {item.category}
                            </span>
                            <span className="text-xs font-mono font-medium text-slate-500">
                              {item.ticketCode}
                            </span>
                            {item.codeStudent && (
                              <span className="text-[11px] text-slate-500">
                                Ref: <strong>{item.codeStudent}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-700 block tabular-nums">
                          Bs. {Number(item.amount).toFixed(2)} PAGADO
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                          {item.boardedAt || 'Recién'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Modal de Trasbordo por Relevo (RF-08) */}
      {showReliefModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-lg space-y-4">
            <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />
              <span>Trasbordo por Relevo de Turno (RF-08)</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cumpliendo con la regla <strong>RF-08</strong> y <strong>RNF-03 (ACID)</strong>: Este micro conservará la totalidad de sus ingresos recaudados en su balance, y el micro de relevo absorberá a los <strong>{currentCount} pasajeros a bordo</strong> sin cobrarles pasaje de nuevo.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Selecciona la Unidad de Relevo (Misma Línea)
              </label>
              <select
                value={reliefTargetId}
                onChange={(e) => setReliefTargetId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value="">-- Seleccionar micro disponible --</option>
                {micros
                  .filter((m) => m.id !== activeMicro?.id && m.line_id === activeMicro?.line_id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      Interno #{m.internal_number} — Capacidad: {m.capacity_max} (Libres: {m.capacity_max - m.current_passengers})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReliefModal(false)}
                className="w-1/2 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteRelief}
                disabled={!reliefTargetId || loading}
                className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition shadow-xs"
              >
                {loading ? 'Transfiriendo...' : 'Confirmar Relevo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
