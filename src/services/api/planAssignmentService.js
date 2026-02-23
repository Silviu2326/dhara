import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { errorHandler } from '../utils/errorHandler';
import { privacy } from '../utils/privacy';
import { security } from '../utils/security';
import { auditService } from '../utils/auditService';

class PlanAssignmentService {
  constructor() {
    this.baseEndpoint = 'plan-assignments';
    this.cachePrefix = 'assignment_';
    this.cacheTags = ['assignments', 'plans', 'progress'];
    this.defaultCacheTTL = 300;
    this.isInitialized = false;

    this.assignmentStates = {
      PENDING: 'pending',
      ACTIVE: 'active',
      PAUSED: 'paused',
      COMPLETED: 'completed',
      TERMINATED: 'terminated',
      CANCELLED: 'cancelled',
      REASSIGNED: 'reassigned'
    };

    this.progressStates = {
      NOT_STARTED: 'not_started',
      IN_PROGRESS: 'in_progress',
      ON_TRACK: 'on_track',
      BEHIND_SCHEDULE: 'behind_schedule',
      AHEAD_OF_SCHEDULE: 'ahead_of_schedule',
      STALLED: 'stalled',
      COMPLETED: 'completed'
    };

    this.complianceStates = {
      EXCELLENT: 'excellent',    // 90-100%
      GOOD: 'good',             // 75-89%
      FAIR: 'fair',             // 60-74%
      POOR: 'poor',             // 40-59%
      CRITICAL: 'critical'      // <40%
    };

    this.modificationTypes = {
      OBJECTIVE_ADDED: 'objective_added',
      OBJECTIVE_MODIFIED: 'objective_modified',
      OBJECTIVE_REMOVED: 'objective_removed',
      TECHNIQUE_ADDED: 'technique_added',
      TECHNIQUE_MODIFIED: 'technique_modified',
      TECHNIQUE_REMOVED: 'technique_removed',
      FREQUENCY_CHANGED: 'frequency_changed',
      DURATION_EXTENDED: 'duration_extended',
      DURATION_SHORTENED: 'duration_shortened',
      PLAN_SWITCHED: 'plan_switched'
    };

    this.milestoneTypes = {
      ASSIGNMENT_START: 'assignment_start',
      FIRST_SESSION: 'first_session',
      QUARTER_PROGRESS: 'quarter_progress',
      HALF_PROGRESS: 'half_progress',
      THREE_QUARTER_PROGRESS: 'three_quarter_progress',
      OBJECTIVE_COMPLETED: 'objective_completed',
      PLAN_COMPLETED: 'plan_completed',
      EARLY_TERMINATION: 'early_termination',
      REASSIGNMENT: 'reassignment'
    };

    this.reportTypes = {
      PROGRESS_SUMMARY: 'progress_summary',
      COMPLIANCE_REPORT: 'compliance_report',
      OBJECTIVE_ANALYSIS: 'objective_analysis',
      MILESTONE_REPORT: 'milestone_report',
      EFFECTIVENESS_REVIEW: 'effectiveness_review',
      MODIFICATION_HISTORY: 'modification_history'
    };

    this.reminderTypes = {
      SESSION_DUE: 'session_due',
      OBJECTIVE_REVIEW: 'objective_review',
      PROGRESS_CHECK: 'progress_check',
      MILESTONE_APPROACHING: 'milestone_approaching',
      COMPLIANCE_WARNING: 'compliance_warning',
      PLAN_EXPIRING: 'plan_expiring'
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing PlanAssignmentService');

      // Setup periodic progress monitoring
      this.setupProgressMonitoring();

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize PlanAssignmentService', error);
      throw error;
    }
  }

  async assignPlan(assignmentData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validatePlanClientCompatibility = true,
        createProgressTracking = true,
        scheduleReminders = true,
        notifyStakeholders = true,
        createAuditLog = true
      } = options;

      logger.info('Assigning therapy plan to client', {
        planId: assignmentData.planId,
        clientId: assignmentData.clientId,
        therapistId: assignmentData.therapistId,
        startDate: assignmentData.startDate
      });

      // Validate assignment data
      this.validateAssignmentData(assignmentData);

