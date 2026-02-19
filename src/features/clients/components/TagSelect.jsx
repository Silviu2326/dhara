import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';

const AVAILABLE_TAGS = [
  { id: 'ansiedad', label: 'Ansiedad', color: 'bg-red-100 text-red-800' },
  { id: 'depresion', label: 'Depresión', color: 'bg-blue-100 text-blue-800' },
  { id: 'pareja', label: 'Terapia de Pareja', color: 'bg-pink-100 text-pink-800' },
  { id: 'estres', label: 'Estrés', color: 'bg-orange-100 text-orange-800' },
  { id: 'trauma', label: 'Trauma', color: 'bg-purple-100 text-purple-800' },
  { id: 'autoestima', label: 'Autoestima', color: 'bg-green-100 text-green-800' },
  { id: 'duelo', label: 'Duelo', color: 'bg-gray-100 text-gray-800' },
  { id: 'adicciones', label: 'Adicciones', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'tca', label: 'TCA', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'infantil', label: 'Terapia Infantil', color: 'bg-cyan-100 text-cyan-800' },
  { id: 'adolescentes', label: 'Adolescentes', color: 'bg-teal-100 text-teal-800' },
  { id: 'familiar', label: 'Terapia Familiar', color: 'bg-rose-100 text-rose-800' }
];

export const TagSelect = ({ selectedTags = [], onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

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

  const filteredTags = AVAILABLE_TAGS.filter(tag =>
    tag.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTagToggle = (tagId) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    onChange(newSelectedTags);
  };

  const handleRemoveTag = (tagId, e) => {
    e.stopPropagation();
    const newSelectedTags = selectedTags.filter(id => id !== tagId);
    onChange(newSelectedTags);
  };

  const getTagLabel = (tagId) => {
    const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
    return tag ? tag.label : tagId;
  };

  const getTagColor = (tagId) => {
    const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
    return tag ? tag.color : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
      >
        <div className="flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-gray-400" />
          <span className="block truncate text-sm">
            {selectedTags.length === 0 
              ? 'Filtrar por tags' 
              : `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} seleccionado${selectedTags.length > 1 ? 's' : ''}`
            }
          </span>
        </div>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedTags.slice(0, 3).map(tagId => (
            <span
              key={tagId}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getTagColor(tagId)}`}
            >
              {getTagLabel(tagId)}
              <button
                onClick={(e) => handleRemoveTag(tagId, e)}
                className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedTags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
              +{selectedTags.length - 3} más
            </span>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          {/* Search input */}
          <div className="px-3 py-2 border-b border-gray-100">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar tags..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Tags list */}
          <div className="py-1">
            {filteredTags.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No se encontraron tags
              </div>
            ) : (
              filteredTags.map(tag => (
                <label
                  key={tag.id}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => handleTagToggle(tag.id)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${tag.color}`}>
                    {tag.label}
                  </span>
                </label>
              ))
            )}
          </div>

          {/* Clear all */}
          {selectedTags.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2">
              <button
                onClick={() => onChange([])}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Limpiar todos los tags
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};