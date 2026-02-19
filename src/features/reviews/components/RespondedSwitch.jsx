import React from 'react';

export const RespondedSwitch = ({ value, onChange }) => {
  const options = [
    { value: 'all', label: 'Todas' },
    { value: 'responded', label: 'Con respuesta' },
    { value: 'pending', label: 'Sin respuesta' }
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">
        Estado:
      </span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              value === option.value
                ? 'bg-white text-sage shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};