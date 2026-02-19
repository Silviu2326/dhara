import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { Button } from '../../../components/Button';

const AVAILABLE_THERAPIES = [
  'Terapia Cognitivo-Conductual (CBT)',
  'EMDR',
  'Mindfulness',
  'Terapia Gestalt',
  'Terapia Sistémica',
  'Psicoanálisis',
  'Terapia Humanista',
  'Terapia de Pareja',
  'Terapia Familiar',
  'Terapia de Grupo',
  'Hipnoterapia',
  'Terapia Breve',
  'Terapia Narrativa',
  'Terapia Dialéctica Conductual (DBT)',
  'Terapia de Aceptación y Compromiso (ACT)',
  'Terapia Interpersonal',
  'Neuropsicología',
  'Psicología Infantil',
  'Psicología del Deporte',
  'Coaching Psicológico'
];

export const TherapiesSelect = ({ selectedTherapies = [], onChange, isEditing = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customTherapy, setCustomTherapy] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredTherapies = AVAILABLE_THERAPIES.filter(therapy => 
    therapy.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTherapies.includes(therapy)
  );

  const handleAddTherapy = (therapy) => {
    if (!selectedTherapies.includes(therapy)) {
      const newTherapies = [...selectedTherapies, therapy];
      onChange(newTherapies);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleRemoveTherapy = (therapyToRemove) => {
    const newTherapies = selectedTherapies.filter(therapy => therapy !== therapyToRemove);
    onChange(newTherapies);
  };

  const handleAddCustomTherapy = () => {
    if (customTherapy.trim() && !selectedTherapies.includes(customTherapy.trim())) {
      handleAddTherapy(customTherapy.trim());
      setCustomTherapy('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTherapies.length > 0) {
        handleAddTherapy(filteredTherapies[0]);
      } else if (searchTerm.trim()) {
        handleAddTherapy(searchTerm.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isEditing) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-deep">Especialidades y Terapias</h3>
        {selectedTherapies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedTherapies.map((therapy, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-sage/10 text-sage border border-sage/20"
              >
                {therapy}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No hay especialidades definidas</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-deep">Especialidades y Terapias</h3>
      
      {/* Chips seleccionados */}
      {selectedTherapies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTherapies.map((therapy, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-sage/10 text-sage border border-sage/20 group"
            >
              <span>{therapy}</span>
              <button
                onClick={() => handleRemoveTherapy(therapy)}
                className="ml-2 hover:bg-sage/20 rounded-full p-0.5 transition-colors"
                aria-label={`Quitar ${therapy}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Selector */}
      <div className="relative" ref={dropdownRef}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center justify-between"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Añadir especialidad</span>
          </span>
        </Button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
            {/* Buscador */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar o escribir nueva especialidad..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sage focus:border-transparent"
                  aria-label="Buscar especialidades"
                />
              </div>
            </div>

            {/* Lista de opciones */}
            <div className="max-h-48 overflow-y-auto">
              {filteredTherapies.length > 0 ? (
                <ul role="listbox" className="py-1">
                  {filteredTherapies.map((therapy, index) => (
                    <li key={index}>
                      <button
                        onClick={() => handleAddTherapy(therapy)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        role="option"
                      >
                        {therapy}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : searchTerm.trim() ? (
                <div className="p-4 text-center">
                  <p className="text-gray-500 mb-2">No se encontraron especialidades</p>
                  <Button
                    onClick={() => {
                      setCustomTherapy(searchTerm);
                      handleAddCustomTherapy();
                    }}
                    className="bg-sage text-white hover:bg-sage/90 px-3 py-1 rounded-md text-sm"
                  >
                    Añadir "{searchTerm}"
                  </Button>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Escribe para buscar o añadir una nueva especialidad
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600">
        Selecciona las especialidades y enfoques terapéuticos que ofreces. Puedes añadir especialidades personalizadas.
      </p>
    </div>
  );
};