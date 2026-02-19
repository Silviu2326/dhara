import React from 'react';

export const QuietHoursPicker = ({ quietHours, onChange }) => {
  const handleEnabledChange = (enabled) => {
    onChange({
      ...quietHours,
      enabled
    });
  };

  const handleStartTimeChange = (startTime) => {
    onChange({
      ...quietHours,
      startTime
    });
  };

  const handleEndTimeChange = (endTime) => {
    onChange({
      ...quietHours,
      endTime
    });
  };

  const formatTimeRange = () => {
    if (!quietHours?.enabled) return 'Desactivado';
    return `${quietHours.startTime} - ${quietHours.endTime}`;
  };

  const getQuietHoursDuration = () => {
    if (!quietHours?.enabled || !quietHours.startTime || !quietHours.endTime) return '';
    
    const start = new Date(`2000-01-01T${quietHours.startTime}:00`);
    const end = new Date(`2000-01-01T${quietHours.endTime}:00`);
    
    // Handle overnight periods
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMinutes === 0) {
      return `(${diffHours}h)`;
    }
    return `(${diffHours}h ${diffMinutes}m)`;
  };

  return (
    <div className="space-y-4">
      {/* Enable/Disable toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h5 className="text-sm font-medium text-gray-900">Activar horario de silencio</h5>
          <p className="text-xs text-gray-500 mt-1">
            No recibir notificaciones durante estas horas
          </p>
          {quietHours?.enabled && (
            <p className="text-xs text-blue-600 mt-1">
              Activo: {formatTimeRange()} {getQuietHoursDuration()}
            </p>
          )}
        </div>
        
        <div className="relative">
          <input
            type="checkbox"
            checked={quietHours?.enabled || false}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="sr-only"
          />
          <div
            onClick={() => handleEnabledChange(!quietHours?.enabled)}
            className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${
              quietHours?.enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ${
                quietHours?.enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Time pickers */}
      {quietHours?.enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🌙 Hora de inicio
            </label>
            <input
              type="time"
              value={quietHours.startTime || '22:00'}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Comenzar período de silencio
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🌅 Hora de fin
            </label>
            <input
              type="time"
              value={quietHours.endTime || '07:00'}
              onChange={(e) => handleEndTimeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Finalizar período de silencio
            </p>
          </div>
        </div>
      )}

      {/* Quick presets */}
      {quietHours?.enabled && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Presets rápidos:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                handleStartTimeChange('22:00');
                handleEndTimeChange('07:00');
              }}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
            >
              Noche (22:00 - 07:00)
            </button>
            <button
              onClick={() => {
                handleStartTimeChange('23:00');
                handleEndTimeChange('08:00');
              }}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200"
            >
              Tarde (23:00 - 08:00)
            </button>
            <button
              onClick={() => {
                handleStartTimeChange('20:00');
                handleEndTimeChange('09:00');
              }}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200"
            >
              Extendido (20:00 - 09:00)
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-blue-800">
            <p className="font-medium">Información sobre horario de silencio:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Las notificaciones importantes seguirán llegando</li>
              <li>Se aplicará a notificaciones push y sonidos</li>
              <li>Los emails no se ven afectados por esta configuración</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};