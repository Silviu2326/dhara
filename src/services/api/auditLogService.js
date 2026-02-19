import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { APP_CONSTANTS } from '../config/constants';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';
import { cache } from '../utils/cache';
import { tokenManager } from '../utils/tokenManager';
import { privacy } from '../utils/privacy';

/**
 * Servicio de logs de auditoría para cumplimiento y seguimiento
 * Proporciona funcionalidades para registrar, consultar y analizar eventos de auditoría
 */
class AuditLogService {
  constructor() {
    this.cache = cache;
    this.cachePrefix = 'audit_';
    this.cacheTTL = APP_CONSTANTS.CACHE.SHORT_TTL;
    this.isInitialized = false;
    this.retentionPeriods = {
      'security_event': 365 * 24 * 60 * 60 * 1000, // 1 año
      'data_access': 180 * 24 * 60 * 60 * 1000,    // 6 meses
      'user_action': 90 * 24 * 60 * 60 * 1000,     // 3 meses
      'system_change': 365 * 24 * 60 * 60 * 1000,  // 1 año
      'compliance': 2555 * 24 * 60 * 60 * 1000     // 7 años
    };
  }

  /**
   * Inicializa el servicio de audit logs
   */
  async initialize() {
    try {
      // Configurar retención automática
      this.setupRetentionSchedule();

      // Configurar backup automático
      this.setupBackupSchedule();

      this.isInitialized = true;

      logger.info('AuditLogService initialized successfully');

      // Log de inicialización después de que el servicio esté completamente inicializado
      // Para evitar dependencias circulares, usamos setTimeout
      setTimeout(async () => {
        try {
          await this.logEvent({
            eventType: 'system_change',
            entityType: 'service',
            entityId: 'auditLogService',
            action: 'initialize',
            details: { timestamp: new Date().toISOString() }
          });
        } catch (logError) {
          logger.warn('Failed to log audit service initialization', logError);
        }
      }, 100);

      return true;
    } catch (error) {
      logger.error('Failed to initialize AuditLogService', { error: error.message });
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Normalize action to match backend validation
   */
  normalizeAction(action) {
    if (!action) return 'read';

    // Map common actions to backend-accepted values
    const actionMap = {
      'get_payment_stats': 'read',
      'get_financial_statistics': 'read',
      'get_payout_data': 'read',
      'fetch_data': 'read',
      'view_data': 'read',
      'access_data': 'read',
      'create_payment': 'payment_process',
      'process_payment': 'payment_process',
      'refund_payment': 'payment_refund',
      'create_booking': 'booking_create',
      'update_booking': 'booking_update',
      'cancel_booking': 'booking_cancel',
      'upload_file': 'file_upload',
      'download_file': 'file_download',
      'delete_file': 'file_delete'
    };

    return actionMap[action] || action;
  }

  /**
   * Map entity type to resource type
   */
  mapEntityToResourceType(entityType) {
    if (!entityType) return 'system';

    const typeMap = {
      'payment_statistics': 'payment',
      'financial_statistics': 'payment',
      'payout_data': 'payment',
      'payment_data': 'payment',
      'booking_data': 'booking',
      'client_data': 'client',
      'user_data': 'user',
      'session_data': 'session',
      'document_data': 'document',
      'file_data': 'file',
      'notification_data': 'notification',
      'subscription_data': 'subscription',
      'plan_data': 'plan'
    };

    return typeMap[entityType] || entityType.replace('_data', '').replace('_statistics', '');
  }

  /**
   * Determine category based on entity and action
   */
  determineCategory(entityType, action) {
    if (entityType?.includes('payment') || action?.includes('payment')) {
      return 'payment';
    }
    if (entityType?.includes('user') || action?.includes('login') || action?.includes('logout')) {
      return 'user';
    }
    if (entityType?.includes('security') || action?.includes('security')) {
      return 'security';
    }
    if (action?.includes('api') || action === 'read') {
      return 'api';
    }
    if (entityType?.includes('integration')) {
      return 'integration';
    }
    if (entityType?.includes('notification') || action?.includes('notification')) {
      return 'communication';
    }

    return 'data';
  }

  /**
   * Registra un evento de auditoría
   */
  async logEvent(eventData) {
    try {
      // Safety check for required data
      if (!eventData || typeof eventData !== 'object') {
        throw new Error('Event data is required and must be an object');
      }

      // Transform action to match backend validation
      const normalizedAction = this.normalizeAction(eventData.action);

      // Transform entity type to resource type
      const resourceType = this.mapEntityToResourceType(eventData.entityType);

      // Determine category based on entity type and action
      const category = this.determineCategory(eventData.entityType, normalizedAction);

      const auditEvent = {
        action: normalizedAction,
        resource: {
          type: resourceType,
          id: eventData.entityId,
          name: eventData.entityType
        },
        category: category,
        severity: eventData.severity || 'info',
        description: eventData.description || `${normalizedAction} ${eventData.entityType}`,
        context: {
          eventType: eventData.eventType,
          originalAction: eventData.action,
          outcome: eventData.outcome || 'success',
          userId: typeof tokenManager?.getCurrentUserId === 'function' ? tokenManager.getCurrentUserId() : 'anonymous',
          sessionId: typeof tokenManager?.getSessionId === 'function' ? tokenManager.getSessionId() : 'no-session',
          ipAddress: await this.getClientIP(),
          userAgent: navigator?.userAgent || 'Unknown',
          timestamp: new Date().toISOString()
        },
        tags: eventData.tags || [],
        details: eventData.details || {}
      };

      // Cifrar datos sensibles
      if (auditEvent.details && Object.keys(auditEvent.details).length > 0) {
        auditEvent.details = await privacy.encryptSensitiveData(auditEvent.details);
      }

      const response = await apiClient.post(ENDPOINTS.AUDIT_LOGS.CREATE, auditEvent);

      // Cache del evento reciente
      const cacheKey = `${this.cachePrefix}recent_events`;
      const recentEvents = this.cache.get(cacheKey, { defaultValue: [] });
      recentEvents.unshift(auditEvent);

      // Mantener solo los últimos 100 eventos en cache
      if (recentEvents.length > 100) {
        recentEvents.splice(100);
      }

      this.cache.set(cacheKey, recentEvents, this.cacheTTL);

      // Log local para debugging
      logger.debug('Audit event logged', {
        eventId: auditEvent.id,
        eventType: auditEvent.eventType,
        action: auditEvent.action
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to log audit event', {
        eventData,
        error: error.message
      });

      // Fallback: guardar en localStorage si falla la API
      this.storeEventLocally(eventData);
      throw errorHandler.handle(error);
    }
  }

  /**
   * Obtiene logs de auditoría con filtros
   */
  async getLogs(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        startDate,
        endDate,
        eventType,
        entityType,
        entityId,
        userId,
        action,
        outcome,
        riskLevel,
        compliance,
        search
      } = options;

      const cacheKey = `${this.cachePrefix}logs_${JSON.stringify(options)}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const params = {
        page,
        limit,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(eventType && { eventType }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        ...(userId && { userId }),
        ...(action && { action }),
        ...(outcome && { outcome }),
        ...(riskLevel && { riskLevel }),
        ...(compliance && { compliance }),
        ...(search && { search })
      };

      const response = await apiClient.get(ENDPOINTS.AUDIT_LOGS.GET_ALL, { params });

      // Descifrar detalles sensibles
      if (response.data?.items) {
        for (const event of response.data.items) {
          if (event.details) {
            try {
              event.details = await privacy.decryptSensitiveData(event.details);
            } catch (decryptError) {
              logger.warn('Failed to decrypt audit event details', {
                eventId: event.id,
                error: decryptError.message
              });
            }
          }
        }
      }

      this.cache.set(cacheKey, response.data, this.cacheTTL);
      return response.data;
    } catch (error) {
      logger.error('Failed to get audit logs', { options, error: error.message });
      throw errorHandler.handle(error);
    }
  }

  /**
   * Obtiene un evento específico por ID
   */
  async getEventById(eventId) {
    try {
      const cacheKey = `${this.cachePrefix}event_${eventId}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiClient.get(`${ENDPOINTS.AUDIT_LOGS.GET_BY_ID}/${eventId}`);

      // Descifrar detalles si están cifrados
      if (response.data.details) {
        try {
          response.data.details = await privacy.decryptSensitiveData(response.data.details);
        } catch (decryptError) {
          logger.warn('Failed to decrypt event details', {
            eventId,
            error: decryptError.message
          });
        }
      }

      this.cache.set(cacheKey, response.data, this.cacheTTL);
      return response.data;
    } catch (error) {
      logger.error('Failed to get audit event', { eventId, error: error.message });
      throw errorHandler.handle(error);
    }
  }

