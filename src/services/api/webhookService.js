import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { cache, apiCache } from '../utils/cache';
import { privacy, encryptSensitiveData, decryptSensitiveData } from '../utils/privacy';
import { security, generateSecureId } from '../utils/security';
import { auditService } from '../utils/auditService';

class WebhookService {
  constructor() {
    this.cachePrefix = 'webhook_';
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutos
    this.maxRetries = 5;
    this.auditContext = 'webhook_service';

    // Estados de webhook
    this.webhookStatus = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      DISABLED: 'disabled',
      FAILED: 'failed',
      SUSPENDED: 'suspended'
    };

    // Estados de entrega
    this.deliveryStatus = {
      PENDING: 'pending',
      DELIVERED: 'delivered',
      FAILED: 'failed',
      RETRYING: 'retrying',
      ABANDONED: 'abandoned'
    };

    // Eventos de la aplicación disponibles
    this.availableEvents = {
      // Eventos de usuario
      USER_CREATED: 'user.created',
      USER_UPDATED: 'user.updated',
      USER_DELETED: 'user.deleted',
      USER_VERIFIED: 'user.verified',

      // Eventos de autenticación
      USER_LOGIN: 'auth.user_login',
      USER_LOGOUT: 'auth.user_logout',
      PASSWORD_RESET: 'auth.password_reset',

      // Eventos de citas
      BOOKING_CREATED: 'booking.created',
      BOOKING_UPDATED: 'booking.updated',
      BOOKING_CANCELLED: 'booking.cancelled',
      BOOKING_COMPLETED: 'booking.completed',
      BOOKING_REMINDER: 'booking.reminder',

      // Eventos de sesiones
      SESSION_STARTED: 'session.started',
      SESSION_ENDED: 'session.ended',
      SESSION_NOTES_ADDED: 'session.notes_added',

      // Eventos de pagos
      PAYMENT_CREATED: 'payment.created',
      PAYMENT_COMPLETED: 'payment.completed',
      PAYMENT_FAILED: 'payment.failed',
      PAYMENT_REFUNDED: 'payment.refunded',

      // Eventos de suscripciones
      SUBSCRIPTION_CREATED: 'subscription.created',
      SUBSCRIPTION_UPDATED: 'subscription.updated',
      SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
      SUBSCRIPTION_RENEWED: 'subscription.renewed',
      SUBSCRIPTION_EXPIRED: 'subscription.expired',

      // Eventos de documentos
      DOCUMENT_UPLOADED: 'document.uploaded',
      DOCUMENT_SHARED: 'document.shared',
      DOCUMENT_DELETED: 'document.deleted',

      // Eventos de reseñas
      REVIEW_CREATED: 'review.created',
      REVIEW_UPDATED: 'review.updated',
      REVIEW_MODERATED: 'review.moderated',

      // Eventos de integraciones
      INTEGRATION_CONNECTED: 'integration.connected',
      INTEGRATION_DISCONNECTED: 'integration.disconnected',
      INTEGRATION_SYNC_COMPLETED: 'integration.sync_completed',
      INTEGRATION_FAILED: 'integration.failed',

      // Eventos de sistema
      SYSTEM_MAINTENANCE: 'system.maintenance',
      SYSTEM_ALERT: 'system.alert'
    };

    // Categorías de eventos
    this.eventCategories = {
      USER: 'user',
      AUTH: 'auth',
      BOOKING: 'booking',
      SESSION: 'session',
      PAYMENT: 'payment',
      SUBSCRIPTION: 'subscription',
      DOCUMENT: 'document',
      REVIEW: 'review',
      INTEGRATION: 'integration',
      SYSTEM: 'system'
    };

    // Tipos de webhook
    this.webhookTypes = {
      INCOMING: 'incoming',
      OUTGOING: 'outgoing'
    };

    // Algoritmos de firma soportados
    this.signatureAlgorithms = {
      HMAC_SHA256: 'hmac-sha256',
      HMAC_SHA512: 'hmac-sha512'
    };

