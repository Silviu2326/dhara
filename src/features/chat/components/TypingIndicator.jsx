import React, { useState, useEffect } from 'react';

export const TypingIndicator = ({ 
  userName = 'Cliente',
  userAvatar = null,
  isVisible = false,
  className = '' 
}) => {
  const [dots, setDots] = useState('');

  // Animación de los puntos
  useEffect(() => {
    if (!isVisible) {
      setDots('');
      return;
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '') return '.';
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`flex justify-start ${className}`}>
      <div className="flex items-end space-x-2 max-w-xs sm:max-w-md">
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={userName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
          )}
        </div>

        {/* Indicador de escritura */}
        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-600">
              {userName} está escribiendo
            </span>
            <span className="text-sm text-gray-600 w-4 text-left">
              {dots}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Versión compacta del indicador
export const TypingIndicatorCompact = ({ 
  userName = 'Cliente',
  isVisible = false,
  className = '' 
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isVisible) {
      setDots('');
      return;
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '') return '.';
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="bg-gray-100 rounded-full px-3 py-1">
        <span className="text-xs text-gray-500">
          {userName} está escribiendo{dots}
        </span>
      </div>
    </div>
  );
};

// Indicador con puntos animados usando CSS
export const TypingIndicatorAnimated = ({ 
  userName = 'Cliente',
  userAvatar = null,
  isVisible = false,
  className = '' 
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`flex justify-start ${className}`}>
      <div className="flex items-end space-x-2 max-w-xs sm:max-w-md">
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={userName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
          )}
        </div>

        {/* Indicador de escritura con animación CSS */}
        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {userName} está escribiendo
            </span>
            
            {/* Puntos animados */}
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook para manejar el estado de escritura
export const useTypingIndicator = (conversationId) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Simular recepción de eventos de escritura
  useEffect(() => {
    // En una implementación real, esto se conectaría a WebSocket o similar
    const simulateTyping = () => {
      if (Math.random() > 0.7) { // 30% de probabilidad
        setIsTyping(true);
        setTypingUser({
          name: 'Ana García',
          avatar: null
        });
        
        // Simular que deja de escribir después de 3-8 segundos
        const timeout = setTimeout(() => {
          setIsTyping(false);
          setTypingUser(null);
        }, Math.random() * 5000 + 3000);
        
        setTypingTimeout(timeout);
      }
    };

    // Simular eventos de escritura cada 10-20 segundos
    const interval = setInterval(simulateTyping, Math.random() * 10000 + 10000);

    return () => {
      clearInterval(interval);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [conversationId, typingTimeout]);

  const startTyping = (user) => {
    setIsTyping(true);
    setTypingUser(user);
  };

  const stopTyping = () => {
    setIsTyping(false);
    setTypingUser(null);
  };

  return {
    isTyping,
    typingUser,
    startTyping,
    stopTyping
  };
};

// Componente principal que usa el hook
export const TypingIndicatorContainer = ({ 
  conversationId,
  variant = 'default', // 'default', 'compact', 'animated'
  className = '' 
}) => {
  const { isTyping, typingUser } = useTypingIndicator(conversationId);

  const renderIndicator = () => {
    const props = {
      userName: typingUser?.name || 'Cliente',
      userAvatar: typingUser?.avatar,
      isVisible: isTyping,
      className
    };

    switch (variant) {
      case 'compact':
        return <TypingIndicatorCompact {...props} />;
      case 'animated':
        return <TypingIndicatorAnimated {...props} />;
      default:
        return <TypingIndicator {...props} />;
    }
  };

  return (
    <div className="transition-all duration-300 ease-in-out">
      {renderIndicator()}
    </div>
  );
};

// Utilidades para el componente
export const typingIndicatorUtils = {
  // Formatear el texto del indicador según el número de usuarios escribiendo
  formatTypingText: (users) => {
    if (!users || users.length === 0) {
      return '';
    }
    
    if (users.length === 1) {
      return `${users[0].name} está escribiendo`;
    }
    
    if (users.length === 2) {
      return `${users[0].name} y ${users[1].name} están escribiendo`;
    }
    
    return `${users[0].name} y ${users.length - 1} más están escribiendo`;
  },

  // Obtener el color del avatar basado en el nombre del usuario
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
    
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  },

  // Debounce para eventos de escritura
  createTypingDebounce: (callback, delay = 1000) => {
    let timeoutId;
    
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback.apply(null, args), delay);
    };
  }
};

export default TypingIndicator;