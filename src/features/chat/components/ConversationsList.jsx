import React from 'react';
import { ConversationItem } from './ConversationItem';
import { Loader } from '../../../components/Loader';

export const ConversationsList = ({
  conversations = [],
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  onSearchClients,
  isLoading = false,
  searchTerm = '',
  filter = 'all',
  onlineUsers = new Set(),
  error = null
}) => {
  // Filtrar conversaciones según búsqueda y filtros
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = !searchTerm || 
      conversation.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = (() => {
      switch (filter) {
        case 'today':
          const today = new Date().toDateString();
          return conversation.lastMessage && 
            new Date(conversation.lastMessage.timestamp).toDateString() === today;
        case 'unread':
          return conversation.unreadCount > 0;
        case 'all':
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesFilter;
  });

  // Ordenar por última actividad
  const sortedConversations = filteredConversations.sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp) : new Date(0);
    const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp) : new Date(0);
    return bTime - aTime;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader size="sm" />
      </div>
    );
  }

  // Componente para buscar nuevos clientes
  const NewClientSearch = () => {
    const [searchingClients, setSearchingClients] = React.useState(false);
    const [clientResults, setClientResults] = React.useState([]);

    React.useEffect(() => {
      if (searchTerm && searchTerm.length >= 2 && onSearchClients) {
        setSearchingClients(true);
        onSearchClients(searchTerm)
          .then(results => {
            // Filtrar clientes que no tienen conversación activa
            const newClients = results.filter(client =>
              !conversations.some(conv => conv.client.id === client.id)
            );
            setClientResults(newClients);
          })
          .catch(err => {
            console.error('Error searching clients:', err);
            setClientResults([]);
          })
          .finally(() => setSearchingClients(false));
      } else {
        setClientResults([]);
      }
    }, [searchTerm]);

    if (searchingClients) {
      return (
        <div className="p-3 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sage-600 mx-auto mb-2"></div>
          <p className="text-xs text-gray-500">Buscando clientes...</p>
        </div>
      );
    }

    if (clientResults.length > 0) {
      return (
        <div className="border-t border-gray-200 pt-2">
          <div className="px-3 py-2">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Nuevos chats disponibles
            </h4>
          </div>
          <div className="space-y-1">
            {clientResults.slice(0, 3).map(client => (
              <div
                key={client.id}
                className="p-3 rounded-lg cursor-pointer hover:bg-gray-50 border border-dashed border-gray-300"
                onClick={() => onCreateConversation && onCreateConversation(client.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                    {client.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{client.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{client.email}</p>
                    {client.tags && client.tags[0] && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {client.tags[0]}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-sage-600">
                    Iniciar chat
                  </div>
                </div>
              </div>
            ))}
            {clientResults.length > 3 && (
              <div className="p-2 text-center">
                <p className="text-xs text-gray-500">
                  +{clientResults.length - 3} clientes más
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  if (sortedConversations.length === 0 && !searchTerm) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.476L3 21l2.476-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">
          No hay conversaciones activas
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Busca un cliente para iniciar una nueva conversación
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Conversaciones existentes */}
      {sortedConversations.length > 0 && (
        <>
          {sortedConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={conversation.id === selectedConversationId}
              onClick={() => onSelectConversation(conversation)}
            />
          ))}
        </>
      )}

      {/* Búsqueda de nuevos clientes */}
      <NewClientSearch />

      {/* Estado cuando no hay resultados */}
      {sortedConversations.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">
            No se encontraron conversaciones para "{searchTerm}"
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Intenta buscar con otros términos
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-6">
          <div className="text-red-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.348 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 text-sm">Error al cargar conversaciones</p>
          <p className="text-red-500 text-xs mt-1">{error.message}</p>
        </div>
      )}
    </div>
  );
};

// Hook personalizado para gestionar conversaciones usando clientService
export const useConversations = () => {
  const [conversations, setConversations] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // Cargar conversaciones con clientes reales
    const loadConversations = async () => {
      try {
        setIsLoading(true);

        // Importar clientService dinámicamente para evitar problemas de dependencias circulares
        const { clientService } = await import('../../../services/api/clientService');

        // Obtener clientes reales
        const clientsResponse = await clientService.getClients({
          therapistId: '68ce20c17931a40b74af366a', // ID del terapeuta actual
          status: 'active',
          limit: 50
        });

        console.log('💬 Loading real clients for chat:', clientsResponse);

        // Crear conversaciones ficticias pero con clientes reales
        const realConversations = clientsResponse.clients.map((client, index) => {
          const conversationId = `conv-${client.id}`;
          const hasRecentActivity = Math.random() > 0.3; // 70% probabilidad de actividad reciente
          const unreadCount = hasRecentActivity ? Math.floor(Math.random() * 3) : 0;

          const mockMessages = [
            'Hola, tengo una consulta sobre mi próxima sesión',
            'Gracias por la sesión de hoy, me ayudó mucho',
            '¿Podríamos cambiar la hora de mañana?',
            'Perfecto, nos vemos la próxima semana',
            'Me siento mejor desde nuestras sesiones',
            'Tengo algunas dudas sobre el ejercicio que me mandaste',
            'Muchas gracias por todo el apoyo',
            'Creo que estoy progresando bien',
            '¿Podríamos hablar sobre mis últimos síntomas?',
            'La técnica que me enseñaste está funcionando'
          ];

          return {
            id: conversationId,
            client: {
              id: client.id,
              name: client.name,
              email: client.email,
              phone: client.phone,
              avatar: null,
              isOnline: Math.random() > 0.5, // 50% online
              status: client.status,
              rating: client.rating,
              tags: client.tags || [],
              sessionsCount: client.sessionsCount || 0
            },
            lastMessage: hasRecentActivity ? {
              id: `msg-${conversationId}-${Date.now()}`,
              content: mockMessages[Math.floor(Math.random() * mockMessages.length)],
              timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Último día
              senderId: Math.random() > 0.6 ? client.id : 'therapist', // 60% mensajes del cliente
              isRead: unreadCount === 0
            } : null,
            unreadCount,
            nextSession: hasRecentActivity ?
              new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : // Próximos 7 días
              null,
            isFavorite: client.rating >= 4.5,
            isArchived: false,
            isPriority: client.tags?.includes('urgente') || client.tags?.includes('crisis') || false,
            therapyType: client.tags?.[0] || 'Terapia general',
            clientNotes: client.notes || ''
          };
        });

        // Ordenar por actividad reciente
        const sortedConversations = realConversations.sort((a, b) => {
          if (!a.lastMessage && !b.lastMessage) return 0;
          if (!a.lastMessage) return 1;
          if (!b.lastMessage) return -1;
          return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
        });

        console.log('💬 Created conversations from real clients:', sortedConversations);
        setConversations(sortedConversations);

      } catch (err) {
        console.error('Error loading conversations with real clients:', err);
        setError(err.message);

        // Fallback a datos mock si falla
        console.log('💬 Falling back to mock conversations');
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  const markAsRead = (conversationId) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  };

  const updateLastMessage = (conversationId, message) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, lastMessage: message }
          : conv
      )
    );
  };

  return {
    conversations,
    isLoading,
    error,
    markAsRead,
    updateLastMessage
  };
};