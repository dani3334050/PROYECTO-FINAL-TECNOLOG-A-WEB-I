import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bus, 
  LogOut, 
  Shield, 
  LayoutDashboard, 
  LogIn, 
  Navigation, 
  Ticket, 
  GraduationCap, 
  School, 
  UserCheck, 
  UserPlus
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Renderiza el badge específico según el rol del usuario autenticado
  const renderRoleBadge = () => {
    if (!user) return null;

    if (user.role === 'SUPERADMIN' || user.role === 'ADMIN' || user.role === 'ADMIN_LINEA') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full whitespace-nowrap">
          <Shield className="w-3 h-3 text-purple-600" />
          <span>Admin</span>
        </span>
      );
    }

    if (user.role === 'CHOFER') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
          <Bus className="w-3 h-3 text-amber-600" />
          <span>Chofer</span>
        </span>
      );
    }

    if (user.role === 'ESTUDIANTE') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
          <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
          <span>Estudiante UPDS</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
        <span>Pasajero</span>
      </span>
    );
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          
          {/* Logo Corporativo Clean Urban Mobility */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-800 transition">
              <Bus className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <span className="font-display font-bold text-base text-slate-900 tracking-tight block leading-tight">
                RUTABOL-SCZ
              </span>
              <span className="hidden sm:block text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Movilidad Santa Cruz
              </span>
            </div>
          </Link>

          {/* Menú de navegación filtrado con indicador activo sutil */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Si NO está autenticado: Solo Inicio, Registro Estudiante e Iniciar Sesión */}
            {!user && (
              <>
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive('/') 
                      ? 'text-blue-700 bg-blue-50 font-bold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Inicio
                </Link>

                <Link
                  to="/register-student"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive('/register-student') 
                      ? 'text-blue-700 bg-blue-50 font-bold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                  <span>Registro Estudiante</span>
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-1.5 rounded-lg transition shadow-sm ml-1"
                >
                  <LogIn className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Iniciar Sesión</span>
                </Link>
              </>
            )}

            {/* Si está autenticado como ESTUDIANTE o PASAJERO */}
            {user && (user.role === 'ESTUDIANTE' || user.role === 'PASAJERO') && (
              <>
                <Link
                  to="/passenger"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive('/passenger')
                      ? 'text-blue-700 bg-blue-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.75} />
                  <span>Mapa en Vivo</span>
                </Link>

                <Link
                  to="/lines"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive('/lines')
                      ? 'text-blue-700 bg-blue-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                  <span>Líneas y Paradas</span>
                </Link>
              </>
            )}

            {/* Si está autenticado como CHOFER */}
            {user && user.role === 'CHOFER' && (
              <Link
                to="/driver"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive('/driver')
                    ? 'text-amber-800 bg-amber-50 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
                <span>Panel de Conducción</span>
              </Link>
            )}

            {/* Si está autenticado como ADMINISTRADOR */}
            {user && (user.role === 'SUPERADMIN' || user.role === 'ADMIN' || user.role === 'ADMIN_LINEA') && (
              <>
                <Link
                  to="/passenger"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive('/passenger')
                      ? 'text-blue-700 bg-blue-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.75} />
                  <span>Mapa</span>
                </Link>

                <Link
                  to="/lines"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive('/lines')
                      ? 'text-blue-700 bg-blue-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                  <span>Líneas</span>
                </Link>

                <Link
                  to="/superadmin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive('/superadmin')
                      ? 'text-purple-700 bg-purple-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-purple-600" strokeWidth={1.75} />
                  <span>Administración</span>
                </Link>
              </>
            )}

            {/* Perfil del usuario compacto de una sola línea */}
            {user && (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 ml-1 sm:ml-2 border-l border-slate-200">
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-lg whitespace-nowrap">
                  {user.studentProfile?.photo_url ? (
                    <img
                      src={user.studentProfile.photo_url}
                      alt={user.full_name}
                      className="w-6 h-6 rounded-full object-cover border border-slate-300 shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <span className="hidden md:inline-block text-xs font-medium text-slate-800 max-w-[120px] truncate">
                    {user.full_name?.split(' ')[0]}
                  </span>

                  {renderRoleBadge()}
                </div>

                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            )}

          </nav>

        </div>
      </div>
    </header>
  );
}
