import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Bus, 
  MapPin, 
  Navigation, 
  ArrowRight, 
  Layers, 
  RefreshCw, 
  Search, 
  X,
  Star
} from 'lucide-react';

export default function LinesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [tab, setTab] = useState('ALL'); // 'ALL' | 'FAVORITES'

  const fetchLines = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fleet/lines');
      if (res.success) {
        setLines(res.lines || []);
      }
    } catch (err) {
      console.error('Error al cargar líneas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      if (user) {
        const res = await api.get('/fleet/favorites');
        if (res.success && Array.isArray(res.favorites)) {
          setFavorites(res.favorites);
          return;
        }
      }
      const cached = JSON.parse(localStorage.getItem('rutabol_guest_favs') || '[]');
      setFavorites(cached);
    } catch (e) {
      const cached = JSON.parse(localStorage.getItem('rutabol_guest_favs') || '[]');
      setFavorites(cached);
    }
  };

  useEffect(() => {
    fetchLines();
    fetchFavorites();
  }, []);

  // Sincronizar favoritas cuando el usuario autenticado cargue
  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const handleToggleFavorite = async (lineNumber, e) => {
    if (e) e.stopPropagation();
    const strLine = String(lineNumber);

    // Actualización visual inmediata optimista
    setFavorites((prev) => {
      const exists = prev.includes(strLine);
      const updated = exists ? prev.filter((x) => x !== strLine) : [...prev, strLine];
      localStorage.setItem('rutabol_guest_favs', JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        const res = await api.post('/fleet/favorites/toggle', { line_number: strLine });
        if (res.success && Array.isArray(res.favorites)) {
          setFavorites(res.favorites);
        }
      } catch (err) {
        console.error('Error al alternar favorita:', err);
      }
    }
  };

  const handleSelectLine = (lineNumber) => {
    navigate(`/passenger?line=${lineNumber}`);
  };

  // Formateador de nombres limpios sin duplicación de "Línea X"
  const formatLineDisplayName = (line) => {
    if (!line || !line.name) return `Línea ${line?.line_number || ''}`;
    return line.name.replace(/^Línea\s+\d+\s*[-—–]\s*/i, '').trim();
  };

  const filteredLines = lines
    .filter((l) => (tab === 'FAVORITES' ? favorites.includes(String(l.line_number)) : true))
    .filter((l) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        String(l.line_number).includes(term) ||
        (l.name && l.name.toLowerCase().includes(term)) ||
        (l.origin_name && l.origin_name.toLowerCase().includes(term)) ||
        (l.destination_name && l.destination_name.toLowerCase().includes(term))
      );
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* Cabecera Limpia */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 sm:p-6 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Catálogo de Líneas de Transporte
            </h1>
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
              {lines.length} Líneas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Red completa de transporte urbano de Santa Cruz de la Sierra. Selecciona una línea para visualizar su recorrido en el mapa.
          </p>
        </div>

        {/* Buscador, Pestañas y Actualizar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pestañas de Filtro (Punto 2) */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setTab('ALL')}
              className={`px-3 py-1.5 rounded-md transition ${
                tab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas ({lines.length})
            </button>
            <button
              onClick={() => setTab('FAVORITES')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                tab === 'FAVORITES'
                  ? 'bg-white text-amber-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Star className={`w-3 h-3 ${favorites.length > 0 ? 'fill-amber-400 text-amber-500' : ''}`} />
              <span>Favoritas ({favorites.length})</span>
            </button>
          </div>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por número o zona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={fetchLines}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-700' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Catálogo de Tarjetas de Líneas */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 space-y-3">
          <div className="w-7 h-7 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-medium">Cargando 60 líneas de transporte...</p>
        </div>
      ) : filteredLines.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 space-y-2 shadow-xs">
          <p className="font-semibold text-slate-800 text-sm">
            {tab === 'FAVORITES' 
              ? 'No tienes líneas marcadas en tus favoritas' 
              : `No se encontraron líneas que coincidan con "${search}"`}
          </p>
          <button
            onClick={() => {
              setSearch('');
              setTab('ALL');
            }}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Ver todas las líneas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLines.map((line) => {
            const activeMicros = line.active_micros_count || 0;
            const lineColor = line.color || '#1D4ED8';
            const cleanDescription = formatLineDisplayName(line);
            const isFav = favorites.includes(String(line.line_number));

            return (
              <div
                key={line.id}
                onClick={() => handleSelectLine(line.line_number)}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-5 shadow-xs transition-all hover:shadow-sm cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  
                  {/* Encabezado con Badge de Línea y Estrella de Favoritas */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0"
                        style={{ backgroundColor: lineColor }}
                      >
                        L{line.line_number}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-blue-700 transition">
                          Línea {line.line_number}
                        </h3>
                        <span className="text-xs text-slate-500 font-medium tabular-nums">
                          {line.distance_km ? `${line.distance_km} km de recorrido` : 'Ruta Urbana'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(line.line_number, e)}
                        className={`p-1.5 rounded-lg border transition ${
                          isFav
                            ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-amber-500 hover:border-amber-200'
                        }`}
                        title={isFav ? 'Quitar de favoritas' : 'Guardar en favoritas'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                      </button>

                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        activeMicros > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {activeMicros > 0 ? `${activeMicros} en ruta` : 'En terminal'}
                      </span>
                    </div>
                  </div>

                  {/* Nombre descriptivo del recorrido */}
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {cleanDescription}
                  </p>

                  {/* Paradas Salida / Llegada */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 space-y-1.5 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0"></span>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Salida</span>
                        <span className="text-slate-800 font-medium truncate block">{line.origin_name || 'Terminal de Salida'}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0"></span>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Llegada</span>
                        <span className="text-slate-800 font-medium truncate block">{line.destination_name || 'Destino Final'}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Botón de acción */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700 group-hover:text-blue-800">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Ver mapa y micros</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
