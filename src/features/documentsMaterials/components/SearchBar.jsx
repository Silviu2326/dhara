import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRecentSearches } from '../../../hooks/useRecentSearches';

export const SearchBar = ({ 
  searchTerm, 
  onSearch, 
  placeholder = "Buscar documentos...", 
  compact = false 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
    getSuggestions
  } = useRecentSearches('documents-search');

  const suggestions = getSuggestions(searchTerm);
  const showRecentSearches = isFocused && !searchTerm && recentSearches.length > 0;
  const showSearchSuggestions = isFocused && searchTerm && suggestions.length > 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    onSearch(value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    onSearchChange(suggestion);
    addSearch(suggestion);
    setShowSuggestions(false);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      addSearch(searchTerm.trim());
      setShowSuggestions(false);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="relative">
      <label className={`block text-sm font-medium text-gray-700 mb-1 ${
        compact ? 'text-xs' : ''
      }`}>
        Buscar
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className={`text-gray-400 ${
            compact ? 'w-4 h-4' : 'w-5 h-5'
          }`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            compact ? 'text-sm' : ''
          } ${
            isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''
          }`}
        />
        
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className={`text-gray-400 ${
              compact ? 'w-4 h-4' : 'w-5 h-5'
            }`} />
          </button>
        )}
      </div>

      {/* Sugerencias */}
      {(showRecentSearches || showSearchSuggestions) && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden"
        >
          {showRecentSearches && (
            <div>
              <div className="px-3 py-2 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Búsquedas recientes
                  </span>
                  <button
                    onClick={clearSearches}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
              
              <div className="max-h-48 overflow-y-auto">
                {recentSearches.map((search, index) => (
                  <div key={index} className="flex items-center group">
                    <button
                      onClick={() => handleSuggestionClick(search)}
                      className="flex-1 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{search}</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => removeSearch(search)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSearchSuggestions && (
            <div>
              <div className="px-3 py-2 bg-gray-50 border-b">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Sugerencias
                </span>
              </div>
              
              <div className="max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {highlightMatch(suggestion, searchTerm)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SearchBarCompact = (props) => {
  return <SearchBar {...props} compact />;
};