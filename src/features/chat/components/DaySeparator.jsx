import React from 'react';

export const DaySeparator = ({ date, className = '' }) => {
  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(date);
    
    // Normalizar las fechas para comparar solo día/mes/año
    const isToday = messageDate.toDateString() === today.toDateString();
    const isYesterday = messageDate.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return 'Hoy';
    }
    
    if (isYesterday) {
      return 'Ayer';
    }
    
    // Para fechas de esta semana
    const daysDiff = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7 && daysDiff > 1) {
      return messageDate.toLocaleDateString('es-ES', { 
        weekday: 'long' 
      });
    }
    
    // Para fechas de este año
    if (messageDate.getFullYear() === today.getFullYear()) {
      return messageDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long'
      });
    }
    
    // Para fechas de años anteriores
    return messageDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className={`flex items-center justify-center my-6 ${className}`}>
      <div className="flex items-center w-full max-w-xs">
        {/* Línea izquierda */}
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-300" />
        
        {/* Texto de la fecha */}
        <div className="px-4 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
          <span className="text-xs font-medium text-gray-600">
            {capitalizeFirst(formatDate(date))}
          </span>
        </div>
        
        {/* Línea derecha */}
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-300" />
      </div>
    </div>
  );
};

// Variante compacta para espacios reducidos
export const DaySeparatorCompact = ({ date, className = '' }) => {
  const formatDateCompact = (date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    const isToday = messageDate.toDateString() === today.toDateString();
    
    if (isToday) {
      return 'Hoy';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = messageDate.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return 'Ayer';
    }
    
    return messageDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className={`flex justify-center my-3 ${className}`}>
      <div className="px-3 py-1 bg-gray-100 rounded-full">
        <span className="text-xs text-gray-500 font-medium">
          {formatDateCompact(date)}
        </span>
      </div>
    </div>
  );
};

// Separador con información adicional (ej: "3 mensajes nuevos")
export const DaySeparatorWithInfo = ({ 
  date, 
  info, 
  infoType = 'neutral', // 'neutral', 'new', 'warning'
  className = '' 
}) => {
  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(date);
    
    const isToday = messageDate.toDateString() === today.toDateString();
    const isYesterday = messageDate.toDateString() === yesterday.toDateString();
    
    if (isToday) return 'Hoy';
    if (isYesterday) return 'Ayer';
    
    return messageDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long'
    });
  };

  const getInfoStyles = () => {
    switch (infoType) {
      case 'new':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className={`flex flex-col items-center my-6 space-y-2 ${className}`}>
      {/* Separador principal */}
      <div className="flex items-center w-full max-w-xs">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-300" />
        <div className="px-4 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
          <span className="text-xs font-medium text-gray-600">
            {formatDate(date)}
          </span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-300" />
      </div>
      
      {/* Información adicional */}
      {info && (
        <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getInfoStyles()}`}>
          {info}
        </div>
      )}
    </div>
  );
};

// Utilidades para el componente
export const daySeparatorUtils = {
  // Determinar si dos fechas están en días diferentes
  isDifferentDay: (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() !== d2.toDateString();
  },

  // Obtener todos los separadores necesarios para una lista de mensajes
  getSeparatorsForMessages: (messages) => {
    const separators = [];
    let lastDate = null;
    
    messages.forEach((message, index) => {
      const messageDate = new Date(message.timestamp);
      
      if (!lastDate || daySeparatorUtils.isDifferentDay(lastDate, messageDate)) {
        separators.push({
          id: `separator-${index}`,
          date: messageDate,
          position: index
        });
        lastDate = messageDate;
      }
    });
    
    return separators;
  },

  // Agrupar mensajes por día
  groupMessagesByDay: (messages) => {
    const groups = [];
    let currentGroup = null;
    
    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp);
      const dateString = messageDate.toDateString();
      
      if (!currentGroup || currentGroup.date !== dateString) {
        currentGroup = {
          date: dateString,
          dateObject: messageDate,
          messages: []
        };
        groups.push(currentGroup);
      }
      
      currentGroup.messages.push(message);
    });
    
    return groups;
  },

  // Calcular estadísticas de mensajes por día
  getMessageStats: (messages, date) => {
    const dayMessages = messages.filter(msg => {
      const msgDate = new Date(msg.timestamp);
      return msgDate.toDateString() === new Date(date).toDateString();
    });
    
    return {
      total: dayMessages.length,
      unread: dayMessages.filter(msg => !msg.isRead).length,
      fromClient: dayMessages.filter(msg => !msg.isOwn).length,
      fromTherapist: dayMessages.filter(msg => msg.isOwn).length
    };
  }
};

export default DaySeparator;