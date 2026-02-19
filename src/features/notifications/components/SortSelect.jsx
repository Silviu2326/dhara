import React, { useState } from 'react';
import {
  Clock,
  Clock3,
  Star,
  Folder,
  Eye
} from 'lucide-react';

const sortOptions = [
  { value: 'date_desc', label: 'Más recientes', icon: Clock },
  { value: 'date_asc', label: 'Más antiguas', icon: Clock3 },
  { value: 'importance', label: 'Por importancia', icon: Star },
  { value: 'type', label: 'Por tipo', icon: Folder },
  { value: 'read_status', label: 'Por estado', icon: Eye }
];

export const SortSelect = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = sortOptions.find(option => option.value === value) || sortOptions[0];

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Ordenar notificaciones"
      >
        <div className="flex items-center gap-2">
          <selectedOption.icon className="w-4 h-4" />
          <span className="text-gray-900">{selectedOption.label}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            <ul role="listbox" className="py-1">
              {sortOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                      value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                    role="option"
                    aria-selected={value === option.value}
                  >
                    <option.icon className="w-4 h-4" />
                    <span>{option.label}</span>
                    {value === option.value && (
                      <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};