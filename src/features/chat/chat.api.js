// Chat API interface using the integrated services
import { chatService } from '../../services/api/chatService';
import { clientService } from '../../services/api/clientService';
import { notificationService } from '../../services/api/notificationService';

// Initialize services
export const initializeChatApi = async () => {
  await chatService.initialize();
  await clientService.initialize();
  await notificationService.initialize();
};

// Conversations
export const getConversations = async (filters = {}) => {
  try {
    const response = await chatService.getConversations({
      status: filters.status,
      search: filters.search,
      limit: filters.limit || 50,
      includeLastMessage: true,
      decryptSensitiveData: true
    });
    return response;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

export const createConversation = async (conversationData) => {
  try {
    return await chatService.createConversation(conversationData, {
      encryptSensitiveData: true,
      createAuditLog: true,
      notifyParticipants: true
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const archiveConversation = async (conversationId, reason = 'user_request') => {
  try {
    return await chatService.archiveConversation(conversationId, {
      reason,
      createAuditLog: true
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    throw error;
  }
};

// Messages
export const getMessages = async (conversationId, options = {}) => {
  try {
    return await chatService.getMessages(conversationId, {
      limit: options.limit || 50,
      offset: options.offset || 0,
      decryptSensitiveData: true,
      ...options
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const sendMessage = async (messageData) => {
  try {
    return await chatService.sendMessage(messageData, {
      encryptSensitiveData: true,
      moderateContent: true,
      deliveryConfirmation: true,
      createAuditLog: true
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const editMessage = async (messageId, newContent) => {
  try {
    return await chatService.editMessage(messageId, newContent, {
      moderateContent: true,
      createAuditLog: true
    });
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId, reason = 'user_request') => {
  try {
    return await chatService.deleteMessage(messageId, {
      reason,
      createAuditLog: true,
      notifyParticipants: true
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

export const markAsRead = async (messageId, readerId) => {
  try {
    return await chatService.markMessageAsRead(messageId, readerId, {
      createAuditLog: false
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// File handling
export const uploadAttachment = async (file, options = {}) => {
  try {
    return await chatService.uploadAttachment(file, options);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
};

// Search
export const searchMessages = async (searchParams) => {
  try {
    return await chatService.searchMessages(searchParams);
  } catch (error) {
    console.error('Error searching messages:', error);
    throw error;
  }
};

export const searchClients = async (searchTerm, options = {}) => {
  try {
    return await clientService.searchClients(searchTerm, {
      searchFields: ['name', 'email', 'phone'],
      limit: 10,
      exactMatch: false,
      includeInactive: false,
      ...options
    });
  } catch (error) {
    console.error('Error searching clients:', error);
    throw error;
  }
};

// Real-time functionality
export const sendTypingIndicator = async (conversationId, isTyping = true) => {
  try {
    return await chatService.sendTypingIndicator(conversationId, isTyping);
  } catch (error) {
    console.error('Error sending typing indicator:', error);
    throw error;
  }
};

// Event listeners
export const addChatEventListener = (event, callback) => {
  chatService.on(event, callback);
};

export const removeChatEventListener = (event, callback) => {
  chatService.off(event, callback);
};

// Notifications
export const sendNotification = async (notificationData) => {
  try {
    return await notificationService.sendNotification(notificationData);
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Utility functions
export const getChatService = () => chatService;
export const getClientService = () => clientService;
export const getNotificationService = () => notificationService;

// Export constants from chat service
export const MESSAGE_TYPES = chatService.messageTypes;
export const MESSAGE_STATES = chatService.messageStates;
export const CONVERSATION_STATES = chatService.conversationStates;
export const PARTICIPANT_ROLES = chatService.participantRoles;