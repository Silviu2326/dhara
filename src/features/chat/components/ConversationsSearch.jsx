import React, { useState, useEffect, useRef } from 'react';

export const ConversationsSearch = ({
  value = '',
  onChange,
  placeholder = 'Buscar conversaciones...',
  suggestions = [],
  onSuggestionClick,
  isLoading = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mostrar sugerencias cuando hay valor y está enfocado
  useEffect(() => {
    setShowSuggestions(isFocused && value.length > 0 && suggestions.length > 0);
  }, [isFocused, value, suggestions]);

  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleInputBlur = () => {
    // Delay para permitir clic en sugerencias
    setTimeout(() => setIsFocused(false), 150);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleSuggestionSelect = (suggestion) => {
    onChange(suggestion.name || suggestion.email || suggestion);
    setShowSuggestions(false);
    onSuggestionClick?.(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <div className={`
        relative flex items-center
        ${isFocused ? 'ring-2 ring-sage-500 ring-opacity-50' : ''}
        transition-all duration-200
      `}>
        {/* Icono de búsqueda */}
        <div className="absolute left-3 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="animate-spin w-4 h-4">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-10 py-2.5 text-sm
            bg-white border border-gray-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-opacity-50 focus:border-sage-500
            placeholder-gray-400
            transition-all duration-200
          "
          aria-label="Buscar conversaciones"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          role="combobox"
        />

        {/* Botón limpiar */}
        {value && (
          <button
            onClick={handleClear}
            className="
              absolute right-3 p-1 rounded-full
              text-gray-400 hover:text-gray-600 hover:bg-gray-100
              transition-colors duration-200
            "
            aria-label="Limpiar búsqueda"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Sugerencias */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="
            absolute top-full left-0 right-0 mt-1 z-50
            bg-white border border-gray-200 rounded-lg shadow-lg
            max-h-60 overflow-y-auto
          "
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={suggestion.id || index}
              suggestion={suggestion}
              onClick={() => handleSuggestionSelect(suggestion)}
              searchTerm={value}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente para cada sugerencia
const SuggestionItem = ({ suggestion, onClick, searchTerm }) => {
  const highlightText = (text, term) => {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-gray-900">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className="
        flex items-center space-x-3 p-3 cursor-pointer
        hover:bg-gray-50 active:bg-gray-100
        border-b border-gray-100 last:border-b-0
        transition-colors duration-150
      "
      onClick={onClick}
      role="option"
    >
      {/* Avatar */}
      <div className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
        {suggestion.avatar ? (
          <img 
            src={suggestion.avatar} 
            alt={suggestion.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          suggestion.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        )}
      </div>

      {/* Información */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {highlightText(suggestion.name || '', searchTerm)}
        </div>
        {suggestion.email && (
          <div className="text-xs text-gray-500 truncate">
            {highlightText(suggestion.email, searchTerm)}
          </div>
        )}
      </div>

      {/* Estado online */}
      {suggestion.isOnline !== undefined && (
        <div className={`
          w-2 h-2 rounded-full flex-shrink-0
          ${suggestion.isOnline ? 'bg-green-500' : 'bg-gray-400'}
        `} />
      )}
    </div>
  );
};

// Hook para gestionar búsquedas
export const useConversationsSearch = (conversations = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar búsquedas recientes del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chat-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Generar sugerencias basadas en el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions(recentSearches.slice(0, 5));
      return;
    }

    setIsLoading(true);
    
    // Simular delay de búsqueda
    const timeoutId = setTimeout(() => {
      const filtered = conversations
        .filter(conv => {
          const name = conv.client.name.toLowerCase();
          const email = conv.client.email.toLowerCase();
          const term = searchTerm.toLowerCase();
          return name.includes(term) || email.includes(term);
        })
        .map(conv => conv.client)
        .slice(0, 8);
      
      setSuggestions(filtered);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, conversations, recentSearches]);

  // Guardar búsqueda reciente
  const saveRecentSearch = (client) => {
    const newRecent = [
      client,
      ...recentSearches.filter(item => item.id !== client.id)
    ].slice(0, 10);
    
    setRecentSearches(newRecent);
    localStorage.setItem('chat-recent-searches', JSON.stringify(newRecent));
  };

  // Limpiar búsquedas recientes
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('chat-recent-searches');
  };

  return {
    searchTerm,
    setSearchTerm,
    suggestions,
    recentSearches,
    isLoading,
    saveRecentSearch,
    clearRecentSearches
  };
};