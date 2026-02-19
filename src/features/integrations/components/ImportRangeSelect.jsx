import React from 'react';

const IMPORT_RANGES = [
  { value: 'future', label: 'Solo eventos futuros', description: 'Importar únicamente eventos que aún no han ocurrido' },
  { value: 'past7', label: 'Últimos 7 días + futuros', description: 'Eventos de los últimos 7 días y todos los futuros' },
  { value: 'past30', label: 'Últimos 30 días + futuros', description: 'Eventos de los últimos 30 días y todos los futuros' },
  { value: 'past90', label: 'Últimos 90 días + futuros', description: 'Eventos de los últimos 90 días y todos los futuros' },
  { value: 'all', label: 'Todos los eventos', description: 'Importar todos los eventos disponibles (puede ser lento)' }
];

export const ImportRangeSelect = ({ value, onChange }) => {
  const selectedRange = IMPORT_RANGES.find(range => range.value === value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Rango de importación
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {IMPORT_RANGES.map((range) => (
          <option key={range.value} value={range.value}>
            {range.label}
          </option>
        ))}
      </select>
      {selectedRange && (
        <p className="text-xs text-gray-500">
          {selectedRange.description}
        </p>
      )}
    </div>
  );
};