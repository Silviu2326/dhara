import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { errorHandler } from '../utils/errorHandler';
import { privacy } from '../utils/privacy';
import { security } from '../utils/security';
import { auditService } from '../utils/auditService';

class NotificationService {
  constructor() {
    this.baseEndpoint = 'notifications';
    this.cachePrefix = 'notification_';
    this.cacheTags = ['notifications', 'alerts'];
    this.defaultCacheTTL = 300;
    this.isInitialized = false;
    this.serviceWorkerRegistration = null;
    this.pushSubscription = null;

    this.notificationTypes = {
      APPOINTMENT: 'appointment',
      MESSAGE: 'message',
      PAYMENT: 'payment',
      SYSTEM: 'system',
      REMINDER: 'reminder',
      ALERT: 'alert',
      UPDATE: 'update',
      PLAN_PROGRESS: 'plan_progress',
      SESSION_NOTE: 'session_note',
      DOCUMENT: 'document',
      VERIFICATION: 'verification',
      EMERGENCY: 'emergency'
    };

    this.priorities = {
      LOW: 'low',
      NORMAL: 'normal',
      HIGH: 'high',
      URGENT: 'urgent',
      CRITICAL: 'critical'
    };

    this.deliveryChannels = {
      IN_APP: 'in_app',
      EMAIL: 'email',
      SMS: 'sms',
      PUSH: 'push',
      WEBHOOK: 'webhook'
    };

    this.notificationStates = {
      PENDING: 'pending',
      SENT: 'sent',
      DELIVERED: 'delivered',
      READ: 'read',
      DISMISSED: 'dismissed',
      FAILED: 'failed',
      EXPIRED: 'expired'
    };

    this.categories = {
      APPOINTMENT_REMINDERS: 'appointment_reminders',
      MESSAGES: 'messages',
      PLAN_UPDATES: 'plan_updates',
      PAYMENT_ALERTS: 'payment_alerts',
      SYSTEM_MAINTENANCE: 'system_maintenance',
      SECURITY_ALERTS: 'security_alerts',
      PROGRESS_REPORTS: 'progress_reports',
      DOCUMENT_REQUESTS: 'document_requests'
    };

    this.actionTypes = {
      VIEW: 'view',
      APPROVE: 'approve',
      REJECT: 'reject',
      SCHEDULE: 'schedule',
      PAYMENT: 'payment',
      DOWNLOAD: 'download',
      RESPOND: 'respond',
      DISMISS: 'dismiss'
    };

    this.templates = {
      APPOINTMENT_REMINDER: 'appointment_reminder',
      APPOINTMENT_CONFIRMED: 'appointment_confirmed',
      APPOINTMENT_CANCELLED: 'appointment_cancelled',
      NEW_MESSAGE: 'new_message',
      PLAN_ASSIGNED: 'plan_assigned',
      PLAN_UPDATED: 'plan_updated',
      OBJECTIVE_COMPLETED: 'objective_completed',
      PAYMENT_DUE: 'payment_due',
      PAYMENT_RECEIVED: 'payment_received',
      DOCUMENT_REQUIRED: 'document_required',
      SYSTEM_UPDATE: 'system_update'
    };

    this.retryPolicies = {
      IMMEDIATE: { maxRetries: 3, baseDelay: 1000 },
      GRADUAL: { maxRetries: 5, baseDelay: 5000 },
      PERSISTENT: { maxRetries: 10, baseDelay: 30000 }
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing NotificationService');

      // Initialize service worker for push notifications
      await this.initializeServiceWorker();

      // Setup periodic notification processing
      this.setupPeriodicProcessing();

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize NotificationService', error);
      throw error;
    }
  }

