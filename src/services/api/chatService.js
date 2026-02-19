import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { errorHandler } from '../utils/errorHandler';
import { privacy } from '../utils/privacy';
import { security } from '../utils/security';
import { auditService } from '../utils/auditService';

class ChatService {
  constructor() {
    this.baseEndpoint = 'chat';
    this.cachePrefix = 'chat_';
    this.cacheTags = ['chat', 'messages', 'conversations'];
    this.defaultCacheTTL = 300;
    this.isInitialized = false;
    this.wsConnection = null;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;

    this.messageTypes = {
      TEXT: 'text',
      IMAGE: 'image',
      FILE: 'file',
      AUDIO: 'audio',
      VIDEO: 'video',
      SYSTEM: 'system',
      APPOINTMENT_REQUEST: 'appointment_request',
      PAYMENT_REQUEST: 'payment_request',
      FORM_REQUEST: 'form_request'
    };

    this.messageStates = {
      PENDING: 'pending',
      SENT: 'sent',
      DELIVERED: 'delivered',
      READ: 'read',
      FAILED: 'failed',
      DELETED: 'deleted'
    };

    this.conversationStates = {
      ACTIVE: 'active',
      ARCHIVED: 'archived',
      BLOCKED: 'blocked',
      MUTED: 'muted',
      ENDED: 'ended'
    };

    this.participantRoles = {
      THERAPIST: 'therapist',
      CLIENT: 'client',
      ADMIN: 'admin',
      SYSTEM: 'system'
    };

    this.moderationActions = {
      APPROVE: 'approve',
      REJECT: 'reject',
      FLAG: 'flag',
      WARN: 'warn',
      BLOCK: 'block'
    };

    this.contentFlags = {
      INAPPROPRIATE: 'inappropriate',
      SPAM: 'spam',
      HARASSMENT: 'harassment',
      SENSITIVE_INFO: 'sensitive_info',
      EXTERNAL_LINKS: 'external_links',
      PROFANITY: 'profanity'
    };

    this.fileTypes = {
      IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
      AUDIO: ['mp3', 'wav', 'ogg', 'm4a'],
      VIDEO: ['mp4', 'webm', 'avi', 'mov']
    };

    this.maxFileSizes = {
      IMAGE: 5 * 1024 * 1024,    // 5MB
      DOCUMENT: 10 * 1024 * 1024, // 10MB
      AUDIO: 50 * 1024 * 1024,   // 50MB
      VIDEO: 100 * 1024 * 1024   // 100MB
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing ChatService');

      // Initialize WebSocket connection
      await this.initializeWebSocket();

      // Setup message moderation
      this.setupMessageModeration();

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize ChatService', error);
      throw error;
    }
  }

  async initializeWebSocket() {
    try {
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        return;
      }

      const wsUrl = this.buildWebSocketUrl();
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        logger.info('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          logger.error('Failed to parse WebSocket message', error);
        }
      };

      this.wsConnection.onclose = (event) => {
        logger.warn('WebSocket connection closed', { code: event.code, reason: event.reason });
        this.emit('disconnected', { code: event.code, reason: event.reason });
        this.handleReconnection();
      };

