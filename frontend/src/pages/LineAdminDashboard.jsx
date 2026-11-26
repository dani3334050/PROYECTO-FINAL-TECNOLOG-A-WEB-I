import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Bus, Users, RotateCw, DollarSign, Plus, CheckCircle2, AlertCircle, Radio, KeyRound, X } from 'lucide-react';

export default function LineAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles', 'drivers', 'rounds', 'finances'
  const [kpis, setKpis] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modales
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showRoundModal, setShowRoundModal] = useState(false);

  // Formulario nuevo vehículo
  const [vInternal, setVInternal] = useState('');
  const [vPlate, setVPlate] = useState('');
  const [vModel, setVModel] = useState('Toyota Coaster');
  const [vYear, setVYear] = useState('2021');
  const [vCapacity, setVCapacity] = useState('22');

  // Formulario nuevo chofer (para la App Móvil)
  const [dName, setDName] = useState('');
  const [dEmail, setDEmail] = useState('');
  const [dPassword, setDPassword] = useState('');
  const [dPhone, setDPhone] = useState('');
  const [dLicense, setDLicense] = useState('');
  const [dAssignMicroId, setDAssignMicroId] = useState('');

  // Formulario nueva ronda
  const [rMicroId, setRMicroId] = useState('');
  const [rDriverId, setRDriverId] = useState('');
  const [rNumber, setRNumber] = useState('1');
  const [rPassengers, setRPassengers] = useState('20');
  const [rCollected, setRCollected] = useState('40.00');

  const fetchLineData = async () => {
    try {
      setLoading(true);
      const [kRes, vRes, dRes, rRes] = await Promise.all([
        api.get('/line-admin/kpis'),
        api.get('/line-admin/vehicles'),
        api.get('/line-admin/drivers'),
        api.get('/line-admin/rounds')
      ]);

      if (kRes.success) setKpis(kRes.kpis);
      if (vRes.success) setVehicles(vRes.vehicles);
      if (dRes.success) setDrivers(dRes.drivers);
      if (rRes.success) setRounds(rRes.rounds);
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar datos de la línea.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineData();
  }, []);

  // Activar o pausar rastreo para la App Móvil
  const handleToggleTracking = async (vehicleId, currentTracking) => {
    try {
      const nextState = currentTracking === 1 ? 0 : 1;
      const res = await api.patch(`/line-admin/vehicles/${vehicleId}/tracking`, {
        tracking_active: nextState
      });

      if (res.success) {
        setStatusMsg(res.message);
        fetchLineData();
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Crear vehículo
  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/line-admin/vehicles', {
        internal_number: vInternal,
        license_plate: vPlate,
        vehicle_model: vModel,
        year: vYear,
        capacity_max: vCapacity
      });

      if (res.success) {
        setStatusMsg(res.message);
        setShowVehicleModal(false);
        setVInternal('');
        setVPlate('');
        fetchLineData();
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Crear chofer para la App Móvil
  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/line-admin/drivers', {
        full_name: dName,
        email: dEmail,
        password: dPassword,
        phone: dPhone,
        license_number: dLicense,
        assign_micro_id: dAssignMicroId || null
      });

      if (res.success) {
        setStatusMsg(res.message);
        setShowDriverModal(false);
        setDName('');
        setDEmail('');
        setDPassword('');
        setDPhone('');
        setDLicense('');
        fetchLineData();
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Registrar ronda completada
  const handleCreateRound = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/line-admin/rounds', {
        micro_id: Number(rMicroId),
        driver_id: rDriverId ? Number(rDriverId) : null,
        round_number: Number(rNumber),
        passengers_count: Number(rPassengers),
        total_collected: parseFloat(rCollected)
      });

      if (res.success) {
        setStatusMsg(res.message);
        setShowRoundModal(false);
        fetchLineData();
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const lineTitle = user?.assignedLine ? `Línea ${user.assignedLine.line_number} — ${user.assignedLine.name}` : 'Mi Línea';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Notificaciones */}
      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-800 font-bold ml-2">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-800 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Cabecera del Dashboard de Línea */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{lineTitle}</h1>
            <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded border border-slate-200">
              Sindicato de Línea
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administrador: <strong className="text-slate-700">{user?.full_name}</strong> | Control de flota, activación de rastreo y usuarios de choferes para App Móvil.
          </p>
        </div>

        <button
          onClick={fetchLineData}
          disabled={loading}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 transition self-start md:self-auto"
          title="Actualizar datos"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPIs de la Línea */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Flota de Micros</span>
          <span className="text-2xl font-bold text-slate-900 block">{kpis?.vehicleCount ?? '0'}</span>
          <span className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
            <Radio className="w-3 h-3 text-emerald-600" />
            <span>{kpis?.trackingActiveCount ?? '0'} con rastreo activo</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Choferes Registrados</span>
          <span className="text-2xl font-bold text-slate-900 block">{kpis?.driverCount ?? '0'}</span>
          <span className="text-xs text-slate-400">Cuentas creadas para App Móvil</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Recaudación Bruta</span>
          <span className="text-2xl font-bold text-slate-900 block">
            Bs. {kpis ? kpis.grossRevenue.toFixed(2) : '0.00'}
          </span>
          <span className="text-xs text-slate-400">
            Comisión ({kpis?.commissionPercentage ?? 10}%): -Bs. {kpis ? kpis.commissionDeducted.toFixed(2) : '0.00'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Ganancia Neta Línea</span>
          <span className="text-2xl font-bold text-slate-900 block">
            Bs. {kpis ? kpis.netRevenue.toFixed(2) : '0.00'}
          </span>
          <span className="text-xs text-emerald-700 font-medium">Fondo neto disponible</span>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'vehicles'
              ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg shadow-sm border-t border-x border-b-0'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bus className="w-3.5 h-3.5" />
          <span>Gestión de Vehículos ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'drivers'
              ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg shadow-sm border-t border-x border-b-0'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Conductores para App Móvil ({drivers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rounds')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'rounds'
              ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg shadow-sm border-t border-x border-b-0'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Rondas / Vueltas ({rounds.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('finances')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'finances'
              ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg shadow-sm border-t border-x border-b-0'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Caja y Liquidación</span>
        </button>
      </div>

      {/* PESTAÑA 1: VEHÍCULOS */}
      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Flota de Vehículos Registrados</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Habilite o pause el rastreo para que la App Móvil muestre la unidad en ruta a los estudiantes.
              </p>
            </div>
            <button
              onClick={() => setShowVehicleModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Micro</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200/70">
                <tr>
                  <th className="py-3 px-3">Interno</th>
                  <th className="py-3 px-3">Placa</th>
                  <th className="py-3 px-3">Modelo / Año</th>
                  <th className="py-3 px-3">Aforo Máximo</th>
                  <th className="py-3 px-3">Chofer Asignado</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-center">Rastreo App Móvil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                      #{v.internal_number}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-semibold text-slate-800">
                      {v.license_plate || <span className="text-slate-400 italic">S/P</span>}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      {v.vehicle_model} {v.year ? `(${v.year})` : ''}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-800">
                      {v.capacity_max} pasajeros
                    </td>
                    <td className="py-3.5 px-3 text-slate-800">
                      {v.driver_name ? (
                        <div>
                          <span className="font-medium block">{v.driver_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{v.driver_phone || 'Sin cel'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No asignado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                          v.status === 'EN_RUTA'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : v.status === 'EN_DESCANSO'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleTracking(v.id, v.tracking_active)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition inline-flex items-center gap-1.5 border ${
                          v.tracking_active === 1
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <Radio className={`w-3 h-3 ${v.tracking_active === 1 ? 'text-emerald-700' : 'text-slate-400'}`} />
                        <span>{v.tracking_active === 1 ? 'Rastreo Activo' : 'Pausado (Activar)'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CONDUCTORES (APP MÓVIL) */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Cuentas de Conductores para la App Móvil</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cree los accesos para que los choferes inicien sesión en la aplicación móvil con su correo y contraseña.
              </p>
            </div>
            <button
              onClick={() => setShowDriverModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Cuenta Chofer</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200/70">
                <tr>
                  <th className="py-3 px-3">Conductor</th>
                  <th className="py-3 px-3">Correo (Login App Móvil)</th>
                  <th className="py-3 px-3">Teléfono</th>
                  <th className="py-3 px-3">N° Licencia</th>
                  <th className="py-3 px-3">Micro Asignado</th>
                  <th className="py-3 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      {d.full_name}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-700">
                      {d.email}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {d.phone || 'S/N'}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-700">
                      {d.license_number || 'S/N'}
                    </td>
                    <td className="py-3.5 px-3">
                      {d.assigned_internal_number ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px] border border-slate-200">
                          Micro #{d.assigned_internal_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sin micro asignado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium text-[10px] border border-slate-200">
                        Habilitado App Móvil
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: RONDAS / VUELTAS */}
      {activeTab === 'rounds' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Historial de Rondas / Vueltas Operativas</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Auditoría cronológica de vueltas realizadas y montos recaudados por unidad.
              </p>
            </div>
            <button
              onClick={() => setShowRoundModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Vuelta</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200/70">
                <tr>
                  <th className="py-3 px-3">Vuelta</th>
                  <th className="py-3 px-3">Micro</th>
                  <th className="py-3 px-3">Conductor</th>
                  <th className="py-3 px-3">Horario</th>
                  <th className="py-3 px-3 text-center">Pasajeros</th>
                  <th className="py-3 px-3 text-right">Recaudado (Bs.)</th>
                  <th className="py-3 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {rounds.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      #{r.round_number}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      Micro #{r.internal_number}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {r.driver_name || 'Sin chofer'}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-500">
                      {new Date(r.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-900">
                      {r.passengers_count}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900">
                      Bs. {r.total_collected.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium text-[10px]">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: CAJA Y LIQUIDACIÓN */}
      {activeTab === 'finances' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm">Liquidación y Desglose de Comisión</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cálculo transparente de ingresos con la retención parametrizada por la administración central.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">1. Recaudación Bruta</span>
              <span className="text-2xl font-bold text-slate-900 block">
                Bs. {kpis ? kpis.grossRevenue.toFixed(2) : '0.00'}
              </span>
              <p className="text-xs text-slate-500">
                Suma total de pasajes recaudados por las unidades de la línea.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                2. Comisión Plataforma ({kpis?.commissionPercentage ?? 10}%)
              </span>
              <span className="text-2xl font-bold text-slate-700 block">
                - Bs. {kpis ? kpis.commissionDeducted.toFixed(2) : '0.00'}
              </span>
              <p className="text-xs text-slate-500">
                Tasa fijada por el Superadmin de la red.
              </p>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-xl shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">3. Ganancia Neta Línea</span>
              <span className="text-2xl font-bold text-white block">
                = Bs. {kpis ? kpis.netRevenue.toFixed(2) : '0.00'}
              </span>
              <p className="text-xs text-slate-400">
                Monto líquido a favor de la línea y sus socios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Micro */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">Registrar Micro en la Línea</h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Número Interno</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 48"
                  value={vInternal}
                  onChange={(e) => setVInternal(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Placa de Control</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 3412-ABC"
                  value={vPlate}
                  onChange={(e) => setVPlate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Año</label>
                  <input
                    type="number"
                    value={vYear}
                    onChange={(e) => setVYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Capacidad Máxima (18 a 25 personas)</label>
                <input
                  type="number"
                  min="18"
                  max="25"
                  required
                  value={vCapacity}
                  onChange={(e) => setVCapacity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg font-bold text-slate-800"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="w-1/2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
                >
                  Guardar Micro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear Chofer para App Móvil */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">Crear Cuenta Chofer para App Móvil</h3>
              <button onClick={() => setShowDriverModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mario Flores"
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Correo de Acceso a App Móvil</label>
                <input
                  type="email"
                  required
                  placeholder="chofer@rutabol.com"
                  value={dEmail}
                  onChange={(e) => setDEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={dPassword}
                    onChange={(e) => setDPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="78100000"
                    value={dPhone}
                    onChange={(e) => setDPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">N° de Licencia</label>
                <input
                  type="text"
                  placeholder="LIC-SCZ-12345"
                  value={dLicense}
                  onChange={(e) => setDLicense(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Asignar a Micro (Opcional)</label>
                <select
                  value={dAssignMicroId}
                  onChange={(e) => setDAssignMicroId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg font-medium"
                >
                  <option value="">-- Sin micro asignado por ahora --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      Micro #{v.internal_number} — Placa: {v.license_plate || 'S/P'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="w-1/2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
                >
                  Crear Chofer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Ronda */}
      {showRoundModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">Registrar Vuelta / Ronda</h3>
              <button onClick={() => setShowRoundModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateRound} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Micro</label>
                <select
                  required
                  value={rMicroId}
                  onChange={(e) => setRMicroId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg font-medium"
                >
                  <option value="">-- Seleccionar Micro --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      Micro #{v.internal_number} ({v.license_plate || 'S/P'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Conductor</label>
                <select
                  value={rDriverId}
                  onChange={(e) => setRDriverId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg font-medium"
                >
                  <option value="">-- Seleccionar Conductor --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Vuelta N°</label>
                  <input
                    type="number"
                    required
                    value={rNumber}
                    onChange={(e) => setRNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pasajeros</label>
                  <input
                    type="number"
                    required
                    value={rPassengers}
                    onChange={(e) => setRPassengers(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Total (Bs.)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={rCollected}
                    onChange={(e) => setRCollected(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRoundModal(false)}
                  className="w-1/2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
                >
                  Registrar Vuelta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