  async initializeServiceWorker() {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');

        logger.info('Service worker registered for push notifications');

        // Request notification permission
        if (Notification.permission === 'default') {
          await this.requestNotificationPermission();
        }

        // Setup push subscription
        if (Notification.permission === 'granted') {
          await this.setupPushSubscription();
        }
      } else {
        logger.warn('Push notifications not supported in this browser');
      }
    } catch (error) {
      logger.warn('Failed to initialize service worker', error);
    }
  }

  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();
      logger.info('Notification permission', { permission });
      return permission === 'granted';
    } catch (error) {
      logger.warn('Failed to request notification permission', error);
      return false;
    }
  }

  async setupPushSubscription() {
    try {
      if (!this.serviceWorkerRegistration) {
        throw new Error('Service worker not registered');
      }

      const applicationServerKey = await this.getVAPIDKey();

      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Send subscription to server
      await this.registerPushSubscription(this.pushSubscription);

      logger.info('Push subscription setup completed');
    } catch (error) {
      logger.warn('Failed to setup push subscription', error);
    }
  }

  async getVAPIDKey() {
    try {
      const response = await apiClient.get(ENDPOINTS.notifications.getVAPIDKey);
      return response.data.publicKey;
    } catch (error) {
      logger.warn('Failed to get VAPID key', error);
      return null;
    }
  }

  async registerPushSubscription(subscription) {
    try {
      await apiClient.post(ENDPOINTS.notifications.registerPushSubscription, {
        subscription: subscription.toJSON()
      });
      logger.info('Push subscription registered on server');
    } catch (error) {
      logger.warn('Failed to register push subscription', error);
    }
  }

  async createNotification(notificationData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        scheduleDelivery = false,
        deliveryChannels = [this.deliveryChannels.IN_APP],
        retryPolicy = this.retryPolicies.GRADUAL,
        createAuditLog = true
      } = options;

      logger.info('Creating notification', {
        type: notificationData.type,
        priority: notificationData.priority,
        recipientId: notificationData.recipientId,
        deliveryChannels
      });

      // Validate notification data
      this.validateNotificationData(notificationData);

      let processedData = {
        ...notificationData,
        notificationId: security.generateSecureId('notif_'),
        status: scheduleDelivery ? this.notificationStates.PENDING : this.notificationStates.SENT,
        createdAt: new Date().toISOString(),
        deliveryChannels,
        retryPolicy,
        attempts: 0
      };

      // Set default priority if not provided
      if (!processedData.priority) {
        processedData.priority = this.getDefaultPriority(processedData.type);
      }

      // Set expiration time based on priority
      if (!processedData.expiresAt) {
        processedData.expiresAt = this.calculateExpirationTime(processedData.priority);
      }

      // Generate notification content from template if template specified
      if (processedData.template) {
        const templateContent = await this.generateFromTemplate(
          processedData.template,
          processedData.templateData || {}
        );
        processedData = { ...processedData, ...templateContent };
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          processedData.recipientId,
          processedData.notificationId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.notificationId;
      }

      const sanitizedData = privacy.sanitizeForLogging(processedData);
      logger.info('Creating notification with sanitized data', { data: sanitizedData });

      const response = await apiClient.post(
        ENDPOINTS.notifications.create,
        processedData
      );

      const notification = response.data;

      // Deliver immediately if not scheduled
      if (!scheduleDelivery) {
        await this.deliverNotification(notification.id, deliveryChannels);
      }

      this.invalidateCache(['notifications'], notificationData.recipientId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'notification',
          entityId: notification.id,
          action: 'create_notification',
          details: {
            type: notificationData.type,
            priority: notificationData.priority,
            recipientId: notificationData.recipientId,
            deliveryChannels
          },
          userId: notificationData.senderId || 'system'
        });
      }

      privacy.logDataAccess(
        notificationData.recipientId,
        'notification',
        'create',
        { notificationId: notification.id }
      );

      logger.info('Notification created successfully', {
        notificationId: notification.id,
        recipientId: notificationData.recipientId
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create notification', error);
      throw errorHandler.handle(error);
    }
  }

  async getNotification(notificationId, options = {}) {
    try {
      const { decryptSensitiveData = true } = options;

      const cacheKey = `${this.cachePrefix}${notificationId}`;
      let notification = cache.get(cacheKey);

      if (!notification) {
        logger.info('Fetching notification from API', { notificationId });

        const response = await apiClient.get(
          ENDPOINTS.notifications.getById.replace(':id', notificationId)
        );

        notification = response.data;
        cache.set(cacheKey, notification, this.defaultCacheTTL, this.cacheTags);
      }

      if (decryptSensitiveData && notification._encryptionKeyId) {
        try {
          const encryptionKey = await privacy.generateEncryptionKey(
            notification.recipientId,
            notification._encryptionKeyId
          );
          notification = await privacy.decryptSensitiveData(notification, encryptionKey);
        } catch (decryptError) {
          logger.warn('Failed to decrypt notification data', {
            notificationId,
            error: decryptError.message
          });
        }
      }

      privacy.logDataAccess(
        notification.recipientId,
        'notification',
        'read',
        { notificationId }
      );

      return notification;
    } catch (error) {
      logger.error('Failed to get notification', { notificationId, error });
      throw errorHandler.handle(error);
    }
  }

  async getNotifications(filters = {}, options = {}) {
    try {
      const {
        userId = null,
        type = null,
        category = null,
        priority = null,
        status = null,
        unreadOnly = false,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        dateFrom = null,
        dateTo = null,
        decryptSensitiveData = false
      } = { ...filters, ...options };

      const params = {
        user_id: userId,
        type,
        category,
        priority,
        status,
        unread_only: unreadOnly,
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        date_from: dateFrom,
        date_to: dateTo
      };

      const cacheKey = `${this.cachePrefix}list_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        logger.info('Fetching notifications from API', { filters: params });

        response = await apiClient.get(ENDPOINTS.notifications.getAll, { params });
        cache.set(cacheKey, response.data, this.defaultCacheTTL, this.cacheTags);
      } else {
        response = { data: response };
      }

      let notifications = response.data.notifications || response.data;

      if (decryptSensitiveData) {
        notifications = await Promise.all(
          notifications.map(async (notification) => {
            if (notification._encryptionKeyId) {
              try {
                const encryptionKey = await privacy.generateEncryptionKey(
                  notification.recipientId,
                  notification._encryptionKeyId
                );
                return await privacy.decryptSensitiveData(notification, encryptionKey);
              } catch (error) {
                logger.warn('Failed to decrypt notification data', {
                  notificationId: notification.id,
                  error: error.message
                });
                return notification;
              }
            }
            return notification;
          })
        );
      }

      return {
        notifications,
        pagination: {
          page,
          limit,
          total: response.data.total || notifications.length,
          hasMore: response.data.hasMore || false
        },
        filters: params,
        unreadCount: response.data.unreadCount || 0
      };
    } catch (error) {
      logger.error('Failed to get notifications', { filters, error });
      throw errorHandler.handle(error);
    }
  }

  async markAsRead(notificationId, options = {}) {
    try {
      const { createAuditLog = false } = options;

      logger.info('Marking notification as read', { notificationId });

      const response = await apiClient.patch(
        ENDPOINTS.notifications.markAsRead.replace(':id', notificationId),
        {
          status: this.notificationStates.READ,
          read_at: new Date().toISOString()
        }
      );

      this.invalidateCache(['notifications']);

      if (createAuditLog) {
        const notification = await this.getNotification(notificationId, { decryptSensitiveData: false });
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'notification',
          entityId: notificationId,
          action: 'mark_read',
          userId: notification.recipientId
        });
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to mark notification as read', { notificationId, error });
      throw errorHandler.handle(error);
    }
  }

  async markAllAsRead(userId, options = {}) {
    try {
      const { category = null, type = null } = options;

      logger.info('Marking all notifications as read', { userId, category, type });

      const response = await apiClient.patch(
        ENDPOINTS.notifications.markAllAsRead,
        {
          user_id: userId,
          category,
          type,
          read_at: new Date().toISOString()
        }
      );

      this.invalidateCache(['notifications'], userId);

      return response.data;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { userId, error });
      throw errorHandler.handle(error);
    }
  }

  async dismissNotification(notificationId, options = {}) {
    try {
      const { reason = 'user_action', createAuditLog = false } = options;

      logger.info('Dismissing notification', { notificationId, reason });

      const response = await apiClient.patch(
        ENDPOINTS.notifications.dismiss.replace(':id', notificationId),
        {
          status: this.notificationStates.DISMISSED,
          dismissed_at: new Date().toISOString(),
          dismiss_reason: reason
        }
      );

      this.invalidateCache(['notifications']);

      if (createAuditLog) {
        const notification = await this.getNotification(notificationId, { decryptSensitiveData: false });
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'notification',
          entityId: notificationId,
          action: 'dismiss',
          details: { reason },
          userId: notification.recipientId
        });
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to dismiss notification', { notificationId, error });
      throw errorHandler.handle(error);
    }
  }

  async deleteNotification(notificationId, options = {}) {
    try {
      const { reason = 'user_request', createAuditLog = true } = options;

      logger.info('Deleting notification', { notificationId, reason });

      const notification = await this.getNotification(notificationId, { decryptSensitiveData: false });

      await apiClient.delete(
        ENDPOINTS.notifications.delete.replace(':id', notificationId),
        {
          data: {
            reason,
            deleted_at: new Date().toISOString()
          }
        }
      );

      this.invalidateCache(['notifications'], notification.recipientId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'delete',
          entityType: 'notification',
          entityId: notificationId,
          action: 'delete_notification',
          details: { reason },
          userId: notification.recipientId
        });
      }

      logger.info('Notification deleted successfully', { notificationId });

      return {
        success: true,
        notificationId,
        deletedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to delete notification', { notificationId, error });
      throw errorHandler.handle(error);
    }
  }

  async deliverNotification(notificationId, channels = [], options = {}) {
    try {
      const { retryOnFailure = true } = options;

      logger.info('Delivering notification', { notificationId, channels });

      const notification = await this.getNotification(notificationId);

      const deliveryPromises = channels.map(channel =>
        this.deliverToChannel(notification, channel)
      );

      const results = await Promise.allSettled(deliveryPromises);

      const deliveryResults = {
        notificationId,
        channels: [],
        successful: 0,
        failed: 0
      };

      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        const channel = channels[index];
        if (result.status === 'fulfilled') {
          deliveryResults.successful++;
          deliveryResults.channels.push({
            channel,
            status: 'delivered',
            deliveredAt: new Date().toISOString()
          });
        } else {
          deliveryResults.failed++;
          deliveryResults.channels.push({
            channel,
            status: 'failed',
            error: result.reason?.message || 'Unknown error'
          });

          if (retryOnFailure) {
            await this.scheduleRetry(notificationId, channel);
          }
        }
      }

      // Update notification status
      const newStatus = deliveryResults.successful > 0 ?
        this.notificationStates.DELIVERED :
        this.notificationStates.FAILED;

      await this.updateNotificationStatus(notificationId, newStatus, deliveryResults);

      return deliveryResults;
    } catch (error) {
      logger.error('Failed to deliver notification', { notificationId, error });
      throw errorHandler.handle(error);
    }
  }

  async deliverToChannel(notification, channel) {
    switch (channel) {
      case this.deliveryChannels.IN_APP:
        return await this.deliverInApp(notification);
      case this.deliveryChannels.EMAIL:
        return await this.deliverEmail(notification);
      case this.deliveryChannels.SMS:
        return await this.deliverSMS(notification);
      case this.deliveryChannels.PUSH:
        return await this.deliverPush(notification);
      case this.deliveryChannels.WEBHOOK:
        return await this.deliverWebhook(notification);
      default:
        throw new Error(`Unsupported delivery channel: ${channel}`);
    }
  }

  async deliverInApp(notification) {
    // In-app notifications are stored in database and shown in UI
    // This is already handled by the create operation
    return { success: true, channel: this.deliveryChannels.IN_APP };
  }

  async deliverEmail(notification) {
    try {
      const response = await apiClient.post(
        ENDPOINTS.notifications.sendEmail.replace(':id', notification.id)
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to deliver email notification', { notificationId: notification.id, error });
      throw error;
    }
  }

  async deliverSMS(notification) {
    try {
      const response = await apiClient.post(
        ENDPOINTS.notifications.sendSMS.replace(':id', notification.id)
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to deliver SMS notification', { notificationId: notification.id, error });
      throw error;
    }
  }

  async deliverPush(notification) {
    try {
      if (!this.pushSubscription) {
        throw new Error('Push subscription not available');
      }

      const response = await apiClient.post(
        ENDPOINTS.notifications.sendPush.replace(':id', notification.id),
        {
          subscription: this.pushSubscription.toJSON()
        }
      );

      // Also trigger local notification if supported
      if (Notification.permission === 'granted') {
        const localNotification = new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: notification.id,
          data: {
            notificationId: notification.id,
            actions: notification.actions
          }
        });

        localNotification.onclick = () => {
          this.handleNotificationClick(notification);
        };
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to deliver push notification', { notificationId: notification.id, error });
      throw error;
    }
  }

  async deliverWebhook(notification) {
    try {
      const response = await apiClient.post(
        ENDPOINTS.notifications.sendWebhook.replace(':id', notification.id)
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to deliver webhook notification', { notificationId: notification.id, error });
      throw error;
    }
  }

  async scheduleRetry(notificationId, channel) {
    try {
      const notification = await this.getNotification(notificationId, { decryptSensitiveData: false });
      const retryPolicy = notification.retryPolicy || this.retryPolicies.GRADUAL;

      if (notification.attempts >= retryPolicy.maxRetries) {
        logger.warn('Max retry attempts reached for notification', { notificationId, channel });
        return;
      }

      const delay = retryPolicy.baseDelay * Math.pow(2, notification.attempts);

      setTimeout(async () => {
        try {
          await this.deliverToChannel(notification, channel);
          logger.info('Notification retry successful', { notificationId, channel, attempt: notification.attempts + 1 });
        } catch (error) {
          logger.error('Notification retry failed', { notificationId, channel, error });
          await this.scheduleRetry(notificationId, channel);
        }
      }, delay);

      // Increment attempt counter
      await this.incrementAttemptCounter(notificationId);
    } catch (error) {
      logger.error('Failed to schedule retry', { notificationId, channel, error });
    }
  }

  async generateFromTemplate(templateName, templateData) {
    try {
      const response = await apiClient.post(
        ENDPOINTS.notifications.generateFromTemplate,
        {
          template: templateName,
          data: templateData
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to generate notification from template', { templateName, error });
      throw error;
    }
  }

  async bulkCreate(notifications, options = {}) {
    try {
      const {
        deliveryChannels = [this.deliveryChannels.IN_APP],
        scheduleDelivery = false,
        batchSize = 100
      } = options;

      logger.info('Creating bulk notifications', {
        count: notifications.length,
        deliveryChannels,
        batchSize
      });

      if (notifications.length > batchSize) {
        const batches = [];
        for (let i = 0; i < notifications.length; i += batchSize) {
          batches.push(notifications.slice(i, i + batchSize));
        }

        const results = [];
        for (const batch of batches) {
          const batchResult = await this.bulkCreate(batch, {
            ...options,
            batchSize: Infinity
          });
          results.push(...batchResult.notifications);
        }

        return { notifications: results, total: results.length };
      }

      const bulkData = {
        notifications,
        delivery_channels: deliveryChannels,
        schedule_delivery: scheduleDelivery
      };

      const response = await apiClient.post(
        ENDPOINTS.notifications.bulkCreate,
        bulkData
      );

      this.invalidateCache(['notifications']);

      logger.info('Bulk notifications created', {
        processed: response.data.notifications.length,
        successful: response.data.notifications.filter(n => n.success).length
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create bulk notifications', error);
      throw errorHandler.handle(error);
    }
  }

  async getNotificationStats(userId, options = {}) {
    try {
      const {
        dateFrom = null,
        dateTo = null,
        groupBy = 'day'
      } = options;

      const params = {
        user_id: userId,
        date_from: dateFrom,
        date_to: dateTo,
        group_by: groupBy
      };

      const cacheKey = `${this.cachePrefix}stats_${security.generateHash(params)}`;
      let stats = cache.get(cacheKey);

      if (!stats) {
        logger.info('Fetching notification statistics', { userId, params });

        const response = await apiClient.get(ENDPOINTS.notifications.getStats, { params });
        stats = response.data;
        cache.set(cacheKey, stats, 600, [...this.cacheTags, 'statistics']);
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get notification statistics', { userId, error });
      throw errorHandler.handle(error);
    }
  }

  handleNotificationClick(notification) {
    // Handle notification click actions
    if (notification.actions && notification.actions.length > 0) {
      const defaultAction = notification.actions.find(action => action.isDefault) ||
                           notification.actions[0];

      if (defaultAction) {
        this.executeNotificationAction(notification.id, defaultAction);
      }
    }

    // Mark as read
    this.markAsRead(notification.id);
  }

  async executeNotificationAction(notificationId, action) {
    try {
      logger.info('Executing notification action', { notificationId, action: action.type });

      const response = await apiClient.post(
        ENDPOINTS.notifications.executeAction.replace(':id', notificationId),
        { action }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to execute notification action', { notificationId, action, error });
      throw error;
    }
  }

  // Validation and helper methods
  validateNotificationData(notificationData) {
    const requiredFields = ['recipientId', 'type', 'title'];

    for (const field of requiredFields) {
      if (!notificationData[field]) {
        throw errorHandler.createValidationError(`Missing required field: ${field}`, notificationData);
      }
    }

    if (!Object.values(this.notificationTypes).includes(notificationData.type)) {
      throw errorHandler.createValidationError('Invalid notification type', {
        provided: notificationData.type,
        valid: Object.values(this.notificationTypes)
      });
    }

    return true;
  }

  getDefaultPriority(notificationType) {
    const priorityMap = {
      [this.notificationTypes.EMERGENCY]: this.priorities.CRITICAL,
      [this.notificationTypes.ALERT]: this.priorities.HIGH,
      [this.notificationTypes.APPOINTMENT]: this.priorities.HIGH,
      [this.notificationTypes.PAYMENT]: this.priorities.HIGH,
      [this.notificationTypes.MESSAGE]: this.priorities.NORMAL,
      [this.notificationTypes.REMINDER]: this.priorities.NORMAL,
      [this.notificationTypes.SYSTEM]: this.priorities.LOW,
      [this.notificationTypes.UPDATE]: this.priorities.LOW
    };

    return priorityMap[notificationType] || this.priorities.NORMAL;
  }

  calculateExpirationTime(priority) {
    const expirationMap = {
      [this.priorities.CRITICAL]: 24 * 60 * 60 * 1000,      // 24 hours
      [this.priorities.HIGH]: 7 * 24 * 60 * 60 * 1000,      // 7 days
      [this.priorities.NORMAL]: 30 * 24 * 60 * 60 * 1000,   // 30 days
      [this.priorities.LOW]: 90 * 24 * 60 * 60 * 1000       // 90 days
    };

    const expiration = expirationMap[priority] || expirationMap[this.priorities.NORMAL];
    return new Date(Date.now() + expiration).toISOString();
  }

  async updateNotificationStatus(notificationId, status, deliveryResults = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (deliveryResults) {
        updateData.delivery_results = deliveryResults;
      }

      await apiClient.patch(
        ENDPOINTS.notifications.updateStatus.replace(':id', notificationId),
        updateData
      );
    } catch (error) {
      logger.warn('Failed to update notification status', { notificationId, status, error });
    }
  }

  async incrementAttemptCounter(notificationId) {
    try {
      await apiClient.patch(
        ENDPOINTS.notifications.incrementAttempts.replace(':id', notificationId)
      );
    } catch (error) {
      logger.warn('Failed to increment attempt counter', { notificationId, error });
    }
  }

  setupPeriodicProcessing() {
    // Process pending notifications every 5 minutes
    setInterval(async () => {
      try {
        await this.processPendingNotifications();
      } catch (error) {
        logger.error('Periodic notification processing failed', error);
      }
    }, 5 * 60 * 1000);

    // Clean up expired notifications every hour
    setInterval(async () => {
      try {
        await this.cleanupExpiredNotifications();
      } catch (error) {
        logger.error('Notification cleanup failed', error);
      }
    }, 60 * 60 * 1000);
  }

  async processPendingNotifications() {
    try {
      logger.debug('Processing pending notifications');

      const response = await apiClient.post(ENDPOINTS.notifications.processPending);

      const { processedCount, failedCount } = response.data;

      if (processedCount > 0) {
        logger.info('Pending notifications processed', { processedCount, failedCount });
      }

      return response.data;
    } catch (error) {
      logger.warn('Failed to process pending notifications', error);
      return null;
    }
  }

  async cleanupExpiredNotifications() {
    try {
      logger.debug('Cleaning up expired notifications');

      const response = await apiClient.post(ENDPOINTS.notifications.cleanupExpired);

      const { cleanedCount } = response.data;

      if (cleanedCount > 0) {
        logger.info('Expired notifications cleaned up', { cleanedCount });
      }

      return response.data;
    } catch (error) {
      logger.warn('Failed to cleanup expired notifications', error);
      return null;
    }
  }

  invalidateCache(tags = [], specificUserId = null) {
    try {
      if (specificUserId) {
        cache.deleteByPattern(`${this.cachePrefix}*${specificUserId}*`);
      }

      tags.forEach(tag => {
        cache.deleteByTag(tag);
      });

      logger.debug('Notification service cache invalidated', { tags, specificUserId });
    } catch (error) {
      logger.warn('Failed to invalidate cache', error);
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('notifications');
      cache.deleteByTag('alerts');
      logger.info('Notification service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear notification service cache', error);
    }
  }

  getStats() {
    return {
      service: 'NotificationService',
      initialized: this.isInitialized,
      serviceWorkerRegistered: !!this.serviceWorkerRegistration,
      pushSubscriptionActive: !!this.pushSubscription,
      notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
      cacheStats: {
        notifications: cache.getStatsByTag('notifications'),
        alerts: cache.getStatsByTag('alerts')
      },
      constants: {
        notificationTypes: this.notificationTypes,
        priorities: this.priorities,
        deliveryChannels: this.deliveryChannels,
        notificationStates: this.notificationStates,
        categories: this.categories,
        actionTypes: this.actionTypes,
        templates: this.templates
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const notificationService = new NotificationService();

export const {
  createNotification,
  getNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  deleteNotification,
  deliverNotification,
  bulkCreate,
  getNotificationStats
} = notificationService;

export default notificationService;