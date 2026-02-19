import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, Bars3BottomLeftIcon, CalendarIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';

const SORT_OPTIONS = [
  {
    value: 'name_asc',
    label: 'Nombre A-Z',
    icon: Bars3BottomLeftIcon,
    description: 'Ordenar alfabéticamente'
  },
  {
    value: 'name_desc',
    label: 'Nombre Z-A',
    icon: Bars3BottomLeftIcon,
    description: 'Ordenar alfabéticamente inverso'
  },
  {
    value: 'last_session_desc',
    label: 'Última sesión (Reciente)',
    icon: CalendarIcon,
    description: 'Más recientes primero'
  },
  {
    value: 'last_session_asc',
    label: 'Última sesión (Antigua)',
    icon: CalendarIcon,
    description: 'Más antiguos primero'
  },
  {
    value: 'session_count_desc',
    label: 'Más sesiones',
    icon: ChartBarIcon,
    description: 'Mayor número de sesiones'
  },
  {
    value: 'session_count_asc',
    label: 'Menos sesiones',
    icon: ChartBarIcon,
    description: 'Menor número de sesiones'
  },
  {
    value: 'created_desc',
    label: 'Más recientes',
    icon: ClockIcon,
    description: 'Clientes agregados recientemente'
  },
  {
    value: 'created_asc',
    label: 'Más antiguos',
    icon: ClockIcon,
    description: 'Clientes agregados hace tiempo'
  }
];

export const SortSelect = ({ value = 'name_asc', onChange }) => {
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

  const selectedOption = SORT_OPTIONS.find(option => option.value === value) || SORT_OPTIONS[0];
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
          <SelectedIcon className="h-4 w-4 text-gray-400" />
          <span className="block truncate text-sm font-medium">
            {selectedOption.label}
          </span>
        </div>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          {SORT_OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = option.value === value;
            
            return (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3 ${
                  isSelected ? 'bg-primary bg-opacity-5' : ''
                }`}
              >
                <OptionIcon className="h-4 w-4 text-gray-400" />
                <div>
                  <div className={`text-sm font-medium ${
                    isSelected ? 'text-primary' : 'text-gray-900'
                  }`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {option.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Función utilitaria para aplicar ordenamiento
export const sortClients = (clients, sortValue) => {
  const sortedClients = [...clients];
  
  switch (sortValue) {
    case 'name_asc':
      return sortedClients.sort((a, b) => a.name.localeCompare(b.name));
    
    case 'name_desc':
      return sortedClients.sort((a, b) => b.name.localeCompare(a.name));
    
    case 'last_session_desc':
      return sortedClients.sort((a, b) => {
        const dateA = a.lastSession ? new Date(a.lastSession) : new Date(0);
        const dateB = b.lastSession ? new Date(b.lastSession) : new Date(0);
        return dateB - dateA;
      });
    
    case 'last_session_asc':
      return sortedClients.sort((a, b) => {
        const dateA = a.lastSession ? new Date(a.lastSession) : new Date(0);
        const dateB = b.lastSession ? new Date(b.lastSession) : new Date(0);
        return dateA - dateB;
      });
    
    case 'session_count_desc':
      return sortedClients.sort((a, b) => (b.sessionCount || 0) - (a.sessionCount || 0));
    
    case 'session_count_asc':
      return sortedClients.sort((a, b) => (a.sessionCount || 0) - (b.sessionCount || 0));
    
    case 'created_desc':
      return sortedClients.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
    
    case 'created_asc':
      return sortedClients.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateA - dateB;
      });
    
    default:
      return sortedClients;
  }
};