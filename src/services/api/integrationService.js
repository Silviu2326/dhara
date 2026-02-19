import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { cache, apiCache } from '../utils/cache';
import { privacy, encryptSensitiveData, decryptSensitiveData } from '../utils/privacy';
import { security, generateSecureId } from '../utils/security';
import { auditService } from '../utils/auditService';

class IntegrationService {
  constructor() {
    this.cachePrefix = 'integration_';
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutos
    this.maxRetries = 3;
    this.auditContext = 'integration_service';

    // Estados de integración
    this.integrationStatus = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      CONNECTING: 'connecting',
      FAILED: 'failed',
      SUSPENDED: 'suspended',
      EXPIRED: 'expired',
      MAINTENANCE: 'maintenance'
    };

    // Tipos de integración
    this.integrationTypes = {
      CALENDAR: 'calendar',
      VIDEO_CALL: 'video_call',
      PAYMENT: 'payment',
      MESSAGING: 'messaging',
      EMAIL: 'email',
      STORAGE: 'storage',
      ANALYTICS: 'analytics',
      CRM: 'crm',
      ACCOUNTING: 'accounting'
    };

    // Proveedores soportados
    this.supportedProviders = {
      calendar: {
        GOOGLE_CALENDAR: {
          id: 'google_calendar',
          name: 'Google Calendar',
          authType: 'oauth2',
          scopes: ['calendar.readonly', 'calendar.events'],
          features: ['read_events', 'create_events', 'update_events', 'delete_events']
        },
        OUTLOOK: {
          id: 'outlook',
          name: 'Microsoft Outlook',
          authType: 'oauth2',
          scopes: ['calendar.readwrite'],
          features: ['read_events', 'create_events', 'update_events', 'delete_events']
        },
        APPLE_CALENDAR: {
          id: 'apple_calendar',
          name: 'Apple Calendar',
          authType: 'caldav',
          features: ['read_events', 'create_events']
        }
      },
      video_call: {
        ZOOM: {
          id: 'zoom',
          name: 'Zoom',
          authType: 'oauth2',
          features: ['create_meeting', 'schedule_meeting', 'manage_participants']
        },
        TEAMS: {
          id: 'teams',
          name: 'Microsoft Teams',
          authType: 'oauth2',
          features: ['create_meeting', 'schedule_meeting']
        },
        GOOGLE_MEET: {
          id: 'google_meet',
          name: 'Google Meet',
          authType: 'oauth2',
          features: ['create_meeting', 'schedule_meeting']
        }
      },
      payment: {
        STRIPE: {
          id: 'stripe',
          name: 'Stripe',
          authType: 'api_key',
          features: ['process_payments', 'subscriptions', 'refunds']
        },
        PAYPAL: {
          id: 'paypal',
          name: 'PayPal',
          authType: 'oauth2',
          features: ['process_payments', 'subscriptions']
        },
        MERCADOPAGO: {
          id: 'mercadopago',
          name: 'MercadoPago',
          authType: 'api_key',
          features: ['process_payments', 'subscriptions']
        }
      },
      messaging: {
        WHATSAPP_BUSINESS: {
          id: 'whatsapp_business',
          name: 'WhatsApp Business API',
          authType: 'api_key',
          features: ['send_messages', 'receive_messages', 'templates']
        },
        TELEGRAM: {
          id: 'telegram',
          name: 'Telegram Bot',
          authType: 'bot_token',
          features: ['send_messages', 'receive_messages']
        },
        SMS: {
          id: 'sms',
          name: 'SMS Provider',
          authType: 'api_key',
          features: ['send_sms']
        }
      }
    };

    // Estados de sincronización
    this.syncStatus = {
      IDLE: 'idle',
      SYNCING: 'syncing',
      SUCCESS: 'success',
      ERROR: 'error',
      PARTIAL: 'partial'
    };

