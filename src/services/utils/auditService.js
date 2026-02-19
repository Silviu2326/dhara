import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from './logger';
import { cache } from './cache';
import { errorHandler } from './errorHandler';
import { privacy } from './privacy';
import { security } from './security';

class AuditService {
  constructor() {
    this.baseEndpoint = 'audit';
    this.cachePrefix = 'audit_';
    this.cacheTags = ['audit', 'logs'];
    this.defaultCacheTTL = 600;
    this.isInitialized = false;

    this.eventTypes = {
      CREATE: 'create',
      READ: 'read',
      UPDATE: 'update',
      DELETE: 'delete',
      LOGIN: 'login',
      LOGOUT: 'logout',
      ACCESS: 'access',
      PERMISSION_CHANGE: 'permission_change',
      DATA_EXPORT: 'data_export',
      DATA_IMPORT: 'data_import',
      SYSTEM_CHANGE: 'system_change'
    };

    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.entityTypes = {
      USER: 'user',
      CLIENT: 'client',
      SESSION_NOTE: 'session_note',
      TREATMENT_PLAN: 'treatment_plan',
      OBJECTIVE: 'objective',
      CREDENTIAL: 'credential',
      DOCUMENT: 'document',
      SYSTEM: 'system'
    };

    this.retentionPolicies = {
      SECURITY_EVENTS: 7 * 365, // 7 years
      DATA_ACCESS: 3 * 365,     // 3 years
      SYSTEM_CHANGES: 5 * 365,  // 5 years
      USER_ACTIONS: 2 * 365,    // 2 years
      DEFAULT: 365              // 1 year
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing AuditService');

      // Setup periodic cleanup
      this.setupPeriodicCleanup();

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize AuditService', error);
      throw error;
    }
  }

  async logEvent(eventData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        severity = this.severityLevels.MEDIUM,
        retentionDays = null,
        createAlert = false,
        skipValidation = false
      } = options;

      if (!skipValidation && !this.validateEventData(eventData)) {
        throw errorHandler.createValidationError('Invalid audit event data', eventData);
      }

      let processedData = {
        ...eventData,
        eventId: security.generateSecureId('audit_'),
        timestamp: new Date().toISOString(),
        severity,
        retentionDays: retentionDays || this.getRetentionPeriod(eventData.eventType),
        ip: eventData.ip || 'unknown',
        userAgent: eventData.userAgent || 'unknown',
        sessionId: eventData.sessionId || 'unknown'
      };

