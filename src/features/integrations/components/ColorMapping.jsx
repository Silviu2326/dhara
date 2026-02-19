import React from 'react';

const CALENDAR_COLORS = [
  { id: 'red', name: 'Rojo', color: '#ef4444' },
  { id: 'orange', name: 'Naranja', color: '#f97316' },
  { id: 'yellow', name: 'Amarillo', color: '#eab308' },
  { id: 'green', name: 'Verde', color: '#22c55e' },
  { id: 'blue', name: 'Azul', color: '#3b82f6' },
  { id: 'purple', name: 'Morado', color: '#a855f7' },
  { id: 'pink', name: 'Rosa', color: '#ec4899' },
  { id: 'gray', name: 'Gris', color: '#6b7280' }
];

const SESSION_TYPES = [
  { id: 'consultation', name: 'Consulta' },
  { id: 'therapy', name: 'Terapia' },
  { id: 'workshop', name: 'Taller' },
  { id: 'meeting', name: 'Reunión' },
  { id: 'personal', name: 'Personal' },
  { id: 'blocked', name: 'Tiempo bloqueado' }
];

export const ColorMapping = ({ value, onChange }) => {
  const handleMappingChange = (colorId, sessionType) => {
    const newMapping = { ...value };
    if (sessionType === '') {
      delete newMapping[colorId];
    } else {
      newMapping[colorId] = sessionType;
    }
    onChange(newMapping);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mapeo de colores a tipos de sesión
        </label>
        <p className="text-xs text-gray-500 mb-4">
          Asocia los colores de tu calendario externo con tipos de sesión en Dhara
        </p>
      </div>

      <div className="space-y-3">
        {CALENDAR_COLORS.map((color) => (
          <div key={color.id} className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 w-24">
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: color.color }}
              />
              <span className="text-sm text-gray-700">{color.name}</span>
            </div>
            
            <div className="flex-1">
              <select
                value={value[color.id] || ''}
                onChange={(e) => handleMappingChange(color.id, e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sin mapear</option>
                {SESSION_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded-md">
        <div className="flex items-start space-x-2">
          <svg className="h-4 w-4 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="text-xs text-yellow-700">
            Los eventos sin mapeo de color se importarán como "Tiempo bloqueado" por defecto.
          </div>
        </div>
      </div>
    </div>
  );
};