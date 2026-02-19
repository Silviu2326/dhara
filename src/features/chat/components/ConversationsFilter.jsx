import React, { useState } from 'react';

export const ConversationsFilter = ({
  activeFilter = 'all',
  onFilterChange,
  conversationCounts = { all: 0, today: 0, unread: 0 }
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const filters = [
    {
      key: 'all',
      label: 'Todos',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.476L3 21l2.476-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
        </svg>
      ),
      count: conversationCounts.all,
      description: 'Todas las conversaciones'
    },
    {
      key: 'unread',
      label: 'No leídas',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h8a2 2 0 012 2v4" />
        </svg>
      ),
      count: conversationCounts.unread,
      description: 'Mensajes sin leer',
      highlight: conversationCounts.unread > 0
    },
    {
      key: 'favorites',
      label: 'Favoritas',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      count: conversationCounts.favorites || 0,
      description: 'Conversaciones favoritas'
    },
    {
      key: 'today',
      label: 'Hoy',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      count: conversationCounts.today,
      description: 'Conversaciones de hoy'
    },
    {
      key: 'archived',
      label: 'Archivadas',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
        </svg>
      ),
      count: conversationCounts.archived || 0,
      description: 'Conversaciones archivadas'
    }
  ];

  const activeFilterData = filters.find(f => f.key === activeFilter);

  const handleFilterSelect = (filterKey) => {
    onFilterChange(filterKey);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium
          transition-all duration-200
          ${isOpen 
            ? 'bg-sage-100 text-sage-700 ring-2 ring-sage-500 ring-opacity-50' 
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Filtro actual: ${activeFilterData?.label}`}
      >
        {/* Icono del filtro activo */}
        <span className={activeFilterData?.highlight ? 'text-blue-600' : ''}>
          {activeFilterData?.icon}
        </span>
        
        {/* Texto del filtro */}
        <span className={activeFilterData?.highlight ? 'text-blue-600' : ''}>
          {activeFilterData?.label}
        </span>
        
        {/* Contador */}
        {activeFilterData?.count > 0 && (
          <span className={`
            px-2 py-0.5 rounded-full text-xs font-medium
            ${activeFilterData.highlight 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            {activeFilterData.count}
          </span>
        )}
        
        {/* Icono dropdown */}
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu */}
          <div className="
            absolute top-full left-0 mt-1 w-64 z-20
            bg-white border border-gray-200 rounded-lg shadow-lg
            py-1
          ">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => handleFilterSelect(filter.key)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 text-left
                  hover:bg-gray-50 active:bg-gray-100
                  transition-colors duration-150
                  ${filter.key === activeFilter ? 'bg-sage-50 text-sage-700' : 'text-gray-700'}
                `}
                role="menuitem"
              >
                <div className="flex items-center space-x-3">
                  <span className={filter.highlight ? 'text-blue-600' : ''}>
                    {filter.icon}
                  </span>
                  <div>
                    <div className={`text-sm font-medium ${filter.highlight ? 'text-blue-600' : ''}`}>
                      {filter.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {filter.description}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Contador */}
                  {filter.count > 0 && (
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-medium
                      ${filter.highlight 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {filter.count}
                    </span>
                  )}
                  
                  {/* Checkmark para filtro activo */}
                  {filter.key === activeFilter && (
                    <svg className="w-4 h-4 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
            
            {/* Separador */}
            <div className="border-t border-gray-100 my-1" />
            
            {/* Información adicional */}
            <div className="px-4 py-2 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Los filtros se aplican en tiempo real</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Componente compacto para móvil
export const ConversationsFilterMobile = ({
  activeFilter = 'all',
  onFilterChange,
  conversationCounts = { all: 0, today: 0, unread: 0 }
}) => {
  const filters = [
    { key: 'all', label: 'Todos', count: conversationCounts.all },
    { key: 'today', label: 'Hoy', count: conversationCounts.today },
    { key: 'unread', label: 'Sin leer', count: conversationCounts.unread, highlight: conversationCounts.unread > 0 }
  ];

  return (
    <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`
            flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-xs font-medium
            transition-all duration-200
            ${filter.key === activeFilter
              ? 'bg-white text-sage-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          <span className={filter.highlight ? 'text-blue-600' : ''}>
            {filter.label}
          </span>
          {filter.count > 0 && (
            <span className={`
              px-1.5 py-0.5 rounded-full text-xs font-medium
              ${filter.highlight 
                ? 'bg-blue-100 text-blue-700' 
                : filter.key === activeFilter
                  ? 'bg-sage-100 text-sage-700'
                  : 'bg-gray-200 text-gray-600'
              }
            `}>
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// Hook para gestionar filtros
export const useConversationsFilter = (conversations = []) => {
  const [activeFilter, setActiveFilter] = useState('all');

  // Calcular contadores
  const conversationCounts = React.useMemo(() => {
    const today = new Date().toDateString();
    
    return {
      all: conversations.length,
      today: conversations.filter(conv => 
        conv.lastMessage && 
        new Date(conv.lastMessage.timestamp).toDateString() === today
      ).length,
      unread: conversations.filter(conv => conv.unreadCount > 0).length,
      favorites: conversations.filter(conv => conv.isFavorite).length,
      archived: conversations.filter(conv => conv.isArchived).length
    };
  }, [conversations]);

  // Filtrar conversaciones
  const filteredConversations = React.useMemo(() => {
    switch (activeFilter) {
      case 'today': {
        const today = new Date().toDateString();
        return conversations.filter(conv => 
          conv.lastMessage && 
          new Date(conv.lastMessage.timestamp).toDateString() === today &&
          !conv.isArchived
        );
      }
      case 'unread':
        return conversations.filter(conv => conv.unreadCount > 0 && !conv.isArchived);
      case 'favorites':
        return conversations.filter(conv => conv.isFavorite && !conv.isArchived);
      case 'archived':
        return conversations.filter(conv => conv.isArchived);
      case 'all':
      default:
        return conversations.filter(conv => !conv.isArchived);
    }
  }, [conversations, activeFilter]);

  return {
    activeFilter,
    setActiveFilter,
    conversationCounts,
    filteredConversations
  };
};