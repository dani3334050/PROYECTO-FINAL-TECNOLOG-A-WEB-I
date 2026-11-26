import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bus, 
  Navigation, 
  GraduationCap, 
  CreditCard, 
  Users, 
  Layers,
  ArrowRight,
  CheckCircle2,
  QrCode,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Hero Asimétrico de 2 Columnas */}
      <section className="relative overflow-hidden py-14 lg:py-24 border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Columna Izquierda: Mensaje y Acciones */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Badge En Vivo con punto verde pulsante */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold tracking-tight">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>En vivo · 60 líneas activas en Santa Cruz</span>
              </div>

              {/* Titular Principal */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold text-slate-900 tracking-tight leading-[1.12]">
                Movilidad urbana en tiempo real para Santa Cruz de la Sierra.
              </h1>

              {/* Subtítulo legible */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
                Monitorea el recorrido de micros calle por calle en tiempo real, verifica el aforo de asientos y calcula cuándo salir de casa con el asistente inteligente de llegada (ETA).
              </p>

              {/* Máximo 2 Botones en el Hero */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/passenger"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition"
                >
                  <Navigation className="w-4 h-4 text-white" strokeWidth={1.75} />
                  <span>Ver Mapa en Vivo</span>
                </Link>

                <Link
                  to="/lines"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg border border-slate-300 shadow-sm transition"
                >
                  <Layers className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                  <span>Explorar Líneas</span>
                </Link>
              </div>

              {/* Enlace destacado a Registro Estudiante UPDS */}
              <div className="pt-3 border-t border-slate-200/60 max-w-lg">
                <Link
                  to="/register-student"
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-blue-700 transition group"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" strokeWidth={1.75} />
                  <span>¿Estudiante de la Universidad Privada Domingo Savio?</span>
                  <span className="text-blue-700 font-semibold group-hover:underline flex items-center gap-1">
                    Registra tu perfil estudiantil UPDS <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>

            </div>

            {/* Columna Derecha: Mockup Visual Estilizado (Tailwind Puro) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md space-y-4">
                
                {/* Tarjeta Mockup 1: Micro en Ruta en Vivo */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-md space-y-3 relative z-10 transition hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        L11
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900">
                          Línea 11 · Interno #24
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.75} />
                          <span>Villa 1ro de Mayo ➔ Centro</span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>En ruta</span>
                    </span>
                  </div>

                  {/* Barra de ocupación visual */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Aforo disponible</span>
                      <span className="font-semibold text-slate-800 tabular-nums">16/22 asientos · 6 libres</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full w-[72%]"></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      <span>A <strong className="text-slate-800 font-medium tabular-nums">1.4 km</strong> de ti</span>
                    </div>
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Ruta Campus UPDS
                    </span>
                  </div>
                </div>

                {/* Tarjeta Mockup 2: Asistente ¿Cuándo Salir de Casa? */}
                <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white p-5 rounded-xl shadow-md space-y-3 relative -mt-3 ml-4 sm:ml-8 border border-blue-600/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-200" strokeWidth={1.75} />
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                        Asistente de Salida Inteligente
                      </span>
                    </div>
                    <span className="text-[11px] font-bold bg-emerald-500 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      <span>Sal ahora</span>
                    </span>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="text-2xl font-bold font-display text-white tracking-tight">
                      Llegada en ~4 minutos
                    </div>
                    <p className="text-xs text-blue-100">
                      Línea 11 (Interno #24) a <strong>1.4 km</strong> de tu ubicación. Sal de casa ahora para llegar a tiempo a la parada.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-blue-200 border-t border-blue-600/50 pt-2 font-sans">
                    <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> 6 asientos libres
                    </span>
                    <span className="bg-white/10 px-2 py-0.5 rounded font-medium">
                      Conexión Universitaria UPDS
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Sección Inferior: Bento Grid de 3 Columnas */}
      <section className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xs font-bold text-blue-700 uppercase tracking-widest">
              Tecnología de Transporte Urbano
            </h2>
            <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Diseñado para la vida cotidiana en Santa Cruz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tarjeta 1: Rastreo GPS */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/80 space-y-3 transition hover:border-slate-300">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Navigation className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Rastreo GPS en tiempo real
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Telemetría cinemática y trazado exacto calle por calle en las 60 líneas registradas. Visualiza la posición de las unidades sin saltos ni líneas diagonales.
              </p>
            </div>

            {/* Tarjeta 2: Asistente ETA */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/80 space-y-3 transition hover:border-slate-300">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">
                ¿Cuándo salir de casa? (ETA)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calcula con precisión a cuántos minutos está el micro de tu parada. Evita largas esperas innecesarias bajo el sol o de noche en esquinas solitarias.
              </p>
            </div>

            {/* Tarjeta 3: Perfil Estudiantil UPDS */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/80 space-y-3 transition hover:border-slate-300">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Comunidad Estudiantil UPDS
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Acceso exclusivo para la comunidad universitaria UPDS: personaliza tus líneas favoritas con una estrella, activa la alarma de proximidad a 4 minutos y reporta irregularidades cívicas en tiempo real.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 text-slate-500 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-900">RUTABOL-SCZ</span>
            <span>·</span>
            <span>Red de Transporte Urbano de Santa Cruz de la Sierra</span>
          </div>
          <div className="text-slate-400">
            Universidad Privada Domingo Savio (UPDS) · Santa Cruz
          </div>
        </div>
      </footer>

    </div>
  );
}
