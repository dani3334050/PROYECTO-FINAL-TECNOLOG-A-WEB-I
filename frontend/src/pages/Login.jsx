import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bus, 
  Lock, 
  Mail, 
  ArrowRight, 
  GraduationCap
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRedirectByRole = (role) => {
    if (role === 'SUPERADMIN' || role === 'ADMIN' || role === 'ADMIN_LINEA') {
      navigate('/superadmin');
    } else if (role === 'CHOFER') {
      navigate('/driver');
    } else {
      navigate('/passenger');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await login(email, password);
      if (res.success) {
        handleRedirectByRole(res.user.role);
      }
    } catch (err) {
      setError(err.message || 'Credenciales inválidas. Verifique su correo o contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50 font-sans">
      <div className="max-w-md w-full space-y-6">
        
        {/* Encabezado Limpio */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 shadow-xs">
            <Bus className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Iniciar Sesión
          </h2>
          <p className="text-xs text-slate-500">
            Ingresa a tu cuenta en la red RUTABOL-SCZ
          </p>
        </div>

        {/* Formulario Principal Limpio */}
        <div className="bg-white border border-slate-200/90 p-6 sm:p-8 rounded-xl shadow-xs space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej: usuario@correo.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-700 pl-9 transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" strokeWidth={1.75} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-700 pl-9 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" strokeWidth={1.75} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Ingresar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Enlaces de Registro */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              ¿Eres estudiante de la UPDS?{' '}
              <Link to="/register-student" className="text-blue-700 font-semibold hover:underline inline-flex items-center gap-1">
                <span>Registra tu cuenta</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
