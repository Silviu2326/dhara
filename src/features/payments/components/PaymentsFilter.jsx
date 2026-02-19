import React, { useState } from 'react';
import { StatusSelect } from './StatusSelect';
import { MethodSelect } from './MethodSelect';
import { SearchBar } from './SearchBar';
import { Calendar, Filter, X, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const PaymentsFilter = ({ filters, onFiltersChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleDateRangeChange = (startDate, endDate) => {
    onFiltersChange({
      ...filters,
      dateRange: { startDate, endDate }
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      method: 'all',
      search: '',
      dateRange: { startDate: null, endDate: null }
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.status !== 'all' ||
      filters.method !== 'all' ||
      filters.search ||
      filters.dateRange?.startDate ||
      filters.dateRange?.endDate
    );
  };

  const formatDateRange = () => {
    const { startDate, endDate } = filters.dateRange || {};
    if (!startDate && !endDate) return 'Seleccionar fechas';
    if (startDate && endDate) {
      return `${format(new Date(startDate), 'dd MMM', { locale: es })} - ${format(new Date(endDate), 'dd MMM', { locale: es })}`;
    }
    if (startDate) {
      return `Desde ${format(new Date(startDate), 'dd MMM yyyy', { locale: es })}`;
    }
    if (endDate) {
      return `Hasta ${format(new Date(endDate), 'dd MMM yyyy', { locale: es })}`;
    }
    return 'Seleccionar fechas';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Filtros principales siempre visibles */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="w-full sm:w-80">
            <SearchBar
              value={filters.search}
              onChange={(value) => handleFilterChange('search', value)}
              placeholder="Buscar por ID, cliente o concepto..."
            />
          </div>
          
          {/* Botón para expandir filtros en móvil */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            <Filter className="h-4 w-4" />
            Filtros
            <ChevronDown className={`h-4 w-4 transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} />
          </button>
        </div>

        {/* Botón limpiar filtros */}
        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Filtros adicionales */}
      <div className={`mt-4 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-6 ${
        isExpanded ? 'block' : 'hidden lg:flex'
      }`}>
        <StatusSelect
          value={filters.status}
          onChange={(value) => handleFilterChange('status', value)}
        />
        
        <MethodSelect
          value={filters.method}
          onChange={(value) => handleFilterChange('method', value)}
        />
        
        {/* Selector de rango de fechas */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Fechas:
          </span>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent min-w-[180px]"
            >
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{formatDateRange()}</span>
              <ChevronDown className="h-4 w-4 text-gray-400 ml-auto" />
            </button>
            
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-[300px]">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={filters.dateRange?.startDate || ''}
                      onChange={(e) => handleDateRangeChange(e.target.value, filters.dateRange?.endDate)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      value={filters.dateRange?.endDate || ''}
                      onChange={(e) => handleDateRangeChange(filters.dateRange?.startDate, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        handleDateRangeChange(null, null);
                        setShowDatePicker(false);
                      }}
                      className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="flex-1 px-3 py-2 text-sm text-white bg-sage rounded-lg hover:bg-sage/90"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Indicador de filtros activos */}
      {hasActiveFilters() && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>Filtros aplicados</span>
          {filters.status !== 'all' && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              Estado: {filters.status}
            </span>
          )}
          {filters.method !== 'all' && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              Método: {filters.method}
            </span>
          )}
          {filters.search && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
              Búsqueda: {filters.search}
            </span>
          )}
        </div>
      )}
    </div>
  );
};