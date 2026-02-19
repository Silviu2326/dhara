import React, { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { DaySeparator } from './DaySeparator';
import { TypingIndicator } from './TypingIndicator';
import { Loader } from '../../../components/Loader';

export const MessagesPane = ({
  messages = [],
  currentUserId,
  isLoading = false,
  isTyping = false,
  typingUser = null,
  onLoadMore,
  hasMore = false,
  onMessageRead,
  className = ''
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (shouldAutoScroll && isNearBottom) {
      scrollToBottom();
    }
  }, [messages, isTyping, shouldAutoScroll, isNearBottom]);

  // Marcar mensajes como leídos cuando están visibles
  useEffect(() => {
    const unreadMessages = messages.filter(msg => 
      msg.senderId !== currentUserId && !msg.isRead
    );
    
    if (unreadMessages.length > 0 && onMessageRead) {
      // Simular que los mensajes visibles se marcan como leídos
      const timer = setTimeout(() => {
        unreadMessages.forEach(msg => onMessageRead(msg.id));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [messages, currentUserId, onMessageRead]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'instant' 
    });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Considerar "cerca del final" si está a menos de 100px
    const nearBottom = distanceFromBottom < 100;
    setIsNearBottom(nearBottom);
    setShouldAutoScroll(nearBottom);
    
    // Cargar más mensajes si está cerca del inicio
    if (scrollTop < 100 && hasMore && onLoadMore && !isLoading) {
      onLoadMore();
    }
  };

  // Agrupar mensajes por día
  const groupMessagesByDay = (messages) => {
    const groups = [];
    let currentDay = null;
    let currentGroup = [];

    messages.forEach((message) => {
      const messageDay = new Date(message.timestamp).toDateString();
      
      if (messageDay !== currentDay) {
        if (currentGroup.length > 0) {
          groups.push({ day: currentDay, messages: currentGroup });
        }
        currentDay = messageDay;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ day: currentDay, messages: currentGroup });
    }

    return groups;
  };

  const messageGroups = groupMessagesByDay(messages);

  if (isLoading && messages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Loader size="md" />
          <p className="text-gray-500 text-sm mt-2">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.476L3 21l2.476-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Inicia la conversación
          </h3>
          <p className="text-gray-500 text-sm">
            Envía un mensaje para comenzar a chatear con tu cliente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${className}`}>
      {/* Contenedor de mensajes */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="Mensajes de la conversación"
      >
        {/* Indicador de carga superior */}
        {isLoading && hasMore && (
          <div className="flex justify-center py-2">
            <Loader size="sm" />
          </div>
        )}

        {/* Grupos de mensajes por día */}
        {messageGroups.map((group, groupIndex) => (
          <div key={group.day || groupIndex}>
            {/* Separador de día */}
            <DaySeparator date={group.day} />
            
            {/* Mensajes del día */}
            <div className="space-y-2">
              {group.messages.map((message, messageIndex) => {
                const prevMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null;
                const nextMessage = messageIndex < group.messages.length - 1 ? group.messages[messageIndex + 1] : null;
                
                // Determinar si debe mostrar avatar y timestamp
                const showAvatar = !nextMessage || nextMessage.senderId !== message.senderId;
                const showTimestamp = !prevMessage || 
                  prevMessage.senderId !== message.senderId ||
                  (new Date(message.timestamp) - new Date(prevMessage.timestamp)) > 5 * 60 * 1000; // 5 minutos
                
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === currentUserId}
                    showAvatar={showAvatar}
                    showTimestamp={showTimestamp}
                    className={`
                      ${!prevMessage || prevMessage.senderId !== message.senderId ? 'mt-4' : 'mt-1'}
                    `}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Indicador de escritura */}
        {isTyping && typingUser && (
          <TypingIndicator user={typingUser} />
        )}

        {/* Referencia para auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Botón para ir al final */}
      {!isNearBottom && (
        <div className="absolute bottom-20 right-4 z-10">
          <button
            onClick={() => scrollToBottom()}
            className="
              bg-sage-600 text-white p-2 rounded-full shadow-lg
              hover:bg-sage-700 transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2
            "
            aria-label="Ir al final de la conversación"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// Hook para gestionar mensajes
export const useMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Cargar mensajes iniciales
  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simular carga de mensajes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Datos mock
        const mockMessages = [
          {
            id: 'msg-1',
            content: 'Hola, tengo una consulta sobre mi próxima sesión',
            timestamp: '2024-01-15T14:30:00Z',
            senderId: 'CL001',
            senderName: 'Ana García',
            isRead: true,
            type: 'text'
          },
          {
            id: 'msg-2',
            content: 'Hola Ana, claro. ¿En qué te puedo ayudar?',
            timestamp: '2024-01-15T14:32:00Z',
            senderId: 'therapist',
            senderName: 'Dr. Martínez',
            isRead: true,
            type: 'text'
          },
          {
            id: 'msg-3',
            content: '¿Podríamos cambiar la hora? Me surgió un compromiso laboral',
            timestamp: '2024-01-15T14:35:00Z',
            senderId: 'CL001',
            senderName: 'Ana García',
            isRead: true,
            type: 'text'
          },
          {
            id: 'msg-4',
            content: 'Por supuesto. ¿Qué horario te vendría mejor?',
            timestamp: '2024-01-15T14:36:00Z',
            senderId: 'therapist',
            senderName: 'Dr. Martínez',
            isRead: true,
            type: 'text'
          },
          {
            id: 'msg-5',
            content: '¿Podría ser a las 16:00 en lugar de las 14:00?',
            timestamp: '2024-01-15T14:40:00Z',
            senderId: 'CL001',
            senderName: 'Ana García',
            isRead: false,
            type: 'text'
          }
        ];
        
        setMessages(mockMessages);
        setHasMore(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  // Enviar mensaje
  const sendMessage = async (content, type = 'text', attachments = []) => {
    try {
      const newMessage = {
        id: `msg-${Date.now()}`,
        content,
        timestamp: new Date().toISOString(),
        senderId: 'therapist',
        senderName: 'Dr. Martínez',
        isRead: false,
        type,
        attachments
      };

      setMessages(prev => [...prev, newMessage]);
      
      // Aquí se enviaría el mensaje al servidor
      // await api.sendMessage(conversationId, newMessage);
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Marcar mensaje como leído
  const markAsRead = (messageId) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
  };

  // Cargar más mensajes (paginación)
  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    
    try {
      setIsLoading(true);
      // Simular carga de mensajes anteriores
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En una implementación real, aquí se cargarían más mensajes
      setHasMore(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    hasMore,
    error,
    sendMessage,
    markAsRead,
    loadMore
  };
};