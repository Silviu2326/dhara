import React, { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, BookOpen, Loader2 } from "lucide-react";

const DictionaryScreen = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [terapias, setTerapias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar el JSON de terapias
  useEffect(() => {
    const cargarTerapias = async () => {
      try {
        setLoading(true);
        // Intentar cargar desde la raíz del proyecto
        const response = await fetch('/terapias.json');
        if (!response.ok) {
          throw new Error('No se pudo cargar el diccionario de terapias');
        }
        const data = await response.json();
        setTerapias(data.terapias || []);
      } catch (err) {
        console.error('Error cargando terapias:', err);
        setError(err.message);
        // Datos de respaldo mínimos para que la app no se rompa
        setTerapias([]);
      } finally {
        setLoading(false);
      }
    };

    cargarTerapias();
  }, []);

  // Filtrar terapias según el término de búsqueda
  const filteredTerapias = terapias.filter((terapia) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      terapia.nombre?.toLowerCase().includes(searchLower) ||
      terapia.descripcion_corta?.toLowerCase().includes(searchLower) ||
      terapia.que_trata?.toLowerCase().includes(searchLower) ||
      terapia.definicion?.toLowerCase().includes(searchLower) ||
      terapia.fundamento?.toLowerCase().includes(searchLower)
    );
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Función para resaltar el término de búsqueda en el texto
  const highlightText = (text, search) => {
    if (!search || !text) return text;
    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <span key={index} className="bg-yellow-200 text-deep">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-sage animate-spin mx-auto mb-4" />
          <p className="text-muted">Cargando diccionario de terapias...</p>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error && terapias.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error al cargar el diccionario</h2>
          <p className="text-red-500">{error}</p>
          <p className="text-sm text-red-400 mt-2">
            Asegúrate de que el archivo terapias.json esté en la carpeta public
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-deep mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-sage" />
          Diccionario de Terapias
        </h1>
        <p className="text-muted">
          Explora {terapias.length} terapias y tratamientos alternativas. 
          Encuentra información sobre sus beneficios, contraindicaciones y cómo funcionan.
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción, síntomas o beneficios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-deep placeholder-gray-400"
          />
        </div>
      </div>

      {/* Contador de resultados */}
      {searchTerm && (
        <div className="mb-4 text-sm text-muted">
          {filteredTerapias.length} {filteredTerapias.length === 1 ? "resultado" : "resultados"} encontrados
        </div>
      )}

      {/* Lista de terapias */}
      <div className="space-y-4">
        {filteredTerapias.length > 0 ? (
          filteredTerapias.map((terapia) => (
            <div
              key={terapia.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              {/* Header de la terapia (siempre visible) */}
              <button
                onClick={() => toggleExpand(terapia.id)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-medium text-sage bg-sage/10 px-2 py-1 rounded-full">
                      #{terapia.id}
                    </span>
                    <h3 className="text-lg font-bold text-deep">
                      {highlightText(terapia.nombre, searchTerm)}
                    </h3>
                  </div>
                  <p className="text-sm text-muted">
                    {highlightText(terapia.descripcion_corta, searchTerm)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {expandedId === terapia.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Contenido expandido */}
              {expandedId === terapia.id && (
                <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50/50">
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Definición */}
                    {terapia.definicion && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-semibold text-deep mb-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-sage rounded-full"></span>
                          Definición
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {highlightText(terapia.definicion, searchTerm)}
                        </p>
                      </div>
                    )}

                    {/* Fundamento */}
                    {terapia.fundamento && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-semibold text-deep mb-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-sage rounded-full"></span>
                          Fundamento
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {highlightText(terapia.fundamento, searchTerm)}
                        </p>
                      </div>
                    )}

                    {/* Qué trata */}
                    {terapia.que_trata && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-semibold text-deep mb-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-sage rounded-full"></span>
                          ¿Qué trata?
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {highlightText(terapia.que_trata, searchTerm)}
                        </p>
                      </div>
                    )}

                    {/* Público recomendado */}
                    {terapia.publico_recomendado && (
                      <div>
                        <h4 className="text-sm font-semibold text-deep mb-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-sage rounded-full"></span>
                          Público recomendado
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {terapia.publico_recomendado}
                        </p>
                      </div>
                    )}

                    {/* Contraindicaciones */}
                    {terapia.contraindicaciones && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-600 mb-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          Contraindicaciones
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {terapia.contraindicaciones}
                        </p>
                      </div>
                    )}

                    {/* Cómo es una sesión */}
                    {terapia.como_es_una_sesion && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-semibold text-deep mb-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-sage rounded-full"></span>
                          ¿Cómo es una sesión?
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {terapia.como_es_una_sesion}
                        </p>
                      </div>
                    )}

                    {/* Terapias complementarias */}
                    {terapia.complementaria_con && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-semibold text-deep mb-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-sage rounded-full"></span>
                          Terapias complementarias
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {terapia.complementaria_con}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-deep mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-muted">
              Intenta con otros términos como "ansiedad", "dolor", "estrés" o el nombre de una terapia específica.
            </p>
          </div>
        )}
      </div>

      {/* Footer con información */}
      <div className="mt-8 text-center text-sm text-muted">
        <p>
          Base de datos con {terapias.length} terapias alternativas • 
          Fuente: Diccionario Dhara Terapeutas
        </p>
      </div>
    </div>
  );
};

export default DictionaryScreen;
