import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = ({ user }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [isInChatView, setIsInChatView] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 380;
  const isTablet = screenWidth > 600;
  const isWeb = Platform.OS === 'web';

  // Responsive measurements
  const getResponsiveSize = (size) => {
    const scale = screenWidth / 375; // Base iPhone width
    return Math.max(size * scale, size * 0.8); // Min 80% of original size
  };

  const getResponsivePadding = (padding) => {
    if (isSmallScreen) return padding * 0.8;
    if (isTablet) return padding * 1.2;
    return padding;
  };

  const chats = [
    {
      id: 1,
      name: 'Dr. María González',
      lastMessage: 'Hola, ¿cómo te sientes hoy?',
      time: '10:30 AM',
      unread: 2,
      avatar: 'M',
      avatarColor: '#8CA48F',
      specialty: 'Psicología Clínica',
      online: true,
      messages: [
        { id: 1, text: 'Hola Doctora, espero esté teniendo un buen día', sender: 'me', time: '9:30 AM', read: true },
        { id: 2, text: 'Hola! Muchas gracias, sí ha sido un día productivo 😊', sender: 'them', time: '9:45 AM', read: true },
        { id: 3, text: 'Quería contarle que esta semana me he sentido mucho mejor', sender: 'me', time: '9:50 AM', read: true },
        { id: 4, text: 'Eso es excelente! Me alegra mucho escuchar eso. ¿Qué ha sido lo que más te ha ayudado?', sender: 'them', time: '9:55 AM', read: true },
        { id: 5, text: 'Los ejercicios de respiración han sido increíbles. Los hago todas las mañanas', sender: 'me', time: '10:00 AM', read: true },
        { id: 6, text: 'Perfecto! Mantener una rutina es clave para el progreso', sender: 'them', time: '10:05 AM', read: true },
        { id: 7, text: 'También he estado escribiendo en el diario como me sugirió', sender: 'me', time: '10:10 AM', read: true },
        { id: 8, text: '¡Excelente! ¿Has notado algún patrón en tus pensamientos?', sender: 'them', time: '10:15 AM', read: true },
        { id: 9, text: 'Sí, me doy cuenta que por las tardes tiendo a ser más ansioso', sender: 'me', time: '10:20 AM', read: true },
        { id: 10, text: 'Muy buena observación. Podemos trabajar estrategias específicas para esos momentos', sender: 'them', time: '10:25 AM', read: true },
        { id: 11, text: 'Me parece perfecto. ¿Podríamos hablar de eso en la próxima sesión?', sender: 'me', time: '10:28 AM', read: true },
        { id: 12, text: 'Por supuesto. ¿Cómo te sientes hoy en general?', sender: 'them', time: '10:30 AM', read: false },
        { id: 13, text: 'También, recuerda que nuestra próxima sesión es mañana a las 3:00 PM', sender: 'them', time: '10:31 AM', read: false },
      ]
    },
    {
      id: 2,
      name: 'Dr. Carlos Ruiz',
      lastMessage: 'Recuerda hacer los ejercicios de respiración',
      time: 'Ayer',
      unread: 0,
      avatar: 'C',
      avatarColor: '#C9A2A6',
      specialty: 'Psicoterapia',
      online: false,
      messages: [
        { id: 1, text: 'Doctor, ¿cómo está usted hoy?', sender: 'me', time: 'Ayer 1:30 PM', read: true },
        { id: 2, text: '¡Hola! Todo muy bien por aquí, gracias por preguntar ¿Cómo va todo contigo?', sender: 'them', time: 'Ayer 1:45 PM', read: true },
        { id: 3, text: 'Bastante bien doctor. Esta semana he tenido menos episodios de ansiedad', sender: 'me', time: 'Ayer 2:00 PM', read: true },
        { id: 4, text: 'Eso es una excelente noticia! ¿Has estado aplicando las técnicas que trabajamos?', sender: 'them', time: 'Ayer 2:15 PM', read: true },
        { id: 5, text: 'Sí, especialmente la técnica de los 5-4-3-2-1 cuando siento que viene la ansiedad', sender: 'me', time: 'Ayer 2:20 PM', read: true },
        { id: 6, text: 'Perfecto! Esa técnica de grounding es muy efectiva. ¿Te está funcionando bien?', sender: 'them', time: 'Ayer 2:25 PM', read: true },
        { id: 7, text: 'Mucho! Me ayuda a centrarme en el presente y calmarme', sender: 'me', time: 'Ayer 2:30 PM', read: true },
        { id: 8, text: 'Me alegra escuchar eso. También quiero que sigas con la meditación diaria', sender: 'them', time: 'Ayer 2:35 PM', read: true },
        { id: 9, text: 'Sí doctor, he estado meditando 15 minutos cada mañana', sender: 'me', time: 'Ayer 2:40 PM', read: true },
        { id: 10, text: 'Excelente constancia! ¿Has notado cambios en tu estado de ánimo general?', sender: 'them', time: 'Ayer 2:45 PM', read: true },
        { id: 11, text: 'Definitivamente me siento más tranquilo durante el día', sender: 'me', time: 'Ayer 2:50 PM', read: true },
        { id: 12, text: 'Eso es justo lo que esperábamos lograr. Sigues haciendo un excelente trabajo', sender: 'them', time: 'Ayer 2:55 PM', read: true },
        { id: 13, text: 'Recuerda hacer los ejercicios de respiración que practicamos', sender: 'them', time: 'Ayer 3:00 PM', read: true },
      ]
    },
    {
      id: 3,
      name: 'Dra. Ana Martín',
      lastMessage: 'Nos vemos la próxima semana 😊',
      time: '2 días',
      unread: 1,
      avatar: 'A',
      avatarColor: '#D58E6E',
      specialty: 'Psicología Infantil',
      online: true,
      messages: [
        { id: 1, text: 'Doctora, quería agradecerle por todo su apoyo con mi hijo', sender: 'me', time: '2 días 10:15 AM', read: true },
        { id: 2, text: 'Por favor, no tienes que agradecerme. Es mi trabajo y me encanta ayudar', sender: 'them', time: '2 días 10:30 AM', read: true },
        { id: 3, text: 'Mi hijo se ha adaptado muy bien a las técnicas que le enseñó', sender: 'me', time: '2 días 10:35 AM', read: true },
        { id: 4, text: '¡Qué maravilloso! Los niños son increíbles para adaptarse y aprender', sender: 'them', time: '2 días 10:40 AM', read: true },
        { id: 5, text: 'Sí, ahora maneja mucho mejor sus emociones cuando está frustrado', sender: 'me', time: '2 días 10:45 AM', read: true },
        { id: 6, text: 'Eso es un progreso excelente. ¿Ha estado usando la técnica del semáforo?', sender: 'them', time: '2 días 10:50 AM', read: true },
        { id: 7, text: 'Sí! Le encanta y siempre me dice "mamá, estoy en amarillo" cuando se siente así', sender: 'me', time: '2 días 10:55 AM', read: true },
        { id: 8, text: 'Jajaja me encanta escuchar eso! Es exactamente como esperaba que funcionara', sender: 'them', time: '2 días 11:00 AM', read: true },
        { id: 9, text: 'Muchas gracias por la sesión de hoy, fue muy útil como siempre', sender: 'me', time: '2 días 11:15 AM', read: true },
        { id: 10, text: 'Me alegra mucho escucharte decir eso. Fue un placer trabajar contigo hoy', sender: 'them', time: '2 días 11:30 AM', read: true },
        { id: 11, text: 'Para la próxima semana, vamos a trabajar en nuevas estrategias de comunicación', sender: 'them', time: '2 días 11:45 AM', read: true },
        { id: 12, text: 'Perfecto, estaré esperando con muchas ganas', sender: 'me', time: '2 días 11:50 AM', read: true },
        { id: 13, text: 'Nos vemos la próxima semana 😊', sender: 'them', time: '2 días 12:00 PM', read: false },
      ]
    },
    {
      id: 4,
      name: 'Dr. Luis Fernández',
      lastMessage: 'El informe está listo para revisión',
      time: '3 días',
      unread: 0,
      avatar: 'L',
      avatarColor: '#A2B2C2',
      specialty: 'Neuropsicología',
      online: false,
      messages: [
        { id: 1, text: 'Doctor, buenos días. ¿Cómo está hoy?', sender: 'me', time: '3 días 8:30 AM', read: true },
        { id: 2, text: 'Buenos días! Muy bien, gracias. ¿Cómo has estado desde la última evaluación?', sender: 'them', time: '3 días 8:45 AM', read: true },
        { id: 3, text: 'Bastante bien, aunque aún tengo curiosidad por los resultados', sender: 'me', time: '3 días 9:00 AM', read: true },
        { id: 4, text: 'Es completamente normal esa curiosidad. Los resultados están casi listos', sender: 'them', time: '3 días 9:15 AM', read: true },
        { id: 5, text: '¿Aproximadamente cuándo estarán listos los resultados?', sender: 'me', time: '3 días 9:30 AM', read: true },
        { id: 6, text: 'Estoy terminando el análisis detallado. Te los tendré para mañana por la tarde', sender: 'them', time: '3 días 10:30 AM', read: true },
        { id: 7, text: 'Perfecto, muchas gracias por su dedicación doctor', sender: 'me', time: '3 días 10:35 AM', read: true },
        { id: 8, text: 'Para nada, es importante que tengas toda la información clara y completa', sender: 'them', time: '3 días 11:00 AM', read: true },
        { id: 9, text: '¿Hay algo que pueda hacer mientras tanto para prepararme?', sender: 'me', time: '3 días 11:15 AM', read: true },
        { id: 10, text: 'Solo mantente tranquilo. Los resultados son para ayudarte, no para juzgarte', sender: 'them', time: '3 días 11:30 AM', read: true },
        { id: 11, text: 'Eso me tranquiliza mucho, doctor. Gracias por recordármelo', sender: 'me', time: '3 días 12:00 PM', read: true },
        { id: 12, text: 'El informe está listo para revisión. Podemos programar una cita para revisarlo juntos', sender: 'them', time: '3 días 4:00 PM', read: true },
        { id: 13, text: 'Excelente! ¿Cuándo sería conveniente para usted?', sender: 'me', time: '3 días 4:15 PM', read: true },
        { id: 14, text: '¿Qué tal mañana a las 2:00 PM? Así tenemos tiempo suficiente para revisar todo', sender: 'them', time: '3 días 4:30 PM', read: true },
      ]
    }
  ];

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setIsInChatView(true);
  };

  const handleBackToChats = () => {
    setIsInChatView(false);
    setSelectedChat(null);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log('Enviando mensaje:', newMessage);
      setNewMessage('');
    }
  };

  const renderChatList = () => (
    <View style={styles.section}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Mensajes</Text>
        <TouchableOpacity style={styles.newChatButton}>
          <Ionicons name="create-outline" size={24} color="#8CA48F" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={18} color="#A2B2C2" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversaciones..."
            placeholderTextColor="#A2B2C2"
          />
        </View>
      </View>

      <ScrollView style={styles.chatsList} showsVerticalScrollIndicator={false}>
        {chats.map((chat, index) => (
          <TouchableOpacity
            key={chat.id}
            style={[
              styles.chatCard,
              index === chats.length - 1 && styles.lastChatCard
            ]}
            onPress={() => handleChatSelect(chat)}
            activeOpacity={0.7}
          >
            <View style={styles.chatCardContent}>
              <View style={styles.avatarContainer}>
                <View style={[styles.chatAvatar, { backgroundColor: chat.avatarColor }]}>
                  <Text style={styles.chatAvatarText}>{chat.avatar}</Text>
                </View>
                {chat.online && <View style={styles.onlineIndicator} />}
              </View>

              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>{chat.name}</Text>
                  <Text style={[
                    styles.chatTime,
                    chat.unread > 0 && styles.chatTimeUnread
                  ]}>
                    {chat.time}
                  </Text>
                </View>

                <View style={styles.chatPreview}>
                  <View style={styles.messagePreview}>
                    <Text style={styles.chatSpecialty}>{chat.specialty}</Text>
                    <Text
                      style={[
                        styles.chatLastMessage,
                        chat.unread > 0 && styles.chatLastMessageUnread
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {chat.lastMessage}
                    </Text>
                  </View>

                  {chat.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{chat.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderIndividualChat = () => (
    <View style={styles.chatContainer}>
      <View style={styles.chatHeaderIndividual}>
        <TouchableOpacity onPress={handleBackToChats} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2D3A4A" />
        </TouchableOpacity>

        <View style={styles.headerUserInfo}>
          <View style={styles.avatarContainer}>
            <View style={[styles.chatAvatarLarge, { backgroundColor: selectedChat?.avatarColor }]}>
              <Text style={styles.chatAvatarTextLarge}>{selectedChat?.avatar}</Text>
            </View>
            {selectedChat?.online && <View style={styles.onlineIndicatorLarge} />}
          </View>

          <View style={styles.chatInfoHeader}>
            <Text style={styles.chatNameHeader}>{selectedChat?.name}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: selectedChat?.online ? '#4CAF50' : '#BDBDBD' }]} />
              <Text style={[styles.chatStatus, { color: selectedChat?.online ? '#4CAF50' : '#BDBDBD' }]}>
                {selectedChat?.online ? 'En línea' : 'Desconectado'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#2D3A4A" />
        </TouchableOpacity>
      </View>

      <View style={styles.messagesWrapper}>
        <ScrollView
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        >
          {selectedChat?.messages.map((message, index) => (
            <View key={message.id} style={styles.messageGroup}>
              <View
                style={[
                  styles.messageContainer,
                  message.sender === 'me' ? styles.myMessage : styles.theirMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.sender === 'me' ? styles.myMessageText : styles.theirMessageText
                ]}>
                  {message.text}
                </Text>

                <View style={styles.messageFooter}>
                  <Text style={[
                    styles.messageTime,
                    message.sender === 'me' ? styles.myMessageTime : styles.theirMessageTime
                  ]}>
                    {message.time}
                  </Text>
                  {message.sender === 'me' && (
                    <View style={styles.messageStatus}>
                      <Ionicons
                        name={message.read ? "checkmark-done" : "checkmark"}
                        size={12}
                        color={message.read ? "#4CAF50" : "#BDBDBD"}
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.messageInputWrapper}>
        <View style={styles.messageInputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={22} color="#A2B2C2" />
          </TouchableOpacity>

          <TextInput
            style={styles.messageInput}
            placeholder="Escribir mensaje..."
            placeholderTextColor="#A2B2C2"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />

          <TouchableOpacity style={styles.emojiButton}>
            <Ionicons name="happy-outline" size={22} color="#A2B2C2" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sendButton,
              newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={18}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Create responsive styles
  const styles = StyleSheet.create({
  // Main Container Styles
  section: {
    flex: 1,
    paddingTop: getResponsivePadding(10),
    paddingHorizontal: getResponsivePadding(20),
    backgroundColor: '#FAFAFA',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(16),
    paddingHorizontal: getResponsivePadding(4),
  },
  sectionTitle: {
    fontSize: getResponsiveSize(isSmallScreen ? 28 : isTablet ? 36 : 32),
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  newChatButton: {
    width: getResponsiveSize(44),
    height: getResponsiveSize(44),
    borderRadius: getResponsiveSize(22),
    backgroundColor: 'rgba(140, 164, 143, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search Styles
  searchContainer: {
    marginBottom: getResponsivePadding(20),
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(16),
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: getResponsivePadding(12),
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveSize(16),
    color: '#1A1A1A',
    fontWeight: '400',
  },

  // Chat List Styles
  chatsList: {
    flex: 1,
  },
  chatCard: {
    backgroundColor: 'white',
    marginBottom: getResponsivePadding(12),
    borderRadius: getResponsiveSize(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lastChatCard: {
    marginBottom: getResponsivePadding(20),
  },
  chatCardContent: {
    flexDirection: 'row',
    padding: getResponsivePadding(20),
    alignItems: 'center',
  },

  // Avatar Styles
  avatarContainer: {
    position: 'relative',
    marginRight: getResponsivePadding(16),
  },
  chatAvatar: {
    width: getResponsiveSize(isSmallScreen ? 48 : 56),
    height: getResponsiveSize(isSmallScreen ? 48 : 56),
    borderRadius: getResponsiveSize(isSmallScreen ? 24 : 28),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chatAvatarText: {
    fontSize: getResponsiveSize(isSmallScreen ? 20 : 24),
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
  },
  chatAvatarLarge: {
    width: getResponsiveSize(isSmallScreen ? 40 : 48),
    height: getResponsiveSize(isSmallScreen ? 40 : 48),
    borderRadius: getResponsiveSize(isSmallScreen ? 20 : 24),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chatAvatarTextLarge: {
    fontSize: getResponsiveSize(isSmallScreen ? 16 : 20),
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: getResponsiveSize(isSmallScreen ? 12 : 16),
    height: getResponsiveSize(isSmallScreen ? 12 : 16),
    borderRadius: getResponsiveSize(isSmallScreen ? 6 : 8),
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  onlineIndicatorLarge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: getResponsiveSize(isSmallScreen ? 10 : 14),
    height: getResponsiveSize(isSmallScreen ? 10 : 14),
    borderRadius: getResponsiveSize(isSmallScreen ? 5 : 7),
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },

  // Chat Content Styles
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsivePadding(6),
  },
  chatName: {
    fontSize: getResponsiveSize(isSmallScreen ? 16 : 18),
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  chatNameHeader: {
    fontSize: getResponsiveSize(isSmallScreen ? 18 : 20),
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  chatTime: {
    fontSize: getResponsiveSize(isSmallScreen ? 11 : 13),
    color: '#8E8E93',
    fontWeight: '500',
  },
  chatTimeUnread: {
    color: '#8CA48F',
    fontWeight: '600',
  },

  // Message Preview Styles
  chatPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messagePreview: {
    flex: 1,
    marginRight: getResponsivePadding(8),
  },
  chatSpecialty: {
    fontSize: getResponsiveSize(isSmallScreen ? 11 : 13),
    color: '#8CA48F',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chatLastMessage: {
    fontSize: getResponsiveSize(isSmallScreen ? 13 : 15),
    color: '#8E8E93',
    lineHeight: getResponsiveSize(isSmallScreen ? 18 : 20),
    fontWeight: '400',
  },
  chatLastMessageUnread: {
    color: '#1A1A1A',
    fontWeight: '500',
  },

  // Badge Styles
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: getResponsiveSize(12),
    paddingHorizontal: getResponsivePadding(8),
    paddingVertical: getResponsivePadding(4),
    minWidth: getResponsiveSize(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: getResponsiveSize(isSmallScreen ? 10 : 12),
    color: 'white',
    fontWeight: '700',
  },

  // Individual Chat Header Styles
  chatHeaderIndividual: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: getResponsiveSize(44),
    height: getResponsiveSize(44),
    borderRadius: getResponsiveSize(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsivePadding(12),
    backgroundColor: 'rgba(140, 164, 143, 0.1)',
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatInfoHeader: {
    marginLeft: getResponsivePadding(12),
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: getResponsiveSize(8),
    height: getResponsiveSize(8),
    borderRadius: getResponsiveSize(4),
    marginRight: getResponsivePadding(6),
  },
  chatStatus: {
    fontSize: getResponsiveSize(isSmallScreen ? 12 : 14),
    fontWeight: '500',
  },
  moreButton: {
    width: getResponsiveSize(44),
    height: getResponsiveSize(44),
    borderRadius: getResponsiveSize(22),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(140, 164, 143, 0.1)',
  },

  // Messages Styles
  messagesWrapper: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(20),
  },
  messagesContent: {
    flexGrow: 1,
    paddingTop: getResponsivePadding(20),
    paddingBottom: getResponsivePadding(20),
    justifyContent: 'flex-end',
  },
  messageGroup: {
    marginBottom: getResponsivePadding(12),
  },
  messageContainer: {
    maxWidth: '85%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#8CA48F',
    borderRadius: getResponsiveSize(24),
    borderBottomRightRadius: getResponsiveSize(8),
    paddingHorizontal: getResponsivePadding(18),
    paddingVertical: getResponsivePadding(12),
    shadowColor: '#8CA48F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: getResponsiveSize(6),
    elevation: 3,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(24),
    borderBottomLeftRadius: getResponsiveSize(8),
    paddingHorizontal: getResponsivePadding(18),
    paddingVertical: getResponsivePadding(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: getResponsiveSize(6),
    elevation: 2,
  },
  messageText: {
    fontSize: getResponsiveSize(16),
    lineHeight: getResponsiveSize(22),
    fontWeight: '400',
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: '#1A1A1A',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: getResponsivePadding(6),
  },
  messageTime: {
    fontSize: getResponsiveSize(11),
    fontWeight: '500',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  theirMessageTime: {
    color: '#8E8E93',
  },
  messageStatus: {
    marginLeft: getResponsivePadding(4),
  },

  // Message Input Styles
  messageInputWrapper: {
    backgroundColor: 'white',
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: getResponsivePadding(12),
    paddingBottom: getResponsivePadding(isWeb ? 12 : 20),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F9FA',
    borderRadius: getResponsiveSize(28),
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(8),
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  attachButton: {
    width: getResponsiveSize(36),
    height: getResponsiveSize(36),
    borderRadius: getResponsiveSize(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsivePadding(8),
  },
  messageInput: {
    flex: 1,
    fontSize: getResponsiveSize(16),
    color: '#1A1A1A',
    maxHeight: getResponsiveSize(isTablet ? 160 : 120),
    paddingVertical: getResponsivePadding(8),
    paddingHorizontal: getResponsivePadding(4),
    fontWeight: '400',
    lineHeight: getResponsiveSize(20),
  },
  emojiButton: {
    width: getResponsiveSize(36),
    height: getResponsiveSize(36),
    borderRadius: getResponsiveSize(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: getResponsivePadding(8),
    marginRight: getResponsivePadding(8),
  },
  sendButton: {
    width: getResponsiveSize(36),
    height: getResponsiveSize(36),
    borderRadius: getResponsiveSize(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#8CA48F',
    shadowColor: '#8CA48F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: getResponsiveSize(6),
    elevation: 3,
  },
  sendButtonInactive: {
    backgroundColor: '#E5E5EA',
  },
});

  return isInChatView ? renderIndividualChat() : renderChatList();
};

export default ChatScreen;