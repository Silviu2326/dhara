import React from 'react';

const EVENT_TYPE_OPTIONS = [
  {
    value: 'busy',
    label: 'Solo eventos ocupados',
    description: 'Importar únicamente eventos que marquen tiempo como ocupado'
  },
  {
    value: 'all',
    label: 'Todos los eventos',
    description: 'Importar todos los eventos, incluyendo los que no marcan tiempo ocupado'
  }
];

export const EventTypeSwitches = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Tipos de eventos a importar
      </label>
      
      <div className="space-y-3">
        {EVENT_TYPE_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="eventTypes"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {option.label}
              </div>
              <div className="text-xs text-gray-500">
                {option.description}
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex items-start space-x-2">
          <svg className="h-4 w-4 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-blue-700">
            <strong>Recomendación:</strong> Selecciona "Solo eventos ocupados" para evitar conflictos con eventos informativos o recordatorios.
          </div>
        </div>
      </div>
    </div>
  );
};