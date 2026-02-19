import React, { useState, useRef, useEffect } from 'react';

export const MessageInput = ({
  onSendMessage,
  onAttachFile,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = 'Escribe un mensaje...',
  maxLength = 1000,
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [commandFilter, setCommandFilter] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Comandos rápidos disponibles
  const quickCommands = [
    {
      id: 'template-anxiety',
      command: '/plantilla ansiedad',
      description: 'Plantilla para manejo de ansiedad',
      content: 'Recuerda que la ansiedad es temporal. Practica la respiración profunda: inhala por 4 segundos, mantén por 4, exhala por 6. ¿Cómo te sientes ahora?'
    },
    {
      id: 'template-depression',
      command: '/plantilla depresión',
      description: 'Plantilla para apoyo en depresión',
      content: 'Es importante reconocer tus sentimientos. Cada pequeño paso cuenta. ¿Qué actividad pequeña podrías hacer hoy que te haga sentir un poco mejor?'
    },
    {
      id: 'template-stress',
      command: '/plantilla estrés',
      description: 'Plantilla para manejo de estrés',
      content: 'El estrés es una respuesta natural. Vamos a trabajar juntos para encontrar estrategias que te ayuden. ¿Cuál es tu principal fuente de estrés ahora?'
    },
    {
      id: 'link-document',
      command: '/link documento',
      description: 'Insertar enlace a documento',
      content: '[Documento de ejercicios](https://ejemplo.com/documento) - Te he compartido algunos ejercicios que pueden ayudarte.'
    },
    {
      id: 'schedule-session',
      command: '/programar sesión',
      description: 'Sugerir programar nueva sesión',
      content: 'Me parece que sería beneficioso programar una sesión adicional. ¿Tienes disponibilidad esta semana?'
    },
    {
      id: 'homework',
      command: '/tarea',
      description: 'Asignar tarea terapéutica',
      content: 'Para nuestra próxima sesión, me gustaría que practiques [ejercicio específico]. ¿Te parece factible?'
    }
  ];

  // Auto-resize del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Manejar cambios en el texto
  const handleMessageChange = (e) => {
    const value = e.target.value;
    
    if (value.length <= maxLength) {
      setMessage(value);
      
      // Detectar comandos
      if (value.startsWith('/')) {
        const command = value.toLowerCase();
        setCommandFilter(command);
        setShowCommands(true);
      } else {
        setShowCommands(false);
        setCommandFilter('');
      }
      
      // Manejar indicador de escritura
      if (!isTyping && value.trim()) {
        setIsTyping(true);
        onTypingStart?.();
      }
      
      // Reset del timeout de escritura
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTypingStop?.();
      }, 1000);
    }
  };

  // Manejar envío del mensaje
  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || disabled) {
      return;
    }

    const messageData = {
      content: message.trim(),
      attachments: attachments,
      timestamp: new Date().toISOString()
    };

    onSendMessage(messageData);
    setMessage('');
    setAttachments([]);
    setIsTyping(false);
    onTypingStop?.();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Manejar teclas especiales
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleSend();
      } else if (!e.shiftKey && showCommands) {
        e.preventDefault();
      }
    }
    
    if (e.key === 'Escape') {
      setShowCommands(false);
    }
  };

  // Manejar selección de comando
  const handleCommandSelect = (command) => {
    setMessage(command.content);
    setShowCommands(false);
    setCommandFilter('');
    textareaRef.current?.focus();
  };

  // Manejar archivos adjuntos
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // Validar tamaño (25MB)
      if (file.size > 25 * 1024 * 1024) {
        alert(`El archivo ${file.name} es demasiado grande. Máximo 25MB.`);
        return;
      }
      
      // Validar tipo
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'audio/mpeg',
        'audio/wav',
        'video/mp4',
        'video/quicktime'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert(`Tipo de archivo no permitido: ${file.name}`);
        return;
      }
      
      const attachment = {
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      };
      
      setAttachments(prev => [...prev, attachment]);
    });
    
    // Reset del input
    e.target.value = '';
  };

  // Remover adjunto
  const removeAttachment = (id) => {
    setAttachments(prev => {
      const updated = prev.filter(att => att.id !== id);
      // Limpiar URL del objeto
      const removed = prev.find(att => att.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return updated;
    });
  };

  // Filtrar comandos
  const filteredCommands = quickCommands.filter(cmd => 
    cmd.command.toLowerCase().includes(commandFilter.toLowerCase()) ||
    cmd.description.toLowerCase().includes(commandFilter.toLowerCase())
  );

  const canSend = (message.trim() || attachments.length > 0) && !disabled;

  return (
    <div className={`bg-white border-t border-gray-200 ${className}`}>
      {/* Comandos rápidos */}
      {showCommands && filteredCommands.length > 0 && (
        <div className="border-b border-gray-200 bg-gray-50 max-h-48 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 px-2">Comandos rápidos:</div>
            {filteredCommands.map(command => (
              <button
                key={command.id}
                onClick={() => handleCommandSelect(command)}
                className="w-full text-left p-2 hover:bg-white rounded-md transition-colors duration-200 group"
              >
                <div className="font-medium text-sm text-gray-900 group-hover:text-sage-600">
                  {command.command}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {command.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Adjuntos */}
      {attachments.length > 0 && (
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <AttachmentPreview
                key={attachment.id}
                attachment={attachment}
                onRemove={() => removeAttachment(attachment.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Input principal */}
      <div className="p-4">
        <div className="flex items-end space-x-3">
          {/* Botón de adjuntos */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-sage-600 hover:bg-sage-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Adjuntar archivo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          {/* Input de archivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.mov"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] max-h-[120px]"
              rows={1}
            />
            
            {/* Contador de caracteres */}
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              {message.length}/{maxLength}
            </div>
          </div>
          
          {/* Botón enviar */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-shrink-0 bg-sage-600 text-white p-2 rounded-lg hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            aria-label="Enviar mensaje"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {/* Ayuda */}
        <div className="mt-2 text-xs text-gray-500">
          <span>Ctrl+Enter para enviar</span>
          <span className="mx-2">•</span>
          <span>/ para comandos rápidos</span>
        </div>
      </div>
    </div>
  );
};

// Componente para preview de adjuntos
const AttachmentPreview = ({ attachment, onRemove }) => {
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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (type === 'application/pdf') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-2 pr-1">
      {/* Preview de imagen o icono */}
      {attachment.type.startsWith('image/') ? (
        <img
          src={attachment.url}
          alt={attachment.name}
          className="w-8 h-8 object-cover rounded"
        />
      ) : (
        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-600">
          {getFileIcon(attachment.type)}
        </div>
      )}
      
      {/* Info del archivo */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate">
          {attachment.name}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(attachment.size)}
        </p>
      </div>
      
      {/* Botón remover */}
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
        aria-label={`Remover ${attachment.name}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default MessageInput;