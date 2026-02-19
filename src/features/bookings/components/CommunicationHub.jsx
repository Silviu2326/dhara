import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Send, 
  Paperclip,
  Smile,
  Clock,
  Check,
  CheckCheck,
  User,
  Video,
  Calendar,
  Bell,
  BellOff,
  Star,
  Archive,
  Search,
  Filter,
  MoreVertical,
  PhoneCall,
  VideoIcon
} from 'lucide-react';

const CommunicationHub = ({
  selectedBooking,
  bookings = [],
  clients = [],
  isLoadingClients = false,
  onSendMessage,
  onMakeCall,
  onScheduleReminder,
  messages = [],
  templates = []
}) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Default templates
  const defaultTemplates = [
    {
      id: 'confirmation',
      name: 'Confirmación de Cita',
      content: 'Hola {clientName}, te escribo para confirmar tu cita del {date} a las {time}. ¿Podrías confirmarme tu asistencia? Gracias.'
    },
    {
      id: 'reminder_24h',
      name: 'Recordatorio 24h',
      content: 'Hola {clientName}, te recordamos que mañana {date} a las {time} tienes tu cita de {therapyType}. ¡Te esperamos!'
    },
    {
      id: 'reminder_2h',
      name: 'Recordatorio 2h',
      content: 'Hola {clientName}, te recordamos que en 2 horas ({time}) tienes tu cita. Si necesitas reprogramar, por favor avísanos con tiempo.'
    },
    {
      id: 'reschedule_offer',
      name: 'Oferta de Reprogramación',
      content: 'Hola {clientName}, se ha liberado un hueco el {newDate} a las {newTime}. ¿Te gustaría cambiar tu cita? Confirma si te interesa.'
    },
    {
      id: 'session_follow_up',
      name: 'Seguimiento Post-Sesión',
      content: 'Hola {clientName}, espero que estés bien después de nuestra sesión. Si tienes alguna pregunta o necesitas algo, no dudes en contactarme.'
    },
    {
      id: 'payment_reminder',
      name: 'Recordatorio de Pago',
      content: 'Hola {clientName}, te escribo para recordarte el pago pendiente de la sesión del {date}. Puedes realizarlo por transferencia o en la próxima cita.'
    }
  ];

  const allTemplates = [...defaultTemplates, ...templates];

  // Generate conversations from real clients data
  const [conversations, setConversations] = useState([]);

  const [selectedConversation, setSelectedConversation] = useState(null);

  // Generate conversations from clients data
  useEffect(() => {
    if (clients.length > 0) {
      const clientConversations = clients.map((client, index) => {
        const recentBooking = bookings.find(booking => booking.clientId === client.id);
        const hasRecentMessage = Math.random() > 0.5; // Random mock for demo

        return {
          clientId: client.id,
          clientName: client.name,
          lastMessage: hasRecentMessage ? 'Gracias por la sesión' : '',
          timestamp: new Date(Date.now() - (1000 * 60 * (30 + index * 15))),
          unreadCount: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
          status: Math.random() > 0.6 ? 'online' : 'offline',
          avatar: client.avatar || null,
          phone: client.phone,
          email: client.email,
          tags: client.tags || [],
          messagesCount: client.messagesCount || 0,
          messages: hasRecentMessage ? [
            {
              id: 1,
              sender: 'client',
              content: '¿Podríamos cambiar la próxima cita?',
              timestamp: new Date(Date.now() - 1000 * 60 * 60),
              status: 'read'
            },
            {
              id: 2,
              sender: 'therapist',
              content: 'Por supuesto, ¿qué día te viene mejor?',
              timestamp: new Date(Date.now() - 1000 * 60 * 45),
              status: 'delivered'
            },
            {
              id: 3,
              sender: 'client',
              content: 'Gracias por la sesión',
              timestamp: new Date(Date.now() - 1000 * 60 * 30),
              status: 'read'
            }
          ] : []
        };
      });

      // Sort by most recent activity
      clientConversations.sort((a, b) => b.timestamp - a.timestamp);

      console.log('💬 Generated conversations from clients:', clientConversations.length);
      setConversations(clientConversations);
    }
  }, [clients, bookings]);

  useEffect(() => {
    if (selectedBooking && !selectedConversation) {
      const conversation = conversations.find(c => c.clientId === selectedBooking.clientId);
      if (conversation) {
        setSelectedConversation(conversation);
      } else {
        // Create new conversation
        const newConversation = {
          clientId: selectedBooking.clientId,
          clientName: selectedBooking.clientName,
          lastMessage: '',
          timestamp: new Date(),
          unreadCount: 0,
          status: 'offline',
          avatar: selectedBooking.clientAvatar,
          messages: []
        };
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
      }
    }
  }, [selectedBooking, selectedConversation, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const newMessage = {
      id: Date.now(),
      sender: 'therapist',
      content: messageText,
      timestamp: new Date(),
      status: 'sending'
    };

    // Update conversation
    setConversations(prev => prev.map(conv => 
      conv.clientId === selectedConversation.clientId 
        ? {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: messageText,
            timestamp: new Date()
          }
        : conv
    ));

    setSelectedConversation(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    setMessageText('');

    try {
      // Simulate sending message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update message status
      setConversations(prev => prev.map(conv => 
        conv.clientId === selectedConversation.clientId 
          ? {
              ...conv,
              messages: conv.messages.map(msg => 
                msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
              )
            }
          : conv
      ));

      setSelectedConversation(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
        )
      }));

      if (onSendMessage) {
        onSendMessage(selectedConversation.clientId, messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Update message status to failed
      setConversations(prev => prev.map(conv => 
        conv.clientId === selectedConversation.clientId 
          ? {
              ...conv,
              messages: conv.messages.map(msg => 
                msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg
              )
            }
          : conv
      ));
    }
  };

  const handleUseTemplate = (template) => {
    let content = template.content;
    
    if (selectedBooking) {
      content = content
        .replace('{clientName}', selectedBooking.clientName)
        .replace('{date}', new Date(selectedBooking.date).toLocaleDateString('es-ES'))
        .replace('{time}', selectedBooking.startTime)
        .replace('{therapyType}', selectedBooking.therapyType);
    }
    
    setMessageText(content);
    setSelectedTemplate('');
  };

  const handleMakeCall = (phone, type = 'voice') => {
    if (type === 'video') {
      // Open video call interface
      console.log('Starting video call to:', phone);
    } else {
      window.open(`tel:${phone}`, '_self');
    }
    
    if (onMakeCall) {
      onMakeCall(selectedConversation.clientId, type);
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor((now - messageTime) / (1000 * 60));
      return `${minutes}m`;
    } else if (diffInHours < 24) {
      return messageTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageTime.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <span className="text-red-500 text-xs">!</span>;
      default:
        return null;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || conv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="h-[650px] flex">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Conversaciones</h3>
                <p className="text-sm text-gray-500 mt-1">Comunícate con tus clientes</p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    activeTab === 'chat'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar conversaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="all">📋 Todos los clientes</option>
                <option value="online">🟢 En línea</option>
                <option value="offline">⚫ Desconectados</option>
              </select>
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingClients ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-500 mb-4"></div>
                <span className="text-gray-600 font-medium">Cargando clientes...</span>
                <span className="text-gray-400 text-sm mt-1">Esto puede tomar unos segundos</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-700 mb-2">No hay conversaciones</h4>
                <p className="text-sm">Los clientes aparecerán aquí cuando tengas</p>
                <p className="text-sm">conversaciones activas</p>
              </div>
            ) : (
              filteredConversations.map(conversation => (
              <div
                key={conversation.clientId}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-white hover:shadow-sm ${
                  selectedConversation?.clientId === conversation.clientId
                    ? 'bg-white border-l-4 border-l-blue-500 shadow-sm'
                    : 'hover:border-l-4 hover:border-l-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {conversation.avatar ? (
                      <img src={conversation.avatar} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100" />
                    ) : (
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-sm ${
                      conversation.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.clientName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(conversation.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage || 'Sin mensajes'}
                        </p>
                        {conversation.tags && conversation.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {conversation.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                                {tag}
                              </span>
                            ))}
                            {conversation.tags.length > 2 && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                                +{conversation.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {conversation.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-md animate-pulse">
                            {conversation.unreadCount}
                          </span>
                        )}
                        {conversation.messagesCount > 0 && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            {conversation.messagesCount} 💬
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {selectedConversation.avatar ? (
                        <img src={selectedConversation.avatar} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-md" />
                      ) : (
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                          <User className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-sm ${
                        selectedConversation.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {selectedConversation.clientName}
                      </h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            selectedConversation.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                          }`} />
                          <p className="text-sm text-gray-600">
                            {selectedConversation.status === 'online' ? 'En línea' : 'Desconectado'}
                          </p>
                        </div>
                        {selectedConversation.tags && selectedConversation.tags.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                            {selectedConversation.tags[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    {selectedConversation.email && (
                      <div className="flex items-center space-x-2 text-xs text-gray-600 bg-white px-3 py-2 rounded-lg shadow-sm">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span>{selectedConversation.email}</span>
                      </div>
                    )}
                    {selectedConversation.phone && (
                      <div className="flex items-center space-x-2 text-xs text-gray-600 bg-white px-3 py-2 rounded-lg shadow-sm">
                        <Phone className="h-4 w-4 text-green-500" />
                        <span>{selectedConversation.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {selectedConversation.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-4 shadow-md">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="font-semibold text-gray-700 mb-2">¡Inicia la conversación!</h4>
                    <p className="text-sm text-center">Envía el primer mensaje a {selectedConversation.clientName}</p>
                  </div>
                ) : (
                  selectedConversation.messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'therapist' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                          message.sender === 'therapist'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-100'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <div className={`flex items-center justify-between mt-2 ${
                          message.sender === 'therapist' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.sender === 'therapist' && (
                            <span className="ml-2">
                              {getMessageStatusIcon(message.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-gray-100 bg-white">
                {/* Templates */}
                {allTemplates.length > 0 && (
                  <div className="mb-4">
                    <select
                      value={selectedTemplate}
                      onChange={(e) => {
                        const template = allTemplates.find(t => t.id === e.target.value);
                        if (template) {
                          handleUseTemplate(template);
                        }
                      }}
                      className="text-sm border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    >
                      <option value="">📝 Usar plantilla...</option>
                      {allTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Escribe tu mensaje aquí..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Adjuntar archivo"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span className="font-medium">Enviar</span>
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Handle file upload
                      console.log('File selected:', file);
                    }
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
              <div className="text-center p-12">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MessageSquare className="h-10 w-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Centro de Comunicación</h3>
                <p className="text-gray-500 mb-1">Selecciona una conversación para comenzar</p>
                <p className="text-sm text-gray-400">Comunícate de forma directa con tus clientes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { CommunicationHub };