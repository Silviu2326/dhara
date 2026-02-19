import React, { useState } from 'react';

export const MessageBubble = ({
  message,
  isOwn = false,
  showAvatar = true,
  showTimestamp = true,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (type === 'application/pdf') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    if (type.startsWith('audio/')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 9v6l4-2V7l-4 2z" />
        </svg>
      );
    }
    if (type.startsWith('video/')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const renderAttachment = (attachment) => {
    if (attachment.type.startsWith('image/')) {
      return (
        <div key={attachment.id} className="mt-2">
          <div 
            className="relative inline-block cursor-pointer rounded-lg overflow-hidden"
            onClick={() => setShowFullImage(true)}
          >
            {!imageError ? (
              <img
                src={attachment.url}
                alt={attachment.name}
                className="max-w-xs max-h-64 object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-48 h-32 bg-gray-100 flex items-center justify-center rounded-lg">
                <div className="text-center text-gray-500">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs">Error al cargar imagen</p>
                </div>
              </div>
            )}
            
            {/* Overlay de zoom */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={attachment.id} className="mt-2">
        <div className={`
          flex items-center space-x-3 p-3 rounded-lg border
          ${isOwn ? 'bg-white border-sage-200' : 'bg-gray-50 border-gray-200'}
          hover:bg-opacity-80 transition-colors duration-200
        `}>
          <div className={`
            p-2 rounded-lg
            ${isOwn ? 'bg-sage-100 text-sage-600' : 'bg-gray-200 text-gray-600'}
          `}>
            {getFileIcon(attachment.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {attachment.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(attachment.size)}
            </p>
          </div>
          
          <button
            onClick={() => window.open(attachment.url, '_blank')}
            className={`
              p-1 rounded-md transition-colors duration-200
              ${isOwn 
                ? 'text-sage-600 hover:bg-sage-100' 
                : 'text-gray-600 hover:bg-gray-200'
              }
            `}
            aria-label={`Descargar ${attachment.name}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs sm:max-w-md lg:max-w-lg`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
            {message.senderAvatar ? (
              <img 
                src={message.senderAvatar} 
                alt={message.senderName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              message.senderName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            )}
          </div>
        )}
        
        {/* Espaciador cuando no hay avatar */}
        {!showAvatar && !isOwn && (
          <div className="w-8" />
        )}

        {/* Contenido del mensaje */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Timestamp */}
          {showTimestamp && (
            <div className={`text-xs text-gray-500 mb-1 ${isOwn ? 'mr-2' : 'ml-2'}`}>
              {!isOwn && message.senderName && (
                <span className="font-medium">{message.senderName} • </span>
              )}
              {formatTime(message.timestamp)}
            </div>
          )}

          {/* Burbuja del mensaje */}
          <div className={`
            relative px-4 py-2 rounded-2xl max-w-full
            ${isOwn 
              ? 'bg-sage-600 text-white rounded-br-md' 
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }
          `}>
            {/* Contenido del texto */}
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {message.content}
              </p>
            )}

            {/* Adjuntos */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="space-y-2">
                {message.attachments.map(renderAttachment)}
              </div>
            )}
          </div>

          {/* Estado del mensaje */}
          {isOwn && (
            <div className={`flex items-center space-x-1 mt-1 mr-2 text-xs text-gray-500`}>
              {message.isRead ? (
                <>
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <svg className="w-3 h-3 text-blue-500 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-blue-500">Leído</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Enviado</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de imagen completa */}
      {showFullImage && message.attachments?.find(a => a.type.startsWith('image/')) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={message.attachments.find(a => a.type.startsWith('image/')).url}
              alt="Imagen completa"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors duration-200"
              aria-label="Cerrar imagen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para mostrar el skeleton de un mensaje mientras carga
export const MessageBubbleSkeleton = ({ isOwn = false }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs sm:max-w-md`}>
        {!isOwn && (
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
        )}
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          <div className={`h-3 bg-gray-200 rounded w-16 mb-1 animate-pulse ${isOwn ? 'mr-2' : 'ml-2'}`} />
          <div className={`
            px-4 py-2 rounded-2xl animate-pulse
            ${isOwn 
              ? 'bg-gray-200 rounded-br-md' 
              : 'bg-gray-200 rounded-bl-md'
            }
          `}>
            <div className="h-4 bg-gray-300 rounded w-32 mb-1" />
            <div className="h-4 bg-gray-300 rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Utilidades para el componente
export const messageUtils = {
  // Detectar URLs en el texto y convertirlas en enlaces
  linkifyText: (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">$1</a>');
  },

  // Formatear texto con markdown básico
  formatMarkdown: (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>');
  },

  // Validar si un archivo es una imagen
  isImage: (file) => {
    return file.type.startsWith('image/');
  },

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
    
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  }
};