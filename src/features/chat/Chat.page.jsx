import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ConversationsList,
  useConversations,
} from "./components/ConversationsList";
import { ConversationsSearch } from "./components/ConversationsSearch";
import {
  ConversationsFilter,
  useConversationsFilter,
} from "./components/ConversationsFilter";
import { ChatHeader } from "./components/ChatHeader";
import { MessagesPane, useMessages } from "./components/MessagesPane";
import { MessageInput } from "./components/MessageInput";
import { TypingIndicatorContainer } from "./components/TypingIndicator";
import { chatService } from "../../services/api/chatService";
import { clientService } from "../../services/api/clientService";
import { notificationService } from "../../services/api/notificationService";
import { documentService } from "../../services/api/documentService";
import { auditLogService } from "../../services/api/auditLogService";

export const Chat = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Estados para el chat
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Referencias para cleanup
  const wsEventListeners = useRef([]);
  const typingTimeoutRef = useRef(null);
  const currentUserId = "therapist"; // TODO: Get from auth context

  // Usar hooks personalizados como fallback
  const {
    activeFilter,
    setActiveFilter,
    conversationCounts,
    filteredConversations,
  } = useConversationsFilter(conversations);

  // Inicializar chat service y WebSocket
  useEffect(() => {
    const initializeChatService = async () => {
      try {
        setIsLoading(true);

        // Inicializar servicios
        await chatService.initialize();
        await clientService.initialize();
        await notificationService.initialize();

        // Configurar event listeners de WebSocket
        const listeners = [
          {
            event: "connected",
            handler: () => {
              console.log("Chat connected");
              setIsConnected(true);
              setError(null);
            },
          },
          {
            event: "disconnected",
            handler: (data) => {
              console.log("Chat disconnected:", data);
              setIsConnected(false);
            },
          },
          {
            event: "message_received",
            handler: (message) => {
              handleIncomingMessage(message);
            },
          },
          {
            event: "message_status_updated",
            handler: (statusUpdate) => {
              handleMessageStatusUpdate(statusUpdate);
            },
          },
          {
            event: "typing",
            handler: (typingData) => {
              handleTypingIndicator(typingData);
            },
          },
          {
            event: "conversation_updated",
            handler: (conversationData) => {
              handleConversationUpdate(conversationData);
            },
          },
          {
            event: "user_status_changed",
            handler: (userStatus) => {
              handleUserStatusChange(userStatus);
            },
          },
          {
            event: "error",
            handler: (error) => {
              console.error("Chat error:", error);
              setError(error);
            },
          },
        ];

        // Registrar listeners
        listeners.forEach(({ event, handler }) => {
          chatService.on(event, handler);
          wsEventListeners.current.push({ event, handler });
        });

        // Cargar conversaciones iniciales
        await loadConversations();

        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing chat service:", error);
        setError(error);
        setIsLoading(false);
      }
    };

    initializeChatService();

    // Cleanup al desmontar
    return () => {
      wsEventListeners.current.forEach(({ event, handler }) => {
        chatService.off(event, handler);
      });
      wsEventListeners.current = [];
    };
  }, []);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Cargar conversaciones cuando cambia el filtro o búsqueda
  useEffect(() => {
    if (chatService.isInitialized) {
      loadConversations();
    }
  }, [activeFilter, searchTerm]);

  // Cargar mensajes cuando cambia la conversación seleccionada
  useEffect(() => {
    if (selectedConversation?.id) {
      loadMessages(selectedConversation.id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation?.id]);

  // Funciones de carga de datos - Ahora usa el hook useConversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("💬 Loading conversations with real clients...");

      // En lugar de usar chatService.getConversations (que no existe),
      // usamos clientService para generar conversaciones como en useConversations
      const { clientService } =
        await import("../../services/api/clientService");

      const clientsResponse = await clientService.getClients({
        therapistId: "68ce20c17931a40b74af366a",
        status: "active",
        limit: 50,
      });

      console.log("💬 Loaded clients for conversations:", clientsResponse);

      // Crear conversaciones usando la misma lógica que useConversations
      const realConversations = clientsResponse.clients.map((client) => {
        const conversationId = `conv-${client.id}`;
        const hasRecentActivity = Math.random() > 0.3;
        const unreadCount = hasRecentActivity
          ? Math.floor(Math.random() * 3)
          : 0;

        const mockMessages = [
          "Hola, tengo una consulta sobre mi próxima sesión",
          "Gracias por la sesión de hoy, me ayudó mucho",
          "¿Podríamos cambiar la hora de mañana?",
          "Perfecto, nos vemos la próxima semana",
          "Me siento mejor desde nuestras sesiones",
          "Tengo algunas dudas sobre el ejercicio que me mandaste",
          "Muchas gracias por todo el apoyo",
          "Creo que estoy progresando bien",
          "¿Podríamos hablar sobre mis últimos síntomas?",
          "La técnica que me enseñaste está funcionando",
        ];

        return {
          id: conversationId,
          client: {
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            avatar: null,
            isOnline: Math.random() > 0.5,
            status: client.status,
            rating: client.rating,
            tags: client.tags || [],
            sessionsCount: client.sessionsCount || 0,
          },
          lastMessage: hasRecentActivity
            ? {
                id: `msg-${conversationId}-${Date.now()}`,
                content:
                  mockMessages[Math.floor(Math.random() * mockMessages.length)],
                timestamp: new Date(
                  Date.now() - Math.random() * 24 * 60 * 60 * 1000,
                ).toISOString(),
                senderId: Math.random() > 0.6 ? client.id : "therapist",
                isRead: unreadCount === 0,
              }
            : null,
          unreadCount,
          nextSession: hasRecentActivity
            ? new Date(
                Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000,
              ).toISOString()
            : null,
          isFavorite: client.rating >= 4.5,
          isArchived: false,
          isPriority:
            client.tags?.includes("urgente") ||
            client.tags?.includes("crisis") ||
            false,
          therapyType: client.tags?.[0] || "Terapia general",
          clientNotes: client.notes || "",
        };
      });

      // Filtrar según el filtro activo
      let filteredConversations = realConversations;
      if (activeFilter !== "all") {
        filteredConversations = realConversations.filter((conv) => {
          switch (activeFilter) {
            case "unread":
              return conv.unreadCount > 0;
            case "today":
              const today = new Date().toDateString();
              return (
                conv.lastMessage &&
                new Date(conv.lastMessage.timestamp).toDateString() === today
              );
            default:
              return true;
          }
        });
      }

      // Filtrar por búsqueda
      if (searchTerm) {
        filteredConversations = filteredConversations.filter(
          (conv) =>
            conv.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conv.client.email
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (conv.lastMessage?.content || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()),
        );
      }

      // Ordenar por actividad reciente
      const sortedConversations = filteredConversations.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return (
          new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
        );
      });

      setConversations(sortedConversations);
      console.log(
        "💬 Conversations loaded successfully:",
        sortedConversations.length,
      );
    } catch (error) {
      console.error("💬 Error loading conversations:", error);
      setError(error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, searchTerm]);

  const loadMessages = useCallback(
    async (conversationId) => {
      try {
        setMessagesLoading(true);
        setError(null);

        console.log("💬 Loading messages for conversation:", conversationId);

        // Intentar usar chatService.getMessages primero
        try {
          const response = await chatService.getMessages(conversationId, {
            limit: 50,
            decryptSensitiveData: true,
          });

          setMessages(response.messages || []);
          console.log(
            "💬 Messages loaded from chatService:",
            response.messages?.length || 0,
          );
        } catch (chatServiceError) {
          console.warn(
            "💬 ChatService.getMessages failed, generating mock messages:",
            chatServiceError,
          );

          // Fallback: generar mensajes mock para la conversación
          const conversation = conversations.find(
            (c) => c.id === conversationId,
          );
          const mockMessages = [];

          if (conversation) {
            // Generar algunos mensajes de ejemplo
            const messageTemplates = [
              {
                senderId: conversation.client.id,
                content: "Hola, ¿cómo está?",
              },
              {
                senderId: "therapist",
                content: "Hola, muy bien. ¿Cómo te has sentido esta semana?",
              },
              {
                senderId: conversation.client.id,
                content:
                  "He estado practicando los ejercicios que me recomendaste",
              },
              {
                senderId: "therapist",
                content:
                  "Excelente, me alegra saberlo. ¿Has notado algún cambio?",
              },
              {
                senderId: conversation.client.id,
                content: "Sí, me siento un poco más tranquilo",
              },
              {
                senderId: "therapist",
                content:
                  "Eso es muy positivo. Continuemos trabajando en esa dirección.",
              },
            ];

            messageTemplates.forEach((template, index) => {
              mockMessages.push({
                id: `msg-${conversationId}-${index}`,
                conversationId,
                senderId: template.senderId,
                content: template.content,
                type: chatService.messageTypes?.TEXT || "text",
                sentAt: new Date(
                  Date.now() -
                    (messageTemplates.length - index) * 60 * 60 * 1000,
                ).toISOString(),
                status: chatService.messageStates?.READ || "read",
                readAt: new Date(
                  Date.now() -
                    (messageTemplates.length - index - 1) * 60 * 60 * 1000,
                ).toISOString(),
              });
            });

            // Agregar el último mensaje si existe
            if (conversation.lastMessage) {
              mockMessages.push({
                id: conversation.lastMessage.id,
                conversationId,
                senderId: conversation.lastMessage.senderId,
                content: conversation.lastMessage.content,
                type: chatService.messageTypes?.TEXT || "text",
                sentAt: conversation.lastMessage.timestamp,
                status: conversation.lastMessage.isRead
                  ? chatService.messageStates?.READ || "read"
                  : chatService.messageStates?.DELIVERED || "delivered",
                readAt: conversation.lastMessage.isRead
                  ? conversation.lastMessage.timestamp
                  : null,
              });
            }
          }

          setMessages(mockMessages);
          console.log("💬 Generated mock messages:", mockMessages.length);
        }
      } catch (error) {
        console.error("💬 Error loading messages:", error);
        setError(error);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    },
    [conversations],
  );

  // Event handlers para WebSocket
  const handleIncomingMessage = useCallback(
    (message) => {
      setMessages((prev) => {
        // Evitar duplicados
        const exists = prev.find((m) => m.id === message.id);
        if (exists) return prev;

        return [...prev, message].sort(
          (a, b) => new Date(a.sentAt) - new Date(b.sentAt),
        );
      });

      // Actualizar última actividad de la conversación
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? { ...conv, lastMessage: message, lastActivity: message.sentAt }
            : conv,
        ),
      );

      // Enviar notificación si el mensaje no es del usuario actual
      if (message.senderId !== currentUserId) {
        notificationService.sendNotification({
          title: "Nuevo mensaje",
          body: message.content || "Archivo adjunto",
          tag: `chat_${message.conversationId}`,
          data: {
            conversationId: message.conversationId,
            messageId: message.id,
          },
        });
      }
    },
    [currentUserId],
  );

  const handleMessageStatusUpdate = useCallback((statusUpdate) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === statusUpdate.messageId
          ? { ...msg, status: statusUpdate.status, readAt: statusUpdate.readAt }
          : msg,
      ),
    );
  }, []);

  const handleTypingIndicator = useCallback((typingData) => {
    setTypingUsers((prev) => {
      const newSet = new Set(prev);
      if (typingData.isTyping) {
        newSet.add(typingData.userId);
      } else {
        newSet.delete(typingData.userId);
      }
      return newSet;
    });

    // Limpiar automáticamente después de 3 segundos
    if (typingData.isTyping) {
      setTimeout(() => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(typingData.userId);
          return newSet;
        });
      }, 3000);
    }
  }, []);

  const handleConversationUpdate = useCallback((conversationData) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationData.id
          ? { ...conv, ...conversationData }
          : conv,
      ),
    );
  }, []);

  const handleUserStatusChange = useCallback((userStatus) => {
    setOnlineUsers((prev) => {
      const newSet = new Set(prev);
      if (userStatus.isOnline) {
        newSet.add(userStatus.userId);
      } else {
        newSet.delete(userStatus.userId);
      }
      return newSet;
    });
  }, []);

  // Funciones de chat
  const markAsRead = useCallback(
    async (conversationId) => {
      try {
        const conversation = conversations.find((c) => c.id === conversationId);
        if (!conversation || !conversation.lastMessage) return;

        await chatService.markMessageAsRead(
          conversation.lastMessage.id,
          currentUserId,
        );

        // Actualizar estado local
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
          ),
        );
      } catch (error) {
        console.error("Error marking conversation as read:", error);
      }
    },
    [conversations, currentUserId],
  );

  const markMessageAsRead = useCallback(
    async (messageId) => {
      try {
        await chatService.markMessageAsRead(messageId, currentUserId);
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    },
    [currentUserId],
  );

  // Manejar selección de conversación
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    // Marcar conversación como leída
    if (conversation.unreadCount > 0) {
      markAsRead(conversation.id);
    }
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Filtrar conversaciones por búsqueda
  const searchFilteredConversations = filteredConversations.filter(
    (conversation) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        conversation.client.name.toLowerCase().includes(searchLower) ||
        conversation.client.email.toLowerCase().includes(searchLower) ||
        (conversation.lastMessage?.content || "")
          .toLowerCase()
          .includes(searchLower)
      );
    },
  );

  // Manejar envío de mensaje
  const handleSendMessage = async (messageData) => {
    if (!selectedConversation) return;

    try {
      setError(null);

      // Preparar datos del mensaje
      const messagePayload = {
        conversationId: selectedConversation.id,
        senderId: currentUserId,
        type:
          messageData.attachments?.length > 0
            ? messageData.content
              ? chatService.messageTypes.TEXT
              : getAttachmentMessageType(messageData.attachments[0])
            : chatService.messageTypes.TEXT,
        content: messageData.content || null,
        attachment: messageData.attachments?.[0] || null,
      };

      // Enviar mensaje usando chatService
      const sentMessage = await chatService.sendMessage(messagePayload, {
        encryptSensitiveData: true,
        moderateContent: true,
        deliveryConfirmation: true,
        createAuditLog: true,
      });

      // Actualizar mensajes localmente (optimistic update)
      setMessages((prev) => [...prev, sentMessage]);

      // Actualizar última actividad de la conversación
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: sentMessage,
                lastActivity: sentMessage.sentAt,
              }
            : conv,
        ),
      );

      console.log("Message sent successfully:", sentMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      setError(error);

      // Mostrar notificación de error
      notificationService.sendNotification({
        title: "Error",
        body: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
        type: "error",
      });
    }
  };

  // Función auxiliar para determinar tipo de mensaje por attachment
  const getAttachmentMessageType = (attachment) => {
    if (!attachment) return chatService.messageTypes.TEXT;

    const fileType = chatService.getFileType(attachment.name);
    switch (fileType) {
      case "IMAGE":
        return chatService.messageTypes.IMAGE;
      case "AUDIO":
        return chatService.messageTypes.AUDIO;
      case "VIDEO":
        return chatService.messageTypes.VIDEO;
      default:
        return chatService.messageTypes.FILE;
    }
  };

  // Manejar eventos de escritura
  const handleTypingStart = useCallback(() => {
    if (!selectedConversation) return;

    console.log("User started typing");
    chatService.sendTypingIndicator(selectedConversation.id, true);

    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing después de 3 segundos de inactividad
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  }, [selectedConversation]);

  const handleTypingStop = useCallback(() => {
    if (!selectedConversation) return;

    console.log("User stopped typing");
    chatService.sendTypingIndicator(selectedConversation.id, false);

    // Limpiar timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [selectedConversation]);

  // Manejar adjuntos
  const handleAttachFile = useCallback(async (file) => {
    try {
      console.log("Uploading file:", file.name);
      setError(null);

      // Validar archivo
      chatService.validateFile(file);

      // Subir archivo usando chatService
      const uploadResult = await chatService.uploadAttachment(file, {
        maxSize: null, // Usar límites por defecto del servicio
        allowedTypes: null, // Usar tipos permitidos por defecto
      });

      console.log("File uploaded successfully:", uploadResult);

      // El archivo se adjuntará automáticamente al próximo mensaje
      return uploadResult;
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error);

      // Mostrar notificación de error
      notificationService.sendNotification({
        title: "Error de subida",
        body: `No se pudo subir el archivo: ${error.message}`,
        type: "error",
      });

      throw error;
    }
  }, []);

  // Funciones adicionales de chat
  const handleCreateConversation = useCallback(
    async (clientId) => {
      try {
        console.log("💬 Creating conversation for client:", clientId);

        // Verificar si ya existe una conversación con este cliente
        const existingConversation = conversations.find(
          (conv) => conv.client.id === clientId,
        );
        if (existingConversation) {
          console.log("💬 Found existing conversation:", existingConversation);
          setSelectedConversation(existingConversation);
          return existingConversation;
        }

        // Obtener información del cliente
        const client = await clientService.getClient(clientId, {
          includeStatistics: true,
          decryptSensitiveData: false,
        });

        console.log("💬 Client data for new conversation:", client);

        // Crear nueva conversación usando chatService
        let newConversation;
        try {
          newConversation = await chatService.createConversation({
            participants: [
              {
                id: currentUserId,
                role: chatService.participantRoles?.THERAPIST || "therapist",
              },
              {
                id: clientId,
                role: chatService.participantRoles?.CLIENT || "client",
              },
            ],
            type: "therapy_session",
            createdBy: currentUserId,
            title: `Chat con ${client.name}`,
            metadata: {
              clientId: clientId,
              therapistId: currentUserId,
              clientName: client.name,
              clientEmail: client.email,
            },
          });
        } catch (chatServiceError) {
          console.warn(
            "💬 ChatService failed, creating local conversation:",
            chatServiceError,
          );

          // Fallback: crear conversación local si chatService falla
          newConversation = {
            id: `conv-${clientId}-${Date.now()}`,
            client: {
              id: client.id,
              name: client.name,
              email: client.email,
              phone: client.phone,
              avatar: null,
              isOnline: false,
              status: client.status,
              rating: client.rating,
              tags: client.tags || [],
              sessionsCount: client.sessionsCount || 0,
            },
            lastMessage: null,
            unreadCount: 0,
            nextSession: null,
            isFavorite: client.rating >= 4.5,
            isArchived: false,
            isPriority: false,
            therapyType: client.tags?.[0] || "Terapia general",
            clientNotes: client.notes || "",
            createdAt: new Date().toISOString(),
            type: "therapy_session",
          };
        }

        // Actualizar lista de conversaciones
        setConversations((prev) => [newConversation, ...prev]);
        setSelectedConversation(newConversation);

        console.log("💬 Conversation created successfully:", newConversation);
        return newConversation;
      } catch (error) {
        console.error("💬 Error creating conversation:", error);
        setError(error);

        // Mostrar notificación de error
        notificationService.sendNotification({
          title: "Error",
          body: `No se pudo crear la conversación: ${error.message}`,
          type: "error",
        });

        throw error;
      }
    },
    [currentUserId, conversations],
  );

  const handleSearchClients = useCallback(
    async (searchTerm) => {
      try {
        if (!searchTerm || searchTerm.length < 2) return [];

        console.log("🔍 Searching clients for chat:", searchTerm);

        const results = await clientService.searchClients(searchTerm, {
          searchFields: ["name", "email", "phone"],
          limit: 10,
          exactMatch: false,
          includeInactive: false,
        });

        console.log("🔍 Client search results:", results);

        // Formatear resultados para el chat
        const formattedResults = results.map((client) => ({
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          avatar: client.avatar || null,
          status: client.status,
          tags: client.tags || [],
          rating: client.rating,
          sessionsCount: client.sessionsCount || 0,
          lastSession: client.lastSession || null,
          hasActiveConversation: conversations.some(
            (conv) => conv.client.id === client.id,
          ),
        }));

        return formattedResults;
      } catch (error) {
        console.error("Error searching clients:", error);

        // Fallback: buscar en conversaciones existentes si la API falla
        const localResults = conversations
          .filter(
            (conv) =>
              conv.client.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              conv.client.email
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
          )
          .map((conv) => ({
            ...conv.client,
            hasActiveConversation: true,
          }));

        return localResults;
      }
    },
    [conversations],
  );

  // Función para agregar métodos de utilidad adicionales
  const chatUtils = {
    // Obtener estado de conexión
    getConnectionStatus: () => isConnected,

    // Obtener estadísticas del chat
    getChatStats: () => chatService.getStats(),

    // Limpiar cache del chat
    clearChatCache: () => chatService.clearCache(),

    // Desconectar WebSocket
    disconnect: () => chatService.disconnect(),

    // Obtener usuarios en línea
    getOnlineUsers: () => Array.from(onlineUsers),

    // Obtener usuarios escribiendo
    getTypingUsers: () => Array.from(typingUsers),

    // Refrescar conversaciones
    refreshConversations: loadConversations,

    // Refrescar mensajes
    refreshMessages: (conversationId) => loadMessages(conversationId),

    // Crear nueva conversación
    createNewConversation: handleCreateConversation,

    // Buscar clientes
    searchForClients: handleSearchClients,
  };

  // Pasar utilidades a componentes hijos si es necesario
  const chatContextValue = {
    ...chatUtils,
    conversations,
    messages,
    selectedConversation,
    isLoading,
    messagesLoading,
    error,
    isConnected,
    typingUsers,
    onlineUsers,
    currentUserId,
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar de conversaciones */}
      <div
        className={`
        ${isMobile ? "fixed inset-y-0 left-0 z-50" : "relative"}
        ${isSidebarOpen ? "w-full sm:w-72 md:w-80" : "w-0"}
        transition-all duration-300 ease-in-out
        bg-white border-r border-gray-200 flex flex-col
        ${isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"}
      `}
      >
        {/* Header del sidebar */}
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Chat</h1>
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label="Cerrar sidebar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Buscador */}
          <ConversationsSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            className="mb-2 sm:mb-3"
          />

          {/* Filtros */}
          <ConversationsFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            conversationCounts={conversationCounts}
          />
        </div>

        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-hidden">
          <ConversationsList
            conversations={searchFilteredConversations}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleConversationSelect}
            onCreateConversation={handleCreateConversation}
            onSearchClients={handleSearchClients}
            isLoading={isLoading}
            searchTerm={searchTerm}
            filter={activeFilter}
            onlineUsers={onlineUsers}
            error={error}
          />
        </div>
      </div>

      {/* Overlay para móvil */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Área principal del chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Header del chat */}
            <ChatHeader
              client={selectedConversation.client}
              conversation={selectedConversation}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              showSidebarToggle={isMobile || !isSidebarOpen}
              isConnected={isConnected}
              onlineUsers={onlineUsers}
            />

            {/* Área de mensajes */}
            <div className="flex-1 flex flex-col min-h-0">
              <MessagesPane
                messages={messages}
                currentUserId={currentUserId}
                conversation={selectedConversation}
                isLoading={messagesLoading}
                onMessageRead={markMessageAsRead}
                onLoadMoreMessages={() => loadMessages(selectedConversation.id)}
                className="flex-1"
                error={error}
              />

              {/* Indicador de escritura */}
              <TypingIndicatorContainer
                conversationId={selectedConversation.id}
                typingUsers={typingUsers}
                currentUserId={currentUserId}
                className="px-4 py-2"
              />

              {/* Input de mensaje */}
              <MessageInput
                onSendMessage={handleSendMessage}
                onAttachFile={handleAttachFile}
                onTypingStart={handleTypingStart}
                onTypingStop={handleTypingStop}
                isConnected={isConnected}
                disabled={messagesLoading}
              />
            </div>
          </>
        ) : (
          /* Estado vacío */
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md mx-auto w-full">
              {/* Botón para abrir sidebar en móvil */}
              {isMobile && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="mb-4 sm:mb-6 bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-colors duration-200 w-full sm:w-auto"
                >
                  Ver conversaciones
                </button>
              )}

              {/* Icono y mensaje */}
              <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg
                  className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>

              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Selecciona una conversación
              </h2>

              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Elige una conversación de la lista para comenzar a chatear con
                tu cliente.
              </p>

              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                  <div className="text-xl sm:text-2xl font-bold text-sage-600 mb-1">
                    {conversationCounts.all}
                  </div>
                  <div className="text-gray-600 text-xs sm:text-sm">
                    Conversaciones
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                    {conversationCounts.unread}
                  </div>
                  <div className="text-gray-600 text-xs sm:text-sm">
                    Sin leer
                  </div>
                </div>
              </div>

              {/* Indicador de estado de conexión */}
              <div className="mt-4 flex items-center justify-center">
                <div
                  className={`flex items-center space-x-2 text-xs ${isConnected ? "text-green-600" : "text-red-600"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span>{isConnected ? "Conectado" : "Desconectado"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notificación de error global */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Error de chat</p>
              <p className="text-sm">
                {error.message || "Ha ocurrido un error inesperado"}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600 focus:outline-none"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
