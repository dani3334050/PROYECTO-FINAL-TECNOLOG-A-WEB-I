import React, { useState } from 'react';
import { api } from '../api';
import { 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  Send, 
  Bus, 
  User, 
  Clock 
} from 'lucide-react';

const INCIDENT_TYPES = [
  {
    id: 'TARIFA_NO_RESPETADA',
    label: 'Tarifa no respetada',
    description: 'No quiso cobrar la tarifa regulada de Bs. 1.00 para estudiantes UPDS'
  },
  {
    id: 'NO_FRENO_PARADA',
    label: 'No se detuvo en la parada',
    description: 'Ignoró la señal de parada en el campus universitario o colegio'
  },
  {
    id: 'EXCESO_VELOCIDAD',
    label: 'Conducción peligrosa',
    description: 'Exceso de velocidad, maniobras bruscas o competir con otra línea'
  },
  {
    id: 'TRATO_DESCORTEZ',
    label: 'Maltrato o discriminación',
    description: 'Agresiones verbales o discriminación hacia el estudiante'
  },
  {
    id: 'OTRO',
    label: 'Otro incidente',
    description: 'Cualquier otra anomalía ocurrida en el servicio de transporte'
  }
];

export default function ReportIncidentModal({ micro, user, onClose, onSuccess }) {
  const [incidentType, setIncidentType] = useState('TARIFA_NO_RESPETADA');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successReport, setSuccessReport] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!incidentType) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/fleet/reports', {
        micro_id: micro?.id,
        line_number: micro?.line_number,
        internal_number: micro?.internal_number,
        driver_name: micro?.driver_name,
        incident_type: incidentType,
        description
      });

      if (res.success) {
        setSuccessReport(res);
        if (onSuccess) onSuccess(res);
      }
    } catch (err) {
      setError(err.message || 'Error al enviar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-in fade-in">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-5">
        
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-900 leading-tight">
                Reporte Ciudadano Estudiantil (ODS 11)
              </h2>
              <p className="text-[11px] text-slate-500">
                Supervisión de tarifa y seguridad del transporte urbano
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Si ya fue enviado con éxito */}
        {successReport ? (
          <div className="space-y-4 py-4 text-center animate-in fade-in">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" strokeWidth={2} />
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                ¡Reporte Registrado Oficialmente!
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                Tu reporte fue archivado y enviado a la directiva de supervisión de líneas de Santa Cruz.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block font-mono text-xs text-slate-700">
              Código de Seguimiento: <strong className="text-blue-700 font-bold">{successReport.reportCode}</strong>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg transition shadow-xs"
              >
                Cerrar y Regresar al Mapa
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de Reporte */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Tarjeta Informativa del Micro y Conductor Involucrado */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-md text-white font-bold text-xs flex items-center justify-center shrink-0"
                  style={{ backgroundColor: micro?.line_color || '#1D4ED8' }}
                >
                  L{micro?.line_number || 'N/A'}
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    Interno #{micro?.internal_number} · Placa {micro?.license_plate || 'S/P'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Conductor: {micro?.driver_name || 'Conductor de Turno'}
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-500 font-medium">
                Denunciante: <strong className="text-slate-800">{user?.full_name?.split(' ')[0] || 'Estudiante'}</strong>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Selector de Tipo de Incidencia */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Motivo del Reporte *
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {INCIDENT_TYPES.map((type) => {
                  const isChecked = incidentType === type.id;
                  return (
                    <label
                      key={type.id}
                      onClick={() => setIncidentType(type.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition text-xs ${
                        isChecked
                          ? 'border-rose-400 bg-rose-50/60 font-semibold text-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="incident_type"
                        value={type.id}
                        checked={isChecked}
                        onChange={() => setIncidentType(type.id)}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">{type.label}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{type.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Detalle o Comentario Adicional */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Detalle de lo ocurrido (opcional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ejemplo: El chofer cobró Bs. 2.00 a pesar de mostrar el carnet universitario en la parada..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition"
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Enviando Reporte...' : 'Enviar Reporte Oficial'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
