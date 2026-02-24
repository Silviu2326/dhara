import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { errorHandler } from '../utils/errorHandler';
import { privacy } from '../utils/privacy';
import { security } from '../utils/security';
import { auditService } from '../utils/auditService';

class TherapyPlanService {
  constructor() {
    this.baseEndpoint = 'plans';
    this.cachePrefix = 'therapy_plan_';
    this.cacheTags = ['therapy-plans', 'templates', 'objectives'];
    this.defaultCacheTTL = 600;
    this.isInitialized = false;

    this.planStates = {
      DRAFT: 'draft',
      ACTIVE: 'active',
      UNDER_REVIEW: 'under_review',
      ARCHIVED: 'archived',
      DEPRECATED: 'deprecated',
      SUSPENDED: 'suspended'
    };

    this.planTypes = {
      INDIVIDUAL: 'individual',
      GROUP: 'group',
      FAMILY: 'family',
      COUPLES: 'couples',
      INTENSIVE: 'intensive',
      SHORT_TERM: 'short_term',
      LONG_TERM: 'long_term',
      // Tipos clínicos (según validación del backend)
      ANSIEDAD: 'ansiedad',
      DEPRESION: 'depresion',
      PAREJA: 'pareja',
      TRAUMA: 'trauma',
      ADICCIONES: 'adicciones',
      AUTOESTIMA: 'autoestima',
      ESTRES: 'estres',
      TRASTORNOS_ALIMENTARIOS: 'trastornos_alimentarios',
      DUELO: 'duelo',
      TOC: 'toc',
      OTHER: 'other'
    };

    this.specialties = {
      COGNITIVE_BEHAVIORAL: 'cognitive_behavioral',
      PSYCHODYNAMIC: 'psychodynamic',
      HUMANISTIC: 'humanistic',
      FAMILY_THERAPY: 'family_therapy',
      GESTALT: 'gestalt',
      SOLUTION_FOCUSED: 'solution_focused',
      TRAUMA_FOCUSED: 'trauma_focused',
      MINDFULNESS_BASED: 'mindfulness_based',
      DIALECTICAL_BEHAVIORAL: 'dialectical_behavioral',
      ACCEPTANCE_COMMITMENT: 'acceptance_commitment'
    };

    this.objectiveTypes = {
      BEHAVIORAL: 'behavioral',
      COGNITIVE: 'cognitive',
      EMOTIONAL: 'emotional',
      SOCIAL: 'social',
      FUNCTIONAL: 'functional',
      SYMPTOM_REDUCTION: 'symptom_reduction',
      SKILL_BUILDING: 'skill_building',
      INSIGHT_DEVELOPMENT: 'insight_development'
    };

    this.techniques = {
      COGNITIVE_RESTRUCTURING: 'cognitive_restructuring',
      EXPOSURE_THERAPY: 'exposure_therapy',
      RELAXATION_TECHNIQUES: 'relaxation_techniques',
      BEHAVIORAL_ACTIVATION: 'behavioral_activation',
      MINDFULNESS_MEDITATION: 'mindfulness_meditation',
      ROLE_PLAYING: 'role_playing',
      HOMEWORK_ASSIGNMENTS: 'homework_assignments',
      JOURNALING: 'journaling',
      GROUNDING_TECHNIQUES: 'grounding_techniques',
      BIOFEEDBACK: 'biofeedback',
      ART_THERAPY: 'art_therapy',
      MUSIC_THERAPY: 'music_therapy'
    };

    this.sessionFrequency = {
      DAILY: 'daily',
      TWICE_WEEKLY: 'twice_weekly',
      WEEKLY: 'weekly',
      BIWEEKLY: 'biweekly',
      MONTHLY: 'monthly',
      AS_NEEDED: 'as_needed'
    };

    this.effectivenessMetrics = {
      SYMPTOM_IMPROVEMENT: 'symptom_improvement',
      FUNCTIONAL_IMPROVEMENT: 'functional_improvement',
      QUALITY_OF_LIFE: 'quality_of_life',
      GOAL_ACHIEVEMENT: 'goal_achievement',
      CLIENT_SATISFACTION: 'client_satisfaction',
      THERAPY_COMPLETION: 'therapy_completion'
    };

    this.evidenceBasedApproaches = {
      RESEARCH_SUPPORTED: 'research_supported',
      EMPIRICALLY_VALIDATED: 'empirically_validated',
      PROMISING_PRACTICE: 'promising_practice',
      EXPERT_CONSENSUS: 'expert_consensus',
      CLINICAL_EXPERIENCE: 'clinical_experience'
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing TherapyPlanService');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize TherapyPlanService', error);
      throw error;
    }
  }

  async createPlan(planData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validateObjectives = true,
        createAuditLog = true,
        saveAsTemplate = false,
        validateEvidence = true
      } = options;

      logger.info('Creating therapy plan', {
        therapistId: planData.therapistId,
        planType: planData.type,
        specialty: planData.specialty,
        objectivesCount: planData.objectives?.length || 0
      });

      // Validate plan data
      this.validatePlanData(planData);

      // Validate objectives coherence
      if (validateObjectives && planData.objectives) {
        const objectiveValidation = this.validateObjectivesCoherence(planData.objectives);
        if (!objectiveValidation.isValid) {
          throw errorHandler.createValidationError(
            'Objectives validation failed',
            objectiveValidation.errors
          );
        }
      }

      // Validate evidence-based practices
      if (validateEvidence && planData.techniques) {
        const evidenceValidation = this.validateEvidenceBasedPractices(
          planData.techniques,
          planData.specialty
        );
        if (!evidenceValidation.isValid) {
          logger.warn('Evidence-based validation warnings', evidenceValidation.warnings);
        }
      }

      let processedData = {
        ...planData,
        planId: security.generateSecureId('plan_'),
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        status: this.planStates.DRAFT,
        version: 1,
        isTemplate: saveAsTemplate
      };

      // Generate plan metadata
      processedData.metadata = this.generatePlanMetadata(processedData);

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          planData.therapistId,
          processedData.planId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.planId;
      }

      const sanitizedData = privacy.sanitizeForLogging(processedData);
      logger.info('Creating therapy plan with sanitized data', { data: sanitizedData });

      const response = await apiClient.post(
        ENDPOINTS.therapyPlans.create,
        processedData
      );

      const plan = response.data;

      this.invalidateCache(['therapy-plans', 'templates'], planData.therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'therapy_plan',
          entityId: plan.id,
          action: 'create',
          details: {
            therapistId: planData.therapistId,
            planType: planData.type,
            specialty: planData.specialty,
            isTemplate: saveAsTemplate
          },
          userId: planData.createdBy || planData.therapistId
        });
      }

      privacy.logDataAccess(
        planData.therapistId,
        'therapy_plan',
        'create',
        { planId: plan.id }
      );

      logger.info('Therapy plan created successfully', {
        planId: plan.id,
        therapistId: planData.therapistId
      });

      return plan;
    } catch (error) {
      logger.error('Failed to create therapy plan', error);
      throw errorHandler.handle(error);
    }
  }

  async getPlan(planId, options = {}) {
    try {
      const {
        decryptSensitiveData = true,
        includeHistory = false,
        includeStatistics = false,
        includeAssignments = false
      } = options;

      const cacheKey = `${this.cachePrefix}${planId}`;
      let plan = cache.get(cacheKey);

      if (!plan) {
        logger.info('Fetching therapy plan from API', { planId });

        const params = {
          include_history: includeHistory,
          include_statistics: includeStatistics,
          include_assignments: includeAssignments
        };

        const response = await apiClient.get(
          ENDPOINTS.therapyPlans.getById.replace(':id', planId),
          { params }
        );

        plan = response.data;
        cache.set(cacheKey, plan, this.defaultCacheTTL, this.cacheTags);
      }

      if (decryptSensitiveData && plan._encryptionKeyId) {
        try {
          const encryptionKey = await privacy.generateEncryptionKey(
            plan.therapistId,
            plan._encryptionKeyId
          );
          plan = await privacy.decryptSensitiveData(plan, encryptionKey);
        } catch (decryptError) {
          logger.warn('Failed to decrypt therapy plan data', {
            planId,
            error: decryptError.message
          });
        }
      }

      privacy.logDataAccess(
        plan.therapistId,
        'therapy_plan',
        'read',
        { planId }
      );

      return plan;
    } catch (error) {
      logger.error('Failed to get therapy plan', { planId, error });
      throw errorHandler.handle(error);
    }
  }

  async updatePlan(planId, updates, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validateObjectives = true,
        createAuditLog = true,
        incrementVersion = true,
        notifyAssignees = false
      } = options;

      logger.info('Updating therapy plan', {
        planId,
        updateKeys: Object.keys(updates)
      });

      const currentPlan = await this.getPlan(planId, { decryptSensitiveData: false });

      let processedUpdates = { ...updates };

      if (incrementVersion) {
        processedUpdates.version = (currentPlan.version || 1) + 1;
        processedUpdates.lastModifiedAt = new Date().toISOString();
      }

      // Validate objectives if being updated
      if (validateObjectives && updates.objectives) {
        const objectiveValidation = this.validateObjectivesCoherence(updates.objectives);
        if (!objectiveValidation.isValid) {
          throw errorHandler.createValidationError(
            'Objectives validation failed',
            objectiveValidation.errors
          );
        }
      }

      // Update metadata if significant changes
      if (this.hasSignificantChanges(updates)) {
        processedUpdates.metadata = this.generatePlanMetadata({
          ...currentPlan,
          ...processedUpdates
        });
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          currentPlan.therapistId,
          currentPlan._encryptionKeyId || planId
        );

        processedUpdates = await privacy.encryptSensitiveData(processedUpdates, encryptionKey);
      }

      if (createAuditLog) {
        const auditData = {
          entityType: 'therapy_plan',
          entityId: planId,
          action: 'update',
          changes: processedUpdates,
          previousData: privacy.sanitizeForLogging(currentPlan),
          timestamp: new Date().toISOString(),
          therapistId: currentPlan.therapistId
        };

        await auditService.logEvent({
          eventType: 'update',
          ...auditData
        });
      }

      const response = await apiClient.put(
        ENDPOINTS.therapyPlans.update.replace(':id', planId),
        processedUpdates
      );

      const updatedPlan = response.data;

      // Notify assignees if requested
      if (notifyAssignees && this.hasSignificantChanges(updates)) {
        await this.notifyPlanUpdates(planId, updates);
      }

      this.invalidateCache(['therapy-plans', 'templates'], currentPlan.therapistId);

      privacy.logDataAccess(
        currentPlan.therapistId,
        'therapy_plan',
        'update',
        { planId, changes: Object.keys(updates) }
      );

      logger.info('Therapy plan updated successfully', { planId });

      return updatedPlan;
    } catch (error) {
      logger.error('Failed to update therapy plan', { planId, error });
      throw errorHandler.handle(error);
    }
  }

  async deletePlan(planId, options = {}) {
    try {
      const {
        reason = 'user_request',
        createAuditLog = true,
        checkActiveAssignments = true,
        archiveInsteadOfDelete = true
      } = options;

      logger.info('Deleting therapy plan', { planId, reason });

      const plan = await this.getPlan(planId, { decryptSensitiveData: false });

      // Check for active assignments
      if (checkActiveAssignments) {
        const activeAssignments = await this.checkActiveAssignments(planId);
        if (activeAssignments.hasActive) {
          if (archiveInsteadOfDelete) {
            logger.info('Archiving plan instead of deleting due to active assignments');
            return await this.updatePlan(planId, {
              status: this.planStates.ARCHIVED,
              archivedReason: reason,
              archivedAt: new Date().toISOString()
            }, { createAuditLog });
          } else {
            throw errorHandler.createConflictError(
              'Cannot delete plan with active assignments',
              activeAssignments.assignments
            );
          }
        }
      }

      const deletionData = {
        reason,
        deletedAt: new Date().toISOString()
      };

      await apiClient.delete(
        ENDPOINTS.therapyPlans.delete.replace(':id', planId),
        { data: deletionData }
      );

      this.invalidateCache(['therapy-plans', 'templates'], plan.therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'delete',
          entityType: 'therapy_plan',
          entityId: planId,
          action: 'delete',
          details: {
            reason,
            originalPlan: privacy.sanitizeForLogging(plan)
          },
          userId: plan.therapistId
        });
      }

      privacy.logDataAccess(
        plan.therapistId,
        'therapy_plan',
        'delete',
        { planId, reason }
      );

      logger.info('Therapy plan deleted successfully', { planId });

      return {
        success: true,
        planId,
        deletedAt: new Date().toISOString(),
        reason
      };
    } catch (error) {
      logger.error('Failed to delete therapy plan', { planId, error });
      throw errorHandler.handle(error);
    }
  }

  async getPlans(filters = {}, options = {}) {
    try {
      const {
        therapistId = null,
        specialty = null,
        planType = null,
        status = 'all',
        isTemplate = false,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeStatistics = false,
        decryptSensitiveData = false
      } = { ...filters, ...options };

      // Solo incluir parámetros que no sean null/undefined
      const params = {};
      if (therapistId) params.therapistId = therapistId;
      if (specialty) params.specialty = specialty;
      if (planType) params.plan_type = planType;
      if (status !== 'all') params.status = status;
      if (isTemplate !== false) params.is_template = isTemplate;
      params.page = page;
      params.limit = limit;
      params.sort_by = sortBy;
      params.sort_order = sortOrder;
      if (includeStatistics) params.include_statistics = includeStatistics;

      console.log('📊 Sending params to API:', params);
      console.log('📊 Full endpoint URL would be:', ENDPOINTS.therapyPlans.getAll);

      const cacheKey = `${this.cachePrefix}list_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        logger.info('Fetching therapy plans from API', { filters: params });

        response = await apiClient.get(ENDPOINTS.therapyPlans.getAll, { params });
        console.log('📊 Raw API Response from backend:', response);
        console.log('📊 Response.data:', response.data);
        console.log('📊 Response.data.data:', response.data.data);
        cache.set(cacheKey, response.data, this.defaultCacheTTL, this.cacheTags);
      } else {
        response = { data: response };
      }

      let plans = response.data.data || response.data.plans || response.data;
      console.log('📊 Extracted plans:', plans);

      if (decryptSensitiveData) {
        plans = await Promise.all(
          plans.map(async (plan) => {
            if (plan._encryptionKeyId) {
              try {
                const encryptionKey = await privacy.generateEncryptionKey(
                  plan.therapistId,
                  plan._encryptionKeyId
                );
                return await privacy.decryptSensitiveData(plan, encryptionKey);
              } catch (error) {
                logger.warn('Failed to decrypt therapy plan data', {
                  planId: plan.id,
                  error: error.message
                });
                return plan;
              }
            }
            return plan;
          })
        );
      }

      return {
        plans,
        pagination: response.data.pagination || {
          page,
          limit,
          total: response.data.total || plans.length,
          hasMore: response.data.hasMore || false
        },
        filters: params,
        statistics: response.data.statistics || null
      };
    } catch (error) {
      logger.error('Failed to get therapy plans', { filters, error });
      throw errorHandler.handle(error);
    }
  }

  async getTemplates(specialty = null, options = {}) {
    try {
      const {
        includePrivate = false,
        therapistId = null,
        evidenceLevel = null
      } = options;

      const params = {
        specialty,
        include_private: includePrivate,
        therapistId: therapistId,
        evidence_level: evidenceLevel,
        is_template: true
      };

      const cacheKey = `${this.cachePrefix}templates_${security.generateHash(params)}`;
      let templates = cache.get(cacheKey);

      if (!templates) {
        logger.info('Fetching therapy plan templates', { specialty, params });

        const response = await apiClient.get(ENDPOINTS.therapyPlans.getTemplates, { params });
        templates = response.data;
        cache.set(cacheKey, templates, this.defaultCacheTTL, [...this.cacheTags, 'templates']);
      }

      return templates;
    } catch (error) {
      logger.error('Failed to get therapy plan templates', { specialty, error });
      throw errorHandler.handle(error);
    }
  }

  async clonePlan(planId, cloneOptions = {}, options = {}) {
    try {
      const {
        newTherapistId = null,
        preserveObjectives = true,
        preserveTechniques = true,
        updateForNewClient = false,
        createAsTemplate = false
      } = cloneOptions;

      const { createAuditLog = true } = options;

      logger.info('Cloning therapy plan', {
        planId,
        newTherapistId,
        createAsTemplate
      });

      const originalPlan = await this.getPlan(planId, { decryptSensitiveData: true });

      // Prepare cloned data
      let clonedData = {
        ...originalPlan,
        name: `${originalPlan.name} (Copy)`,
        therapistId: newTherapistId || originalPlan.therapistId,
        isTemplate: createAsTemplate,
        clonedFrom: planId,
        clonedAt: new Date().toISOString()
      };

      // Remove original identifiers
      delete clonedData.id;
      delete clonedData.planId;
      delete clonedData.createdAt;
      delete clonedData.assignments;
      delete clonedData.statistics;

      // Optionally preserve objectives and techniques
      if (!preserveObjectives) {
        clonedData.objectives = [];
      }

      if (!preserveTechniques) {
        clonedData.techniques = [];
      }

      // Update for new client context if requested
      if (updateForNewClient) {
        clonedData = this.adaptPlanForNewContext(clonedData);
      }

      const clonedPlan = await this.createPlan(clonedData, {
        saveAsTemplate: createAsTemplate,
        createAuditLog
      });

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'therapy_plan',
          entityId: clonedPlan.id,
          action: 'clone',
          details: {
            originalPlanId: planId,
            newTherapistId,
            createAsTemplate,
            preserveObjectives,
            preserveTechniques
          },
          userId: newTherapistId || originalPlan.therapistId
        });
      }

      logger.info('Therapy plan cloned successfully', {
        originalPlanId: planId,
        clonedPlanId: clonedPlan.id
      });

      return clonedPlan;
    } catch (error) {
      logger.error('Failed to clone therapy plan', { planId, error });
      throw errorHandler.handle(error);
    }
  }

  async getEffectivenessStatistics(planId, options = {}) {
    try {
      const {
        dateFrom = null,
        dateTo = null,
        includeComparisons = true,
        includePredictions = false,
        metricsTypes = []
      } = options;

      const params = {
        plan_id: planId,
        date_from: dateFrom,
        date_to: dateTo,
        include_comparisons: includeComparisons,
        include_predictions: includePredictions,
        metrics_types: metricsTypes.join(',')
      };

      const cacheKey = `${this.cachePrefix}effectiveness_${planId}_${security.generateHash(params)}`;
      let stats = cache.get(cacheKey);

      if (!stats) {
        logger.info('Fetching effectiveness statistics', { planId, params });

        const response = await apiClient.get(
          ENDPOINTS.therapyPlans.getEffectiveness.replace(':planId', planId),
          { params }
        );

        stats = response.data;
        cache.set(cacheKey, stats, 900, [...this.cacheTags, 'statistics']);
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get effectiveness statistics', { planId, error });
      throw errorHandler.handle(error);
    }
  }

  async generatePlanReport(planId, options = {}) {
    try {
      const {
        format = 'json',
        includeObjectives = true,
        includeTechniques = true,
        includeAssignments = true,
        includeStatistics = true,
        includeEvidence = true
      } = options;

      logger.info('Generating therapy plan report', { planId, format });

      const params = {
        format,
        include_objectives: includeObjectives,
        include_techniques: includeTechniques,
        include_assignments: includeAssignments,
        include_statistics: includeStatistics,
        include_evidence: includeEvidence
      };

      const response = await apiClient.get(
        ENDPOINTS.therapyPlans.generateReport.replace(':planId', planId),
        {
          params,
          responseType: format === 'pdf' ? 'blob' : 'json'
        }
      );

      const plan = await this.getPlan(planId, { decryptSensitiveData: false });

      privacy.logDataAccess(
        plan.therapistId,
        'therapy_plan_report',
        'generate',
        { planId, format }
      );

      logger.info('Therapy plan report generated successfully', { planId, format });

      return response.data;
    } catch (error) {
      logger.error('Failed to generate therapy plan report', { planId, format, error });
      throw errorHandler.handle(error);
    }
  }

  async searchPlans(searchTerm, options = {}) {
    try {
      const {
        searchFields = ['name', 'description', 'objectives', 'techniques'],
        specialty = null,
        therapistId = null,
        limit = 20,
        exactMatch = false,
        includeTemplates = true
      } = options;

      const searchParams = {
        q: searchTerm,
        fields: searchFields.join(','),
        specialty,
        therapistId: therapistId,
        limit,
        exact_match: exactMatch,
        include_templates: includeTemplates
      };

      logger.info('Searching therapy plans', { searchTerm, params: searchParams });

      const response = await apiClient.get(ENDPOINTS.therapyPlans.search, {
        params: searchParams
      });

      const results = response.data;

      logger.info('Therapy plan search completed', {
        searchTerm,
        resultsCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('Failed to search therapy plans', { searchTerm, error });
      throw errorHandler.handle(error);
    }
  }

  async bulkOperations(operation, planIds, data = {}, options = {}) {
    try {
      const {
        createAuditLog = true,
        notifyChanges = false,
        batchSize = 25
      } = options;

      logger.info('Performing bulk therapy plan operations', {
        operation,
        planCount: planIds.length,
        batchSize
      });

      if (planIds.length > batchSize) {
        const batches = [];
        for (let i = 0; i < planIds.length; i += batchSize) {
          batches.push(planIds.slice(i, i + batchSize));
        }

        const results = [];
        for (const batch of batches) {
          const batchResult = await this.bulkOperations(
            operation,
            batch,
            data,
            { ...options, batchSize: Infinity }
          );
          results.push(...batchResult.results);
        }

        return { results, total: results.length };
      }

      const payload = {
        operation,
        plan_ids: planIds,
        data,
        options: {
          create_audit_log: createAuditLog,
          notify_changes: notifyChanges
        }
      };

      const response = await apiClient.post(ENDPOINTS.therapyPlans.bulkOperations, payload);

      this.invalidateCache(['therapy-plans', 'templates']);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'therapy_plan',
          entityId: 'bulk_operation',
          action: `bulk_${operation}`,
          details: {
            operation,
            planIds,
            data,
            processedCount: response.data.results.length
          }
        });
      }

      logger.info('Bulk operation completed', {
        operation,
        processed: response.data.results.length,
        successful: response.data.results.filter(r => r.success).length
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to perform bulk operation', { operation, error });
      throw errorHandler.handle(error);
    }
  }

  validatePlanData(planData) {
    const requiredFields = ['therapistId', 'name', 'type', 'specialty'];

    for (const field of requiredFields) {
      if (!planData[field]) {
        throw errorHandler.createValidationError(`Missing required field: ${field}`, planData);
      }
    }

    // Validate plan type
    if (!Object.values(this.planTypes).includes(planData.type)) {
      throw errorHandler.createValidationError('Invalid plan type', {
        provided: planData.type,
        valid: Object.values(this.planTypes)
      });
    }

    // Validate specialty
    if (!Object.values(this.specialties).includes(planData.specialty)) {
      throw errorHandler.createValidationError('Invalid specialty', {
        provided: planData.specialty,
        valid: Object.values(this.specialties)
      });
    }

    // Validate session frequency if provided
    if (planData.sessionFrequency && !Object.values(this.sessionFrequency).includes(planData.sessionFrequency)) {
      throw errorHandler.createValidationError('Invalid session frequency', {
        provided: planData.sessionFrequency,
        valid: Object.values(this.sessionFrequency)
      });
    }

    return true;
  }

  validateObjectivesCoherence(objectives) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(objectives) || objectives.length === 0) {
      errors.push('At least one objective is required');
      return { isValid: false, errors, warnings };
    }

    objectives.forEach((objective, index) => {
      // Support both string objectives and object objectives
      const description = typeof objective === 'string' ? objective : objective?.description;
      const type = typeof objective === 'string' ? objective.type : objective?.type;
      const measurableOutcome = objective?.measurableOutcome;
      const timeline = objective?.timeline;

      // Check required fields
      if (!description) {
        errors.push(`Objective ${index + 1}: description is required`);
      }

      // Only validate objective type if it's provided as an object
      if (typeof objective === 'object' && type && !Object.values(this.objectiveTypes).includes(type)) {
        errors.push(`Objective ${index + 1}: valid type is required`);
      }

      // Check for measurable outcomes (only if objective is an object)
      if (typeof objective === 'object' && !measurableOutcome) {
        warnings.push(`Objective ${index + 1}: consider adding measurable outcome`);
      }

      // Check for timeline (only if objective is an object)
      if (typeof objective === 'object' && !timeline) {
        warnings.push(`Objective ${index + 1}: consider adding timeline`);
      }
    });

    // Check for objective diversity
    const objectiveTypes = objectives.map(obj => obj.type);
    const uniqueTypes = [...new Set(objectiveTypes)];

    if (uniqueTypes.length === 1 && objectives.length > 2) {
      warnings.push('Consider diversifying objective types for comprehensive treatment');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateEvidenceBasedPractices(techniques, specialty) {
    const warnings = [];
    const recommendations = [];

    // Check if techniques are appropriate for specialty
    const specialtyTechniques = this.getSpecialtyRecommendedTechniques(specialty);
    const usedTechniques = techniques.filter(tech => tech.name);

    const inappropriateTechniques = usedTechniques.filter(
      tech => !specialtyTechniques.includes(tech.name)
    );

    if (inappropriateTechniques.length > 0) {
      warnings.push('Some techniques may not be optimal for this specialty');
      recommendations.push(`Consider using: ${specialtyTechniques.slice(0, 3).join(', ')}`);
    }

    // Check for evidence level
    const lowEvidenceTechniques = usedTechniques.filter(
      tech => !tech.evidenceLevel || tech.evidenceLevel === this.evidenceBasedApproaches.CLINICAL_EXPERIENCE
    );

    if (lowEvidenceTechniques.length > usedTechniques.length / 2) {
      warnings.push('Consider incorporating more evidence-based techniques');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      recommendations
    };
  }

  getSpecialtyRecommendedTechniques(specialty) {
    const recommendations = {
      [this.specialties.COGNITIVE_BEHAVIORAL]: [
        this.techniques.COGNITIVE_RESTRUCTURING,
        this.techniques.BEHAVIORAL_ACTIVATION,
        this.techniques.HOMEWORK_ASSIGNMENTS
      ],
      [this.specialties.TRAUMA_FOCUSED]: [
        this.techniques.EXPOSURE_THERAPY,
        this.techniques.GROUNDING_TECHNIQUES,
        this.techniques.RELAXATION_TECHNIQUES
      ],
      [this.specialties.MINDFULNESS_BASED]: [
        this.techniques.MINDFULNESS_MEDITATION,
        this.techniques.RELAXATION_TECHNIQUES,
        this.techniques.BIOFEEDBACK
      ],
      [this.specialties.DIALECTICAL_BEHAVIORAL]: [
        this.techniques.MINDFULNESS_MEDITATION,
        this.techniques.GROUNDING_TECHNIQUES,
        this.techniques.BEHAVIORAL_ACTIVATION
      ]
    };

    return recommendations[specialty] || [];
  }

  generatePlanMetadata(planData) {
    return {
      estimatedDuration: this.calculateEstimatedDuration(planData),
      complexity: this.assessPlanComplexity(planData),
      evidenceLevel: this.assessEvidenceLevel(planData),
      objectivesSummary: this.summarizeObjectives(planData.objectives || []),
      techniquesCount: planData.techniques?.length || 0,
      lastAnalyzed: new Date().toISOString()
    };
  }

  calculateEstimatedDuration(planData) {
    const baseWeeks = {
      [this.planTypes.SHORT_TERM]: 8,
      [this.planTypes.LONG_TERM]: 24,
      [this.planTypes.INTENSIVE]: 4
    };

    let duration = baseWeeks[planData.type] || 12;

    // Adjust based on objectives
    if (planData.objectives) {
      duration += Math.floor(planData.objectives.length / 2);
    }

    // Adjust based on session frequency
    const frequencyMultipliers = {
      [this.sessionFrequency.DAILY]: 0.5,
      [this.sessionFrequency.TWICE_WEEKLY]: 0.8,
      [this.sessionFrequency.WEEKLY]: 1.0,
      [this.sessionFrequency.BIWEEKLY]: 1.5,
      [this.sessionFrequency.MONTHLY]: 2.0
    };

    const multiplier = frequencyMultipliers[planData.sessionFrequency] || 1.0;
    duration *= multiplier;

    return Math.round(duration);
  }

  assessPlanComplexity(planData) {
    let complexity = 0;

    // Base complexity from objectives
    complexity += (planData.objectives?.length || 0) * 2;

    // Add complexity from techniques
    complexity += (planData.techniques?.length || 0);

    // Adjust for plan type
    const typeComplexity = {
      [this.planTypes.INDIVIDUAL]: 1,
      [this.planTypes.GROUP]: 2,
      [this.planTypes.FAMILY]: 3,
      [this.planTypes.INTENSIVE]: 3
    };

    complexity += typeComplexity[planData.type] || 1;

    if (complexity <= 5) return 'low';
    if (complexity <= 12) return 'medium';
    return 'high';
  }

  assessEvidenceLevel(planData) {
    if (!planData.techniques || planData.techniques.length === 0) {
      return this.evidenceBasedApproaches.CLINICAL_EXPERIENCE;
    }

    const evidenceLevels = planData.techniques.map(tech => tech.evidenceLevel);
    const highestLevel = evidenceLevels.reduce((highest, current) => {
      const levels = Object.values(this.evidenceBasedApproaches);
      return levels.indexOf(current) < levels.indexOf(highest) ? current : highest;
    }, this.evidenceBasedApproaches.CLINICAL_EXPERIENCE);

    return highestLevel;
  }

  summarizeObjectives(objectives) {
    const typeCounts = {};
    objectives.forEach(obj => {
      typeCounts[obj.type] = (typeCounts[obj.type] || 0) + 1;
    });

    return {
      total: objectives.length,
      byType: typeCounts,
      hasMeasurable: objectives.filter(obj => obj.measurableOutcome).length,
      hasTimeline: objectives.filter(obj => obj.timeline).length
    };
  }

  hasSignificantChanges(updates) {
    const significantFields = ['objectives', 'techniques', 'sessionFrequency', 'estimatedDuration'];
    return significantFields.some(field => updates.hasOwnProperty(field));
  }

  adaptPlanForNewContext(planData) {
    // Remove specific client references
    if (planData.description) {
      planData.description = planData.description.replace(/\b(client|patient)\s+\w+/gi, 'client');
    }

    // Generalize objectives
    if (planData.objectives) {
      planData.objectives = planData.objectives.map(obj => ({
        ...obj,
        description: obj.description?.replace(/\b(client|patient)\s+\w+/gi, 'client')
      }));
    }

    // Reset progress tracking
    delete planData.currentProgress;
    delete planData.completedObjectives;

    return planData;
  }

  async checkActiveAssignments(planId) {
    try {
      const response = await apiClient.get(
        ENDPOINTS.therapyPlans.checkActiveAssignments.replace(':planId', planId)
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to check active assignments', { planId, error });
      return { hasActive: false, assignments: [] };
    }
  }

  async notifyPlanUpdates(planId, updates) {
    try {
      logger.info('Notifying plan updates', { planId, updates: Object.keys(updates) });

      const notificationData = {
        plan_id: planId,
        updates: privacy.sanitizeForLogging(updates),
        timestamp: new Date().toISOString()
      };

      const response = await apiClient.post(
        ENDPOINTS.therapyPlans.notifyUpdates.replace(':planId', planId),
        notificationData
      );

      return response.data;
    } catch (error) {
      logger.warn('Failed to notify plan updates', { planId, error });
      return null;
    }
  }

  invalidateCache(tags = [], specificTherapistId = null) {
    try {
      if (specificTherapistId) {
        cache.deleteByPattern(`${this.cachePrefix}*${specificTherapistId}*`);
      }

      tags.forEach(tag => {
        cache.deleteByTag(tag);
      });

      logger.debug('Therapy plan service cache invalidated', { tags, specificTherapistId });
    } catch (error) {
      logger.warn('Failed to invalidate cache', error);
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('therapy-plans');
      cache.deleteByTag('templates');
      cache.deleteByTag('objectives');
      logger.info('Therapy plan service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear therapy plan service cache', error);
    }
  }

  getStats() {
    return {
      service: 'TherapyPlanService',
      initialized: this.isInitialized,
      cacheStats: {
        therapyPlans: cache.getStatsByTag('therapy-plans'),
        templates: cache.getStatsByTag('templates'),
        objectives: cache.getStatsByTag('objectives')
      },
      constants: {
        planStates: this.planStates,
        planTypes: this.planTypes,
        specialties: this.specialties,
        objectiveTypes: this.objectiveTypes,
        techniques: this.techniques,
        sessionFrequency: this.sessionFrequency,
        effectivenessMetrics: this.effectivenessMetrics,
        evidenceBasedApproaches: this.evidenceBasedApproaches
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const therapyPlanService = new TherapyPlanService();

export const {
  createPlan,
  getPlan,
  updatePlan,
  deletePlan,
  getPlans,
  getTemplates,
  clonePlan,
  getEffectivenessStatistics,
  generatePlanReport,
  searchPlans,
  bulkOperations
} = therapyPlanService;

export default therapyPlanService;