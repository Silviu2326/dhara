import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { errorHandler } from '../utils/errorHandler';
import { privacy } from '../utils/privacy';
import { security } from '../utils/security';

class ClientPlanProgressService {
  constructor() {
    this.baseEndpoint = 'client-plans';
    this.cachePrefix = 'plan_progress_';
    this.cacheTags = ['plans', 'progress', 'therapy'];
    this.defaultCacheTTL = 300;
    this.isInitialized = false;

    this.progressStates = {
      NOT_STARTED: 'not_started',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      ON_HOLD: 'on_hold',
      CANCELLED: 'cancelled'
    };

    this.objectiveTypes = {
      BEHAVIORAL: 'behavioral',
      COGNITIVE: 'cognitive',
      EMOTIONAL: 'emotional',
      SOCIAL: 'social',
      PHYSICAL: 'physical',
      ACADEMIC: 'academic',
      PROFESSIONAL: 'professional'
    };

    this.priorityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing ClientPlanProgressService');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize ClientPlanProgressService', error);
      throw error;
    }
  }

  async createTreatmentPlan(clientId, planData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validatePrivacy = true,
        createAuditLog = true
      } = options;

      logger.info('Creating treatment plan', {
        clientId,
        objectivesCount: planData.objectives?.length || 0,
        duration: planData.estimatedDuration
      });

      let processedData = {
        clientId,
        ...planData,
        createdAt: new Date().toISOString(),
        status: this.progressStates.NOT_STARTED,
        planId: security.generateSecureId('plan_')
      };

      if (validatePrivacy) {
        const privacyValidation = privacy.validatePrivacyCompliance(processedData, {
          requireEncryption: encryptSensitiveData,
          validateDataMinimization: true
        });

        if (!privacyValidation.isCompliant) {
          throw errorHandler.createValidationError(
            'Privacy compliance validation failed',
            privacyValidation.violations
          );
        }
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          clientId,
          processedData.planId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.planId;
      }

      const response = await apiClient.post(
        ENDPOINTS.clientPlans.create,
        processedData
      );

      const plan = response.data;

      this.invalidateCache(['plans', 'progress'], clientId);

      if (createAuditLog) {
        logger.auditEvent('treatment_plan_created', {
          entityType: 'treatment_plan',
          entityId: plan.id,
          clientId,
          action: 'create',
          timestamp: new Date().toISOString()
        });
      }

      privacy.logDataAccess(
        clientId,
        'treatment_plan',
        'create',
        { planId: plan.id }
      );

      logger.info('Treatment plan created successfully', {
        planId: plan.id,
        clientId
      });

      return plan;
    } catch (error) {
      logger.error('Failed to create treatment plan', { clientId, error });
      throw errorHandler.handle(error);
    }
  }

  async getTreatmentPlan(planId, options = {}) {
    try {
      const {
        decryptSensitiveData = true,
        includeProgress = true,
        includeHistory = false,
        includeStatistics = false
      } = options;

      const cacheKey = `${this.cachePrefix}plan_${planId}`;
      let plan = cache.get(cacheKey);

      if (!plan) {
        logger.info('Fetching treatment plan from API', { planId });

        const params = {
          include_progress: includeProgress,
          include_history: includeHistory,
          include_statistics: includeStatistics
        };

        const response = await apiClient.get(
          ENDPOINTS.clientPlans.getById.replace(':id', planId),
          { params }
        );

        plan = response.data;
        cache.set(cacheKey, plan, this.defaultCacheTTL, this.cacheTags);
      }

      if (decryptSensitiveData && plan._encryptionKeyId) {
        try {
          const encryptionKey = await privacy.generateEncryptionKey(
            plan.clientId,
            plan._encryptionKeyId
          );
          plan = await privacy.decryptSensitiveData(plan, encryptionKey);
        } catch (decryptError) {
          logger.warn('Failed to decrypt treatment plan data', {
            planId,
            error: decryptError.message
          });
        }
      }

      privacy.logDataAccess(
        plan.clientId,
        'treatment_plan',
        'read',
        { planId }
      );

      return plan;
    } catch (error) {
      logger.error('Failed to get treatment plan', { planId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateTreatmentPlan(planId, updates, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validatePrivacy = true,
        createAuditLog = true
      } = options;

      logger.info('Updating treatment plan', {
        planId,
        updateKeys: Object.keys(updates)
      });

      const currentPlan = await this.getTreatmentPlan(planId, { decryptSensitiveData: false });

      let processedUpdates = { ...updates };

      if (validatePrivacy) {
        const privacyValidation = privacy.validatePrivacyCompliance(processedUpdates, {
          requireEncryption: encryptSensitiveData,
          validateDataMinimization: true
        });

        if (!privacyValidation.isCompliant) {
          throw errorHandler.createValidationError(
            'Privacy compliance validation failed',
            privacyValidation.violations
          );
        }
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          currentPlan.clientId,
          currentPlan._encryptionKeyId || planId
        );

        processedUpdates = await privacy.encryptSensitiveData(processedUpdates, encryptionKey);
      }

      if (createAuditLog) {
        const auditData = {
          entityType: 'treatment_plan',
          entityId: planId,
          action: 'update',
          changes: processedUpdates,
          previousData: privacy.sanitizeForLogging(currentPlan),
          timestamp: new Date().toISOString(),
          clientId: currentPlan.clientId
        };

        logger.auditEvent('treatment_plan_updated', auditData);
      }

      const response = await apiClient.put(
        ENDPOINTS.clientPlans.update.replace(':id', planId),
        processedUpdates
      );

      const updatedPlan = response.data;

      this.invalidateCache(['plans', 'progress'], currentPlan.clientId);

      privacy.logDataAccess(
        currentPlan.clientId,
        'treatment_plan',
        'update',
        { planId, changes: Object.keys(updates) }
      );

      logger.info('Treatment plan updated successfully', { planId });

      return updatedPlan;
    } catch (error) {
      logger.error('Failed to update treatment plan', { planId, error });
      throw errorHandler.handle(error);
    }
  }

  async createObjective(planId, objectiveData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validatePrivacy = true,
        priority = this.priorityLevels.MEDIUM,
        type = this.objectiveTypes.BEHAVIORAL
      } = options;

      logger.info('Creating objective', {
        planId,
        type,
        priority,
        description: objectiveData.description?.substring(0, 50)
      });

      let processedData = {
        planId,
        ...objectiveData,
        type,
        priority,
        status: this.progressStates.NOT_STARTED,
        createdAt: new Date().toISOString(),
        objectiveId: security.generateSecureId('obj_')
      };

      if (validatePrivacy) {
        const privacyValidation = privacy.validatePrivacyCompliance(processedData, {
          requireEncryption: encryptSensitiveData,
          validateDataMinimization: true
        });

        if (!privacyValidation.isCompliant) {
          throw errorHandler.createValidationError(
            'Privacy compliance validation failed',
            privacyValidation.violations
          );
        }
      }

      if (encryptSensitiveData) {
        const plan = await this.getTreatmentPlan(planId, { decryptSensitiveData: false });
        const encryptionKey = await privacy.generateEncryptionKey(
          plan.clientId,
          processedData.objectiveId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.objectiveId;
      }

      const response = await apiClient.post(
        ENDPOINTS.clientPlans.createObjective.replace(':planId', planId),
        processedData
      );

      const objective = response.data;

      this.invalidateCache(['plans', 'progress'], null);

      logger.auditEvent('objective_created', {
        entityType: 'objective',
        entityId: objective.id,
        planId,
        action: 'create',
        timestamp: new Date().toISOString()
      });

      logger.info('Objective created successfully', {
        objectiveId: objective.id,
        planId
      });

      return objective;
    } catch (error) {
      logger.error('Failed to create objective', { planId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateObjectiveProgress(objectiveId, progressData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        createProgressEntry = true,
        notifyMilestones = true
      } = options;

      logger.info('Updating objective progress', {
        objectiveId,
        newStatus: progressData.status,
        progressPercentage: progressData.progressPercentage
      });

      let processedData = {
        ...progressData,
        updatedAt: new Date().toISOString(),
        progressEntryId: security.generateSecureId('progress_')
      };

      if (encryptSensitiveData && progressData.notes) {
        const encryptionKey = await privacy.generateEncryptionKey(
          'system',
          processedData.progressEntryId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.progressEntryId;
      }

      const response = await apiClient.patch(
        ENDPOINTS.clientPlans.updateObjectiveProgress.replace(':objectiveId', objectiveId),
        processedData
      );

      const updatedObjective = response.data;

      if (createProgressEntry) {
        await this.createProgressEntry(objectiveId, {
          status: progressData.status,
          progressPercentage: progressData.progressPercentage,
          notes: progressData.notes,
          timestamp: new Date().toISOString()
        });
      }

      if (notifyMilestones && this.isMilestone(progressData)) {
        await this.handleMilestoneReached(objectiveId, progressData);
      }

      this.invalidateCache(['plans', 'progress'], null);

      logger.auditEvent('objective_progress_updated', {
        entityType: 'objective',
        entityId: objectiveId,
        action: 'progress_update',
        progressData: privacy.sanitizeForLogging(progressData),
        timestamp: new Date().toISOString()
      });

      logger.info('Objective progress updated successfully', { objectiveId });

      return updatedObjective;
    } catch (error) {
      logger.error('Failed to update objective progress', { objectiveId, error });
      throw errorHandler.handle(error);
    }
  }

  async createProgressEntry(objectiveId, entryData, options = {}) {
    try {
      const { encryptSensitiveData = true } = options;

      let processedData = {
        objectiveId,
        ...entryData,
        entryId: security.generateSecureId('entry_'),
        createdAt: new Date().toISOString()
      };

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          'system',
          processedData.entryId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.entryId;
      }

      const response = await apiClient.post(
        ENDPOINTS.clientPlans.createProgressEntry.replace(':objectiveId', objectiveId),
        processedData
      );

      const entry = response.data;

      logger.info('Progress entry created', {
        entryId: entry.id,
        objectiveId
      });

      return entry;
    } catch (error) {
      logger.error('Failed to create progress entry', { objectiveId, error });
      throw errorHandler.handle(error);
    }
  }

  async getProgressHistory(planId, options = {}) {
    try {
      const {
        objectiveId = null,
        dateFrom = null,
        dateTo = null,
        limit = 50,
        page = 1,
        includeNotes = true,
        decryptSensitiveData = true
      } = options;

      const params = {
        objective_id: objectiveId,
        date_from: dateFrom,
        date_to: dateTo,
        limit,
        page,
        include_notes: includeNotes
      };

      const cacheKey = `${this.cachePrefix}history_${planId}_${security.generateHash(params)}`;
      let history = cache.get(cacheKey);

      if (!history) {
        logger.info('Fetching progress history from API', { planId, params });

        const response = await apiClient.get(
          ENDPOINTS.clientPlans.getProgressHistory.replace(':planId', planId),
          { params }
        );

        history = response.data;
        cache.set(cacheKey, history, this.defaultCacheTTL, this.cacheTags);
      }

      if (decryptSensitiveData) {
        history.entries = await Promise.all(
          history.entries.map(async (entry) => {
            if (entry._encryptionKeyId) {
              try {
                const encryptionKey = await privacy.generateEncryptionKey(
                  'system',
                  entry._encryptionKeyId
                );
                return await privacy.decryptSensitiveData(entry, encryptionKey);
              } catch (error) {
                logger.warn('Failed to decrypt progress entry', {
                  entryId: entry.id,
                  error: error.message
                });
                return entry;
              }
            }
            return entry;
          })
        );
      }

      return {
        entries: history.entries,
        pagination: {
          page,
          limit,
          total: history.total || 0,
          hasMore: history.hasMore || false
        }
      };
    } catch (error) {
      logger.error('Failed to get progress history', { planId, error });
      throw errorHandler.handle(error);
    }
  }

  async generateProgressReport(planId, options = {}) {
    try {
      const {
        format = 'json',
        dateFrom = null,
        dateTo = null,
        includeStatistics = true,
        includeCharts = true,
        includeRecommendations = true
      } = options;

      logger.info('Generating progress report', { planId, format });

      const params = {
        format,
        date_from: dateFrom,
        date_to: dateTo,
        include_statistics: includeStatistics,
        include_charts: includeCharts,
        include_recommendations: includeRecommendations
      };

      const response = await apiClient.get(
        ENDPOINTS.clientPlans.generateReport.replace(':planId', planId),
        {
          params,
          responseType: format === 'pdf' ? 'blob' : 'json'
        }
      );

      const plan = await this.getTreatmentPlan(planId, { decryptSensitiveData: false });

      privacy.logDataAccess(
        plan.clientId,
        'progress_report',
        'generate',
        { planId, format }
      );

      logger.info('Progress report generated successfully', { planId, format });

      return response.data;
    } catch (error) {
      logger.error('Failed to generate progress report', { planId, error });
      throw errorHandler.handle(error);
    }
  }

  async getClientPlans(clientId, options = {}) {
    try {
      const {
        status = 'all',
        includeProgress = true,
        includeStatistics = false,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const params = {
        status,
        include_progress: includeProgress,
        include_statistics: includeStatistics,
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      const cacheKey = `${this.cachePrefix}client_plans_${clientId}_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        logger.info('Fetching client plans from API', { clientId, params });

        response = await apiClient.get(
          ENDPOINTS.clientPlans.getByClientId.replace(':clientId', clientId),
          { params }
        );

        cache.set(cacheKey, response.data, this.defaultCacheTTL, this.cacheTags);
      } else {
        response = { data: response };
      }

      return {
        plans: response.data.plans || response.data,
        pagination: {
          page,
          limit,
          total: response.data.total || 0,
          hasMore: response.data.hasMore || false
        }
      };
    } catch (error) {
      logger.error('Failed to get client plans', { clientId, error });
      throw errorHandler.handle(error);
    }
  }

  async calculateProgressStatistics(planId, options = {}) {
    try {
      const {
        dateFrom = null,
        dateTo = null,
        includeProjections = true,
        includeTrends = true
      } = options;

      const cacheKey = `${this.cachePrefix}stats_${planId}_${dateFrom}_${dateTo}`;
      let stats = cache.get(cacheKey);

      if (!stats) {
        logger.info('Calculating progress statistics', { planId });

        const params = {
          date_from: dateFrom,
          date_to: dateTo,
          include_projections: includeProjections,
          include_trends: includeTrends
        };

        const response = await apiClient.get(
          ENDPOINTS.clientPlans.getStatistics.replace(':planId', planId),
          { params }
        );

        stats = response.data;
        cache.set(cacheKey, stats, 600, [...this.cacheTags, 'statistics']);
      }

      return stats;
    } catch (error) {
      logger.error('Failed to calculate progress statistics', { planId, error });
      throw errorHandler.handle(error);
    }
  }

  async archivePlan(planId, reason = '', options = {}) {
    try {
      const { createAuditLog = true } = options;

      logger.info('Archiving treatment plan', { planId, reason });

      const plan = await this.getTreatmentPlan(planId, { decryptSensitiveData: false });

      const response = await apiClient.patch(
        ENDPOINTS.clientPlans.archive.replace(':id', planId),
        { reason, archivedAt: new Date().toISOString() }
      );

      this.invalidateCache(['plans', 'progress'], plan.clientId);

      if (createAuditLog) {
        logger.auditEvent('treatment_plan_archived', {
          entityType: 'treatment_plan',
          entityId: planId,
          action: 'archive',
          reason,
          timestamp: new Date().toISOString(),
          clientId: plan.clientId
        });
      }

      logger.info('Treatment plan archived successfully', { planId });

      return response.data;
    } catch (error) {
      logger.error('Failed to archive treatment plan', { planId, error });
      throw errorHandler.handle(error);
    }
  }

  isMilestone(progressData) {
    const milestones = [25, 50, 75, 100];
    return milestones.includes(progressData.progressPercentage) ||
           progressData.status === this.progressStates.COMPLETED;
  }

  async handleMilestoneReached(objectiveId, progressData) {
    try {
      logger.info('Milestone reached', {
        objectiveId,
        milestone: progressData.progressPercentage,
        status: progressData.status
      });

      await apiClient.post(
        ENDPOINTS.clientPlans.recordMilestone.replace(':objectiveId', objectiveId),
        {
          milestone: progressData.progressPercentage,
          status: progressData.status,
          timestamp: new Date().toISOString()
        }
      );

      logger.auditEvent('milestone_reached', {
        entityType: 'objective',
        entityId: objectiveId,
        action: 'milestone',
        milestone: progressData.progressPercentage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.warn('Failed to handle milestone', { objectiveId, error });
    }
  }

  invalidateCache(tags = [], specificClientId = null) {
    try {
      if (specificClientId) {
        cache.deleteByPattern(`${this.cachePrefix}*${specificClientId}*`);
      }

      tags.forEach(tag => {
        cache.deleteByTag(tag);
      });

      logger.debug('Plan progress service cache invalidated', { tags, specificClientId });
    } catch (error) {
      logger.warn('Failed to invalidate cache', error);
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('plans');
      cache.deleteByTag('progress');
      logger.info('Plan progress service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear plan progress service cache', error);
    }
  }

  getStats() {
    return {
      service: 'ClientPlanProgressService',
      initialized: this.isInitialized,
      cacheStats: {
        plans: cache.getStatsByTag('plans'),
        progress: cache.getStatsByTag('progress')
      },
      constants: {
        progressStates: this.progressStates,
        objectiveTypes: this.objectiveTypes,
        priorityLevels: this.priorityLevels
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const clientPlanProgressService = new ClientPlanProgressService();

export const {
  createTreatmentPlan,
  getTreatmentPlan,
  updateTreatmentPlan,
  createObjective,
  updateObjectiveProgress,
  createProgressEntry,
  getProgressHistory,
  generateProgressReport,
  getClientPlans,
  calculateProgressStatistics,
  archivePlan
} = clientPlanProgressService;

export default clientPlanProgressService;