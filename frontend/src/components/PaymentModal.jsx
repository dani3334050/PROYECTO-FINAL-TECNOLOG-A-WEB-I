import React, { useState } from 'react';
import { api } from '../api';
import { CreditCard, ShieldCheck, CheckCircle2, X, AlertTriangle, Bus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';

export default function PaymentModal({ micro, user, onClose, onSuccess }) {
  const [cardNumber, setCardNumber] = useState('4532 8921 4452 7890');
  const [cardHolder, setCardHolder] = useState(user?.full_name || 'JUAN PEREZ');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('789');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [purchasedTicket, setPurchasedTicket] = useState(null);

  // Determinar la tarifa aplicable automáticamente (RF-04)
  const getFare = () => {
    if (user?.role === 'ESTUDIANTE') {
      return user?.studentProfile?.student_type === 'UNIVERSITARIO'
        ? { category: 'UNIVERSITARIO', price: '1.00 Bs (Tarifa UPDS 50% desc.)' }
        : { category: 'ESCOLAR', price: '0.80 Bs (Tarifa Escolar)' };
    }
    return { category: 'GENERAL', price: '2.00 Bs (Tarifa General)' };
  };

  const fareInfo = getFare();
  const isFull = micro.current_passengers >= micro.capacity_max;

  const handlePayment = async (e) => {
    e.preventDefault();
    if (isFull) {
      setError('La unidad ha alcanzado su capacidad máxima permitida (RF-06).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/payments/pay-ticket', {
        micro_id: micro.id,
        card_number: cardNumber,
        card_holder: cardHolder,
        expiry,
        cvv
      });

      if (res.success && res.ticket) {
        setPurchasedTicket(res.ticket);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
        if (onSuccess) onSuccess(res.ticket);
      }
    } catch (err) {
      setError(err.message || 'Error al procesar el pago con tarjeta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera del modal */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <CreditCard className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Pasarela de Pago Seguro</h3>
              <p className="text-xs text-blue-200">Línea {micro.line_number} — Interno #{micro.internal_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {purchasedTicket ? (
            /* Vista de Boleto Digital Emitido */
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-800">¡Boleto Emitido con Éxito!</h4>
                <p className="text-xs text-slate-500 mt-1">Presenta este código QR al conductor al momento de abordar</p>
              </div>

              {/* Tarjeta del boleto con QR */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl shadow-md border border-slate-100">
                    <QRCodeSVG value={purchasedTicket.ticketCode} size={150} level="M" />
                  </div>
                </div>
                <div className="font-mono text-sm font-bold text-blue-700 tracking-wider">
                  {purchasedTicket.ticketCode}
                </div>
                <div className="grid grid-cols-2 text-left text-xs text-slate-600 gap-2 border-t border-slate-200 pt-3">
                  <div>
                    <span className="text-slate-400 block">Línea / Interno:</span>
                    <strong className="text-slate-800">L{micro.line_number} - Int. {micro.internal_number}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tarifa Aplicada:</span>
                    <strong className="text-emerald-700">{purchasedTicket.category} (Bs. {purchasedTicket.amount.toFixed(2)})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Titular:</span>
                    <strong className="text-slate-800">{user?.full_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pago con Tarjeta:</span>
                    <strong className="text-slate-800">•••• {purchasedTicket.cardLast4}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition"
              >
                Cerrar y Ver en Mis Boletos
              </button>
            </div>
          ) : (
            /* Formulario de Pago con Tarjeta */
            <form onSubmit={handlePayment} className="space-y-4">
              {/* Tarifa automática calculada según perfil */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-blue-700 block">Importe Automático</span>
                  <span className="text-lg font-black text-blue-900">{fareInfo.price}</span>
                </div>
                <span className="text-xs bg-blue-200/80 text-blue-800 px-2.5 py-1 rounded-full font-bold">
                  {fareInfo.category}
                </span>
              </div>

              {/* Alerta de aforo */}
              {isFull ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2.5 text-rose-800 text-xs font-semibold">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                  <span>Unidad Llena ({micro.current_passengers}/{micro.capacity_max} pasajeros). Venta bloqueada.</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 flex items-center justify-between px-1">
                  <span>Asientos disponibles en la unidad:</span>
                  <strong className="text-emerald-600 font-bold">
                    {micro.capacity_max - micro.current_passengers} libres
                  </strong>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-100 text-rose-700 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              {/* Campos de Tarjeta de Crédito */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Tarjeta (Creditcard)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 0000 0000 0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono tracking-wider pl-10"
                  />
                  <CreditCard className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Titular</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  placeholder="COMO APARECE EN LA TARJETA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vencimiento</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/AA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="•••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono text-center tracking-widest"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Transmisión encriptada bajo TLS con tokenización bancaria (RNF-04).</span>
              </div>

              <button
                type="submit"
                disabled={loading || isFull}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Validando Pasarela...
                  </span>
                ) : (
                  <span>Abonar Pasaje Digital</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