      // Check plan-client compatibility
      if (validatePlanClientCompatibility) {
        const compatibility = await this.checkPlanClientCompatibility(
          assignmentData.planId,
          assignmentData.clientId
        );

        if (!compatibility.isCompatible) {
          throw errorHandler.createValidationError(
            'Plan-client compatibility check failed',
            compatibility.issues
          );
        }

        if (compatibility.warnings.length > 0) {
          logger.warn('Plan-client compatibility warnings', compatibility.warnings);
        }
      }

      let processedData = {
        ...assignmentData,
        assignmentId: security.generateSecureId('assign_'),
        status: this.assignmentStates.PENDING,
        progressState: this.progressStates.NOT_STARTED,
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        version: 1
      };

      // Set default dates if not provided
      if (!processedData.startDate) {
        processedData.startDate = new Date().toISOString();
      }

      if (!processedData.expectedEndDate && processedData.estimatedDuration) {
        const endDate = new Date(processedData.startDate);
        endDate.setDate(endDate.getDate() + (processedData.estimatedDuration * 7)); // weeks to days
        processedData.expectedEndDate = endDate.toISOString();
      }

      // Initialize progress tracking
      if (createProgressTracking) {
        processedData.progressTracking = this.initializeProgressTracking(assignmentData.planId);
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          assignmentData.clientId,
          processedData.assignmentId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.assignmentId;
      }

      const sanitizedData = privacy.sanitizeForLogging(processedData);
      logger.info('Creating plan assignment with sanitized data', { data: sanitizedData });

      const response = await apiClient.post(
        ENDPOINTS.planAssignments.create,
        processedData
      );

      const assignment = response.data;

      // Schedule reminders
      if (scheduleReminders) {
        await this.scheduleAssignmentReminders(assignment.id, {
          startDate: assignment.startDate,
          expectedEndDate: assignment.expectedEndDate,
          planObjectives: assignment.progressTracking?.objectives || []
        });
      }

      // Notify stakeholders
      if (notifyStakeholders) {
        await this.notifyAssignmentCreated(assignment.id);
      }

