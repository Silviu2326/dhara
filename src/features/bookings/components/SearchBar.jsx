import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, User, Hash, Stethoscope } from 'lucide-react';

const SEARCH_SUGGESTIONS = [
  {
    type: 'client',
    icon: User,
    label: 'Buscar por cliente',
    examples: ['Juan Pérez', 'María García', 'Ana López']
  },
  {
    type: 'booking_id',
    icon: Hash,
    label: 'Buscar por ID de reserva',
    examples: ['BK-2024-001', 'BK-2024-002']
  },
  {
    type: 'therapy',
    icon: Stethoscope,
    label: 'Buscar por terapia',
    examples: ['Fisioterapia', 'Masaje', 'Consulta']
  },
  {
    type: 'recent',
    icon: Clock,
    label: 'Búsquedas recientes',
    examples: []
  }
];

export const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Buscar reservas...',
  loading = false,
  disabled = false,
  showSuggestions = true,
  recentSearches = [],
  onRecentSearchSelect,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleInputChange = (newValue) => {
    setLocalValue(newValue);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new debounce
    debounceRef.current = setTimeout(() => {
      onChange?.(newValue);
    }, 300);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (showSuggestions) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowDropdown(false), 150);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange?.('');
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion) => {
    setLocalValue(suggestion);
    onChange?.(suggestion);
    setShowDropdown(false);
    onRecentSearchSelect?.(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      setShowDropdown(false);
      // Add to recent searches if not empty
      if (localValue.trim() && onRecentSearchSelect) {
        onRecentSearchSelect(localValue.trim());
      }
    }
  };

  const filteredSuggestions = SEARCH_SUGGESTIONS.map(category => {
    if (category.type === 'recent') {
      return {
        ...category,
        examples: recentSearches.slice(0, 3)
      };
    }
    return category;
  }).filter(category => category.examples.length > 0);

  return (
    <div className={`relative ${className}`}>
      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`h-4 w-4 ${
            loading ? 'animate-pulse text-blue-500' : 'text-gray-400'
          }`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Buscando...' : placeholder}
          disabled={disabled || loading}
          className={`
            w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-200
            ${disabled || loading ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'}
            ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          `}
        />
        
        {/* Clear button */}
        {localValue && !disabled && !loading && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            title="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          <div className="py-2">
            {filteredSuggestions.map((category, categoryIndex) => (
              <div key={category.type}>
                {/* Category header */}
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <category.icon className="h-3 w-3" />
                    <span>{category.label}</span>
                  </div>
                </div>
                
                {/* Category suggestions */}
                <div className="py-1">
                  {category.examples.map((example, exampleIndex) => (
                    <button
                      key={`${category.type}-${exampleIndex}`}
                      onClick={() => handleSuggestionClick(example)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <Search className="h-3 w-3 text-gray-400" />
                      <span>{example}</span>
                      {category.type === 'recent' && (
                        <Clock className="h-3 w-3 text-gray-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Separator */}
                {categoryIndex < filteredSuggestions.length - 1 && (
                  <div className="border-b border-gray-100 my-1"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <span>Presiona Enter para buscar</span>
              <span>Esc para cerrar</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for managing recent searches
export const useRecentSearches = (maxItems = 5) => {
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('booking-recent-searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addRecentSearch = (search) => {
    if (!search.trim()) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== search.trim());
      const updated = [search.trim(), ...filtered].slice(0, maxItems);
      
      try {
        localStorage.setItem('booking-recent-searches', JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('booking-recent-searches');
    } catch {
      // Ignore localStorage errors
    }
  };

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches
  };
};