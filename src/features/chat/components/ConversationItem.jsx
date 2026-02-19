import React from 'react';

export const ConversationItem = ({ conversation, isSelected, onClick }) => {
  const { client, lastMessage, unreadCount, nextSession, isFavorite, isPriority } = conversation;

  // Formatear tiempo relativo
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return messageTime.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  // Truncar mensaje
  const truncateMessage = (text, maxLength = 50) => {
    if (!text) return 'Sin mensajes';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Formatear próxima sesión
  const formatNextSession = (timestamp) => {
    if (!timestamp) return null;
    
    const sessionDate = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((sessionDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Mañana';
    if (diffInDays < 7) return `En ${diffInDays} días`;
    
    return sessionDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div
      className={`
        relative p-3 rounded-lg cursor-pointer transition-all duration-200
        hover:bg-gray-50 active:bg-gray-100
        ${isSelected 
          ? 'bg-sage-50 border-l-4 border-sage-500 shadow-sm' 
          : 'border-l-4 border-transparent'
        }
        ${unreadCount > 0 ? 'bg-blue-50' : ''}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Conversación con ${client.name}${unreadCount > 0 ? `, ${unreadCount} mensajes sin leer` : ''}`}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {client.avatar ? (
              <img 
                src={client.avatar} 
                alt={client.name || 'Cliente'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (client.name || 'Unknown').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            )}
          </div>
          
          {/* Indicador de estado online */}
          <div className={`
            absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
            ${client.isOnline ? 'bg-green-500' : 'bg-gray-400'}
          `} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`
              text-sm font-medium truncate
              ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}
            `}>
              {client.name || 'Cliente'}
            </h3>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Indicador de favorito */}
              {isFavorite && (
                <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              )}
              
              {/* Indicador de prioridad */}
              {isPriority && (
                <div className="w-2 h-2 bg-red-500 rounded-full" title="Conversación prioritaria" />
              )}
              
              {lastMessage && (
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(lastMessage.timestamp)}
                </span>
              )}
              
              {unreadCount > 0 && (
                <div className="bg-blue-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
          </div>

          {/* Último mensaje */}
          <p className={`
            text-xs mb-1 leading-relaxed
            ${unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}
          `}>
            {truncateMessage(lastMessage?.content)}
          </p>

          {/* Información adicional del cliente */}
          <div className="flex items-center justify-between text-xs">
            {/* Próxima sesión o info del cliente */}
            <div className="flex items-center space-x-3">
              {nextSession && (
                <div className="flex items-center text-sage-600">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Próxima: {formatNextSession(nextSession)}</span>
                </div>
              )}

              {/* Rating del cliente */}
              {client.rating && (
                <div className="flex items-center text-yellow-600">
                  <svg className="w-3 h-3 mr-1 fill-current" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span>{client.rating}</span>
                </div>
              )}

              {/* Número de sesiones */}
              {client.sessionsCount > 0 && (
                <div className="flex items-center text-gray-500">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{client.sessionsCount} sesiones</span>
                </div>
              )}
            </div>

            {/* Tags principales */}
            <div className="flex items-center space-x-1">
              {client.tags?.slice(0, 1).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs truncate max-w-20"
                  title={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de selección */}
      {isSelected && (
        <div className="absolute inset-y-0 left-0 w-1 bg-sage-500 rounded-r" />
      )}
    </div>
  );
};

// Componente para mostrar el estado de escritura
export const ConversationItemSkeleton = () => {
  return (
    <div className="p-3 rounded-lg animate-pulse">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-8" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-32 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
};

// Utilidades para el componente
export const conversationUtils = {
  // Obtener el color del avatar basado en el nombre
  getAvatarColor: (name) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
      'from-sage-400 to-sage-600'
    ];
    
    const hash = (name || 'Unknown').split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  },

  // Obtener iniciales del nombre
  getInitials: (name) => {
    return (name || 'Unknown')
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  },

  // Determinar si una conversación es prioritaria
  isPriority: (conversation) => {
    const { unreadCount, nextSession } = conversation;
    const now = new Date();
    const sessionDate = nextSession ? new Date(nextSession) : null;
    const hoursUntilSession = sessionDate ? (sessionDate - now) / (1000 * 60 * 60) : null;
    
    return unreadCount > 3 || (hoursUntilSession && hoursUntilSession < 2);
  }
};