      this.invalidateCache(['assignments', 'plans'], assignmentData.clientId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'plan_assignment',
          entityId: assignment.id,
          action: 'assign_plan',
          details: {
            planId: assignmentData.planId,
            clientId: assignmentData.clientId,
            therapistId: assignmentData.therapistId,
            startDate: assignmentData.startDate
          },
          userId: assignmentData.assignedBy || assignmentData.therapistId
        });
      }

      privacy.logDataAccess(
        assignmentData.clientId,
        'plan_assignment',
        'create',
        { assignmentId: assignment.id }
      );

      logger.info('Plan assignment created successfully', {
        assignmentId: assignment.id,
        planId: assignmentData.planId,
        clientId: assignmentData.clientId
      });

      return assignment;
    } catch (error) {
      logger.error('Failed to assign plan', error);
      throw errorHandler.handle(error);
    }
  }

  async getAssignment(assignmentId, options = {}) {
    try {
      const {
        decryptSensitiveData = true,
        includeProgress = true,
        includeHistory = false,
        includeMilestones = false,
        includeModifications = false
      } = options;

      const cacheKey = `${this.cachePrefix}${assignmentId}`;
      let assignment = cache.get(cacheKey);

      if (!assignment) {
        logger.info('Fetching plan assignment from API', { assignmentId });

        const params = {
          include_progress: includeProgress,
          include_history: includeHistory,
          include_milestones: includeMilestones,
          include_modifications: includeModifications
        };

        const response = await apiClient.get(
          ENDPOINTS.planAssignments.getById.replace(':id', assignmentId),
          { params }
        );

        assignment = response.data;
        cache.set(cacheKey, assignment, this.defaultCacheTTL, this.cacheTags);
      }

      if (decryptSensitiveData && assignment._encryptionKeyId) {
        try {
          const encryptionKey = await privacy.generateEncryptionKey(
            assignment.clientId,
            assignment._encryptionKeyId
          );
          assignment = await privacy.decryptSensitiveData(assignment, encryptionKey);
        } catch (decryptError) {
          logger.warn('Failed to decrypt assignment data', {
            assignmentId,
            error: decryptError.message
          });
        }
      }

      privacy.logDataAccess(
        assignment.clientId,
        'plan_assignment',
        'read',
        { assignmentId }
      );

      return assignment;
    } catch (error) {
      logger.error('Failed to get plan assignment', { assignmentId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateProgress(assignmentId, progressData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validateProgress = true,
        checkMilestones = true,
        updateCompliance = true,
        createAuditLog = true,
        notifyChanges = false
      } = options;

      logger.info('Updating assignment progress', {
        assignmentId,
        progressData: privacy.sanitizeForLogging(progressData)
      });

      const currentAssignment = await this.getAssignment(assignmentId, { decryptSensitiveData: false });

      // Validate progress data
      if (validateProgress) {
        const validation = this.validateProgressData(progressData, currentAssignment);
        if (!validation.isValid) {
          throw errorHandler.createValidationError(
            'Progress validation failed',
            validation.errors
          );
        }
      }

      let processedData = {
        ...progressData,
        updatedAt: new Date().toISOString(),
        updatedBy: progressData.updatedBy || currentAssignment.therapistId
      };

      // Update progress state based on data
      if (progressData.objectiveProgress || progressData.overallProgress) {
        processedData.progressState = this.calculateProgressState(
          progressData,
          currentAssignment
        );
      }

      // Update compliance score
      if (updateCompliance) {
        processedData.complianceScore = this.calculateComplianceScore(
          progressData,
          currentAssignment
        );
        processedData.complianceState = this.getComplianceState(processedData.complianceScore);
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          currentAssignment.clientId,
          currentAssignment._encryptionKeyId || assignmentId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
      }

      const response = await apiClient.patch(
        ENDPOINTS.planAssignments.updateProgress.replace(':assignmentId', assignmentId),
        processedData
      );

      const updatedAssignment = response.data;

      // Check and record milestones
      if (checkMilestones) {
        await this.checkAndRecordMilestones(assignmentId, updatedAssignment);
      }

      // Notify changes if significant progress
      if (notifyChanges && this.isSignificantProgress(progressData)) {
        await this.notifyProgressUpdate(assignmentId, progressData);
      }

      this.invalidateCache(['assignments', 'progress'], currentAssignment.clientId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'plan_assignment',
          entityId: assignmentId,
          action: 'update_progress',
          details: {
            progressData: privacy.sanitizeForLogging(progressData),
            newProgressState: processedData.progressState,
            complianceScore: processedData.complianceScore
          },
          userId: processedData.updatedBy
        });
      }

      privacy.logDataAccess(
        currentAssignment.clientId,
        'plan_assignment',
        'update_progress',
        { assignmentId }
      );

      logger.info('Assignment progress updated successfully', { assignmentId });

      return updatedAssignment;
    } catch (error) {
      logger.error('Failed to update assignment progress', { assignmentId, error });
      throw errorHandler.handle(error);
    }
  }

  async modifyPlan(assignmentId, modifications, options = {}) {
    try {
      const {
        reason = 'clinical_judgment',
        encryptSensitiveData = true,
        validateModifications = true,
        createAuditLog = true,
        notifyStakeholders = true,
        preserveHistory = true
      } = options;

      logger.info('Modifying assigned plan', {
        assignmentId,
        modificationType: modifications.type,
        reason
      });

      const currentAssignment = await this.getAssignment(assignmentId, { decryptSensitiveData: false });

      // Validate modifications
      if (validateModifications) {
        const validation = this.validatePlanModifications(modifications, currentAssignment);
        if (!validation.isValid) {
          throw errorHandler.createValidationError(
            'Plan modification validation failed',
            validation.errors
          );
        }
      }

      let processedData = {
        modifications,
        reason,
        modifiedAt: new Date().toISOString(),
        modifiedBy: modifications.modifiedBy || currentAssignment.therapistId,
        previousVersion: preserveHistory ? currentAssignment.version : null
      };

      // Update assignment version
      processedData.version = (currentAssignment.version || 1) + 1;

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          currentAssignment.clientId,
          currentAssignment._encryptionKeyId || assignmentId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
      }

      const response = await apiClient.patch(
        ENDPOINTS.planAssignments.modifyPlan.replace(':assignmentId', assignmentId),
        processedData
      );

      const modifiedAssignment = response.data;

      // Record modification milestone
      await this.recordMilestone(assignmentId, {
        type: this.milestoneTypes.PLAN_MODIFIED,
        description: `Plan modified: ${modifications.type}`,
        reason,
        timestamp: new Date().toISOString()
      });

      // Notify stakeholders
      if (notifyStakeholders) {
        await this.notifyPlanModification(assignmentId, modifications, reason);
      }

      this.invalidateCache(['assignments', 'plans'], currentAssignment.clientId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'plan_assignment',
          entityId: assignmentId,
          action: 'modify_plan',
          details: {
            modificationType: modifications.type,
            reason,
            modifications: privacy.sanitizeForLogging(modifications)
          },
          userId: processedData.modifiedBy
        });
      }

      logger.info('Plan assignment modified successfully', { assignmentId });

      return modifiedAssignment;
    } catch (error) {
      logger.error('Failed to modify plan assignment', { assignmentId, error });
      throw errorHandler.handle(error);
    }
  }

  async reassignPlan(assignmentId, reassignmentData, options = {}) {
    try {
      const {
        reason = 'therapist_change',
        preserveProgress = true,
        createAuditLog = true,
        notifyStakeholders = true
      } = options;

      logger.info('Reassigning plan', {
        assignmentId,
        newTherapistId: reassignmentData.newTherapistId,
        reason
      });

      const currentAssignment = await this.getAssignment(assignmentId, { decryptSensitiveData: false });

      // Validate reassignment
      if (reassignmentData.newTherapistId === currentAssignment.therapistId) {
        throw errorHandler.createValidationError('Cannot reassign to the same therapist');
      }

      const reassignmentPayload = {
        assignment_id: assignmentId,
        new_therapistId: reassignmentData.newTherapistId,
        reason,
        preserve_progress: preserveProgress,
        transition_date: reassignmentData.transitionDate || new Date().toISOString(),
        reassigned_by: reassignmentData.reassignedBy,
        notes: reassignmentData.notes
      };

      const response = await apiClient.post(
        ENDPOINTS.planAssignments.reassign.replace(':assignmentId', assignmentId),
        reassignmentPayload
      );

      const reassignedAssignment = response.data;

      // Update original assignment status
      await this.updateAssignment(assignmentId, {
        status: this.assignmentStates.REASSIGNED,
        reassignedTo: reassignedAssignment.id,
        reassignedAt: new Date().toISOString()
      });

      // Record reassignment milestone
      await this.recordMilestone(assignmentId, {
        type: this.milestoneTypes.REASSIGNMENT,
        description: `Plan reassigned to new therapist`,
        reason,
        timestamp: new Date().toISOString()
      });

      // Notify stakeholders
      if (notifyStakeholders) {
        await this.notifyReassignment(assignmentId, reassignmentData, reason);
      }

      this.invalidateCache(['assignments', 'plans'], currentAssignment.clientId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'plan_assignment',
          entityId: assignmentId,
          action: 'reassign_plan',
          details: {
            originalTherapistId: currentAssignment.therapistId,
            newTherapistId: reassignmentData.newTherapistId,
            reason,
            preserveProgress
          },
          userId: reassignmentData.reassignedBy
        });
      }

      logger.info('Plan reassigned successfully', {
        originalAssignmentId: assignmentId,
        newAssignmentId: reassignedAssignment.id
      });

      return reassignedAssignment;
    } catch (error) {
      logger.error('Failed to reassign plan', { assignmentId, error });
      throw errorHandler.handle(error);
    }
  }

  async getAssignments(filters = {}, options = {}) {
    try {
      const {
        clientId = null,
        therapistId = null,
        planId = null,
        status = 'all',
        progressState = 'all',
        dateFrom = null,
        dateTo = null,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeProgress = true,
        decryptSensitiveData = false
      } = { ...filters, ...options };

      const params = {
        client_id: clientId,
        therapistId: therapistId,
        plan_id: planId,
        status,
        progress_state: progressState,
        date_from: dateFrom,
        date_to: dateTo,
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        include_progress: includeProgress
      };

      const cacheKey = `${this.cachePrefix}list_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        logger.info('Fetching plan assignments from API', { filters: params });

        response = await apiClient.get(ENDPOINTS.planAssignments.getAll, { params });
        cache.set(cacheKey, response.data, this.defaultCacheTTL, this.cacheTags);
      } else {
        response = { data: response };
      }

      let assignments = response.data.assignments || response.data;

      if (decryptSensitiveData) {
        assignments = await Promise.all(
          assignments.map(async (assignment) => {
            if (assignment._encryptionKeyId) {
              try {
                const encryptionKey = await privacy.generateEncryptionKey(
                  assignment.clientId,
                  assignment._encryptionKeyId
                );
                return await privacy.decryptSensitiveData(assignment, encryptionKey);
              } catch (error) {
                logger.warn('Failed to decrypt assignment data', {
                  assignmentId: assignment.id,
                  error: error.message
                });
                return assignment;
              }
            }
            return assignment;
          })
        );
      }

      return {
        assignments,
        pagination: {
          page,
          limit,
          total: response.data.total || assignments.length,
          hasMore: response.data.hasMore || false
        },
        filters: params
      };
    } catch (error) {
      logger.error('Failed to get plan assignments', { filters, error });
      throw errorHandler.handle(error);
    }
  }

  async generateComplianceReport(assignmentId, options = {}) {
    try {
      const {
        reportType = this.reportTypes.COMPLIANCE_REPORT,
        format = 'json',
        dateFrom = null,
        dateTo = null,
        includeRecommendations = true,
        includeGraphics = true
      } = options;

      logger.info('Generating compliance report', {
        assignmentId,
        reportType,
        format
      });

      const params = {
        report_type: reportType,
        format,
        date_from: dateFrom,
        date_to: dateTo,
        include_recommendations: includeRecommendations,
        include_graphics: includeGraphics
      };

      const response = await apiClient.get(
        ENDPOINTS.planAssignments.generateReport.replace(':assignmentId', assignmentId),
        {
          params,
          responseType: format === 'pdf' ? 'blob' : 'json'
        }
      );

      const assignment = await this.getAssignment(assignmentId, { decryptSensitiveData: false });

      privacy.logDataAccess(
        assignment.clientId,
        'compliance_report',
        'generate',
        { assignmentId, reportType, format }
      );

      logger.info('Compliance report generated successfully', {
        assignmentId,
        reportType,
        format
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to generate compliance report', { assignmentId, error });
      throw errorHandler.handle(error);
    }
  }

  async completeAssignment(assignmentId, completionData, options = {}) {
    try {
      const {
        reason = 'plan_completed',
        createFinalReport = true,
        notifyStakeholders = true,
        createAuditLog = true
      } = options;

      logger.info('Completing plan assignment', { assignmentId, reason });

      const currentAssignment = await this.getAssignment(assignmentId, { decryptSensitiveData: false });

      const completionPayload = {
        status: this.assignmentStates.COMPLETED,
        progressState: this.progressStates.COMPLETED,
        completedAt: new Date().toISOString(),
        completionReason: reason,
        finalNotes: completionData.finalNotes,
        outcomeAssessment: completionData.outcomeAssessment,
        recommendationsForFuture: completionData.recommendationsForFuture
      };

      const response = await apiClient.patch(
        ENDPOINTS.planAssignments.complete.replace(':assignmentId', assignmentId),
        completionPayload
      );

      const completedAssignment = response.data;

      // Record completion milestone
      await this.recordMilestone(assignmentId, {
        type: this.milestoneTypes.PLAN_COMPLETED,
        description: 'Plan assignment completed successfully',
        reason,
        timestamp: new Date().toISOString()
      });

      // Generate final report
      if (createFinalReport) {
        await this.generateComplianceReport(assignmentId, {
          reportType: this.reportTypes.EFFECTIVENESS_REVIEW,
          includeRecommendations: true
        });
      }

      // Notify stakeholders
      if (notifyStakeholders) {
        await this.notifyAssignmentCompleted(assignmentId, completionData);
      }

      this.invalidateCache(['assignments', 'plans'], currentAssignment.clientId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'plan_assignment',
          entityId: assignmentId,
          action: 'complete_assignment',
          details: {
            reason,
            outcomeAssessment: completionData.outcomeAssessment
          },
          userId: currentAssignment.therapistId
        });
      }

      logger.info('Plan assignment completed successfully', { assignmentId });

      return completedAssignment;
    } catch (error) {
      logger.error('Failed to complete plan assignment', { assignmentId, error });
      throw errorHandler.handle(error);
    }
  }

  // Validation methods
  validateAssignmentData(assignmentData) {
    const requiredFields = ['planId', 'clientId', 'therapistId'];

    for (const field of requiredFields) {
      if (!assignmentData[field]) {
        throw errorHandler.createValidationError(`Missing required field: ${field}`, assignmentData);
      }
    }

    // Validate dates
    if (assignmentData.startDate && assignmentData.expectedEndDate) {
      const startDate = new Date(assignmentData.startDate);
      const endDate = new Date(assignmentData.expectedEndDate);

      if (startDate >= endDate) {
        throw errorHandler.createValidationError('Start date must be before end date');
      }
    }

    return true;
  }

  validateProgressData(progressData, currentAssignment) {
    const errors = [];

    // Validate progress percentage
    if (progressData.overallProgress !== undefined) {
      if (progressData.overallProgress < 0 || progressData.overallProgress > 100) {
        errors.push('Overall progress must be between 0 and 100');
      }
    }

    // Validate objective progress
    if (progressData.objectiveProgress) {
      Object.entries(progressData.objectiveProgress).forEach(([objectiveId, progress]) => {
        if (progress < 0 || progress > 100) {
          errors.push(`Objective ${objectiveId} progress must be between 0 and 100`);
        }
      });
    }

    // Validate session attendance
    if (progressData.sessionAttendance !== undefined) {
      if (progressData.sessionAttendance < 0 || progressData.sessionAttendance > 100) {
        errors.push('Session attendance must be between 0 and 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validatePlanModifications(modifications, currentAssignment) {
    const errors = [];

    // Validate modification type
    if (!Object.values(this.modificationTypes).includes(modifications.type)) {
      errors.push('Invalid modification type');
    }

    // Validate specific modifications based on type
    switch (modifications.type) {
      case this.modificationTypes.OBJECTIVE_ADDED:
      case this.modificationTypes.OBJECTIVE_MODIFIED:
        if (!modifications.objectiveData) {
          errors.push('Objective data is required for objective modifications');
        }
        break;

      case this.modificationTypes.FREQUENCY_CHANGED:
        if (!modifications.newFrequency) {
          errors.push('New frequency is required for frequency changes');
        }
        break;

      case this.modificationTypes.DURATION_EXTENDED:
      case this.modificationTypes.DURATION_SHORTENED:
        if (!modifications.newDuration) {
          errors.push('New duration is required for duration changes');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper methods
  async checkPlanClientCompatibility(planId, clientId) {
    try {
      const response = await apiClient.get(
        ENDPOINTS.planAssignments.checkCompatibility,
        {
          params: { plan_id: planId, client_id: clientId }
        }
      );

      return response.data;
    } catch (error) {
      logger.warn('Failed to check plan-client compatibility', { planId, clientId, error });
      return {
        isCompatible: true,
        issues: [],
        warnings: ['Compatibility check unavailable']
      };
    }
  }

  initializeProgressTracking(planId) {
    return {
      planId,
      overallProgress: 0,
      objectiveProgress: {},
      sessionAttendance: 0,
      complianceScore: 0,
      lastUpdated: new Date().toISOString(),
      milestones: [],
      modifications: []
    };
  }

  calculateProgressState(progressData, currentAssignment) {
    const overallProgress = progressData.overallProgress || 0;
    const sessionAttendance = progressData.sessionAttendance || 0;
    const timeElapsed = this.calculateTimeElapsed(currentAssignment);

    // Determine progress state based on multiple factors
    if (overallProgress === 0) {
      return this.progressStates.NOT_STARTED;
    }

    if (overallProgress === 100) {
      return this.progressStates.COMPLETED;
    }

    // Compare actual progress with expected progress based on time
    const expectedProgress = Math.min(timeElapsed * 100, 90); // Cap at 90%

    if (overallProgress >= expectedProgress + 10) {
      return this.progressStates.AHEAD_OF_SCHEDULE;
    } else if (overallProgress < expectedProgress - 20) {
      return this.progressStates.BEHIND_SCHEDULE;
    } else if (sessionAttendance < 50) {
      return this.progressStates.STALLED;
    } else {
      return this.progressStates.ON_TRACK;
    }
  }

  calculateComplianceScore(progressData, currentAssignment) {
    let score = 0;
    let factors = 0;

    // Session attendance (40% weight)
    if (progressData.sessionAttendance !== undefined) {
      score += progressData.sessionAttendance * 0.4;
      factors += 0.4;
    }

    // Homework completion (30% weight)
    if (progressData.homeworkCompletion !== undefined) {
      score += progressData.homeworkCompletion * 0.3;
      factors += 0.3;
    }

    // Objective progress (30% weight)
    if (progressData.overallProgress !== undefined) {
      score += progressData.overallProgress * 0.3;
      factors += 0.3;
    }

    // Normalize score based on available factors
    return factors > 0 ? Math.round(score / factors) : 0;
  }

  getComplianceState(complianceScore) {
    if (complianceScore >= 90) return this.complianceStates.EXCELLENT;
    if (complianceScore >= 75) return this.complianceStates.GOOD;
    if (complianceScore >= 60) return this.complianceStates.FAIR;
    if (complianceScore >= 40) return this.complianceStates.POOR;
    return this.complianceStates.CRITICAL;
  }

  calculateTimeElapsed(assignment) {
    const startDate = new Date(assignment.startDate);
    const currentDate = new Date();
    const expectedEndDate = new Date(assignment.expectedEndDate);

    const totalDuration = expectedEndDate.getTime() - startDate.getTime();
    const elapsed = currentDate.getTime() - startDate.getTime();

    return Math.max(0, Math.min(1, elapsed / totalDuration));
  }

  isSignificantProgress(progressData) {
    return (
      progressData.overallProgress >= 25 ||
      progressData.objectiveCompleted ||
      progressData.milestoneReached
    );
  }

  async checkAndRecordMilestones(assignmentId, assignment) {
    try {
      const milestones = [];

      // Check progress milestones
      const progress = assignment.progressTracking?.overallProgress || 0;

      if (progress >= 25 && !this.hasMilestone(assignment, this.milestoneTypes.QUARTER_PROGRESS)) {
        milestones.push({
          type: this.milestoneTypes.QUARTER_PROGRESS,
          description: '25% progress milestone reached',
          timestamp: new Date().toISOString()
        });
      }

      if (progress >= 50 && !this.hasMilestone(assignment, this.milestoneTypes.HALF_PROGRESS)) {
        milestones.push({
          type: this.milestoneTypes.HALF_PROGRESS,
          description: '50% progress milestone reached',
          timestamp: new Date().toISOString()
        });
      }

      if (progress >= 75 && !this.hasMilestone(assignment, this.milestoneTypes.THREE_QUARTER_PROGRESS)) {
        milestones.push({
          type: this.milestoneTypes.THREE_QUARTER_PROGRESS,
          description: '75% progress milestone reached',
          timestamp: new Date().toISOString()
        });
      }

      // Record new milestones
      for (const milestone of milestones) {
        await this.recordMilestone(assignmentId, milestone);
      }

      return milestones;
    } catch (error) {
      logger.warn('Failed to check and record milestones', { assignmentId, error });
      return [];
    }
  }

  async recordMilestone(assignmentId, milestoneData) {
    try {
      const response = await apiClient.post(
        ENDPOINTS.planAssignments.recordMilestone.replace(':assignmentId', assignmentId),
        milestoneData
      );

      logger.info('Milestone recorded', {
        assignmentId,
        milestoneType: milestoneData.type
      });

      return response.data;
    } catch (error) {
      logger.warn('Failed to record milestone', { assignmentId, milestoneData, error });
      return null;
    }
  }

  hasMilestone(assignment, milestoneType) {
    return assignment.milestones?.some(m => m.type === milestoneType) || false;
  }

  async scheduleAssignmentReminders(assignmentId, reminderData) {
    try {
      logger.info('Scheduling assignment reminders', { assignmentId });

      const response = await apiClient.post(
        ENDPOINTS.planAssignments.scheduleReminders.replace(':assignmentId', assignmentId),
        reminderData
      );

      return response.data;
    } catch (error) {
      logger.warn('Failed to schedule reminders', { assignmentId, error });
      return null;
    }
  }

  // Notification methods
  async notifyAssignmentCreated(assignmentId) {
    try {
      await apiClient.post(
        ENDPOINTS.planAssignments.notifyCreated.replace(':assignmentId', assignmentId)
      );
    } catch (error) {
      logger.warn('Failed to notify assignment created', { assignmentId, error });
    }
  }

  async notifyProgressUpdate(assignmentId, progressData) {
    try {
      await apiClient.post(
        ENDPOINTS.planAssignments.notifyProgress.replace(':assignmentId', assignmentId),
        { progressData: privacy.sanitizeForLogging(progressData) }
      );
    } catch (error) {
      logger.warn('Failed to notify progress update', { assignmentId, error });
    }
  }

  async notifyPlanModification(assignmentId, modifications, reason) {
    try {
      await apiClient.post(
        ENDPOINTS.planAssignments.notifyModification.replace(':assignmentId', assignmentId),
        { modifications: privacy.sanitizeForLogging(modifications), reason }
      );
    } catch (error) {
      logger.warn('Failed to notify plan modification', { assignmentId, error });
    }
  }

  async notifyReassignment(assignmentId, reassignmentData, reason) {
    try {
      await apiClient.post(
        ENDPOINTS.planAssignments.notifyReassignment.replace(':assignmentId', assignmentId),
        { reassignmentData: privacy.sanitizeForLogging(reassignmentData), reason }
      );
    } catch (error) {
      logger.warn('Failed to notify reassignment', { assignmentId, error });
    }
  }

  async notifyAssignmentCompleted(assignmentId, completionData) {
    try {
      await apiClient.post(
        ENDPOINTS.planAssignments.notifyCompleted.replace(':assignmentId', assignmentId),
        { completionData: privacy.sanitizeForLogging(completionData) }
      );
    } catch (error) {
      logger.warn('Failed to notify assignment completed', { assignmentId, error });
    }
  }

  setupProgressMonitoring() {
    // Check for overdue assignments every hour
    setInterval(async () => {
      try {
        await this.checkOverdueAssignments();
      } catch (error) {
        logger.error('Progress monitoring check failed', error);
      }
    }, 60 * 60 * 1000);
  }

  async checkOverdueAssignments() {
    try {
      logger.debug('Checking for overdue assignments');

      const response = await apiClient.post(ENDPOINTS.planAssignments.checkOverdue);

      const { overdueCount, notificationssent } = response.data;

      if (overdueCount > 0) {
        logger.info('Overdue assignments processed', { overdueCount, notificationsent });
      }

      return response.data;
    } catch (error) {
      logger.warn('Failed to check overdue assignments', error);
      return null;
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

      logger.debug('Plan assignment service cache invalidated', { tags, specificClientId });
    } catch (error) {
      logger.warn('Failed to invalidate cache', error);
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('assignments');
      cache.deleteByTag('plans');
      cache.deleteByTag('progress');
      logger.info('Plan assignment service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear plan assignment service cache', error);
    }
  }

  getStats() {
    return {
      service: 'PlanAssignmentService',
      initialized: this.isInitialized,
      cacheStats: {
        assignments: cache.getStatsByTag('assignments'),
        plans: cache.getStatsByTag('plans'),
        progress: cache.getStatsByTag('progress')
      },
      constants: {
        assignmentStates: this.assignmentStates,
        progressStates: this.progressStates,
        complianceStates: this.complianceStates,
        modificationTypes: this.modificationTypes,
        milestoneTypes: this.milestoneTypes,
        reportTypes: this.reportTypes,
        reminderTypes: this.reminderTypes
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const planAssignmentService = new PlanAssignmentService();

export const {
  assignPlan,
  getAssignment,
  updateProgress,
  modifyPlan,
  reassignPlan,
  getAssignments,
  generateComplianceReport,
  completeAssignment
} = planAssignmentService;

export default planAssignmentService;