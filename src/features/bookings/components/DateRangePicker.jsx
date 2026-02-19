import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

const QUICK_RANGES = [
  {
    label: 'Hoy',
    getValue: () => {
      const today = new Date().toISOString().split('T')[0];
      return { start: today, end: today };
    }
  },
  {
    label: 'Esta semana',
    getValue: () => {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0]
      };
    }
  },
  {
    label: 'Este mes',
    getValue: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0]
      };
    }
  },
  {
    label: 'Últimos 7 días',
    getValue: () => {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      return {
        start: sevenDaysAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    }
  },
  {
    label: 'Últimos 30 días',
    getValue: () => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return {
        start: thirtyDaysAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    }
  },
  {
    label: 'Próximos 7 días',
    getValue: () => {
      const today = new Date();
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 7);
      return {
        start: today.toISOString().split('T')[0],
        end: sevenDaysLater.toISOString().split('T')[0]
      };
    }
  }
];

const formatDateRange = (range) => {
  if (!range.start && !range.end) return 'Seleccionar fechas';
  if (range.start && !range.end) return `Desde ${formatDate(range.start)}`;
  if (!range.start && range.end) return `Hasta ${formatDate(range.end)}`;
  if (range.start === range.end) return formatDate(range.start);
  return `${formatDate(range.start)} - ${formatDate(range.end)}`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const DateRangePicker = ({
  value = { start: '', end: '' },
  onChange,
  loading = false,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localRange, setLocalRange] = useState(value);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update local range when value prop changes
  useEffect(() => {
    setLocalRange(value);
  }, [value]);

  const handleQuickRangeSelect = (range) => {
    const newRange = range.getValue();
    setLocalRange(newRange);
    onChange?.(newRange);
    setIsOpen(false);
  };

  const handleDateChange = (field, dateValue) => {
    const newRange = { ...localRange, [field]: dateValue };
    
    // Validate date range
    if (newRange.start && newRange.end && newRange.start > newRange.end) {
      // If start date is after end date, adjust accordingly
      if (field === 'start') {
        newRange.end = newRange.start;
      } else {
        newRange.start = newRange.end;
      }
    }
    
    setLocalRange(newRange);
    onChange?.(newRange);
  };

  const clearRange = (e) => {
    e.stopPropagation();
    const clearedRange = { start: '', end: '' };
    setLocalRange(clearedRange);
    onChange?.(clearedRange);
  };

  const hasValue = localRange.start || localRange.end;

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-left
          border border-gray-300 rounded-md shadow-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200
          ${disabled || loading ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className={`truncate ${
            hasValue ? 'text-gray-900' : 'text-gray-500'
          }`}>
            {loading ? 'Cargando...' : formatDateRange(localRange)}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0">
          {hasValue && !disabled && !loading && (
            <button
              onClick={clearRange}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Limpiar fechas"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg"
        >
          <div className="p-4 space-y-4">
            {/* Quick ranges */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Rangos rápidos</h4>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_RANGES.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickRangeSelect(range)}
                    className="px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom date inputs */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Fechas personalizadas</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={localRange.start}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={localRange.end}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    min={localRange.start}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <button
                onClick={clearRange}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};