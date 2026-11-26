import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Shield, 
  Bus, 
  Users, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  MapPin, 
  Search, 
  Navigation, 
  Layers, 
  Star, 
  Phone, 
  FileText, 
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80'
];

export default function SuperadminDashboard() {
  const [activeTab, setActiveTab] = useState('drivers'); // 'drivers' | 'lines' | 'fleet'
  const [kpis, setKpis] = useState(null);
  const [lines, setLines] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Modal para registrar Chofer y Vehículo
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [creatingDriver, setCreatingDriver] = useState(false);
  const [driverLineId, setDriverLineId] = useState('');
  const [driverFullName, setDriverFullName] = useState('');
  const [driverCi, setDriverCi] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPhoto, setDriverPhoto] = useState(PRESET_AVATARS[0]);
  const [driverExperience, setDriverExperience] = useState('7');
  
  // Vehículo del chofer
  const [microInternal, setMicroInternal] = useState('');
  const [microPlate, setMicroPlate] = useState('');
  const [microModel, setMicroModel] = useState('Toyota Coaster');
  const [microYear, setMicroYear] = useState('2022');
  const [microCapacity, setMicroCapacity] = useState('22');

  // Modal para crear nueva Línea
  const [showLineModal, setShowLineModal] = useState(false);
  const [creatingLine, setCreatingLine] = useState(false);
  const [newLineNumber, setNewLineNumber] = useState('');
  const [newLineName, setNewLineName] = useState('');
  const [newLineColor, setNewLineColor] = useState('#2563EB');
  const [newOriginName, setNewOriginName] = useState('');
  const [newDestName, setNewDestName] = useState('');
  const [newDistanceKm, setNewDistanceKm] = useState('9.5');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [kpisRes, linesRes, driversRes] = await Promise.all([
        api.get('/superadmin/kpis'),
        api.get('/superadmin/lines'),
        api.get('/superadmin/drivers')
      ]);

      if (kpisRes.success) setKpis(kpisRes.kpis);
      if (linesRes.success) {
        setLines(linesRes.lines);
        if (!driverLineId && linesRes.lines.length > 0) {
          setDriverLineId(linesRes.lines[0].id);
        }
      }
      if (driversRes.success) setDrivers(driversRes.drivers || []);
    } catch (err) {
      setErrorMessage(err.message || 'Error al cargar datos de administración.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Crear Chofer y su Vehículo asignado
  const handleCreateDriver = async (e) => {
    e.preventDefault();
    setCreatingDriver(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        line_id: Number(driverLineId),
        full_name: driverFullName,
        ci: driverCi,
        license_number: driverLicense || `LIC-SCZ-${driverCi}`,
        phone: driverPhone,
        email: driverEmail || null,
        photo_url: driverPhoto,
        experience_years: parseInt(driverExperience) || 5,
        internal_number: parseInt(microInternal),
        license_plate: microPlate || `${3000 + Math.floor(Math.random() * 5000)}-SCZ`,
        vehicle_model: microModel,
        year: parseInt(microYear) || 2022,
        capacity_max: parseInt(microCapacity) || 22
      };

      const res = await api.post('/superadmin/drivers', payload);
      if (res.success) {
        setStatusMessage(res.message);
        setShowDriverModal(false);
        // Reset campos
        setDriverFullName('');
        setDriverCi('');
        setDriverLicense('');
        setDriverPhone('');
        setDriverEmail('');
        setMicroInternal('');
        setMicroPlate('');
        fetchDashboardData();
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setCreatingDriver(false);
    }
  };

  // Crear nueva Línea de Transporte
  const handleCreateLine = async (e) => {
    e.preventDefault();
    setCreatingLine(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        line_number: newLineNumber,
        name: newLineName,
        color: newLineColor,
        origin_name: newOriginName || 'Terminal de Origen',
        destination_name: newDestName || 'Terminal de Destino',
        distance_km: parseFloat(newDistanceKm) || 9.0
      };

      const res = await api.post('/superadmin/lines', payload);
      if (res.success) {
        setStatusMessage(res.message);
        setShowLineModal(false);
        setNewLineNumber('');
        setNewLineName('');
        setNewOriginName('');
        setNewDestName('');
        fetchDashboardData();
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setCreatingLine(false);
    }
  };

  // Dar de baja a un chofer
  const handleDeleteDriver = async (driverId, driverName) => {
    if (!window.confirm(`¿Estás seguro de dar de baja al chofer ${driverName} y su micro asignado?`)) return;
    try {
      const res = await api.delete(`/superadmin/drivers/${driverId}`);
      if (res.success) {
        setStatusMessage(res.message);
        fetchDashboardData();
      }
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // Filtrar choferes por búsqueda
  const filteredDrivers = drivers.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.driver_name && d.driver_name.toLowerCase().includes(q)) ||
      (d.driver_ci && d.driver_ci.toLowerCase().includes(q)) ||
      (d.driver_license && d.driver_license.toLowerCase().includes(q)) ||
      (d.line_number && String(d.line_number).includes(q)) ||
      (d.license_plate && d.license_plate.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Alertas y Notificaciones */}
      {statusMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-950/90 border border-rose-500/50 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cabecera Ejecutiva Unificada */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-purple-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">Panel de Administración de Red y Flota</h1>
            <span className="text-xs font-black bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-0.5 rounded-full">
              Control Unificado
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestión integral de líneas de transporte urbano, empadronamiento de choferes con credenciales oficiales y asignación de micros.
          </p>
        </div>

        {/* Botones de Acción Rápida */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowDriverModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Chofer y Vehículo</span>
          </button>

          <button
            onClick={() => setShowLineModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Nueva Línea</span>
          </button>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Operativas (Sin comisiones ni ganancias) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Líneas Activas</span>
          <div className="text-2xl font-black text-white mt-1">{kpis?.totalLines || lines.length}</div>
          <span className="text-[10px] text-slate-500">Red Metropolitana</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Choferes Registrados</span>
          <div className="text-2xl font-black text-blue-400 mt-1">{kpis?.totalDrivers || drivers.length}</div>
          <span className="text-[10px] text-slate-500">Con credencial y C.I.</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Flota de Micros</span>
          <div className="text-2xl font-black text-white mt-1">{kpis?.totalVehicles || 120}</div>
          <span className="text-[10px] text-slate-500">Unidades habilitadas</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">En Circulación</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{kpis?.activeMicros || 60}</div>
          <span className="text-[10px] text-emerald-500 font-semibold">● En ruta activa</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">En Terminal</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{kpis?.restingMicros || 60}</div>
          <span className="text-[10px] text-amber-500 font-semibold">⏳ Listos para salida</span>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition flex items-center gap-2 border-b-2 ${
            activeTab === 'drivers'
              ? 'border-blue-500 text-white bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Choferes y Vehículos ({drivers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lines')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition flex items-center gap-2 border-b-2 ${
            activeTab === 'lines'
              ? 'border-purple-500 text-white bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Líneas Registradas ({lines.length})</span>
        </button>
      </div>

      {/* PESTAÑA 1: GESTIÓN DE CHOFERES Y VEHÍCULOS */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          
          {/* Barra de Búsqueda de Choferes */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar chofer por nombre, C.I., placa, licencia o línea..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowDriverModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Chofer</span>
            </button>
          </div>

          {/* Grilla de Fichas de Choferes */}
          {filteredDrivers.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
              <p className="font-bold text-white text-base">No se encontraron choferes con el filtro actual</p>
              <button onClick={() => setSearchQuery('')} className="text-xs text-blue-400 font-bold hover:underline">
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrivers.map((driver) => {
                const isEnRuta = driver.micro_status === 'EN_RUTA';

                return (
                  <div
                    key={driver.driver_id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl shadow-xl flex flex-col justify-between transition-all group"
                  >
                    <div className="space-y-4">
                      
                      {/* Cabecera con Foto y Datos Personales */}
                      <div className="flex items-start gap-3.5">
                        <img
                          src={driver.driver_photo || PRESET_AVATARS[0]}
                          alt={driver.driver_name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 shrink-0 shadow-md"
                          style={{ borderColor: driver.line_color || '#2563EB' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span
                              className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: driver.line_color || '#2563EB' }}
                            >
                              Línea {driver.line_number}
                            </span>
                            <span className="text-[11px] font-black flex items-center gap-1 text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{driver.driver_rating || '4.9'}</span>
                            </span>
                          </div>
                          
                          <h3 className="font-black text-sm text-white mt-1 truncate">
                            {driver.driver_name}
                          </h3>

                          <p className="text-[11px] text-slate-400 font-medium">
                            {driver.driver_experience || 6} años de experiencia
                          </p>
                        </div>
                      </div>

                      {/* Credenciales Oficiales */}
                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-500 font-semibold">C.I.:</span>
                          <strong className="font-mono text-white">{driver.driver_ci || '5892341 SC'}</strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-500 font-semibold">Licencia:</span>
                          <strong className="text-blue-300 truncate max-w-[150px]">{driver.driver_license || 'LIC-SCZ'}</strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-500 font-semibold">Teléfono:</span>
                          <span className="font-medium">{driver.driver_phone || '78000000'}</span>
                        </div>
                      </div>

                      {/* Vehículo Asignado */}
                      <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-2xl space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Vehículo Asignado</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isEnRuta ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {isEnRuta ? '● En Ruta' : '⏳ En Terminal'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-bold text-white pt-1">
                          <span>Interno #{driver.internal_number || 1} • {driver.vehicle_model || 'Toyota Coaster'}</span>
                          <span className="font-mono text-amber-300">{driver.license_plate || '3412-ABC'}</span>
                        </div>
                      </div>

                    </div>

                    {/* Botón de Eliminación / Baja */}
                    <div className="pt-3 mt-3 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => handleDeleteDriver(driver.driver_id, driver.driver_name)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Dar de Baja</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* PESTAÑA 2: GESTIÓN DE LÍNEAS */}
      {activeTab === 'lines' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lines.map((l) => (
              <div
                key={l.id}
                className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl text-white font-black text-sm flex items-center justify-center shadow"
                      style={{ backgroundColor: l.color || '#2563EB' }}
                    >
                      L{l.line_number}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">Línea {l.line_number}</h3>
                      <span className="text-[11px] text-slate-400">{l.distance_km || 9.0} km de recorrido</span>
                    </div>
                  </div>
                  
                  <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                    {l.vehicle_count || 2} micros
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-300">
                  {l.name}
                </p>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs space-y-1 text-slate-300">
                  <div>🟢 <strong>Salida:</strong> {l.origin_name || 'Terminal de Origen'}</div>
                  <div>🏁 <strong>Llegada:</strong> {l.destination_name || 'Terminal de Destino'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR CHOFER Y ASIGNAR VEHÍCULO */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>Registrar Chofer y Vehículo</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  El chofer quedará empadronado con su ficha completa y aparecerá en el mapa al circular.
                </p>
              </div>
              <button onClick={() => setShowDriverModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4 text-xs">
              
              {/* Selección de Línea */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Línea de Transporte *</label>
                <select
                  value={driverLineId}
                  onChange={(e) => setDriverLineId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
                  required
                >
                  {lines.map((l) => (
                    <option key={l.id} value={l.id}>
                      Línea {l.line_number} — {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SECCIÓN 1: DATOS PERSONALES DEL CHOFER */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <span className="text-[11px] font-black uppercase text-blue-400 block tracking-wider">
                  1. Ficha del Conductor
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      placeholder="Ej: Mario Flores Terrazas"
                      value={driverFullName}
                      onChange={(e) => setDriverFullName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Cédula de Identidad (C.I.) *</label>
                    <input
                      type="text"
                      placeholder="Ej: 5892341 SC"
                      value={driverCi}
                      onChange={(e) => setDriverCi(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">N° Licencia de Conducir</label>
                    <input
                      type="text"
                      placeholder="Ej: LIC-SCZ-1101 (Cat. C)"
                      value={driverLicense}
                      onChange={(e) => setDriverLicense(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Teléfono / Celular</label>
                    <input
                      type="text"
                      placeholder="Ej: 78122001"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Selección rápida de Avatar */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Fotografía del Chofer</label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {PRESET_AVATARS.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Avatar"
                        onClick={() => setDriverPhoto(url)}
                        className={`w-10 h-10 rounded-xl object-cover cursor-pointer border-2 transition ${
                          driverPhoto === url ? 'border-blue-500 ring-2 ring-blue-500/50 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: DATOS DEL VEHÍCULO (MICRO) */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <span className="text-[11px] font-black uppercase text-amber-400 block tracking-wider">
                  2. Ficha Técnica del Micro
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">N° Interno *</label>
                    <input
                      type="number"
                      placeholder="Ej: 3"
                      value={microInternal}
                      onChange={(e) => setMicroInternal(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-black focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Placa de Control</label>
                    <input
                      type="text"
                      placeholder="Ej: 3412-ABC"
                      value={microPlate}
                      onChange={(e) => setMicroPlate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Capacidad Asientos</label>
                    <select
                      value={microCapacity}
                      onChange={(e) => setMicroCapacity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="18">18 Pasajeros</option>
                      <option value="20">20 Pasajeros</option>
                      <option value="22">22 Pasajeros (Estándar)</option>
                      <option value="25">25 Pasajeros (Máximo)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Modelo de Vehículo</label>
                    <input
                      type="text"
                      placeholder="Toyota Coaster"
                      value={microModel}
                      onChange={(e) => setMicroModel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Año</label>
                    <input
                      type="number"
                      placeholder="2022"
                      value={microYear}
                      onChange={(e) => setMicroYear(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingDriver}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                >
                  {creatingDriver ? 'Registrando...' : 'Guardar Chofer y Vehículo'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA LÍNEA */}
      {showLineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <span>Nueva Línea de Transporte</span>
              </h3>
              <button onClick={() => setShowLineModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLine} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">N° de Línea *</label>
                  <input
                    type="text"
                    placeholder="Ej: 105"
                    value={newLineNumber}
                    onChange={(e) => setNewLineNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Color</label>
                  <input
                    type="color"
                    value={newLineColor}
                    onChange={(e) => setNewLineColor(e.target.value)}
                    className="w-full h-9 bg-slate-950 border border-slate-800 rounded-xl p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre Descriptivo de la Ruta *</label>
                <input
                  type="text"
                  placeholder="Ej: Línea 105 - Radial 26 / Los Lotes"
                  value={newLineName}
                  onChange={(e) => setNewLineName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Terminal de Salida</label>
                  <input
                    type="text"
                    placeholder="Parada Los Lotes"
                    value={newOriginName}
                    onChange={(e) => setNewOriginName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Terminal de Llegada</label>
                  <input
                    type="text"
                    placeholder="Mercado Nuevo"
                    value={newDestName}
                    onChange={(e) => setNewDestName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLineModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingLine}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
                >
                  {creatingLine ? 'Creando...' : 'Crear Línea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