      // Add context information
      processedData.context = {
        ...processedData.context,
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString(),
        requestId: security.generateSecureId('req_')
      };

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          processedData.userId || 'system',
          processedData.eventId
        );

        // Encrypt sensitive fields while keeping searchable fields plain
        const sensitiveFields = ['changes', 'previousData', 'newData', 'details'];
        for (const field of sensitiveFields) {
          if (processedData[field]) {
            processedData[`${field}_encrypted`] = await privacy.encryptValue(
              processedData[field],
              encryptionKey
            );
            processedData[field] = privacy.sanitizeForLogging(processedData[field]);
          }
        }

        processedData._encryptionKeyId = processedData.eventId;
      }

      const sanitizedData = privacy.sanitizeForLogging(processedData);
      logger.info('Creating audit event', {
        eventType: eventData.eventType,
        entityType: eventData.entityType,
        severity,
        data: sanitizedData
      });

      const response = await apiClient.post(ENDPOINTS.audit.create, processedData);

      const auditEvent = response.data;

      // Handle alerts for critical events
      if (createAlert || severity === this.severityLevels.CRITICAL) {
        await this.handleCriticalEvent(auditEvent);
      }

      // Store in cache for quick access
      const cacheKey = `${this.cachePrefix}event_${auditEvent.id}`;
      cache.set(cacheKey, auditEvent, this.defaultCacheTTL, this.cacheTags);

      logger.debug('Audit event logged successfully', {
        eventId: auditEvent.id,
        eventType: eventData.eventType
      });

      return auditEvent;
    } catch (error) {
      logger.error('Failed to log audit event', { eventData, error });
      // Don't throw here to prevent audit failures from breaking main functionality
      return null;
    }
  }

  async getAuditTrail(entityType, entityId, options = {}) {
    try {
      const {
        startDate = null,
        endDate = null,
        eventTypes = [],
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc',
        decryptSensitiveData = false,
        includeSystemEvents = true
      } = options;

      const params = {
        entity_type: entityType,
        entity_id: entityId,
        start_date: startDate,
        end_date: endDate,
        event_types: eventTypes.join(','),
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        include_system_events: includeSystemEvents
      };

      const cacheKey = `${this.cachePrefix}trail_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        logger.info('Fetching audit trail from API', {
          entityType,
          entityId,
          params
        });

        response = await apiClient.get(ENDPOINTS.audit.getTrail, { params });
        cache.set(cacheKey, response.data, this.defaultCacheTTL, this.cacheTags);
      } else {
        response = { data: response };
      }

      let events = response.data.events || response.data;

      if (decryptSensitiveData) {
        events = await Promise.all(
          events.map(async (event) => {
            if (event._encryptionKeyId) {
              try {
                const encryptionKey = await privacy.generateEncryptionKey(
                  event.userId || 'system',
                  event._encryptionKeyId
                );

                // Decrypt sensitive fields
                const sensitiveFields = ['changes', 'previousData', 'newData', 'details'];
                for (const field of sensitiveFields) {
                  if (event[`${field}_encrypted`]) {
                    event[field] = await privacy.decryptValue(
                      event[`${field}_encrypted`],
                      encryptionKey
                    );
                  }
                }

                return event;
              } catch (error) {
                logger.warn('Failed to decrypt audit event data', {
                  eventId: event.id,
                  error: error.message
                });
                return event;
              }
            }
            return event;
          })
        );
      }

      // Log access to audit trail
      privacy.logDataAccess(
        'system',
        'audit_trail',
        'read',
        { entityType, entityId, eventCount: events.length }
      );

      return {
        events,
        pagination: {
          page,
          limit,
          total: response.data.total || events.length,
          hasMore: response.data.hasMore || false
        },
        summary: this.generateTrailSummary(events)
      };
    } catch (error) {
      logger.error('Failed to get audit trail', { entityType, entityId, error });
      throw errorHandler.handle(error);
    }
  }

  async searchAuditEvents(searchCriteria, options = {}) {
    try {
      const {
        startDate = null,
        endDate = null,
        eventTypes = [],
        severityLevels = [],
        userIds = [],
        entityTypes = [],
        page = 1,
        limit = 100,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = { ...searchCriteria, ...options };

      const params = {
        start_date: startDate,
        end_date: endDate,
        event_types: eventTypes.join(','),
        severity_levels: severityLevels.join(','),
        user_ids: userIds.join(','),
        entity_types: entityTypes.join(','),
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      logger.info('Searching audit events', { searchCriteria: params });

      const response = await apiClient.get(ENDPOINTS.audit.search, { params });

      const results = response.data;

      privacy.logDataAccess(
        'system',
        'audit_search',
        'search',
        {
          criteria: privacy.sanitizeForLogging(searchCriteria),
          resultsCount: results.events?.length || 0
        }
      );

      return {
        events: results.events || results,
        pagination: {
          page,
          limit,
          total: results.total || 0,
          hasMore: results.hasMore || false
        },
        aggregations: results.aggregations || {}
      };
    } catch (error) {
      logger.error('Failed to search audit events', { searchCriteria, error });
      throw errorHandler.handle(error);
    }
  }

  async generateComplianceReport(reportType, options = {}) {
    try {
      const {
        startDate = null,
        endDate = null,
        format = 'json',
        includeStatistics = true,
        includeViolations = true,
        includeRecommendations = true,
        entityTypes = [],
        userIds = []
      } = options;

      logger.info('Generating compliance report', {
        reportType,
        format,
        dateRange: { startDate, endDate }
      });

      const params = {
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        format,
        include_statistics: includeStatistics,
        include_violations: includeViolations,
        include_recommendations: includeRecommendations,
        entity_types: entityTypes.join(','),
        user_ids: userIds.join(',')
      };

      const response = await apiClient.get(ENDPOINTS.audit.generateReport, {
        params,
        responseType: format === 'pdf' ? 'blob' : 'json'
      });

      privacy.logDataAccess(
        'system',
        'compliance_report',
        'generate',
        { reportType, format, options }
      );

      logger.info('Compliance report generated successfully', {
        reportType,
        format
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to generate compliance report', { reportType, error });
      throw errorHandler.handle(error);
    }
  }

  async detectAnomalies(options = {}) {
    try {
      const {
        lookbackDays = 30,
        sensitivityLevel = 'medium',
        eventTypes = [],
        entityTypes = [],
        includeUserBehavior = true,
        includeSystemPatterns = true
      } = options;

      logger.info('Detecting audit anomalies', {
        lookbackDays,
        sensitivityLevel,
        eventTypes
      });

      const params = {
        lookback_days: lookbackDays,
        sensitivity_level: sensitivityLevel,
        event_types: eventTypes.join(','),
        entity_types: entityTypes.join(','),
        include_user_behavior: includeUserBehavior,
        include_system_patterns: includeSystemPatterns
      };

      const response = await apiClient.get(ENDPOINTS.audit.detectAnomalies, { params });

      const anomalies = response.data;

      // Log high-risk anomalies
      const highRiskAnomalies = anomalies.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical');
      if (highRiskAnomalies.length > 0) {
        logger.warn('High-risk anomalies detected', {
          count: highRiskAnomalies.length,
          anomalies: highRiskAnomalies.map(a => ({
            type: a.type,
            riskLevel: a.riskLevel,
            description: a.description
          }))
        });
      }

      return anomalies;
    } catch (error) {
      logger.error('Failed to detect anomalies', error);
      throw errorHandler.handle(error);
    }
  }

  async deleteAuditData(criteria, options = {}) {
    try {
      const {
        dryRun = true,
        reason = 'retention_policy',
        approvedBy = null,
        createDeletionRecord = true
      } = options;

      logger.warn('Deleting audit data', {
        criteria,
        dryRun,
        reason
      });

      if (!approvedBy && !dryRun) {
        throw errorHandler.createValidationError(
          'Audit data deletion requires approval'
        );
      }

      const payload = {
        criteria,
        dry_run: dryRun,
        reason,
        approved_by: approvedBy,
        create_deletion_record: createDeletionRecord,
        requested_at: new Date().toISOString()
      };

      const response = await apiClient.post(ENDPOINTS.audit.deleteData, payload);

      const result = response.data;

      if (!dryRun && createDeletionRecord) {
        await this.logEvent({
          eventType: this.eventTypes.DELETE,
          entityType: this.entityTypes.SYSTEM,
          entityId: 'audit_data',
          action: 'bulk_delete',
          details: {
            criteria,
            deletedCount: result.deletedCount,
            reason,
            approvedBy
          },
          userId: approvedBy
        }, {
          severity: this.severityLevels.HIGH,
          createAlert: true
        });
      }

      logger.info('Audit data deletion completed', {
        dryRun,
        deletedCount: result.deletedCount,
        reason
      });

      return result;
    } catch (error) {
      logger.error('Failed to delete audit data', { criteria, error });
      throw errorHandler.handle(error);
    }
  }

  validateEventData(eventData) {
    const requiredFields = ['eventType', 'entityType', 'action'];

    for (const field of requiredFields) {
      if (!eventData[field]) {
        logger.warn('Missing required audit field', { field, eventData });
        return false;
      }
    }

    if (!Object.values(this.eventTypes).includes(eventData.eventType)) {
      logger.warn('Invalid event type', { eventType: eventData.eventType });
      return false;
    }

    if (!Object.values(this.entityTypes).includes(eventData.entityType)) {
      logger.warn('Invalid entity type', { entityType: eventData.entityType });
      return false;
    }

    return true;
  }

  getRetentionPeriod(eventType) {
    const securityEventTypes = ['login', 'logout', 'permission_change', 'access'];
    const dataEventTypes = ['data_export', 'data_import'];
    const systemEventTypes = ['system_change'];

    if (securityEventTypes.includes(eventType)) {
      return this.retentionPolicies.SECURITY_EVENTS;
    } else if (dataEventTypes.includes(eventType)) {
      return this.retentionPolicies.DATA_ACCESS;
    } else if (systemEventTypes.includes(eventType)) {
      return this.retentionPolicies.SYSTEM_CHANGES;
    } else {
      return this.retentionPolicies.USER_ACTIONS;
    }
  }

  generateTrailSummary(events) {
    const summary = {
      totalEvents: events.length,
      eventTypes: {},
      severityDistribution: {},
      userActivity: {},
      timeRange: {
        earliest: null,
        latest: null
      },
      riskFactors: []
    };

    events.forEach(event => {
      // Count event types
      summary.eventTypes[event.eventType] = (summary.eventTypes[event.eventType] || 0) + 1;

      // Count severity levels
      summary.severityDistribution[event.severity] = (summary.severityDistribution[event.severity] || 0) + 1;

      // Count user activity
      if (event.userId) {
        summary.userActivity[event.userId] = (summary.userActivity[event.userId] || 0) + 1;
      }

      // Track time range
      const eventTime = new Date(event.timestamp);
      if (!summary.timeRange.earliest || eventTime < new Date(summary.timeRange.earliest)) {
        summary.timeRange.earliest = event.timestamp;
      }
      if (!summary.timeRange.latest || eventTime > new Date(summary.timeRange.latest)) {
        summary.timeRange.latest = event.timestamp;
      }

      // Identify risk factors
      if (event.severity === this.severityLevels.CRITICAL || event.severity === this.severityLevels.HIGH) {
        summary.riskFactors.push({
          eventId: event.id,
          type: event.eventType,
          severity: event.severity,
          timestamp: event.timestamp
        });
      }
    });

    return summary;
  }

  async handleCriticalEvent(auditEvent) {
    try {
      logger.error('Critical audit event detected', {
        eventId: auditEvent.id,
        eventType: auditEvent.eventType,
        severity: auditEvent.severity
      });

      // Additional alerting logic would go here
      // e.g., send notifications, trigger security protocols, etc.

      await this.logEvent({
        eventType: this.eventTypes.SYSTEM_CHANGE,
        entityType: this.entityTypes.SYSTEM,
        entityId: 'alert_system',
        action: 'critical_event_alert',
        details: {
          originalEventId: auditEvent.id,
          alertReason: 'critical_severity',
          timestamp: new Date().toISOString()
        }
      }, {
        severity: this.severityLevels.HIGH,
        skipValidation: true
      });
    } catch (error) {
      logger.error('Failed to handle critical event', { auditEvent, error });
    }
  }

  setupPeriodicCleanup() {
    // Setup cleanup every 24 hours
    setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        logger.error('Periodic audit cleanup failed', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  async performCleanup() {
    try {
      logger.info('Starting periodic audit cleanup');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.DEFAULT);

      const result = await this.deleteAuditData({
        end_date: cutoffDate.toISOString(),
        retention_exceeded: true
      }, {
        dryRun: false,
        reason: 'automatic_retention_cleanup',
        approvedBy: 'system',
        createDeletionRecord: true
      });

      logger.info('Audit cleanup completed', {
        deletedCount: result.deletedCount,
        cutoffDate: cutoffDate.toISOString()
      });

      return result;
    } catch (error) {
      logger.error('Failed to perform audit cleanup', error);
      throw error;
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('audit');
      cache.deleteByTag('logs');
      logger.info('Audit service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear audit service cache', error);
    }
  }

  getStats() {
    return {
      service: 'AuditService',
      initialized: this.isInitialized,
      cacheStats: {
        audit: cache.getStatsByTag('audit'),
        logs: cache.getStatsByTag('logs')
      },
      constants: {
        eventTypes: this.eventTypes,
        severityLevels: this.severityLevels,
        entityTypes: this.entityTypes,
        retentionPolicies: this.retentionPolicies
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const auditService = new AuditService();

export const {
  logEvent,
  getAuditTrail,
  searchAuditEvents,
  generateComplianceReport,
  detectAnomalies,
  deleteAuditData
} = auditService;

export default auditService;