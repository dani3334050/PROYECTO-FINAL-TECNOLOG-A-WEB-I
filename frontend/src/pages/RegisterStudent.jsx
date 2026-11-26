import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Building2, 
  IdCard,
  Camera,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function RegisterStudent() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [codeStudent, setCodeStudent] = useState('');
  const [institution, setInstitution] = useState('Universidad Privada Domingo Savio (UPDS)');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Validación de correo institucional UPDS en tiempo real
  const isUpdsEmail = /^[a-zA-Z0-9._%+-]+@upds\.edu\.bo$/i.test(email.trim());

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Por favor sube una imagen en formato JPG, PNG o WEBP.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validación obligatoria de correo institucional UPDS
    if (!isUpdsEmail) {
      setError('El correo estudiantil debe pertenecer obligatoriamente al dominio institucional @upds.edu.bo.');
      return;
    }

    if (!codeStudent.trim()) {
      setError('El código de estudiante UPDS (codEst) es obligatorio.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('student_type', 'UNIVERSITARIO');
      formData.append('full_name', fullName.trim());
      formData.append('email', email.toLowerCase().trim());
      formData.append('password', password);
      formData.append('phone', phone.trim());
      formData.append('code_student', codeStudent.trim());
      formData.append('institution', institution.trim() || 'Universidad Privada Domingo Savio (UPDS)');
      
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await api.postForm('/auth/register-student', formData);

      if (res.success) {
        setSuccessMsg('¡Registro completado! Perfil de estudiante UPDS activado con éxito.');
        setTimeout(() => {
          navigate('/passenger');
          window.location.reload();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Error al procesar el registro de estudiante.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-7 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-9 shadow-sm">
        
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold tracking-tight mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portal Estudiantil UPDS</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Registro de Estudiante UPDS
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Regístrate con tu correo institucional <strong className="text-blue-700">@upds.edu.bo</strong> para monitorear micros, guardar tus líneas favoritas y activar alertas de proximidad.
          </p>
        </div>

        {/* Mensajes de Alerta */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium animate-in fade-in">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" strokeWidth={1.75} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Nombre Completo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" strokeWidth={1.75} />
                <input
                  type="text"
                  required
                  placeholder="Ej: Daniel Frias Vargas"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Teléfono / WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" strokeWidth={1.75} />
                <input
                  type="text"
                  placeholder="78099881"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Correo Electrónico Institucional UPDS */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Correo UPDS (@upds.edu.bo) *</span>
                {email && (
                  <span className={`text-[10px] font-bold ${isUpdsEmail ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {isUpdsEmail ? '✓ UPDS Válido' : '✗ Debe ser @upds.edu.bo'}
                  </span>
                )}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" strokeWidth={1.75} />
                <input
                  type="email"
                  required
                  placeholder="tu.nombre@upds.edu.bo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-slate-50/50 border rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition ${
                    email
                      ? isUpdsEmail
                        ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'border-rose-400 ring-1 ring-rose-400/30'
                      : 'border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
                  }`}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Contraseña de Acceso *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" strokeWidth={1.75} />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Código de Estudiante UPDS */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Código de Estudiante UPDS (codEst) *
              </label>
              <div className="relative">
                <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" strokeWidth={1.75} />
                <input
                  type="text"
                  required
                  placeholder="Ej: UPDS-2024-8891"
                  value={codeStudent}
                  onChange={(e) => setCodeStudent(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition tabular-nums"
                />
              </div>
            </div>

            {/* Sede Universitaria */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Sede Universitaria
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" strokeWidth={1.75} />
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Subida y Previsualización de Fotografía Facial */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Fotografía Facial de Perfil</span>
              <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                Identificación de estudiante
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              {/* Preview o Avatar */}
              <div className="w-20 h-20 rounded-xl border border-dashed border-slate-300 overflow-hidden flex items-center justify-center bg-white shadow-xs flex-shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-7 h-7 text-slate-400" strokeWidth={1.75} />
                )}
              </div>

              {/* Upload Input */}
              <div className="flex-1 w-full space-y-1 text-center sm:text-left">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition">
                  <Upload className="w-4 h-4 text-blue-600" strokeWidth={1.75} />
                  <span>{photoFile ? 'Cambiar Fotografía' : 'Seleccionar Foto (JPG/PNG)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500">
                  {photoFile ? photoFile.name : 'Sube una foto nítida de tu rostro para asociarla a tu perfil estudiantil.'}
                </p>
              </div>
            </div>
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Registrando Estudiante UPDS...</span>
              </>
            ) : (
              <>
                <span>Registrarme como Estudiante UPDS</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>

        {/* Footer / Login Link */}
        <div className="text-center pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            ¿Ya tienes una cuenta universitaria?{' '}
            <Link to="/login" className="text-blue-700 font-semibold hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