  /**
   * Busca eventos de auditoría con texto libre
   */
  async searchEvents(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        startDate,
        endDate,
        eventType
      } = options;

      const params = {
        q: query,
        page,
        limit,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(eventType && { eventType })
      };

      const response = await apiClient.get(ENDPOINTS.AUDIT_LOGS.SEARCH, { params });

      // Descifrar detalles sensibles
      if (response.data?.items) {
        for (const event of response.data.items) {
          if (event.details) {
            try {
              event.details = await privacy.decryptSensitiveData(event.details);
            } catch (decryptError) {
              logger.warn('Failed to decrypt search result details', {
                eventId: event.id,
                error: decryptError.message
              });
            }
          }
        }
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to search audit events', { query, options, error: error.message });
      throw errorHandler.handle(error);
    }
  }

  /**
   * Genera reporte de auditoría
   */
  async generateReport(options = {}) {
    try {
      const {
        type = 'compliance', // compliance, security, activity, summary
        format = 'json', // json, csv, pdf
        startDate,
        endDate,
        entityType,
        includeDetails = false
      } = options;

      const params = {
        type,
        format,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(entityType && { entityType }),
        includeDetails
      };

      const response = await apiClient.post(ENDPOINTS.AUDIT_LOGS.GENERATE_REPORT, params);

      // Log de generación de reporte
      await this.logEvent({
        eventType: 'compliance',
        entityType: 'audit_report',
        entityId: response.data.reportId,
        action: 'generate',
        details: {
          reportType: type,
          format,
          parameters: params
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to generate audit report', { options, error: error.message });
      throw errorHandler.handle(error);
    }
  }

  /**
   * Obtiene estadísticas de auditoría
   */
  async getStatistics(period = '30d') {
    try {
      const cacheKey = `${this.cachePrefix}stats_${period}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiClient.get(ENDPOINTS.AUDIT_LOGS.STATISTICS, {
        params: { period }
      });

      this.cache.set(cacheKey, response.data, APP_CONSTANTS.CACHE.MEDIUM_TTL);
      return response.data;
    } catch (error) {
      logger.error('Failed to get audit statistics', { period, error: error.message });
      throw errorHandler.handle(error);
    }
  }

  /**
   * Obtiene eventos por entidad específica
   */
  async getEventsByEntity(entityType, entityId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        startDate,
        endDate,
        action
      } = options;

      const params = {
        page,
        limit,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(action && { action })
      };

      const response = await apiClient.get(
        `${ENDPOINTS.AUDIT_LOGS.BY_ENTITY}/${entityType}/${entityId}`,
        { params }
      );

      // Descifrar detalles sensibles
      if (response.data?.items) {
        for (const event of response.data.items) {
          if (event.details) {
            try {
              event.details = await privacy.decryptSensitiveData(event.details);
            } catch (decryptError) {
              logger.warn('Failed to decrypt entity event details', {
                eventId: event.id,
                error: decryptError.message
              });
            }
          }
        }
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to get events by entity', {
        entityType,
        entityId,
        options,
        error: error.message
      });
      throw errorHandler.handle(error);
    }
  }

  /**
   * Obtiene alertas de seguridad
   */
  async getSecurityAlerts(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        severity = 'high', // low, medium, high, critical
        resolved = false
      } = options;

      const params = {
        page,
        limit,
        severity,
        resolved
      };

      const response = await apiClient.get(ENDPOINTS.AUDIT_LOGS.SECURITY_ALERTS, { params });
      return response.data;
    } catch (error) {
      logger.error('Failed to get security alerts', { options, error: error.message });
      throw errorHandler.handle(error);
    }
  }

  /**
   * Marca una alerta de seguridad como resuelta
   */
  async resolveSecurityAlert(alertId, resolution) {
    try {
      const response = await apiClient.patch(
        `${ENDPOINTS.AUDIT_LOGS.SECURITY_ALERTS}/${alertId}/resolve`,
        { resolution }
      );

      // Log de resolución de alerta
      await this.logEvent({
        eventType: 'security_event',
        entityType: 'security_alert',
        entityId: alertId,
        action: 'resolve',
        details: { resolution }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to resolve security alert', {
        alertId,
        resolution,
        error: error.message
      });
      throw errorHandler.handle(error);
    }
  }

  /**
   * Exporta logs de auditoría
   */
  async exportLogs(options = {}) {
    try {
      const {
        format = 'csv', // csv, json, xml
        startDate,
        endDate,
        eventType,
        includeDetails = false
      } = options;

      const params = {
        format,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(eventType && { eventType }),
        includeDetails
      };

      const response = await apiClient.post(ENDPOINTS.AUDIT_LOGS.EXPORT, params, {
        responseType: 'blob'
      });

      // Log de exportación
      await this.logEvent({
        eventType: 'compliance',
        entityType: 'audit_export',
        entityId: `export_${Date.now()}`,
        action: 'export',
        details: { format, parameters: params }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to export audit logs', { options, error: error.message });
      throw errorHandler.handle(error);
    }
  }

  /**
   * Limpia logs antiguos según políticas de retención
   */
  async cleanupOldLogs() {
    try {
      const cleanupResults = {};

      for (const [eventType, retentionPeriod] of Object.entries(this.retentionPeriods)) {
        const cutoffDate = new Date(Date.now() - retentionPeriod);

        const response = await apiClient.delete(ENDPOINTS.AUDIT_LOGS.CLEANUP, {
          data: {
            eventType,
            cutoffDate: cutoffDate.toISOString()
          }
        });

        cleanupResults[eventType] = response.data;
      }

      // Log de limpieza
      await this.logEvent({
        eventType: 'system_change',
        entityType: 'audit_logs',
        entityId: 'cleanup',
        action: 'cleanup',
        details: { results: cleanupResults }
      });

      return cleanupResults;
    } catch (error) {
      logger.error('Failed to cleanup old audit logs', { error: error.message });
      throw errorHandler.handle(error);
    }
  }

  /**
   * Verifica integridad de logs
   */
  async verifyLogIntegrity(options = {}) {
    try {
      const {
        startDate,
        endDate,
        verifySignatures = true,
        verifySequence = true
      } = options;

      const params = {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        verifySignatures,
        verifySequence
      };

      const response = await apiClient.post(ENDPOINTS.AUDIT_LOGS.VERIFY_INTEGRITY, params);

      // Log de verificación
      await this.logEvent({
        eventType: 'compliance',
        entityType: 'audit_logs',
        entityId: 'integrity_check',
        action: 'verify',
        details: {
          parameters: params,
          result: response.data
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to verify log integrity', { options, error: error.message });
      throw errorHandler.handle(error);
    }
  }

  /**
   * Calcula el nivel de riesgo de un evento
   */
  calculateRiskLevel(eventData) {
    const { eventType, action, entityType } = eventData;

    // Eventos de seguridad siempre son de alto riesgo
    if (eventType === 'security_event') {
      return 'high';
    }

    // Acciones críticas en datos sensibles
    if (entityType === 'client' && ['delete', 'export', 'share'].includes(action)) {
      return 'high';
    }

    // Cambios de sistema
    if (eventType === 'system_change' && ['delete', 'modify', 'configure'].includes(action)) {
      return 'medium';
    }

    // Acceso a datos
    if (eventType === 'data_access' && entityType === 'client') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Genera ID único para evento
   */
  generateEventId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene IP del cliente
   */
  async getClientIP() {
    try {
      // En entorno de navegador, usar servicio externo
      if (typeof window !== 'undefined') {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      }
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Almacena evento localmente como fallback
   */
  storeEventLocally(eventData) {
    try {
      const localEvents = JSON.parse(localStorage.getItem('dhara_audit_fallback') || '[]');
      localEvents.push({
        ...eventData,
        timestamp: new Date().toISOString(),
        stored_locally: true
      });

      // Mantener solo los últimos 50 eventos
      if (localEvents.length > 50) {
        localEvents.splice(0, localEvents.length - 50);
      }

      localStorage.setItem('dhara_audit_fallback', JSON.stringify(localEvents));
    } catch (error) {
      logger.error('Failed to store audit event locally', { error: error.message });
    }
  }

  /**
   * Sincroniza eventos almacenados localmente
   */
  async syncLocalEvents() {
    try {
      const localEvents = JSON.parse(localStorage.getItem('dhara_audit_fallback') || '[]');

      if (localEvents.length === 0) {
        return { synced: 0, failed: 0 };
      }

      let synced = 0;
      let failed = 0;

      for (const event of localEvents) {
        try {
          await this.logEvent(event);
          synced++;
        } catch (error) {
          failed++;
          logger.error('Failed to sync local audit event', { event, error: error.message });
        }
      }

      // Limpiar eventos sincronizados exitosamente
      if (synced > 0) {
        localStorage.removeItem('dhara_audit_fallback');
      }

      return { synced, failed };
    } catch (error) {
      logger.error('Failed to sync local audit events', { error: error.message });
      return { synced: 0, failed: 0 };
    }
  }

  /**
   * Configura programación automática de retención
   */
  setupRetentionSchedule() {
    // Ejecutar limpieza cada 24 horas
    setInterval(async () => {
      try {
        await this.cleanupOldLogs();
        logger.info('Automatic audit log cleanup completed');
      } catch (error) {
        logger.error('Automatic audit log cleanup failed', { error: error.message });
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Configura programación automática de backup
   */
  setupBackupSchedule() {
    // Ejecutar backup cada 12 horas
    setInterval(async () => {
      try {
        await this.syncLocalEvents();
        logger.info('Automatic audit log sync completed');
      } catch (error) {
        logger.error('Automatic audit log sync failed', { error: error.message });
      }
    }, 12 * 60 * 60 * 1000);
  }

  /**
   * Limpia cache del servicio
   */
  clearCache() {
    this.cache.clearByPattern(`${this.cachePrefix}*`);
  }

  /**
   * Destructor - limpia intervalos y recursos
   */
  destroy() {
    // Los intervalos se limpiarán automáticamente cuando se destruya la instancia
    this.clearCache();
  }
}

// Instancia única del servicio
export const auditLogService = new AuditLogService();

// Helpers específicos para tipos de eventos comunes
export const securityAudit = {
  logLoginAttempt: (success, details = {}) => auditLogService.logEvent({
    eventType: 'security_event',
    entityType: 'user_session',
    entityId: tokenManager.getCurrentUserId(),
    action: success ? 'login_success' : 'login_failure',
    outcome: success ? 'success' : 'failure',
    details
  }),

  logLogout: (details = {}) => auditLogService.logEvent({
    eventType: 'security_event',
    entityType: 'user_session',
    entityId: tokenManager.getCurrentUserId(),
    action: 'logout',
    details
  }),

  logPasswordChange: (userId, details = {}) => auditLogService.logEvent({
    eventType: 'security_event',
    entityType: 'user',
    entityId: userId,
    action: 'password_change',
    details
  }),

  logSuspiciousActivity: (details = {}) => auditLogService.logEvent({
    eventType: 'security_event',
    entityType: 'system',
    entityId: 'security_monitor',
    action: 'suspicious_activity',
    outcome: 'alert',
    details
  })
};

export const dataAudit = {
  logDataAccess: (entityType, entityId, action, details = {}) => auditLogService.logEvent({
    eventType: 'data_access',
    entityType,
    entityId,
    action,
    details
  }),

  logDataModification: (entityType, entityId, changes, details = {}) => auditLogService.logEvent({
    eventType: 'data_access',
    entityType,
    entityId,
    action: 'modify',
    details: { changes, ...details }
  }),

  logDataExport: (entityType, format, count, details = {}) => auditLogService.logEvent({
    eventType: 'data_access',
    entityType,
    entityId: `export_${Date.now()}`,
    action: 'export',
    details: { format, count, ...details }
  })
};

export const complianceAudit = {
  logConsentUpdate: (userId, consentType, granted, details = {}) => auditLogService.logEvent({
    eventType: 'compliance',
    entityType: 'user_consent',
    entityId: userId,
    action: granted ? 'grant_consent' : 'revoke_consent',
    details: { consentType, ...details }
  }),

  logDataRetentionAction: (entityType, action, count, details = {}) => auditLogService.logEvent({
    eventType: 'compliance',
    entityType,
    entityId: `retention_${Date.now()}`,
    action,
    details: { count, ...details }
  }),

  logPrivacyRequest: (userId, requestType, details = {}) => auditLogService.logEvent({
    eventType: 'compliance',
    entityType: 'privacy_request',
    entityId: userId,
    action: requestType, // access, rectification, erasure, portability
    details
  })
};

export default auditLogService;