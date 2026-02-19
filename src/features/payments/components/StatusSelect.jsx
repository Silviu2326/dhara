import React from 'react';
import { ChevronDown } from 'lucide-react';

export const StatusSelect = ({ value, onChange }) => {
  const statusOptions = [
    { value: 'all', label: 'Todos los estados', color: 'gray' },
    { value: 'paid', label: 'Pagado', color: 'green' },
    { value: 'refunded', label: 'Reembolsado', color: 'orange' },
    { value: 'pending', label: 'Pendiente', color: 'yellow' },
    { value: 'failed', label: 'Fallido', color: 'red' }
  ];

  const getStatusBadge = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    if (!option || status === 'all') return null;
    
    const colorClasses = {
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
        colorClasses[option.color]
      }`}>
        {option.label}
      </span>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">
        Estado:
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent min-w-[140px]"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {getStatusBadge(value)}
    </div>
  );
};

// Componente auxiliar para mostrar badges de estado
export const StatusBadge = ({ status }) => {
  const statusConfig = {
    paid: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
    refunded: { label: 'Reembolsado', color: 'bg-orange-100 text-orange-800' },
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    failed: { label: 'Fallido', color: 'bg-red-100 text-red-800' },
    processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-800' }
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      config.color
    }`}>
      {config.label}
    </span>
  );
};