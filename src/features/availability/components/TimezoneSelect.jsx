import React from 'react';
import { Clock, Globe } from 'lucide-react';

const TIMEZONE_OPTIONS = [
  { 
    value: 'Europe/Madrid', 
    label: 'Madrid', 
    offset: '+01:00',
    description: 'Hora Central Europea'
  },
  { 
    value: 'Europe/London', 
    label: 'Londres', 
    offset: '+00:00',
    description: 'Hora de Greenwich'
  },
  { 
    value: 'America/New_York', 
    label: 'Nueva York', 
    offset: '-05:00',
    description: 'Hora del Este'
  },
  { 
    value: 'America/Los_Angeles', 
    label: 'Los Ángeles', 
    offset: '-08:00',
    description: 'Hora del Pacífico'
  },
  { 
    value: 'Asia/Tokyo', 
    label: 'Tokio', 
    offset: '+09:00',
    description: 'Hora de Japón'
  },
  { 
    value: 'Australia/Sydney', 
    label: 'Sídney', 
    offset: '+11:00',
    description: 'Hora del Este de Australia'
  }
];

const getCurrentTime = (timezone) => {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());
  } catch (error) {
    return '--:--';
  }
};

export const TimezoneSelect = ({ 
  value = 'Europe/Madrid',
  onChange,
  showCurrentTime = true,
  className = '' 
}) => {
  const selectedTimezone = TIMEZONE_OPTIONS.find(tz => tz.value === value);
  const currentTime = showCurrentTime ? getCurrentTime(value) : null;

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Globe className="h-4 w-4 inline mr-1" aria-hidden="true" />
        Zona horaria
      </label>
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="
            w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage
            bg-white text-gray-900 appearance-none cursor-pointer
            hover:border-gray-400 transition-colors duration-200
          "
          aria-label="Seleccionar zona horaria"
        >
          {TIMEZONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.offset}) - {option.description}
            </option>
          ))}
        </select>
        
        {/* Icon */}
        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
        
        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Current time display */}
      {showCurrentTime && currentTime && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
          <span>Hora actual: {currentTime}</span>
          {selectedTimezone && (
            <span className="ml-2 text-gray-400">({selectedTimezone.offset})</span>
          )}
        </div>
      )}
    </div>
  );
};