    // Tipos de eventos de sincronización
    this.syncEvents = {
      CALENDAR_SYNC: 'calendar_sync',
      CONTACT_SYNC: 'contact_sync',
      PAYMENT_SYNC: 'payment_sync',
      FULL_SYNC: 'full_sync'
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await auditService.logEvent({
        eventType: 'system_change',
        entityType: 'service',
        entityId: 'integration_service',
        action: 'initialize',
        details: { timestamp: new Date().toISOString() }
      });

      this.initialized = true;
      logger.info('IntegrationService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize IntegrationService:', error);
      throw error;
    }
  }

  // Validación de datos de integración
  validateIntegrationData(integrationData) {
    const requiredFields = ['userId', 'providerId', 'type'];
    const missingFields = requiredFields.filter(field => !integrationData[field]);

    if (missingFields.length > 0) {
      throw errorHandler.createValidationError(
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // Validar tipo de integración
    if (!Object.values(this.integrationTypes).includes(integrationData.type)) {
      throw errorHandler.createValidationError(
        `Invalid integration type: ${integrationData.type}`
      );
    }

    // Validar proveedor
    const typeProviders = this.supportedProviders[integrationData.type];
    if (!typeProviders || !typeProviders[integrationData.providerId.toUpperCase()]) {
      throw errorHandler.createValidationError(
        `Unsupported provider ${integrationData.providerId} for type ${integrationData.type}`
      );
    }

    return true;
  }

  // Crear integración
  async createIntegration(integrationData, options = {}) {
    try {
      const { auditEvent = true } = options;

      // Validar datos de integración
      this.validateIntegrationData(integrationData);

      // Verificar integración existente
      const existingIntegration = await this.getIntegrationByProvider(
        integrationData.userId,
        integrationData.providerId,
        { throwOnNotFound: false }
      );

      if (existingIntegration) {
        throw errorHandler.createConflictError(`Integration with ${integrationData.providerId} already exists`);
      }

      // Procesar datos de integración
      let processedData = {
        ...integrationData,
        integrationId: security.generateSecureId('int_'),
        status: this.integrationStatus.CONNECTING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Encriptar credenciales
      if (integrationData.credentials) {
        processedData.encryptedCredentials = await encryptSensitiveData(integrationData.credentials);
        delete processedData.credentials;
      }

      // Encriptar configuración si contiene datos sensibles
      if (integrationData.config && integrationData.config.sensitiveData) {
        processedData.encryptedConfig = await encryptSensitiveData(integrationData.config);
        delete processedData.config;
      }

      const response = await apiClient.post(ENDPOINTS.integrations.base, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache(integrationData.userId);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'integration_change',
          entityType: 'integration',
          entityId: response.data.integrationId,
          action: 'create',
          userId: integrationData.userId,
          details: {
            providerId: integrationData.providerId,
            type: integrationData.type,
            status: processedData.status
          }
        });
      }

      logger.info('Integration created', {
        integrationId: response.data.integrationId,
        userId: integrationData.userId,
        providerId: integrationData.providerId,
        type: integrationData.type
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating integration:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener integración por ID
  async getIntegrationById(integrationId, options = {}) {
    try {
      const { decryptCredentials = false } = options;
      const cacheKey = `${this.cachePrefix}${integrationId}_${decryptCredentials}`;

      // Verificar cache
      let integrationData = cache.get(cacheKey);
      if (integrationData) {
        return integrationData;
      }

      const response = await apiClient.get(`${ENDPOINTS.integrations.base}/${integrationId}`);
      integrationData = response.data;

      // Desencriptar credenciales si es necesario
      if (decryptCredentials && integrationData.encryptedCredentials) {
        integrationData.credentials = await decryptSensitiveData(integrationData.encryptedCredentials);
        delete integrationData.encryptedCredentials;
      }

      if (decryptCredentials && integrationData.encryptedConfig) {
        integrationData.config = await decryptSensitiveData(integrationData.encryptedConfig);
        delete integrationData.encryptedConfig;
      }

      // Guardar en cache
      cache.set(cacheKey, integrationData, this.cacheTimeout);

      return integrationData;
    } catch (error) {
      logger.error('Error getting integration by ID:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener integración por proveedor
  async getIntegrationByProvider(userId, providerId, options = {}) {
    try {
      const { throwOnNotFound = true } = options;
      const cacheKey = `${this.cachePrefix}provider_${userId}_${providerId}`;

      // Verificar cache
      let integrationData = cache.get(cacheKey);
      if (integrationData) {
        return integrationData;
      }

      try {
        const response = await apiClient.get(`${ENDPOINTS.integrations.user}/${userId}/provider/${providerId}`);
        integrationData = response.data;

        // Guardar en cache
        cache.set(cacheKey, integrationData, this.cacheTimeout);

        return integrationData;
      } catch (error) {
        if (error.response?.status === 404 && !throwOnNotFound) {
          return null;
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error getting integration by provider:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Listar integraciones del usuario
  async getUserIntegrations(userId, options = {}) {
    try {
      const { type, status, includeInactive = false } = options;
      const cacheKey = `${this.cachePrefix}user_${userId}_${type}_${status}_${includeInactive}`;

      // Verificar cache
      let integrations = cache.get(cacheKey);
      if (integrations) {
        return integrations;
      }

      const params = { type, status, includeInactive };
      const response = await apiClient.get(`${ENDPOINTS.integrations.user}/${userId}`, { params });
      integrations = response.data;

      // Guardar en cache
      cache.set(cacheKey, integrations, this.cacheTimeout);

      return integrations;
    } catch (error) {
      logger.error('Error getting user integrations:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Actualizar integración
  async updateIntegration(integrationId, updateData, options = {}) {
    try {
      const { auditEvent = true } = options;

      // Procesar datos de actualización
      let processedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Encriptar credenciales si están incluidas
      if (updateData.credentials) {
        processedData.encryptedCredentials = await encryptSensitiveData(updateData.credentials);
        delete processedData.credentials;
      }

      if (updateData.config && updateData.config.sensitiveData) {
        processedData.encryptedConfig = await encryptSensitiveData(updateData.config);
        delete processedData.config;
      }

      const response = await apiClient.put(`${ENDPOINTS.integrations.base}/${integrationId}`, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'integration_change',
          entityType: 'integration',
          entityId: integrationId,
          action: 'update',
          userId: processedData.updatedBy,
          details: {
            updatedFields: Object.keys(updateData),
            sensitiveFields: ['credentials', 'config'].filter(field => updateData[field])
          }
        });
      }

      logger.info('Integration updated', {
        integrationId,
        updatedFields: Object.keys(updateData)
      });

      return response.data;
    } catch (error) {
      logger.error('Error updating integration:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Eliminar integración
  async deleteIntegration(integrationId, options = {}) {
    try {
      const { auditEvent = true, userId } = options;

      const response = await apiClient.delete(`${ENDPOINTS.integrations.base}/${integrationId}`);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'integration_change',
          entityType: 'integration',
          entityId: integrationId,
          action: 'delete',
          userId: userId,
          details: {
            timestamp: new Date().toISOString()
          }
        });
      }

      logger.info('Integration deleted', {
        integrationId,
        deletedBy: userId
      });

      return response.data;
    } catch (error) {
      logger.error('Error deleting integration:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Probar conexión de integración
  async testConnection(integrationId, options = {}) {
    try {
      const { auditEvent = true } = options;

      const testData = {
        integrationId,
        testedAt: new Date().toISOString()
      };

      const response = await apiClient.post(`${ENDPOINTS.integrations.base}/${integrationId}/test`, testData);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'integration_test',
          entityType: 'integration',
          entityId: integrationId,
          action: 'test_connection',
          details: {
            success: response.data.success,
            responseTime: response.data.responseTime,
            error: response.data.error
          }
        });
      }

      logger.info('Integration connection tested', {
        integrationId,
        success: response.data.success,
        responseTime: response.data.responseTime
      });

      return response.data;
    } catch (error) {
      logger.error('Error testing integration connection:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Sincronizar datos
  async syncData(integrationId, syncType = this.syncEvents.FULL_SYNC, options = {}) {
    try {
      const { auditEvent = true, force = false } = options;

      const syncData = {
        integrationId,
        syncType,
        force,
        initiatedAt: new Date().toISOString()
      };

      const response = await apiClient.post(`${ENDPOINTS.integrations.base}/${integrationId}/sync`, syncData);

      // Invalidar cache relacionado ya que los datos pueden haber cambiado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'integration_sync',
          entityType: 'integration',
          entityId: integrationId,
          action: 'sync_data',
          details: {
            syncType,
            force,
            jobId: response.data.jobId,
            estimatedDuration: response.data.estimatedDuration
          }
        });
      }

      logger.info('Data sync initiated', {
        integrationId,
        syncType,
        jobId: response.data.jobId
      });

      return response.data;
    } catch (error) {
      logger.error('Error syncing data:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener estado de sincronización
  async getSyncStatus(integrationId, options = {}) {
    try {
      const { jobId } = options;
      const cacheKey = `${this.cachePrefix}sync_${integrationId}_${jobId || 'latest'}`;

      // Verificar cache por poco tiempo para estado de sync
      let syncStatus = cache.get(cacheKey);
      if (syncStatus) {
        return syncStatus;
      }

      const params = jobId ? { jobId } : {};
      const response = await apiClient.get(`${ENDPOINTS.integrations.base}/${integrationId}/sync-status`, { params });
      syncStatus = response.data;

      // Guardar en cache por poco tiempo
      cache.set(cacheKey, syncStatus, 2 * 60 * 1000); // 2 minutos

      return syncStatus;
    } catch (error) {
      logger.error('Error getting sync status:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Configurar webhook para integración
  async configureWebhook(integrationId, webhookConfig, options = {}) {
    try {
      const { auditEvent = true } = options;

      const configData = {
        integrationId,
        ...webhookConfig,
        configuredAt: new Date().toISOString()
      };

      const response = await apiClient.post(`${ENDPOINTS.integrations.base}/${integrationId}/webhook`, configData);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'integration_change',
          entityType: 'integration',
          entityId: integrationId,
          action: 'configure_webhook',
          details: {
            webhookUrl: webhookConfig.url,
            events: webhookConfig.events
          }
        });
      }

      logger.info('Webhook configured for integration', {
        integrationId,
        webhookId: response.data.webhookId
      });

      return response.data;
    } catch (error) {
      logger.error('Error configuring webhook:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener eventos disponibles para integración
  async getAvailableEvents(providerId, type) {
    try {
      const cacheKey = `${this.cachePrefix}events_${providerId}_${type}`;

      // Verificar cache
      let events = cache.get(cacheKey);
      if (events) {
        return events;
      }

      const response = await apiClient.get(`${ENDPOINTS.integrations.events}/${providerId}/${type}`);
      events = response.data;

      // Guardar en cache por más tiempo ya que los eventos disponibles cambian poco
      cache.set(cacheKey, events, 60 * 60 * 1000); // 1 hora

      return events;
    } catch (error) {
      logger.error('Error getting available events:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener logs de integración
  async getIntegrationLogs(integrationId, options = {}) {
    try {
      const { page = 1, limit = 50, level = 'all', dateRange } = options;
      const cacheKey = `${this.cachePrefix}logs_${integrationId}_${page}_${limit}_${level}_${JSON.stringify(dateRange)}`;

      // Verificar cache
      let logs = cache.get(cacheKey);
      if (logs) {
        return logs;
      }

      const params = {
        page,
        limit,
        level,
        dateRange: dateRange ? JSON.stringify(dateRange) : undefined
      };

      const response = await apiClient.get(`${ENDPOINTS.integrations.base}/${integrationId}/logs`, { params });
      logs = response.data;

      // Guardar en cache por poco tiempo
      cache.set(cacheKey, logs, 5 * 60 * 1000); // 5 minutos

      return logs;
    } catch (error) {
      logger.error('Error getting integration logs:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener estadísticas de integración
  async getIntegrationStatistics(filters = {}, options = {}) {
    try {
      const { dateRange, groupBy = 'provider' } = options;
      const cacheKey = `${this.cachePrefix}stats_${JSON.stringify(filters)}_${JSON.stringify(options)}`;

      // Verificar cache
      let stats = cache.get(cacheKey);
      if (stats) {
        return stats;
      }

      const params = {
        ...filters,
        dateRange: dateRange ? JSON.stringify(dateRange) : undefined,
        groupBy
      };

      const response = await apiClient.get(`${ENDPOINTS.integrations.base}/statistics`, { params });
      stats = response.data;

      // Guardar en cache por menos tiempo para estadísticas
      cache.set(cacheKey, stats, 10 * 60 * 1000); // 10 minutos

      return stats;
    } catch (error) {
      logger.error('Error getting integration statistics:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener estado de salud de todas las integraciones
  async getIntegrationsHealth(userId, options = {}) {
    try {
      const { includeInactive = false } = options;
      const cacheKey = `${this.cachePrefix}health_${userId}_${includeInactive}`;

      // Verificar cache
      let health = cache.get(cacheKey);
      if (health) {
        return health;
      }

      const params = { includeInactive };
      const response = await apiClient.get(`${ENDPOINTS.integrations.user}/${userId}/health`, { params });
      health = response.data;

      // Guardar en cache por poco tiempo
      cache.set(cacheKey, health, 5 * 60 * 1000); // 5 minutos

      return health;
    } catch (error) {
      logger.error('Error getting integrations health:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener proveedores soportados
  getSupportedProviders(type = null) {
    if (type) {
      return this.supportedProviders[type] || {};
    }
    return this.supportedProviders;
  }

  // Validar credenciales antes de crear integración
  async validateCredentials(providerId, credentials, type) {
    try {
      const validationData = {
        providerId,
        credentials,
        type
      };

      const response = await apiClient.post(`${ENDPOINTS.integrations.validate}`, validationData);

      logger.info('Credentials validated', {
        providerId,
        type,
        valid: response.data.valid
      });

      return response.data;
    } catch (error) {
      logger.error('Error validating credentials:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Renovar token de integración
  async refreshToken(integrationId, options = {}) {
    try {
      const { auditEvent = true } = options;

      const response = await apiClient.post(`${ENDPOINTS.integrations.base}/${integrationId}/refresh-token`);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'integration_change',
          entityType: 'integration',
          entityId: integrationId,
          action: 'refresh_token',
          details: {
            success: response.data.success,
            expiresAt: response.data.expiresAt
          }
        });
      }

      logger.info('Integration token refreshed', {
        integrationId,
        success: response.data.success
      });

      return response.data;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Invalidar cache relacionado
  invalidateRelatedCache(userId = null) {
    try {
      if (userId) {
        // Invalidar cache específico del usuario
        const patterns = [
          `${this.cachePrefix}user_${userId}*`,
          `${this.cachePrefix}provider_${userId}*`,
          `${this.cachePrefix}health_${userId}*`,
          `${this.cachePrefix}stats*`
        ];

        patterns.forEach(pattern => cache.deleteByPattern(pattern));
      } else {
        // Invalidar todo el cache de integraciones
        cache.deleteByPattern(`${this.cachePrefix}*`);
      }

      // También invalidar cache de API relacionado
      apiCache.deleteByPattern('integrations*');

    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }

  // Limpiar cache
  clearCache() {
    try {
      cache.deleteByPattern(`${this.cachePrefix}*`);
      logger.info('IntegrationService cache cleared');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  // Verificar salud del servicio
  async checkHealth() {
    try {
      const healthData = {
        service: 'IntegrationService',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cache: {
          size: cache.size(),
          enabled: true
        }
      };

      // Verificar conectividad básica
      await apiClient.get(`${ENDPOINTS.integrations.base}/health`);

      return healthData;
    } catch (error) {
      return {
        service: 'IntegrationService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Crear instancia única del servicio
export const integrationService = new IntegrationService();

// Métodos de conveniencia para exportación directa
export const createIntegration = (integrationData, options) => integrationService.createIntegration(integrationData, options);
export const getIntegrationById = (integrationId, options) => integrationService.getIntegrationById(integrationId, options);
export const getIntegrationByProvider = (userId, providerId, options) => integrationService.getIntegrationByProvider(userId, providerId, options);
export const getUserIntegrations = (userId, options) => integrationService.getUserIntegrations(userId, options);
export const updateIntegration = (integrationId, updateData, options) => integrationService.updateIntegration(integrationId, updateData, options);
export const deleteIntegration = (integrationId, options) => integrationService.deleteIntegration(integrationId, options);
export const testConnection = (integrationId, options) => integrationService.testConnection(integrationId, options);
export const syncData = (integrationId, syncType, options) => integrationService.syncData(integrationId, syncType, options);
export const getSyncStatus = (integrationId, options) => integrationService.getSyncStatus(integrationId, options);
export const configureWebhook = (integrationId, webhookConfig, options) => integrationService.configureWebhook(integrationId, webhookConfig, options);
export const getAvailableEvents = (providerId, type) => integrationService.getAvailableEvents(providerId, type);
export const getIntegrationLogs = (integrationId, options) => integrationService.getIntegrationLogs(integrationId, options);
export const getIntegrationStatistics = (filters, options) => integrationService.getIntegrationStatistics(filters, options);
export const getIntegrationsHealth = (userId, options) => integrationService.getIntegrationsHealth(userId, options);
export const getSupportedProviders = (type) => integrationService.getSupportedProviders(type);
export const validateCredentials = (providerId, credentials, type) => integrationService.validateCredentials(providerId, credentials, type);
export const refreshToken = (integrationId, options) => integrationService.refreshToken(integrationId, options);

export default integrationService;