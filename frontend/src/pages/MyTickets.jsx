import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Bus, AlertCircle, ArrowRight, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/my-tickets');
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error('Error al obtener boletos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Cabecera Limpia */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 sm:p-6 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-emerald-600" strokeWidth={1.75} />
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Mis Boletos y Pases Digitales
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Muestra el código QR al conductor de la unidad al momento de abordar para validar tu pasaje.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-700' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 space-y-3">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-medium">Cargando tus boletos emitidos...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h3 className="font-display font-bold text-slate-900 text-base">No tienes boletos emitidos aún</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ubica tu micro en el mapa en vivo y realiza el pago con tarjeta para generar tu pase digital instantáneo.
          </p>
          <Link
            to="/passenger"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-sm transition"
          >
            <Bus className="w-4 h-4" />
            <span>Ver Mapa en Vivo</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tickets.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-xl overflow-hidden border shadow-xs transition hover:shadow-sm ${
                t.is_transfer 
                  ? 'border-amber-300 ring-1 ring-amber-200' 
                  : 'border-slate-200/90'
              }`}
            >
              {/* Etiqueta superior del boleto */}
              <div
                className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
                  t.is_transfer
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-50 text-slate-800 border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Bus className="w-4 h-4 text-blue-700" strokeWidth={1.75} />
                  <span>Línea {t.line_number} · Interno #{t.internal_number}</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  {t.is_transfer ? 'Pase de Trasbordo' : 'Boleto Digital'}
                </span>
              </div>

              <div className="p-5 space-y-4">
                
                {/* Código QR limpio */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <QRCodeSVG value={t.ticket_code} size={135} level="M" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700 tracking-wider mt-2.5">
                    {t.ticket_code}
                  </span>
                </div>

                {/* Aviso si es trasbordo */}
                {t.is_transfer === 1 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Trasbordo gratuito aplicado</strong>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Transferido desde Unidad #{t.original_internal_number || 'Origen'} sin cobro adicional.
                      </p>
                    </div>
                  </div>
                )}

                {/* Desglose de información */}
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Tarifa</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {t.fare_category} (Bs. {t.amount ? Number(t.amount).toFixed(2) : '1.00'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Estado</span>
                    <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold rounded-full text-[10px] mt-0.5">
                      {t.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Pago</span>
                    <span className="font-mono text-slate-700 text-xs">Tarjeta •••• {t.card_last4 || '4532'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Hora Emisión</span>
                    <span className="text-slate-700 text-xs">
                      {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
