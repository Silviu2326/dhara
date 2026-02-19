import React, { useState } from 'react';
import { Download, FileText, Table, Loader } from 'lucide-react';

export const ExportButtons = ({ 
  onExportCSV, 
  onExportPDF, 
  filters,
  totalRecords = 0,
  disabled = false 
}) => {
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      await onExportCSV(filters);
    } finally {
      setExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      await onExportPDF(filters);
    } finally {
      setExportingPDF(false);
    }
  };

  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (filters.status && filters.status !== 'all') {
      activeFilters.push(`Estado: ${filters.status}`);
    }
    if (filters.method && filters.method !== 'all') {
      activeFilters.push(`Método: ${filters.method}`);
    }
    if (filters.search) {
      activeFilters.push(`Búsqueda: "${filters.search}"`);
    }
    if (filters.dateRange?.startDate || filters.dateRange?.endDate) {
      const { startDate, endDate } = filters.dateRange;
      if (startDate && endDate) {
        activeFilters.push(`Fechas: ${startDate} - ${endDate}`);
      } else if (startDate) {
        activeFilters.push(`Desde: ${startDate}`);
      } else if (endDate) {
        activeFilters.push(`Hasta: ${endDate}`);
      }
    }
    
    return activeFilters;
  };

  const filterSummary = getFilterSummary();
  const hasFilters = filterSummary.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Información */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            Exportar datos
          </h3>
          <div className="text-sm text-gray-600">
            <p>{totalRecords} registro{totalRecords !== 1 ? 's' : ''} disponible{totalRecords !== 1 ? 's' : ''}</p>
            {hasFilters && (
              <div className="mt-1">
                <p className="text-xs text-gray-500">Filtros aplicados:</p>
                <ul className="text-xs text-gray-500 mt-1">
                  {filterSummary.map((filter, index) => (
                    <li key={index}>• {filter}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Botones de exportación */}
        <div className="flex items-center gap-3">
          {/* Exportar CSV */}
          <button
            onClick={handleExportCSV}
            disabled={disabled || exportingCSV || totalRecords === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            title="Exportar datos en formato CSV"
          >
            {exportingCSV ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Table className="h-4 w-4" />
            )}
            {exportingCSV ? 'Exportando...' : 'CSV'}
          </button>

          {/* Exportar PDF */}
          <button
            onClick={handleExportPDF}
            disabled={disabled || exportingPDF || totalRecords === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            title="Exportar resumen en formato PDF"
          >
            {exportingPDF ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {exportingPDF ? 'Generando...' : 'PDF Resumen'}
          </button>

          {/* Botón de descarga general */}
          <div className="relative group">
            <button
              disabled={disabled || totalRecords === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
              title="Más opciones de exportación"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            
            {/* Tooltip con información */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              <div className="space-y-1">
                <div>CSV: Datos completos para análisis</div>
                <div>PDF: Resumen ejecutivo</div>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      {totalRecords === 0 && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            No hay datos para exportar. Ajusta los filtros para mostrar resultados.
          </p>
        </div>
      )}

      {totalRecords > 1000 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> La exportación incluye un máximo de 1000 registros. 
            Para exportar más datos, aplica filtros más específicos.
          </p>
        </div>
      )}
    </div>
  );
};