    // Configuración de reintentos
    this.retryConfig = {
      maxAttempts: 5,
      backoffMultiplier: 2,
      initialDelay: 1000, // 1 segundo
      maxDelay: 300000 // 5 minutos
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await auditService.logEvent({
        eventType: 'system_change',
        entityType: 'service',
        entityId: 'webhook_service',
        action: 'initialize',
        details: { timestamp: new Date().toISOString() }
      });

      this.initialized = true;
      logger.info('WebhookService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WebhookService:', error);
      throw error;
    }
  }

  // Validación de datos de webhook
  validateWebhookData(webhookData) {
    const requiredFields = ['url', 'events'];
    const missingFields = requiredFields.filter(field => !webhookData[field]);

    if (missingFields.length > 0) {
      throw errorHandler.createValidationError(
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // Validar URL
    try {
      new URL(webhookData.url);
    } catch (error) {
      throw errorHandler.createValidationError('Invalid webhook URL');
    }

    // Validar eventos
    if (!Array.isArray(webhookData.events) || webhookData.events.length === 0) {
      throw errorHandler.createValidationError('Events must be a non-empty array');
    }

    // Validar que los eventos existan
    const invalidEvents = webhookData.events.filter(event =>
      !Object.values(this.availableEvents).includes(event)
    );

    if (invalidEvents.length > 0) {
      throw errorHandler.createValidationError(
        `Invalid events: ${invalidEvents.join(', ')}`
      );
    }

    // Validar algoritmo de firma si se proporciona
    if (webhookData.signatureAlgorithm &&
        !Object.values(this.signatureAlgorithms).includes(webhookData.signatureAlgorithm)) {
      throw errorHandler.createValidationError(
        `Invalid signature algorithm: ${webhookData.signatureAlgorithm}`
      );
    }

    return true;
  }

  // Crear webhook
  async createWebhook(webhookData, options = {}) {
    try {
      const { auditEvent = true } = options;

      // Validar datos del webhook
      this.validateWebhookData(webhookData);

      // Procesar datos del webhook
      let processedData = {
        ...webhookData,
        webhookId: security.generateSecureId('wh_'),
        status: this.webhookStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deliveryCount: 0,
        failureCount: 0
      };

      // Encriptar secret si se proporciona
      if (webhookData.secret) {
        processedData.encryptedSecret = await encryptSensitiveData(webhookData.secret);
        delete processedData.secret;
      }

      // Encriptar headers si contienen datos sensibles
      if (webhookData.headers) {
        processedData.encryptedHeaders = await encryptSensitiveData(webhookData.headers);
        delete processedData.headers;
      }

      const response = await apiClient.post(ENDPOINTS.webhooks.base, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'webhook_change',
          entityType: 'webhook',
          entityId: response.data.webhookId,
          action: 'create',
          userId: webhookData.userId,
          details: {
            url: webhookData.url,
            events: webhookData.events,
            status: processedData.status
          }
        });
      }

      logger.info('Webhook created', {
        webhookId: response.data.webhookId,
        url: webhookData.url,
        events: webhookData.events.length,
        userId: webhookData.userId
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating webhook:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener webhook por ID
  async getWebhookById(webhookId, options = {}) {
    try {
      const { decryptSensitive = false } = options;
      const cacheKey = `${this.cachePrefix}${webhookId}_${decryptSensitive}`;

      // Verificar cache
      let webhookData = cache.get(cacheKey);
      if (webhookData) {
        return webhookData;
      }

      const response = await apiClient.get(`${ENDPOINTS.webhooks.base}/${webhookId}`);
      webhookData = response.data;

      // Desencriptar datos sensibles si es necesario
      if (decryptSensitive && webhookData.encryptedSecret) {
        webhookData.secret = await decryptSensitiveData(webhookData.encryptedSecret);
        delete webhookData.encryptedSecret;
      }

      if (decryptSensitive && webhookData.encryptedHeaders) {
        webhookData.headers = await decryptSensitiveData(webhookData.encryptedHeaders);
        delete webhookData.encryptedHeaders;
      }

      // Guardar en cache
      cache.set(cacheKey, webhookData, this.cacheTimeout);

      return webhookData;
    } catch (error) {
      logger.error('Error getting webhook by ID:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Listar webhooks
  async getWebhooks(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const cacheKey = `${this.cachePrefix}list_${JSON.stringify(filters)}_${page}_${limit}_${sortBy}_${sortOrder}`;

      // Verificar cache
      let webhooks = cache.get(cacheKey);
      if (webhooks) {
        return webhooks;
      }

      const params = {
        ...filters,
        page,
        limit,
        sortBy,
        sortOrder
      };

      const response = await apiClient.get(ENDPOINTS.webhooks.base, { params });
      webhooks = response.data;

      // Guardar en cache
      cache.set(cacheKey, webhooks, this.cacheTimeout);

      return webhooks;
    } catch (error) {
      logger.error('Error getting webhooks:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Actualizar webhook
  async updateWebhook(webhookId, updateData, options = {}) {
    try {
      const { auditEvent = true } = options;

      // Validar datos si incluyen campos críticos
      if (updateData.url || updateData.events) {
        const currentWebhook = await this.getWebhookById(webhookId);
        this.validateWebhookData({ ...currentWebhook, ...updateData });
      }

      // Procesar datos de actualización
      let processedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Encriptar datos sensibles si están incluidos
      if (updateData.secret) {
        processedData.encryptedSecret = await encryptSensitiveData(updateData.secret);
        delete processedData.secret;
      }

      if (updateData.headers) {
        processedData.encryptedHeaders = await encryptSensitiveData(updateData.headers);
        delete processedData.headers;
      }

      const response = await apiClient.put(`${ENDPOINTS.webhooks.base}/${webhookId}`, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'webhook_change',
          entityType: 'webhook',
          entityId: webhookId,
          action: 'update',
          userId: processedData.updatedBy,
          details: {
            updatedFields: Object.keys(updateData),
            sensitiveFields: ['secret', 'headers'].filter(field => updateData[field])
          }
        });
      }

      logger.info('Webhook updated', {
        webhookId,
        updatedFields: Object.keys(updateData)
      });

      return response.data;
    } catch (error) {
      logger.error('Error updating webhook:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Eliminar webhook
  async deleteWebhook(webhookId, options = {}) {
    try {
      const { auditEvent = true, userId } = options;

      const response = await apiClient.delete(`${ENDPOINTS.webhooks.base}/${webhookId}`);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'webhook_change',
          entityType: 'webhook',
          entityId: webhookId,
          action: 'delete',
          userId: userId,
          details: {
            timestamp: new Date().toISOString()
          }
        });
      }

      logger.info('Webhook deleted', {
        webhookId,
        deletedBy: userId
      });

      return response.data;
    } catch (error) {
      logger.error('Error deleting webhook:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Activar/Desactivar webhook
  async toggleWebhookStatus(webhookId, status, options = {}) {
    try {
      const { auditEvent = true, userId } = options;

      if (!Object.values(this.webhookStatus).includes(status)) {
        throw errorHandler.createValidationError(`Invalid webhook status: ${status}`);
      }

      const updateData = {
        status,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      };

      const response = await apiClient.put(`${ENDPOINTS.webhooks.base}/${webhookId}/status`, updateData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'webhook_change',
          entityType: 'webhook',
          entityId: webhookId,
          action: 'status_change',
          userId: userId,
          details: {
            newStatus: status,
            timestamp: new Date().toISOString()
          }
        });
      }

      logger.info('Webhook status changed', {
        webhookId,
        newStatus: status
      });

      return response.data;
    } catch (error) {
      logger.error('Error changing webhook status:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Probar webhook
  async testWebhook(webhookId, options = {}) {
    try {
      const { auditEvent = true, testEvent = this.availableEvents.SYSTEM_ALERT } = options;

      const testData = {
        webhookId,
        testEvent,
        testedAt: new Date().toISOString()
      };

      const response = await apiClient.post(`${ENDPOINTS.webhooks.base}/${webhookId}/test`, testData);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'webhook_test',
          entityType: 'webhook',
          entityId: webhookId,
          action: 'test',
          details: {
            testEvent,
            success: response.data.success,
            responseTime: response.data.responseTime,
            httpStatus: response.data.httpStatus
          }
        });
      }

      logger.info('Webhook tested', {
        webhookId,
        testEvent,
        success: response.data.success,
        responseTime: response.data.responseTime
      });

      return response.data;
    } catch (error) {
      logger.error('Error testing webhook:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Enviar evento a webhooks
  async sendEvent(eventType, eventData, options = {}) {
    try {
      const { auditEvent = true, userId } = options;

      if (!Object.values(this.availableEvents).includes(eventType)) {
        throw errorHandler.createValidationError(`Invalid event type: ${eventType}`);
      }

      const payload = {
        eventType,
        eventData,
        eventId: security.generateSecureId('evt_'),
        timestamp: new Date().toISOString(),
        userId
      };

      const response = await apiClient.post(ENDPOINTS.webhooks.send, payload);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'webhook_event',
          entityType: 'webhook',
          entityId: 'broadcast',
          action: 'send_event',
          userId: userId,
          details: {
            eventType,
            eventId: payload.eventId,
            webhooksTriggered: response.data.webhooksTriggered,
            deliveriesScheduled: response.data.deliveriesScheduled
          }
        });
      }

      logger.info('Event sent to webhooks', {
        eventType,
        eventId: payload.eventId,
        webhooksTriggered: response.data.webhooksTriggered
      });

      return response.data;
    } catch (error) {
      logger.error('Error sending event to webhooks:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener logs de entrega
  async getDeliveryLogs(webhookId, options = {}) {
    try {
      const { page = 1, limit = 50, status, dateRange } = options;
      const cacheKey = `${this.cachePrefix}logs_${webhookId}_${page}_${limit}_${status}_${JSON.stringify(dateRange)}`;

      // Verificar cache
      let logs = cache.get(cacheKey);
      if (logs) {
        return logs;
      }

      const params = {
        page,
        limit,
        status,
        dateRange: dateRange ? JSON.stringify(dateRange) : undefined
      };

      const response = await apiClient.get(`${ENDPOINTS.webhooks.base}/${webhookId}/deliveries`, { params });
      logs = response.data;

      // Guardar en cache por poco tiempo
      cache.set(cacheKey, logs, 5 * 60 * 1000); // 5 minutos

      return logs;
    } catch (error) {
      logger.error('Error getting delivery logs:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Reintentar entrega
  async retryDelivery(deliveryId, options = {}) {
    try {
      const { auditEvent = true } = options;

      const retryData = {
        deliveryId,
        retriedAt: new Date().toISOString()
      };

      const response = await apiClient.post(`${ENDPOINTS.webhooks.deliveries}/${deliveryId}/retry`, retryData);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'webhook_delivery',
          entityType: 'webhook',
          entityId: response.data.webhookId,
          action: 'retry_delivery',
          details: {
            deliveryId,
            attempt: response.data.attempt,
            nextRetryAt: response.data.nextRetryAt
          }
        });
      }

      logger.info('Delivery retry initiated', {
        deliveryId,
        webhookId: response.data.webhookId,
        attempt: response.data.attempt
      });

      return response.data;
    } catch (error) {
      logger.error('Error retrying delivery:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener estadísticas de webhook
  async getWebhookStatistics(webhookId, options = {}) {
    try {
      const { dateRange } = options;
      const cacheKey = `${this.cachePrefix}stats_${webhookId}_${JSON.stringify(dateRange)}`;

      // Verificar cache
      let stats = cache.get(cacheKey);
      if (stats) {
        return stats;
      }

      const params = {
        dateRange: dateRange ? JSON.stringify(dateRange) : undefined
      };

      const response = await apiClient.get(`${ENDPOINTS.webhooks.base}/${webhookId}/statistics`, { params });
      stats = response.data;

      // Guardar en cache por menos tiempo para estadísticas
      cache.set(cacheKey, stats, 10 * 60 * 1000); // 10 minutos

      return stats;
    } catch (error) {
      logger.error('Error getting webhook statistics:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Validar firma de webhook entrante
  async validateSignature(payload, signature, secret, algorithm = this.signatureAlgorithms.HMAC_SHA256) {
    try {
      const validationData = {
        payload,
        signature,
        secret,
        algorithm
      };

      const response = await apiClient.post(ENDPOINTS.webhooks.validate, validationData);

      return response.data.valid;
    } catch (error) {
      logger.error('Error validating webhook signature:', error);
      return false;
    }
  }

  // Procesar webhook entrante
  async processIncomingWebhook(webhookData, options = {}) {
    try {
      const { auditEvent = true, validateSignature = true } = options;

      // Validar firma si es requerido
      if (validateSignature && webhookData.signature && webhookData.secret) {
        const isValid = await this.validateSignature(
          webhookData.payload,
          webhookData.signature,
          webhookData.secret,
          webhookData.algorithm
        );

        if (!isValid) {
          throw errorHandler.createValidationError('Invalid webhook signature');
        }
      }

      const processData = {
        ...webhookData,
        processedAt: new Date().toISOString(),
        processingId: security.generateSecureId('proc_')
      };

      const response = await apiClient.post(ENDPOINTS.webhooks.process, processData);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'webhook_received',
          entityType: 'webhook',
          entityId: 'incoming',
          action: 'process',
          details: {
            processingId: processData.processingId,
            source: webhookData.source,
            eventType: webhookData.eventType,
            success: response.data.success
          }
        });
      }

      logger.info('Incoming webhook processed', {
        processingId: processData.processingId,
        source: webhookData.source,
        success: response.data.success
      });

      return response.data;
    } catch (error) {
      logger.error('Error processing incoming webhook:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener eventos disponibles
  getAvailableEvents(category = null) {
    if (category) {
      const categoryPrefix = category.toLowerCase();
      return Object.entries(this.availableEvents)
        .filter(([key, value]) => value.startsWith(categoryPrefix))
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});
    }
    return this.availableEvents;
  }

  // Obtener categorías de eventos
  getEventCategories() {
    return this.eventCategories;
  }

  // Obtener configuración de reintentos
  getRetryConfig() {
    return this.retryConfig;
  }

  // Calcular próximo reintento
  calculateNextRetry(attempt, baseDelay = this.retryConfig.initialDelay) {
    const delay = Math.min(
      baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
      this.retryConfig.maxDelay
    );

    return new Date(Date.now() + delay);
  }

  // Invalidar cache relacionado
  invalidateRelatedCache() {
    try {
      // Invalidar todo el cache de webhooks
      cache.deleteByPattern(`${this.cachePrefix}*`);

      // También invalidar cache de API relacionado
      apiCache.deleteByPattern('webhooks*');

    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }

  // Limpiar cache
  clearCache() {
    try {
      cache.deleteByPattern(`${this.cachePrefix}*`);
      logger.info('WebhookService cache cleared');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  // Verificar salud del servicio
  async checkHealth() {
    try {
      const healthData = {
        service: 'WebhookService',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cache: {
          size: cache.size(),
          enabled: true
        }
      };

      // Verificar conectividad básica
      await apiClient.get(`${ENDPOINTS.webhooks.base}/health`);

      return healthData;
    } catch (error) {
      return {
        service: 'WebhookService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Crear instancia única del servicio
export const webhookService = new WebhookService();

// Métodos de conveniencia para exportación directa
export const createWebhook = (webhookData, options) => webhookService.createWebhook(webhookData, options);
export const getWebhookById = (webhookId, options) => webhookService.getWebhookById(webhookId, options);
export const getWebhooks = (filters, options) => webhookService.getWebhooks(filters, options);
export const updateWebhook = (webhookId, updateData, options) => webhookService.updateWebhook(webhookId, updateData, options);
export const deleteWebhook = (webhookId, options) => webhookService.deleteWebhook(webhookId, options);
export const toggleWebhookStatus = (webhookId, status, options) => webhookService.toggleWebhookStatus(webhookId, status, options);
export const testWebhook = (webhookId, options) => webhookService.testWebhook(webhookId, options);
export const sendEvent = (eventType, eventData, options) => webhookService.sendEvent(eventType, eventData, options);
export const getDeliveryLogs = (webhookId, options) => webhookService.getDeliveryLogs(webhookId, options);
export const retryDelivery = (deliveryId, options) => webhookService.retryDelivery(deliveryId, options);
export const getWebhookStatistics = (webhookId, options) => webhookService.getWebhookStatistics(webhookId, options);
export const validateSignature = (payload, signature, secret, algorithm) => webhookService.validateSignature(payload, signature, secret, algorithm);
export const processIncomingWebhook = (webhookData, options) => webhookService.processIncomingWebhook(webhookData, options);
export const getAvailableEvents = (category) => webhookService.getAvailableEvents(category);
export const getEventCategories = () => webhookService.getEventCategories();
export const getRetryConfig = () => webhookService.getRetryConfig();

export default webhookService;