import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRecentSearches } from '../../../hooks/useRecentSearches';

export const SearchBar = ({ 
  value = '', 
  onChange, 
  placeholder = 'Buscar clientes...', 
  suggestions,
  isLoading = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const { recentSearches, addRecentSearch } = useRecentSearches('clients-search');

  const memoizedSuggestions = useMemo(() => suggestions || [], [suggestions]);

  useEffect(() => {
    if (value.length > 0 && memoizedSuggestions.length > 0) {
      const filtered = memoizedSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [value, memoizedSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length > 0 || recentSearches.length > 0);
  }, [onChange, recentSearches]);

  const handleSuggestionClick = useCallback((suggestion) => {
    onChange(suggestion);
    addRecentSearch(suggestion);
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onChange, addRecentSearch]);

  const handleClear = useCallback(() => {
    onChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && value.trim()) {
      addRecentSearch(value.trim());
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, [value, addRecentSearch]);

  const showSuggestions = isOpen && (filteredSuggestions.length > 0 || (value.length === 0 && recentSearches.length > 0));

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(value.length > 0 || recentSearches.length > 0)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
        
        {/* Clear button */}
        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          {value.length === 0 && recentSearches.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Búsquedas recientes
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={`recent-${index}`}
                  onClick={() => handleSuggestionClick(search)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  {search}
                </button>
              ))}
            </>
          )}
          
          {filteredSuggestions.length > 0 && (
            <>
              {value.length === 0 && recentSearches.length > 0 && (
                <div className="border-t border-gray-100 my-1"></div>
              )}
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Sugerencias
              </div>
              {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <span className="font-medium">{suggestion}</span>
                </button>
              ))}
            </>
          )}
          
          {filteredSuggestions.length === 0 && value.length > 0 && recentSearches.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No se encontraron sugerencias
            </div>
          )}
        </div>
      )}
    </div>
  );
};