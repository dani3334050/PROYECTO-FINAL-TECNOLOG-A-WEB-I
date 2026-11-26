import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import PassengerHome from './pages/PassengerHome';
import LinesList from './pages/LinesList';
import DriverPanel from './pages/DriverPanel';
import MyTickets from './pages/MyTickets';
import RegisterStudent from './pages/RegisterStudent';
import SuperadminDashboard from './pages/SuperadminDashboard';
import LineAdminDashboard from './pages/LineAdminDashboard';
import Login from './pages/Login';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'SUPERADMIN' || user.role === 'ADMIN' || user.role === 'ADMIN_LINEA') return <Navigate to="/superadmin" replace />;
    if (user.role === 'CHOFER') return <Navigate to="/driver" replace />;
    return <Navigate to="/passenger" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Página Principal / Presentación Corporativa */}
              <Route path="/" element={<LandingPage />} />

              {/* RF-07, RF-06, RF-05: Mapa en Tiempo Real, Consulta de Aforo y Pago de Pasaje */}
              <Route path="/passenger" element={<PassengerHome />} />

              {/* Catálogo de Líneas y Trazado de Rutas */}
              <Route path="/lines" element={<LinesList />} />

              {/* RF-05, RF-08, RF-09: Mis Boletos y Pases de Trasbordo Digitales con QR */}
              <Route
                path="/my-tickets"
                element={
                  <ProtectedRoute>
                    <MyTickets />
                  </ProtectedRoute>
                }
              />

              {/* RF-01, RF-06, RF-08, RF-09, RF-10: Panel Conductor en Tiempo Real */}
              <Route
                path="/driver"
                element={
                  <ProtectedRoute allowedRoles={['CHOFER', 'SUPERADMIN', 'ADMIN_LINEA', 'ADMIN']}>
                    <DriverPanel />
                  </ProtectedRoute>
                }
              />

              {/* RF-03: Registro Unificado de Estudiante Universitario UPDS (@upds.edu.bo) */}
              <Route path="/register-student" element={<RegisterStudent />} />

              {/* Acceso Unificado / Login */}
              <Route path="/login" element={<Login />} />

              {/* Panel de Administración Unificado de Red y Flota */}
              <Route
                path="/superadmin"
                element={
                  <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'ADMIN_LINEA']}>
                    <SuperadminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Redirección unificada para compatibilidad */}
              <Route path="/line-admin" element={<Navigate to="/superadmin" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
