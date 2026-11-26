import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Shield, Bus, Plus, Users, CreditCard, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AdminPanel() {
  const [lines, setLines] = useState([]);
  const [micros, setMicros] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulario de nuevo micro
  const [lineId, setLineId] = useState('');
  const [internalNumber, setInternalNumber] = useState('');
  const [capacityMax, setCapacityMax] = useState('22');
  const [formMsg, setFormMsg] = useState(null);
  const [formErr, setFormErr] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lRes, mRes] = await Promise.all([
        api.get('/fleet/lines'),
        api.get('/fleet/micros')
      ]);
      if (lRes.success) setLines(lRes.lines);
      if (mRes.success) setMicros(mRes.micros);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMicro = async (e) => {
    e.preventDefault();
    setFormMsg(null);
    setFormErr(null);

    try {
      const res = await api.post('/fleet/micros', {
        line_id: Number(lineId),
        internal_number: Number(internalNumber),
        capacity_max: Number(capacityMax)
      });
      if (res.success) {
        setFormMsg(res.message);
        setInternalNumber('');
        fetchData();
      }
    } catch (err) {
      setFormErr(err.message || 'Error al registrar micro.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-600" />
            <span>Panel de Administración y Control de Flota</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervisión operativa, validación de unidades (Línea + Interno) y parametrización de aforo.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Flota</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Alta de Unidad (RF-01, RF-06) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-slate-800 text-base">Registrar Nueva Unidad (Micro)</h2>
          </div>

          {formMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
              {formMsg}
            </div>
          )}
          {formErr && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
              {formErr}
            </div>
          )}

          <form onSubmit={handleCreateMicro} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Línea Asignada</label>
              <select
                required
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
              >
                <option value="">-- Seleccionar Línea --</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    Línea {l.line_number} — {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número Interno Único (RF-01)
              </label>
              <input
                type="number"
                required
                min={1}
                value={internalNumber}
                onChange={(e) => setInternalNumber(e.target.value)}
                placeholder="Ej: 48"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Capacidad Máxima / Aforo Parametrizable (18 a 25 personas) (RF-06)
              </label>
              <input
                type="number"
                required
                min={18}
                max={25}
                value={capacityMax}
                onChange={(e) => setCapacityMax(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-purple-700"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Regla de negocio: El límite estricto debe estar en el rango de 18 a 25 personas.
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md transition text-xs"
            >
              Dar de Alta en Sindicato
            </button>
          </form>
        </div>

        {/* Tabla de Flota Actual */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Bus className="w-5 h-5 text-blue-600" />
              <span>Inventario de Micros Registrados</span>
            </h2>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
              {micros.length} unidades
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Línea</th>
                  <th className="py-2.5 px-3">Interno</th>
                  <th className="py-2.5 px-3">Chofer Asignado</th>
                  <th className="py-2.5 px-3">Aforo Actual</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {micros.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded text-white text-[10px] font-black mr-1" style={{ backgroundColor: m.line_color || '#2563EB' }}>
                        L{m.line_number}
                      </span>
                      {m.line_name}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      #{m.internal_number}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {m.driver_name || <span className="text-slate-400 italic">Sin chofer</span>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">
                        {m.current_passengers} / {m.capacity_max}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.status === 'ACTIVO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.status === 'EMERGENCIA'
                            ? 'bg-rose-100 text-rose-800'
                            : m.status === 'EN_DESCANSO'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
