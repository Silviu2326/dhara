import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, UserIcon, UserMinusIcon, BeakerIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  {
    value: 'all',
    label: 'Todos los estados',
    icon: UserIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    count: null
  },
  {
    value: 'active',
    label: 'Activo',
    icon: UserIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Clientes con sesiones recientes'
  },
  {
    value: 'inactive',
    label: 'Inactivo',
    icon: UserMinusIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    description: 'Sin sesiones en los últimos 30 días'
  },
  {
    value: 'demo',
    label: 'Demo',
    icon: BeakerIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Clientes de prueba'
  }
];

export const StatusSelect = ({ 
  value = 'all', 
  onChange, 
  showCounts = false, 
  counts = {} 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = STATUS_OPTIONS.find(option => option.value === value) || STATUS_OPTIONS[0];
  const SelectedIcon = selectedOption.icon;

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
      >
        <div className="flex items-center gap-2">
          <SelectedIcon className={`h-4 w-4 ${selectedOption.color}`} />
          <span className="block truncate text-sm font-medium">
            {selectedOption.label}
          </span>
          {showCounts && counts[value] !== undefined && (
            <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${selectedOption.bgColor} ${selectedOption.color}`}>
              {counts[value]}
            </span>
          )}
        </div>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          {STATUS_OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = option.value === value;
            
            return (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between group ${
                  isSelected ? 'bg-primary bg-opacity-5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <OptionIcon className={`h-4 w-4 ${option.color}`} />
                  <div>
                    <div className={`text-sm font-medium ${
                      isSelected ? 'text-primary' : 'text-gray-900'
                    }`}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
                
                {showCounts && counts[option.value] !== undefined && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    isSelected 
                      ? 'bg-primary bg-opacity-10 text-primary' 
                      : `${option.bgColor} ${option.color}`
                  }`}>
                    {counts[option.value]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Hook para obtener conteos de estado
export const useStatusCounts = (clients = []) => {
  const counts = {
    all: clients.length,
    active: clients.filter(client => client.status === 'active').length,
    inactive: clients.filter(client => client.status === 'inactive').length,
    demo: clients.filter(client => client.status === 'demo').length
  };
  
  return counts;
};

// Utilidad para determinar el estado de un cliente
export const getClientStatus = (client) => {
  if (client.isDemo) return 'demo';
  
  const lastSessionDate = client.lastSession ? new Date(client.lastSession) : null;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  if (!lastSessionDate || lastSessionDate < thirtyDaysAgo) {
    return 'inactive';
  }
  
  return 'active';
};