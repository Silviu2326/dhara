import { useState, useEffect, useCallback, useMemo } from 'react';

export const useRecentSearches = (key = 'recentSearches', maxItems = 10) => {
  const [recentSearches, setRecentSearches] = useState([]);

  // Cargar búsquedas recientes del localStorage al inicializar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
      setRecentSearches([]);
    }
  }, [key]);

  // Guardar en localStorage cuando cambien las búsquedas
  const saveToStorage = (searches) => {
    try {
      localStorage.setItem(key, JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  };

  // Agregar una nueva búsqueda
  const addSearch = useCallback((searchTerm) => {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return;
    }

    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm.length === 0) {
      return;
    }

    setRecentSearches(prev => {
      // Remover el término si ya existe
      const filtered = prev.filter(term => 
        term.toLowerCase() !== trimmedTerm.toLowerCase()
      );
      
      // Agregar al inicio y limitar el número de elementos
      const updated = [trimmedTerm, ...filtered].slice(0, maxItems);
      
      // Guardar en localStorage
      saveToStorage(updated);
      
      return updated;
    });
  }, [key, maxItems]);

  // Remover una búsqueda específica
  const removeSearch = useCallback((searchTerm) => {
    setRecentSearches(prev => {
      const updated = prev.filter(term => 
        term.toLowerCase() !== searchTerm.toLowerCase()
      );
      saveToStorage(updated);
      return updated;
    });
  }, [key]);

  // Limpiar todas las búsquedas
  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }, [key]);

  // Obtener sugerencias basadas en un término de búsqueda
  const getSuggestions = useCallback((searchTerm, limit = 5) => {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return recentSearches.slice(0, limit);
    }

    const trimmedTerm = searchTerm.trim().toLowerCase();
    if (trimmedTerm.length === 0) {
      return recentSearches.slice(0, limit);
    }

    return recentSearches
      .filter(term => term.toLowerCase().includes(trimmedTerm))
      .slice(0, limit);
  }, [recentSearches]);

  return useMemo(() => ({
    recentSearches,
    addRecentSearch: addSearch,
    removeSearch,
    clearSearches,
    getSuggestions
  }), [recentSearches, addSearch, removeSearch, clearSearches, getSuggestions]);
};

export default useRecentSearches;