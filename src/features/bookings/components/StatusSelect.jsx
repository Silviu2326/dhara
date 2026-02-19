import React from 'react';
import { Check, Clock, X, AlertTriangle, Calendar, Users } from 'lucide-react';

const STATUS_ICONS = {
  all: Calendar,
  upcoming: Clock,
  completed: Check,
  cancelled: X,
  pending: AlertTriangle,
  no_show: Users
};

const STATUS_COLORS = {
  all: 'bg-gray-100 text-gray-700 border-gray-200',
  upcoming: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  no_show: 'bg-orange-100 text-orange-700 border-orange-200'
};

const STATUS_HOVER_COLORS = {
  all: 'hover:bg-gray-200 hover:border-gray-300',
  upcoming: 'hover:bg-blue-200 hover:border-blue-300',
  completed: 'hover:bg-green-200 hover:border-green-300',
  cancelled: 'hover:bg-red-200 hover:border-red-300',
  pending: 'hover:bg-yellow-200 hover:border-yellow-300',
  no_show: 'hover:bg-orange-200 hover:border-orange-300'
};

const STATUS_SELECTED_COLORS = {
  all: 'bg-gray-200 border-gray-400 shadow-sm',
  upcoming: 'bg-blue-200 border-blue-400 shadow-sm',
  completed: 'bg-green-200 border-green-400 shadow-sm',
  cancelled: 'bg-red-200 border-red-400 shadow-sm',
  pending: 'bg-yellow-200 border-yellow-400 shadow-sm',
  no_show: 'bg-orange-200 border-orange-400 shadow-sm'
};

export const StatusSelect = ({
  statuses = [],
  selectedStatus = 'all',
  onStatusChange,
  loading = false,
  showCounts = true,
  layout = 'horizontal', // 'horizontal' | 'vertical' | 'grid'
  className = ''
}) => {
  const handleStatusClick = (statusValue) => {
    if (loading) return;
    onStatusChange?.(statusValue);
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical':
        return 'flex flex-col space-y-2';
      case 'grid':
        return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2';
      default:
        return 'flex flex-wrap gap-2';
    }
  };

  const getButtonClasses = (status) => {
    const isSelected = selectedStatus === status.value;
    const baseClasses = 'flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (loading) {
      return `${baseClasses} bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed`;
    }
    
    if (isSelected) {
      return `${baseClasses} ${STATUS_SELECTED_COLORS[status.value]} focus:ring-blue-500`;
    }
    
    return `${baseClasses} ${STATUS_COLORS[status.value]} ${STATUS_HOVER_COLORS[status.value]} focus:ring-blue-500 cursor-pointer`;
  };

  if (loading) {
    return (
      <div className={`${getLayoutClasses()} ${className}`}>
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg border bg-gray-100 animate-pulse"
          >
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <div className="w-16 h-4 bg-gray-300 rounded"></div>
            <div className="w-6 h-4 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${getLayoutClasses()} ${className}`} role="tablist">
      {statuses.map((status) => {
        const IconComponent = STATUS_ICONS[status.value] || Calendar;
        const isSelected = selectedStatus === status.value;
        
        return (
          <button
            key={status.value}
            onClick={() => handleStatusClick(status.value)}
            className={getButtonClasses(status)}
            role="tab"
            aria-selected={isSelected}
            aria-label={`Filtrar por ${status.label}${showCounts && status.count !== null ? ` (${status.count} reservas)` : ''}`}
            title={`Filtrar por ${status.label}`}
          >
            <IconComponent className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium text-sm whitespace-nowrap">
              {status.label}
            </span>
            {showCounts && status.count !== null && (
              <span className={`
                inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium
                ${isSelected 
                  ? 'bg-white bg-opacity-80 text-gray-700' 
                  : 'bg-white bg-opacity-60 text-gray-600'
                }
              `}>
                {status.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Preset status configurations
export const BOOKING_STATUS_PRESETS = {
  default: [
    { value: 'all', label: 'Todas', count: null },
    { value: 'upcoming', label: 'Próximas', count: 0 },
    { value: 'completed', label: 'Completadas', count: 0 },
    { value: 'cancelled', label: 'Canceladas', count: 0 },
    { value: 'pending', label: 'Pendientes', count: 0 },
    { value: 'no_show', label: 'No asistió', count: 0 }
  ],
  simple: [
    { value: 'all', label: 'Todas', count: null },
    { value: 'upcoming', label: 'Próximas', count: 0 },
    { value: 'completed', label: 'Completadas', count: 0 },
    { value: 'cancelled', label: 'Canceladas', count: 0 }
  ],
  minimal: [
    { value: 'all', label: 'Todas', count: null },
    { value: 'upcoming', label: 'Próximas', count: 0 },
    { value: 'completed', label: 'Completadas', count: 0 }
  ]
};

// Helper function to update status counts
export const updateStatusCounts = (statuses, bookings) => {
  return statuses.map(status => {
    if (status.value === 'all') {
      return { ...status, count: bookings.length };
    }
    
    const count = bookings.filter(booking => booking.status === status.value).length;
    return { ...status, count };
  });
};