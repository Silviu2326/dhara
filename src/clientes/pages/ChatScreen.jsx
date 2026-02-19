import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  IoChatbubblesOutline,
  IoSearchOutline,
  IoSendOutline,
  IoAttachOutline,
  IoArrowBack,
  IoEllipsisVertical,
  IoCheckmarkDone,
  IoCheckmark,
} from "react-icons/io5";
import { chatService } from "../../services/api/chatService";

const ChatScreen = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const mockConversations = [
    {
      id: 1,
      therapist: {
        id: "therapist-1",
        name: "Dra. María García",
        specialty: "Psicología Clínica",
        avatar: null,
        online: true,
      },
      lastMessage: {
        content: "Hola, ¿cómo te sientes hoy?",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        senderId: "therapist-1",
        isRead: false,
      },
      unreadCount: 2,
    },
    {
      id: 2,
      therapist: {
        id: "therapist-2",
        name: "Dr. Carlos López",
        specialty: "Psicoterapia",
        avatar: null,
        online: false,
      },
      lastMessage: {
        content: "Recuerda hacer los ejercicios de respiración",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        senderId: "therapist-2",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      id: 3,
      therapist: {
        id: "therapist-3",
        name: "Dra. Ana Martínez",
        specialty: "Psicología Infantil",
        avatar: null,
        online: true,
      },
      lastMessage: {
        content: "Nos vemos la próxima semana 😊",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        senderId: "therapist-3",
        isRead: true,
      },
      unreadCount: 1,
    },
  ];

  const mockMessages = {
    1: [
      {
        id: 1,
        content: "Hola Doctora, espero esté teniendo un buen día",
        senderId: "me",
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        status: "read",
      },
      {
        id: 2,
        content: "Hola! Muchas gracias, sí ha sido un día productivo 😊",
        senderId: "therapist-1",
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        status: "read",
      },
      {
        id: 3,
        content: "Quería contarle que esta semana me he sentido mucho mejor",
        senderId: "me",
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        status: "read",
      },
      {
        id: 4,
        content:
          "Eso es excelente! Me alegra mucho escuchar eso. ¿Qué ha sido lo que más te ha ayudado?",
        senderId: "therapist-1",
        timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        status: "read",
      },
      {
        id: 5,
        content:
          "Los ejercicios de respiración han sido increíbles. Los hago todas las mañanas",
        senderId: "me",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: "read",
      },
      {
        id: 6,
        content: "Perfecto! Mantener una rutina es clave para el progreso",
        senderId: "therapist-1",
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        status: "read",
      },
      {
        id: 7,
        content: "¿Cómo te sientes hoy en general?",
        senderId: "therapist-1",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: "delivered",
      },
    ],
    2: [
      {
        id: 1,
        content: "Doctor, ¿cómo está usted hoy?",
        senderId: "me",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: "read",
      },
      {
        id: 2,
        content: "¡Hola! Todo muy bien por aquí, gracias por preguntar",
        senderId: "therapist-2",
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
        status: "read",
      },
      {
        id: 3,
        content: "Recuerda hacer los ejercicios de respiración que practicamos",
        senderId: "therapist-2",
        timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
        status: "read",
      },
    ],
    3: [
      {
        id: 1,
        content: "Doctora, wanted agradecerle por todo su apoyo",
        senderId: "me",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "read",
      },
      {
        id: 2,
        content:
          "Por favor, no tienes que agradecerme. Es mi trabajo y me encanta ayudar",
        senderId: "therapist-3",
        timestamp: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000,
        ).toISOString(),
        status: "read",
      },
      {
        id: 3,
        content: "Nos vemos la próxima semana 😊",
        senderId: "therapist-3",
        timestamp: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
        ).toISOString(),
        status: "read",
      },
    ],
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        const response = await chatService.getConversations();
        if (response?.conversations) {
          setConversations(response.conversations);
        } else {
          throw new Error("No conversations");
        }
      } catch (apiError) {
        console.log("Using mock conversations");
        setConversations(mockConversations);
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
      setConversations(mockConversations);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      setMessages([]);

      try {
        const response = await chatService.getMessages(conversationId);
        if (response?.messages) {
          setMessages(response.messages);
        } else {
          throw new Error("No messages");
        }
      } catch (apiError) {
        console.log("Using mock messages");
        setMessages(mockMessages[conversationId] || []);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
      setMessages(mockMessages[conversationId] || []);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messagePayload = {
      id: Date.now(),
      content: newMessage.trim(),
      senderId: "me",
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    setMessages((prev) => [...prev, messagePayload]);
    setNewMessage("");

    try {
      await chatService.sendMessage({
        conversationId: selectedConversation.id,
        content: messagePayload.content,
        type: "text",
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messagePayload.id ? { ...msg, status: "read" } : msg,
        ),
      );

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: {
                  content: messagePayload.content,
                  timestamp: messagePayload.timestamp,
                  senderId: "me",
                  isRead: false,
                },
              }
            : conv,
        ),
      );
    } catch (err) {
      console.log("Message sent (mock):", messagePayload);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);

    if (conversation.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv,
        ),
      );
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      conv.therapist.name.toLowerCase().includes(search) ||
      conv.therapist.specialty.toLowerCase().includes(search) ||
      conv.lastMessage?.content.toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin w-10 h-10 border-4 border-sage border-t-transparent rounded-full mb-4"></div>
          <p className="text-muted">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {!selectedConversation ? (
        <>
          <div className="w-full md:w-80 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h1 className="text-xl font-bold text-deep mb-3">Mensajes</h1>
              <div className="relative">
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar conversaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <IoChatbubblesOutline className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-muted text-sm">No hay conversaciones</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {getInitials(conversation.therapist.name)}
                        </span>
                      </div>
                      {conversation.therapist.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-deep text-sm truncate">
                          {conversation.therapist.name}
                        </h3>
                        <span className="text-xs text-muted flex-shrink-0 ml-2">
                          {formatTime(conversation.lastMessage?.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-muted mb-1">
                        {conversation.therapist.specialty}
                      </p>
                      <p
                        className={`text-sm truncate ${
                          conversation.unreadCount > 0
                            ? "text-deep font-medium"
                            : "text-muted"
                        }`}
                      >
                        {conversation.lastMessage?.content}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-sage text-white text-xs font-medium rounded-full">
                          {conversation.unreadCount}
                        </span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <IoChatbubblesOutline className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-deep mb-2">
                Selecciona una conversación
              </h2>
              <p className="text-muted text-sm">
                Elige un terapeuta para comenzar a chatear
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 -ml-2 text-muted hover:text-deep transition-colors"
              >
                <IoArrowBack className="w-5 h-5" />
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {getInitials(selectedConversation.therapist.name)}
                  </span>
                </div>
                {selectedConversation.therapist.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-deep text-sm">
                  {selectedConversation.therapist.name}
                </h3>
                <p className="text-xs text-muted">
                  {selectedConversation.therapist.online
                    ? "En línea"
                    : selectedConversation.therapist.specialty}
                </p>
              </div>
              <button className="p-2 text-muted hover:text-deep transition-colors">
                <IoEllipsisVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-6 h-6 border-2 border-sage border-t-transparent rounded-full"></div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isMe = message.senderId === "me";
                  const showTime =
                    index === 0 ||
                    new Date(message.timestamp) -
                      new Date(messages[index - 1].timestamp) >
                      5 * 60 * 1000;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] ${
                          isMe
                            ? "bg-sage text-white rounded-2xl rounded-br-sm"
                            : "bg-gray-100 text-deep rounded-2xl rounded-bl-sm"
                        } px-4 py-2.5`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 ${
                            isMe ? "text-white/70" : "text-muted"
                          }`}
                        >
                          {showTime && (
                            <span className="text-xs">
                              {formatTime(message.timestamp)}
                            </span>
                          )}
                          {isMe && (
                            <span>
                              {message.status === "read" ? (
                                <IoCheckmarkDone className="w-4 h-4" />
                              ) : message.status === "delivered" ? (
                                <IoCheckmarkDone className="w-4 h-4" />
                              ) : (
                                <IoCheckmark className="w-4 h-4" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100">
              <div className="flex items-end gap-2">
                <button className="p-2 text-muted hover:text-sage transition-colors">
                  <IoAttachOutline className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    rows={1}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-sage text-white rounded-full hover:bg-sage/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IoSendOutline className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatScreen;
