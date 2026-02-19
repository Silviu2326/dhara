import React, { useState } from 'react';
import { TypeSelect } from './TypeSelect';
import { DateRangePicker } from './DateRangePicker';
import { SearchBar } from './SearchBar';
import { SortSelect } from './SortSelect';

export const NotificationsFilter = ({ filters, onFiltersChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleDateRangeChange = (dateRange) => {
    onFiltersChange({ ...filters, ...dateRange });
  };

  const clearFilters = () => {
    onFiltersChange({
      type: 'all',
      search: '',
      startDate: null,
      endDate: null,
      sortBy: 'date_desc'
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.type !== 'all' ||
      filters.search ||
      filters.startDate ||
      filters.endDate ||
      filters.sortBy !== 'date_desc'
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      {/* Mobile toggle button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
        >
          <span className="text-sm font-medium text-gray-700">
            Filtros {hasActiveFilters() && '(activos)'}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filters content */}
      <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        {/* Search bar - always visible on top */}
        <div className="w-full">
          <SearchBar
            value={filters.search}
            onChange={(value) => handleFilterChange('search', value)}
            placeholder="Buscar en notificaciones..."
          />
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Type filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <TypeSelect
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
            />
          </div>

          {/* Date range filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <DateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={handleDateRangeChange}
            />
          </div>

          {/* Sort filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordenar
            </label>
            <SortSelect
              value={filters.sortBy}
              onChange={(value) => handleFilterChange('sortBy', value)}
            />
          </div>

          {/* Clear filters button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters()}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar
            </button>
          </div>
        </div>

        {/* Active filters summary */}
        {hasActiveFilters() && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">Filtros activos:</span>
            
            {filters.type !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Tipo: {filters.type}
                <button
                  onClick={() => handleFilterChange('type', 'all')}
                  className="ml-1 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Búsqueda: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1 hover:text-green-600"
                >
                  ×
                </button>
              </span>
            )}
            
            {(filters.startDate || filters.endDate) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Fechas
                <button
                  onClick={() => handleDateRangeChange({ startDate: null, endDate: null })}
                  className="ml-1 hover:text-purple-600"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.sortBy !== 'date_desc' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                Orden: {filters.sortBy}
                <button
                  onClick={() => handleFilterChange('sortBy', 'date_desc')}
                  className="ml-1 hover:text-orange-600"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};