      this.wsConnection.onerror = (error) => {
        logger.error('WebSocket connection error', error);
        this.emit('error', error);
      };
    } catch (error) {
      logger.error('Failed to initialize WebSocket', error);
      throw error;
    }
  }

  buildWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/chat`;
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'message':
        this.handleIncomingMessage(data.payload);
        break;
      case 'message_status':
        this.handleMessageStatusUpdate(data.payload);
        break;
      case 'typing':
        this.handleTypingIndicator(data.payload);
        break;
      case 'conversation_update':
        this.handleConversationUpdate(data.payload);
        break;
      case 'user_online':
        this.handleUserOnlineStatus(data.payload);
        break;
      default:
        logger.debug('Unhandled WebSocket message type', data.type);
    }
  }

  handleIncomingMessage(message) {
    // Update cache
    this.invalidateConversationCache(message.conversationId);

    // Emit event for UI updates
    this.emit('message_received', message);

    // Log for audit
    privacy.logDataAccess(
      message.senderId,
      'chat_message',
      'receive',
      { messageId: message.id, conversationId: message.conversationId }
    );
  }

  handleMessageStatusUpdate(statusUpdate) {
    this.emit('message_status_updated', statusUpdate);
  }

  handleTypingIndicator(typingData) {
    this.emit('typing', typingData);
  }

  handleConversationUpdate(conversationData) {
    this.invalidateConversationCache(conversationData.id);
    this.emit('conversation_updated', conversationData);
  }

  handleUserOnlineStatus(userStatus) {
    this.emit('user_status_changed', userStatus);
  }

  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      this.emit('reconnection_failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.initializeWebSocket();
    }, delay);
  }

  async createConversation(conversationData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        createAuditLog = true,
        notifyParticipants = true
      } = options;

      logger.info('Creating conversation', {
        participants: conversationData.participants?.length || 0,
        type: conversationData.type
      });

      // Validate conversation data
      this.validateConversationData(conversationData);

      let processedData = {
        ...conversationData,
        conversationId: security.generateSecureId('conv_'),
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: this.conversationStates.ACTIVE,
        messageCount: 0
      };

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          processedData.createdBy,
          processedData.conversationId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.conversationId;
      }

      const sanitizedData = privacy.sanitizeForLogging(processedData);
      logger.info('Creating conversation with sanitized data', { data: sanitizedData });

      const response = await apiClient.post(
        ENDPOINTS.chat.createConversation,
        processedData
      );

      const conversation = response.data;

      // Notify participants
      if (notifyParticipants) {
        await this.notifyConversationCreated(conversation.id);
      }

      this.invalidateCache(['chat', 'conversations']);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'conversation',
          entityId: conversation.id,
          action: 'create_conversation',
          details: {
            participants: conversationData.participants,
            type: conversationData.type
          },
          userId: conversationData.createdBy
        });
      }

      logger.info('Conversation created successfully', {
        conversationId: conversation.id
      });

      return conversation;
    } catch (error) {
      logger.error('Failed to create conversation', error);
      throw errorHandler.handle(error);
    }
  }

  async sendMessage(messageData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        moderateContent = true,
        deliveryConfirmation = true,
        createAuditLog = true
      } = options;

      logger.info('Sending message', {
        conversationId: messageData.conversationId,
        messageType: messageData.type,
        hasAttachment: !!messageData.attachment
      });

      // Validate message data
      this.validateMessageData(messageData);

      // Moderate content if enabled
      if (moderateContent && messageData.content) {
        const moderationResult = await this.moderateContent(messageData.content);
        if (!moderationResult.approved) {
          throw errorHandler.createValidationError(
            'Message content rejected by moderation',
            moderationResult.violations
          );
        }
      }

      let processedData = {
        ...messageData,
        messageId: security.generateSecureId('msg_'),
        status: this.messageStates.PENDING,
        sentAt: new Date().toISOString(),
        editedAt: null,
        isEdited: false
      };

      // Handle file attachments
      if (messageData.attachment) {
        const uploadResult = await this.uploadAttachment(messageData.attachment);
        processedData.attachment = uploadResult;
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          messageData.senderId,
          processedData.messageId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.messageId;
      }

      const response = await apiClient.post(
        ENDPOINTS.chat.sendMessage,
        processedData
      );

      const message = response.data;

      // Send via WebSocket for real-time delivery
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          type: 'send_message',
          payload: message
        }));
      }

      // Request delivery confirmation
      if (deliveryConfirmation) {
        setTimeout(() => {
          this.requestDeliveryConfirmation(message.id);
        }, 1000);
      }

      this.invalidateConversationCache(messageData.conversationId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'chat_message',
          entityId: message.id,
          action: 'send_message',
          details: {
            conversationId: messageData.conversationId,
            messageType: messageData.type,
            hasAttachment: !!messageData.attachment
          },
          userId: messageData.senderId
        });
      }

      privacy.logDataAccess(
        messageData.senderId,
        'chat_message',
        'send',
        { messageId: message.id, conversationId: messageData.conversationId }
      );

      logger.info('Message sent successfully', {
        messageId: message.id,
        conversationId: messageData.conversationId
      });

      return message;
    } catch (error) {
      logger.error('Failed to send message', error);
      throw errorHandler.handle(error);
    }
  }

  async getConversation(conversationId, options = {}) {
    try {
      const {
        decryptSensitiveData = true,
        includeMessages = true,
        messageLimit = 50,
        messageOffset = 0
      } = options;

      const cacheKey = `${this.cachePrefix}conversation_${conversationId}`;
      let conversation = cache.get(cacheKey);

      if (!conversation) {
        logger.info('Fetching conversation from API', { conversationId });

        const params = {
          include_messages: includeMessages,
          message_limit: messageLimit,
          message_offset: messageOffset
        };

        const response = await apiClient.get(
          ENDPOINTS.chat.getConversation.replace(':id', conversationId),
          { params }
        );

        conversation = response.data;
        cache.set(cacheKey, conversation, this.defaultCacheTTL, this.cacheTags);
      }

      if (decryptSensitiveData && conversation._encryptionKeyId) {
        try {
          const encryptionKey = await privacy.generateEncryptionKey(
            conversation.createdBy,
            conversation._encryptionKeyId
          );
          conversation = await privacy.decryptSensitiveData(conversation, encryptionKey);

          // Decrypt messages if included
          if (conversation.messages) {
            conversation.messages = await Promise.all(
              conversation.messages.map(async (message) => {
                if (message._encryptionKeyId) {
                  try {
                    const msgEncryptionKey = await privacy.generateEncryptionKey(
                      message.senderId,
                      message._encryptionKeyId
                    );
                    return await privacy.decryptSensitiveData(message, msgEncryptionKey);
                  } catch (error) {
                    logger.warn('Failed to decrypt message', {
                      messageId: message.id,
                      error: error.message
                    });
                    return message;
                  }
                }
                return message;
              })
            );
          }
        } catch (decryptError) {
          logger.warn('Failed to decrypt conversation data', {
            conversationId,
            error: decryptError.message
          });
        }
      }

      privacy.logDataAccess(
        'system',
        'conversation',
        'read',
        { conversationId }
      );

      return conversation;
    } catch (error) {
      logger.error('Failed to get conversation', { conversationId, error });
      throw errorHandler.handle(error);
    }
  }

  async getMessages(conversationId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        dateFrom = null,
        dateTo = null,
        messageType = null,
        searchTerm = null,
        decryptSensitiveData = true
      } = options;

      const params = {
        conversation_id: conversationId,
        limit,
        offset,
        date_from: dateFrom,
        date_to: dateTo,
        message_type: messageType,
        search: searchTerm
      };

      const cacheKey = `${this.cachePrefix}messages_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        logger.info('Fetching messages from API', { conversationId, params });

        response = await apiClient.get(ENDPOINTS.chat.getMessages, { params });
        cache.set(cacheKey, response.data, this.defaultCacheTTL, this.cacheTags);
      } else {
        response = { data: response };
      }

      let messages = response.data.messages || response.data;

      if (decryptSensitiveData) {
        messages = await Promise.all(
          messages.map(async (message) => {
            if (message._encryptionKeyId) {
              try {
                const encryptionKey = await privacy.generateEncryptionKey(
                  message.senderId,
                  message._encryptionKeyId
                );
                return await privacy.decryptSensitiveData(message, encryptionKey);
              } catch (error) {
                logger.warn('Failed to decrypt message data', {
                  messageId: message.id,
                  error: error.message
                });
                return message;
              }
            }
            return message;
          })
        );
      }

      return {
        messages,
        pagination: {
          limit,
          offset,
          total: response.data.total || messages.length,
          hasMore: response.data.hasMore || false
        }
      };
    } catch (error) {
      logger.error('Failed to get messages', { conversationId, error });
      throw errorHandler.handle(error);
    }
  }

  async markMessageAsRead(messageId, readerId, options = {}) {
    try {
      const { createAuditLog = false } = options;

      logger.info('Marking message as read', { messageId, readerId });

      const response = await apiClient.patch(
        ENDPOINTS.chat.markAsRead.replace(':messageId', messageId),
        {
          reader_id: readerId,
          read_at: new Date().toISOString()
        }
      );

      // Send read receipt via WebSocket
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          type: 'message_read',
          payload: {
            messageId,
            readerId,
            readAt: new Date().toISOString()
          }
        }));
      }

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'chat_message',
          entityId: messageId,
          action: 'mark_read',
          details: { readerId },
          userId: readerId
        });
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to mark message as read', { messageId, readerId, error });
      throw errorHandler.handle(error);
    }
  }

  async editMessage(messageId, newContent, options = {}) {
    try {
      const {
        moderateContent = true,
        createAuditLog = true
      } = options;

      logger.info('Editing message', { messageId });

      // Moderate new content
      if (moderateContent) {
        const moderationResult = await this.moderateContent(newContent);
        if (!moderationResult.approved) {
          throw errorHandler.createValidationError(
            'Edited content rejected by moderation',
            moderationResult.violations
          );
        }
      }

      const editData = {
        content: newContent,
        edited_at: new Date().toISOString(),
        is_edited: true
      };

      const response = await apiClient.patch(
        ENDPOINTS.chat.editMessage.replace(':messageId', messageId),
        editData
      );

      const editedMessage = response.data;

      // Notify via WebSocket
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          type: 'message_edited',
          payload: editedMessage
        }));
      }

      this.invalidateConversationCache(editedMessage.conversationId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'chat_message',
          entityId: messageId,
          action: 'edit_message',
          details: { newContent: privacy.sanitizeForLogging(newContent) },
          userId: editedMessage.senderId
        });
      }

      logger.info('Message edited successfully', { messageId });

      return editedMessage;
    } catch (error) {
      logger.error('Failed to edit message', { messageId, error });
      throw errorHandler.handle(error);
    }
  }

  async deleteMessage(messageId, options = {}) {
    try {
      const {
        reason = 'user_request',
        createAuditLog = true,
        notifyParticipants = true
      } = options;

      logger.info('Deleting message', { messageId, reason });

      const message = await this.getMessage(messageId);

      const response = await apiClient.delete(
        ENDPOINTS.chat.deleteMessage.replace(':messageId', messageId),
        {
          data: {
            reason,
            deleted_at: new Date().toISOString()
          }
        }
      );

      // Notify via WebSocket
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          type: 'message_deleted',
          payload: {
            messageId,
            conversationId: message.conversationId,
            reason
          }
        }));
      }

      this.invalidateConversationCache(message.conversationId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'delete',
          entityType: 'chat_message',
          entityId: messageId,
          action: 'delete_message',
          details: { reason },
          userId: message.senderId
        });
      }

      logger.info('Message deleted successfully', { messageId });

      return response.data;
    } catch (error) {
      logger.error('Failed to delete message', { messageId, error });
      throw errorHandler.handle(error);
    }
  }

  async searchMessages(searchParams, options = {}) {
    try {
      const {
        query,
        conversationId = null,
        senderId = null,
        messageType = null,
        dateFrom = null,
        dateTo = null,
        limit = 20,
        offset = 0
      } = { ...searchParams, ...options };

      const params = {
        q: query,
        conversation_id: conversationId,
        sender_id: senderId,
        message_type: messageType,
        date_from: dateFrom,
        date_to: dateTo,
        limit,
        offset
      };

      logger.info('Searching messages', { params });

      const response = await apiClient.get(ENDPOINTS.chat.searchMessages, { params });

      const results = response.data;

      privacy.logDataAccess(
        'system',
        'chat_search',
        'search',
        {
          query: query?.substring(0, 50),
          resultsCount: results.messages?.length || 0
        }
      );

      return results;
    } catch (error) {
      logger.error('Failed to search messages', { searchParams, error });
      throw errorHandler.handle(error);
    }
  }

  async archiveConversation(conversationId, options = {}) {
    try {
      const { reason = 'user_request', createAuditLog = true } = options;

      logger.info('Archiving conversation', { conversationId, reason });

      const response = await apiClient.patch(
        ENDPOINTS.chat.archiveConversation.replace(':conversationId', conversationId),
        {
          status: this.conversationStates.ARCHIVED,
          archived_at: new Date().toISOString(),
          archive_reason: reason
        }
      );

      this.invalidateConversationCache(conversationId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'conversation',
          entityId: conversationId,
          action: 'archive_conversation',
          details: { reason },
          userId: 'system'
        });
      }

      logger.info('Conversation archived successfully', { conversationId });

      return response.data;
    } catch (error) {
      logger.error('Failed to archive conversation', { conversationId, error });
      throw errorHandler.handle(error);
    }
  }

  async uploadAttachment(file, options = {}) {
    try {
      const { maxSize = null, allowedTypes = null } = options;

      logger.info('Uploading chat attachment', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Validate file
      this.validateFile(file, maxSize, allowedTypes);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', this.getFileType(file.name));

      const response = await apiClient.post(
        ENDPOINTS.chat.uploadAttachment,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            this.emit('upload_progress', {
              fileName: file.name,
              progress
            });
          }
        }
      );

      logger.info('Attachment uploaded successfully', {
        fileName: file.name,
        fileUrl: response.data.url
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to upload attachment', { fileName: file.name, error });
      throw errorHandler.handle(error);
    }
  }

  async moderateContent(content, options = {}) {
    try {
      const {
        strictMode = false,
        customRules = []
      } = options;

      const moderationData = {
        content,
        strict_mode: strictMode,
        custom_rules: customRules
      };

      const response = await apiClient.post(
        ENDPOINTS.chat.moderateContent,
        moderationData
      );

      return response.data;
    } catch (error) {
      logger.warn('Content moderation failed', { error });
      // Return approval by default if moderation service fails
      return {
        approved: true,
        violations: [],
        confidence: 0
      };
    }
  }

  async sendTypingIndicator(conversationId, isTyping = true) {
    try {
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          type: 'typing',
          payload: {
            conversationId,
            isTyping,
            timestamp: new Date().toISOString()
          }
        }));
      }
    } catch (error) {
      logger.debug('Failed to send typing indicator', { conversationId, error });
    }
  }

  async requestDeliveryConfirmation(messageId) {
    try {
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          type: 'request_delivery_confirmation',
          payload: { messageId }
        }));
      }
    } catch (error) {
      logger.debug('Failed to request delivery confirmation', { messageId, error });
    }
  }

  // Validation methods
  validateConversationData(conversationData) {
    const requiredFields = ['participants', 'type', 'createdBy'];

    for (const field of requiredFields) {
      if (!conversationData[field]) {
        throw errorHandler.createValidationError(`Missing required field: ${field}`, conversationData);
      }
    }

    if (!Array.isArray(conversationData.participants) || conversationData.participants.length < 2) {
      throw errorHandler.createValidationError('At least 2 participants required');
    }

    return true;
  }

  validateMessageData(messageData) {
    const requiredFields = ['conversationId', 'senderId', 'type'];

    for (const field of requiredFields) {
      if (!messageData[field]) {
        throw errorHandler.createValidationError(`Missing required field: ${field}`, messageData);
      }
    }

    if (!Object.values(this.messageTypes).includes(messageData.type)) {
      throw errorHandler.createValidationError('Invalid message type', {
        provided: messageData.type,
        valid: Object.values(this.messageTypes)
      });
    }

    if (messageData.type === this.messageTypes.TEXT && !messageData.content) {
      throw errorHandler.createValidationError('Text messages require content');
    }

    return true;
  }

  validateFile(file, maxSize = null, allowedTypes = null) {
    const fileType = this.getFileType(file.name);
    const actualMaxSize = maxSize || this.maxFileSizes[fileType];
    const actualAllowedTypes = allowedTypes || this.fileTypes[fileType];

    if (actualMaxSize && file.size > actualMaxSize) {
      throw errorHandler.createValidationError('File size exceeds maximum allowed', {
        maxSize: actualMaxSize,
        actualSize: file.size
      });
    }

    if (actualAllowedTypes) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!actualAllowedTypes.includes(fileExtension)) {
        throw errorHandler.createValidationError('File type not allowed', {
          allowedTypes: actualAllowedTypes,
          actualType: fileExtension
        });
      }
    }

    return true;
  }

  getFileType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();

    for (const [type, extensions] of Object.entries(this.fileTypes)) {
      if (extensions.includes(extension)) {
        return type;
      }
    }

    return 'DOCUMENT'; // Default fallback
  }

  async getMessage(messageId) {
    try {
      const response = await apiClient.get(
        ENDPOINTS.chat.getMessage.replace(':messageId', messageId)
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to get message', { messageId, error });
      throw errorHandler.handle(error);
    }
  }

  setupMessageModeration() {
    // Moderate messages in real-time as they come through WebSocket
    this.on('message_received', async (message) => {
      if (message.type === this.messageTypes.TEXT && message.content) {
        try {
          const moderationResult = await this.moderateContent(message.content);
          if (!moderationResult.approved) {
            await this.flagMessage(message.id, moderationResult.violations);
          }
        } catch (error) {
          logger.warn('Failed to moderate incoming message', { messageId: message.id, error });
        }
      }
    });
  }

  async flagMessage(messageId, violations) {
    try {
      await apiClient.post(
        ENDPOINTS.chat.flagMessage.replace(':messageId', messageId),
        { violations }
      );

      logger.info('Message flagged for moderation', { messageId, violations });
    } catch (error) {
      logger.warn('Failed to flag message', { messageId, error });
    }
  }

  async notifyConversationCreated(conversationId) {
    try {
      await apiClient.post(
        ENDPOINTS.chat.notifyConversationCreated.replace(':conversationId', conversationId)
      );
    } catch (error) {
      logger.warn('Failed to notify conversation created', { conversationId, error });
    }
  }

  // Event handling
  on(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
  }

  off(eventName, callback) {
    if (this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(eventName, ...args) {
    if (this.eventListeners.has(eventName)) {
      this.eventListeners.get(eventName).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          logger.error('Error in event callback', { eventName, error });
        }
      });
    }
  }

  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  invalidateConversationCache(conversationId) {
    try {
      cache.deleteByPattern(`${this.cachePrefix}conversation_${conversationId}*`);
      cache.deleteByPattern(`${this.cachePrefix}messages_*${conversationId}*`);
    } catch (error) {
      logger.warn('Failed to invalidate conversation cache', { conversationId, error });
    }
  }

  invalidateCache(tags = []) {
    try {
      tags.forEach(tag => {
        cache.deleteByTag(tag);
      });

      logger.debug('Chat service cache invalidated', { tags });
    } catch (error) {
      logger.warn('Failed to invalidate cache', error);
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('chat');
      cache.deleteByTag('messages');
      cache.deleteByTag('conversations');
      logger.info('Chat service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear chat service cache', error);
    }
  }

  getStats() {
    return {
      service: 'ChatService',
      initialized: this.isInitialized,
      websocketConnected: this.wsConnection?.readyState === WebSocket.OPEN,
      reconnectAttempts: this.reconnectAttempts,
      eventListeners: Object.fromEntries(
        Array.from(this.eventListeners.entries()).map(([event, listeners]) => [event, listeners.length])
      ),
      cacheStats: {
        chat: cache.getStatsByTag('chat'),
        messages: cache.getStatsByTag('messages'),
        conversations: cache.getStatsByTag('conversations')
      },
      constants: {
        messageTypes: this.messageTypes,
        messageStates: this.messageStates,
        conversationStates: this.conversationStates,
        participantRoles: this.participantRoles,
        moderationActions: this.moderationActions,
        contentFlags: this.contentFlags,
        fileTypes: this.fileTypes,
        maxFileSizes: this.maxFileSizes
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const chatService = new ChatService();

export const {
  createConversation,
  sendMessage,
  getConversation,
  getMessages,
  markMessageAsRead,
  editMessage,
  deleteMessage,
  searchMessages,
  archiveConversation,
  uploadAttachment,
  sendTypingIndicator
} = chatService;

export default chatService;