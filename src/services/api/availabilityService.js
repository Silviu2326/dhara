import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { errorHandler } from '../utils/errorHandler';
import { privacy } from '../utils/privacy';
import { security } from '../utils/security';
import { auditService } from '../utils/auditService';

class AvailabilityService {
  constructor() {
    this.baseEndpoint = 'availability';
    this.cachePrefix = 'availability_';
    this.cacheTags = ['availability', 'schedule', 'calendar'];
    this.defaultCacheTTL = 600; // Longer cache for availability data
    this.isInitialized = false;

    this.recurrenceTypes = {
      NONE: 'none',
      DAILY: 'daily',
      WEEKLY: 'weekly',
      MONTHLY: 'monthly',
      YEARLY: 'yearly'
    };

    this.dayOfWeek = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 0
    };

    this.blockTypes = {
      AVAILABLE: 'available',
      UNAVAILABLE: 'unavailable',
      BUSY: 'busy',
      VACATION: 'vacation',
      SICK_LEAVE: 'sick_leave',
      PERSONAL: 'personal',
      TRAINING: 'training',
      MAINTENANCE: 'maintenance'
    };

    this.externalCalendarTypes = {
      GOOGLE: 'google_calendar',
      OUTLOOK: 'outlook',
      APPLE: 'apple_calendar',
      CALDAV: 'caldav'
    };

    this.syncStatus = {
      SYNCED: 'synced',
      PENDING: 'pending',
      ERROR: 'error',
      DISABLED: 'disabled'
    };

    this.conflictResolution = {
      EXTERNAL_PRIORITY: 'external_priority',
      LOCAL_PRIORITY: 'local_priority',
      MANUAL_REVIEW: 'manual_review',
      BLOCK_CONFLICTS: 'block_conflicts'
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing AvailabilityService');

      // Setup periodic sync with external calendars
      this.setupPeriodicSync();

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize AvailabilityService', error);
      throw error;
    }
  }

  async createTimeBlock(blockData, options = {}) {
    try {
      const {
        validateConflicts = true,
        createAuditLog = true,
        syncExternal = false,
        notifyChanges = false
      } = options;

      logger.info('Creating time block', {
        therapistId: blockData.therapistId,
        blockType: blockData.blockType,
        startTime: blockData.startTime,
        endTime: blockData.endTime,
        recurrence: blockData.recurrence
      });

      // Validate time block data
      this.validateTimeBlockData(blockData);

      // Check for conflicts if requested
      if (validateConflicts) {
        const conflicts = await this.checkTimeBlockConflicts(
          blockData.therapistId,
          blockData.startTime,
          blockData.endTime,
          blockData.locationId
        );

        if (conflicts.hasConflicts && blockData.blockType === this.blockTypes.AVAILABLE) {
          throw errorHandler.createConflictError(
            'Time block conflicts with existing schedule',
            conflicts.conflicts
          );
        }
      }

      let processedData = {
        ...blockData,
        blockId: security.generateSecureId('block_'),
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        version: 1
      };

      // Handle recurrence
      if (blockData.recurrence && blockData.recurrence !== this.recurrenceTypes.NONE) {
        processedData.recurrencePattern = this.generateRecurrencePattern(blockData.recurrence);
      }

      const response = await apiClient.post(
        ENDPOINTS.availability.createBlock,
        processedData
      );

      const timeBlock = response;

      // Sync with external calendars
      if (syncExternal) {
        await this.syncTimeBlockWithExternal(timeBlock, 'create');
      }

      // Notify about schedule changes
      if (notifyChanges) {
        await this.notifyScheduleChange(timeBlock.therapistId, {
          action: 'create',
          blockType: timeBlock.blockType,
          timeRange: {
            start: timeBlock.startTime,
            end: timeBlock.endTime
          }
        });
      }

      this.invalidateCache(['availability', 'schedule'], blockData.therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'time_block',
          entityId: timeBlock.id,
          action: 'create',
          details: {
            therapistId: blockData.therapistId,
            blockType: blockData.blockType,
            startTime: blockData.startTime,
            endTime: blockData.endTime,
            recurrence: blockData.recurrence
          },
          userId: blockData.createdBy || blockData.therapistId
        });
      }

      logger.info('Time block created successfully', {
        blockId: timeBlock.id,
        therapistId: blockData.therapistId
      });

      return timeBlock;
    } catch (error) {
      logger.error('Failed to create time block', error);
      throw errorHandler.handle(error);
    }
  }

  async getAvailability(therapistId, options = {}) {
    try {
      const {
        dateFrom = null,
        dateTo = null,
        locationId = null,
        includeRecurring = true,
        includeExceptions = true,
        timezone = 'UTC',
        granularity = 'hour' // 'hour', '30min', '15min'
      } = options;

      const params = {
        therapist_id: therapistId,
        date_from: dateFrom,
        date_to: dateTo,
        location_id: locationId,
        include_recurring: includeRecurring,
        include_exceptions: includeExceptions,
        timezone,
        granularity
      };

      const cacheKey = `${this.cachePrefix}${therapistId}_${security.generateHash(params)}`;
      let availability = cache.get(cacheKey);

      if (!availability) {
        logger.info('Fetching availability from API', { therapistId, params });

        const response = await apiClient.get(ENDPOINTS.availability.getByTherapist, { params });
        availability = response;
        // Handle nested data structure from backend
        if (availability.success && availability.data) {
          availability = availability.data;
        }
        cache.set(cacheKey, availability, this.defaultCacheTTL, this.cacheTags);
      }

      return availability;
    } catch (error) {
      logger.error('Failed to get availability', { therapistId, error });

      // Si no hay therapistId válido o hay problemas de conectividad/endpoints, devolver estructura vacía
      if (!therapistId || therapistId === 'current_therapist_id' ||
          error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
        logger.warn('Returning empty availability due to authentication/connectivity/endpoint issues');
        return {
          timeBlocks: [],
          exceptions: [],
          recurringPatterns: [],
          total: 0
        };
      }

      throw errorHandler.handle(error);
    }
  }

  async getTimeBlock(blockId, options = {}) {
    try {
      const { includeRecurrenceInstances = false } = options;

      const cacheKey = `${this.cachePrefix}block_${blockId}`;
      let timeBlock = cache.get(cacheKey);

      if (!timeBlock) {
        logger.info('Fetching time block from API', { blockId });

        const params = {
          include_recurrence_instances: includeRecurrenceInstances
        };

        const response = await apiClient.get(
          ENDPOINTS.availability.getBlockById.replace(':id', blockId),
          { params }
        );

        timeBlock = response;
        cache.set(cacheKey, timeBlock, this.defaultCacheTTL, this.cacheTags);
      }

      return timeBlock;
    } catch (error) {
      logger.error('Failed to get time block', { blockId, error });
      throw errorHandler.handle(error);
    }
  }

  async getTimeBlocksByTherapist(therapistId, options = {}) {
    try {
      const { startDate, endDate } = options;

      const params = {
        startDate,
        endDate
      };

      logger.info('Fetching time blocks by therapist', { therapistId, params });

      const url = ENDPOINTS.availability.getBlocksByTherapist.replace(':therapistId', therapistId);
      const response = await apiClient.get(url, { params });

      return response || [];
    } catch (error) {
      logger.error('Failed to get time blocks by therapist', { therapistId, error });
      
      // Return empty array if endpoint doesn't exist or there's an error
      if (error.response?.status === 404) {
        logger.warn('Time blocks endpoint not found, returning empty array');
        return [];
      }
      
      throw errorHandler.handle(error);
    }
  }

  async updateTimeBlock(blockId, updates, options = {}) {
    try {
      const {
        validateConflicts = true,
        updateRecurrence = 'this_only', // 'this_only', 'this_and_future', 'all'
        syncExternal = false,
        createAuditLog = true,
        incrementVersion = true
      } = options;

      logger.info('Updating time block', {
        blockId,
        updateKeys: Object.keys(updates),
        updateRecurrence
      });

      const currentBlock = await this.getTimeBlock(blockId);

      let processedUpdates = { ...updates };

      if (incrementVersion) {
        processedUpdates.version = (currentBlock.version || 1) + 1;
        processedUpdates.lastModifiedAt = new Date().toISOString();
      }

      // Validate conflicts for time changes
      if (validateConflicts && (updates.startTime || updates.endTime)) {
        const startTime = updates.startTime || currentBlock.startTime;
        const endTime = updates.endTime || currentBlock.endTime;

        const conflicts = await this.checkTimeBlockConflicts(
          currentBlock.therapistId,
          startTime,
          endTime,
          updates.locationId || currentBlock.locationId,
          blockId // Exclude current block from conflict check
        );

        if (conflicts.hasConflicts) {
          throw errorHandler.createConflictError(
            'Updated time block conflicts with existing schedule',
            conflicts.conflicts
          );
        }
      }

      // Handle recurrence updates
      if (updates.recurrence || updateRecurrence !== 'this_only') {
        processedUpdates.recurrenceUpdateType = updateRecurrence;

        if (updates.recurrence) {
          processedUpdates.recurrencePattern = this.generateRecurrencePattern(updates.recurrence);
        }
      }

      const response = await apiClient.put(
        ENDPOINTS.availability.updateBlock.replace(':id', blockId),
        processedUpdates
      );

      const updatedBlock = response;

      // Sync with external calendars
      if (syncExternal) {
        await this.syncTimeBlockWithExternal(updatedBlock, 'update');
      }

      this.invalidateCache(['availability', 'schedule'], currentBlock.therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'time_block',
          entityId: blockId,
          action: 'update',
          changes: processedUpdates,
          previousData: privacy.sanitizeForLogging(currentBlock),
          timestamp: new Date().toISOString(),
          userId: currentBlock.therapistId
        });
      }

      logger.info('Time block updated successfully', { blockId });

      return updatedBlock;
    } catch (error) {
      logger.error('Failed to update time block', { blockId, error });
      throw errorHandler.handle(error);
    }
  }

  async deleteTimeBlock(blockId, options = {}) {
    try {
      const {
        deleteRecurrence = 'this_only', // 'this_only', 'this_and_future', 'all'
        reason = 'user_request',
        syncExternal = false,
        createAuditLog = true
      } = options;

      logger.info('Deleting time block', { blockId, deleteRecurrence, reason });

      const timeBlock = await this.getTimeBlock(blockId);

      const deletionData = {
        recurrence_delete_type: deleteRecurrence,
        reason,
        deleted_at: new Date().toISOString()
      };

      const response = await apiClient.delete(
        ENDPOINTS.availability.deleteBlock.replace(':id', blockId),
        { data: deletionData }
      );

      // Sync with external calendars
      if (syncExternal) {
        await this.syncTimeBlockWithExternal(timeBlock, 'delete');
      }

      this.invalidateCache(['availability', 'schedule'], timeBlock.therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'delete',
          entityType: 'time_block',
          entityId: blockId,
          action: 'delete',
          details: {
            deleteRecurrence,
            reason,
            originalBlock: privacy.sanitizeForLogging(timeBlock)
          },
          userId: timeBlock.therapistId
        });
      }

      logger.info('Time block deleted successfully', { blockId });

      return response;
    } catch (error) {
      logger.error('Failed to delete time block', { blockId, error });
      throw errorHandler.handle(error);
    }
  }

  async createException(exceptionData, options = {}) {
    try {
      const {
        validateConflicts = true,
        createAuditLog = true,
        syncExternal = false
      } = options;

      logger.info('Creating availability exception', {
        therapistId: exceptionData.therapistId,
        date: exceptionData.date,
        exceptionType: exceptionData.exceptionType
      });

      let processedData = {
        ...exceptionData,
        exceptionId: security.generateSecureId('exception_'),
        createdAt: new Date().toISOString()
      };

      // Validate conflicts
      if (validateConflicts && exceptionData.exceptionType === 'unavailable') {
        const existingAppointments = await this.checkExistingAppointments(
          exceptionData.therapistId,
          exceptionData.date,
          exceptionData.startTime,
          exceptionData.endTime
        );

        if (existingAppointments.hasAppointments) {
          throw errorHandler.createConflictError(
            'Cannot create exception: existing appointments found',
            existingAppointments.appointments
          );
        }
      }

      const response = await apiClient.post(
        ENDPOINTS.availability.createException,
        processedData
      );

      const exception = response;

      // Sync with external calendars
      if (syncExternal) {
        await this.syncExceptionWithExternal(exception, 'create');
      }

      this.invalidateCache(['availability', 'schedule'], exceptionData.therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'availability_exception',
          entityId: exception.id,
          action: 'create',
          details: {
            therapistId: exceptionData.therapistId,
            date: exceptionData.date,
            exceptionType: exceptionData.exceptionType
          },
          userId: exceptionData.createdBy || exceptionData.therapistId
        });
      }

      logger.info('Exception created successfully', {
        exceptionId: exception.id,
        therapistId: exceptionData.therapistId
      });

      return exception;
    } catch (error) {
      logger.error('Failed to create exception', error);
      throw errorHandler.handle(error);
    }
  }

  async getExceptions(therapistId, options = {}) {
    try {
      const {
        dateFrom = null,
        dateTo = null,
        exceptionType = 'all',
        includeRecurring = false
      } = options;

      const params = {
        therapist_id: therapistId,
        date_from: dateFrom,
        date_to: dateTo,
        exception_type: exceptionType,
        include_recurring: includeRecurring
      };

      const cacheKey = `${this.cachePrefix}exceptions_${security.generateHash(params)}`;
      let exceptions = cache.get(cacheKey);

      if (!exceptions) {
        logger.info('Fetching exceptions from API', { therapistId, params });

        const response = await apiClient.get(ENDPOINTS.availability.getExceptions, { params });
        exceptions = response || [];
        cache.set(cacheKey, exceptions, this.defaultCacheTTL, this.cacheTags);
      }

      return exceptions;
    } catch (error) {
      logger.error('Failed to get exceptions', { therapistId, error });

      // Si no hay therapistId válido o hay problemas de conectividad/endpoints, devolver array vacío
      if (!therapistId || therapistId === 'current_therapist_id' ||
          error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
        logger.warn('Returning empty exceptions due to authentication/connectivity/endpoint issues');
        return [];
      }

      throw errorHandler.handle(error);
    }
  }

  async checkTimeBlockConflicts(therapistId, startTime, endTime, locationId = null, excludeBlockId = null) {
    try {
      const params = {
        therapist_id: therapistId,
        start_time: startTime,
        end_time: endTime,
        location_id: locationId,
        exclude_block_id: excludeBlockId
      };

      logger.info('Checking time block conflicts', params);

      const response = await apiClient.get(ENDPOINTS.availability.checkConflicts, { params });

      // El interceptor ya devuelve response.data, así que response ya contiene los datos
      return response;
    } catch (error) {
      logger.error('Failed to check time block conflicts', { therapistId, startTime, endTime, error });
      throw errorHandler.handle(error);
    }
  }

  async checkExistingAppointments(therapistId, date, startTime = null, endTime = null) {
    try {
      const params = {
        therapist_id: therapistId,
        date,
        start_time: startTime,
        end_time: endTime
      };

      logger.info('Checking existing appointments', params);

      const response = await apiClient.get(ENDPOINTS.availability.checkAppointments, { params });

      // El interceptor ya devuelve response.data, así que response ya contiene los datos
      return response;
    } catch (error) {
      logger.error('Failed to check existing appointments', { therapistId, date, error });
      throw errorHandler.handle(error);
    }
  }

  async syncWithExternalCalendar(therapistId, calendarConfig, options = {}) {
    try {
      const {
        syncDirection = 'bidirectional', // 'import_only', 'export_only', 'bidirectional'
        conflictResolution = this.conflictResolution.MANUAL_REVIEW,
        syncHistoryDays = 30,
        syncFutureDays = 90
      } = options;

      logger.info('Syncing with external calendar', {
        therapistId,
        calendarType: calendarConfig.type,
        syncDirection
      });

      const syncData = {
        therapist_id: therapistId,
        calendar_config: calendarConfig,
        sync_direction: syncDirection,
        conflict_resolution: conflictResolution,
        sync_history_days: syncHistoryDays,
        sync_future_days: syncFutureDays,
        sync_timestamp: new Date().toISOString()
      };

      const response = await apiClient.post(
        ENDPOINTS.availability.syncExternalCalendar,
        syncData
      );

      const syncResult = response;

      // Update cache to reflect changes
      this.invalidateCache(['availability', 'schedule'], therapistId);

      await auditService.logEvent({
        eventType: 'system_change',
        entityType: 'calendar_sync',
        entityId: `sync_${therapistId}`,
        action: 'external_sync',
        details: {
          therapistId,
          calendarType: calendarConfig.type,
          syncDirection,
          conflictsFound: syncResult.conflicts?.length || 0,
          itemsSynced: syncResult.syncedItems?.length || 0
        },
        userId: therapistId
      });

      logger.info('External calendar sync completed', {
        therapistId,
        syncStatus: syncResult.status,
        itemsSynced: syncResult.syncedItems?.length || 0,
        conflicts: syncResult.conflicts?.length || 0
      });

      return syncResult;
    } catch (error) {
      logger.error('Failed to sync with external calendar', { therapistId, error });
      throw errorHandler.handle(error);
    }
  }

  async getExternalCalendarStatus(therapistId) {
    try {
      logger.info('Getting external calendar status', { therapistId });

      const response = await apiClient.get(
        ENDPOINTS.availability.getExternalCalendarStatus.replace(':therapistId', therapistId)
      );

      let data = response;
      // Handle nested data structure from backend
      if (data.success && data.data) {
        data = data.data;
      }
      return data;
    } catch (error) {
      logger.error('Failed to get external calendar status', { therapistId, error });

      // Si no hay therapistId válido o hay problemas de conectividad/endpoints, devolver estado desconectado
      if (!therapistId || therapistId === 'current_therapist_id' ||
          error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
        logger.warn('Returning disconnected calendar status due to authentication/connectivity/endpoint issues');
        return {
          status: 'disconnected',
          provider: null,
          lastSync: null,
          conflicts: 0,
          isConfigured: false
        };
      }

      throw errorHandler.handle(error);
    }
  }

  async resolveConflicts(therapistId, conflicts, resolutions, options = {}) {
    try {
      const { createAuditLog = true } = options;

      logger.info('Resolving calendar conflicts', {
        therapistId,
        conflictCount: conflicts.length
      });

      const resolutionData = {
        therapist_id: therapistId,
        conflicts,
        resolutions,
        resolved_at: new Date().toISOString()
      };

      const response = await apiClient.post(
        ENDPOINTS.availability.resolveConflicts,
        resolutionData
      );

      const result = response;

      this.invalidateCache(['availability', 'schedule'], therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'calendar_conflict',
          entityId: `conflicts_${therapistId}`,
          action: 'resolve_conflicts',
          details: {
            therapistId,
            resolvedConflicts: result.resolvedConflicts?.length || 0,
            failedResolutions: result.failedResolutions?.length || 0
          },
          userId: therapistId
        });
      }

      logger.info('Conflicts resolved', {
        therapistId,
        resolved: result.resolvedConflicts?.length || 0,
        failed: result.failedResolutions?.length || 0
      });

      return result;
    } catch (error) {
      logger.error('Failed to resolve conflicts', { therapistId, error });
      throw errorHandler.handle(error);
    }
  }

  async generateAvailabilityReport(therapistId, options = {}) {
    try {
      const {
        dateFrom = null,
        dateTo = null,
        format = 'json',
        includeStatistics = true,
        includeUtilization = true,
        includeConflicts = true
      } = options;

      logger.info('Generating availability report', {
        therapistId,
        format,
        dateRange: { dateFrom, dateTo }
      });

      const params = {
        therapist_id: therapistId,
        date_from: dateFrom,
        date_to: dateTo,
        format,
        include_statistics: includeStatistics,
        include_utilization: includeUtilization,
        include_conflicts: includeConflicts
      };

      // Since the generateReport endpoint doesn't exist yet, return mock statistics
      const mockStats = {
        summary: {
          totalHours: 0,
          availableHours: 0,
          bookedHours: 0,
          utilizationRate: 0
        },
        weeklyOccupancy: [],
        periodSummary: {
          startDate: dateFrom,
          endDate: dateTo,
          totalDays: 0
        }
      };

      privacy.logDataAccess(
        therapistId,
        'availability_report',
        'generate',
        { format, dateRange: { dateFrom, dateTo } }
      );

      logger.info('Availability report generated successfully (mock)', { therapistId, format });

      return mockStats;
    } catch (error) {
      logger.error('Failed to generate availability report', { therapistId, format, error });
      throw errorHandler.handle(error);
    }
  }

  async bulkUpdateAvailability(therapistId, operations, options = {}) {
    try {
      const {
        validateConflicts = true,
        syncExternal = false,
        createAuditLog = true
      } = options;

      logger.info('Performing bulk availability update', {
        therapistId,
        operationCount: operations.length
      });

      const bulkData = {
        therapist_id: therapistId,
        operations,
        options: {
          validate_conflicts: validateConflicts,
          sync_external: syncExternal,
          create_audit_log: createAuditLog
        },
        timestamp: new Date().toISOString()
      };

      const response = await apiClient.post(
        ENDPOINTS.availability.bulkUpdate,
        bulkData
      );

      const result = response;

      this.invalidateCache(['availability', 'schedule'], therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'availability',
          entityId: `bulk_${therapistId}`,
          action: 'bulk_update',
          details: {
            therapistId,
            operationsCount: operations.length,
            successfulOperations: result.successful?.length || 0,
            failedOperations: result.failed?.length || 0
          },
          userId: therapistId
        });
      }

      logger.info('Bulk availability update completed', {
        therapistId,
        successful: result.successful?.length || 0,
        failed: result.failed?.length || 0
      });

      return result;
    } catch (error) {
      logger.error('Failed to perform bulk availability update', { therapistId, error });
      throw errorHandler.handle(error);
    }
  }

  validateTimeBlockData(blockData) {
    const requiredFields = ['therapistId', 'blockType', 'startTime', 'endTime'];

    for (const field of requiredFields) {
      if (!blockData[field]) {
        throw errorHandler.createValidationError(`Missing required field: ${field}`, blockData);
      }
    }

    // Validate time range
    const startTime = new Date(blockData.startTime);
    const endTime = new Date(blockData.endTime);

    if (startTime >= endTime) {
      throw errorHandler.createValidationError('Start time must be before end time', {
        startTime: blockData.startTime,
        endTime: blockData.endTime
      });
    }

    // Validate block type
    if (!Object.values(this.blockTypes).includes(blockData.blockType)) {
      throw errorHandler.createValidationError('Invalid block type', {
        provided: blockData.blockType,
        valid: Object.values(this.blockTypes)
      });
    }

    // Validate recurrence if provided
    if (blockData.recurrence && !Object.values(this.recurrenceTypes).includes(blockData.recurrence)) {
      throw errorHandler.createValidationError('Invalid recurrence type', {
        provided: blockData.recurrence,
        valid: Object.values(this.recurrenceTypes)
      });
    }

    return true;
  }

  generateRecurrencePattern(recurrenceType) {
    const patterns = {
      [this.recurrenceTypes.DAILY]: { freq: 'DAILY', interval: 1 },
      [this.recurrenceTypes.WEEKLY]: { freq: 'WEEKLY', interval: 1 },
      [this.recurrenceTypes.MONTHLY]: { freq: 'MONTHLY', interval: 1 },
      [this.recurrenceTypes.YEARLY]: { freq: 'YEARLY', interval: 1 }
    };

    return patterns[recurrenceType] || null;
  }

  async syncTimeBlockWithExternal(timeBlock, action) {
    try {
      logger.info('Syncing time block with external calendar', {
        blockId: timeBlock.id,
        action
      });

      const syncData = {
        time_block: timeBlock,
        action, // 'create', 'update', 'delete'
        timestamp: new Date().toISOString()
      };

      const response = await apiClient.post(
        ENDPOINTS.availability.syncTimeBlockExternal,
        syncData
      );

      return response;
    } catch (error) {
      logger.warn('Failed to sync time block with external calendar', {
        blockId: timeBlock.id,
        action,
        error: error.message
      });
      return null;
    }
  }

  async syncExceptionWithExternal(exception, action) {
    try {
      logger.info('Syncing exception with external calendar', {
        exceptionId: exception.id,
        action
      });

      const syncData = {
        exception,
        action, // 'create', 'update', 'delete'
        timestamp: new Date().toISOString()
      };

      const response = await apiClient.post(
        ENDPOINTS.availability.syncExceptionExternal,
        syncData
      );

      return response;
    } catch (error) {
      logger.warn('Failed to sync exception with external calendar', {
        exceptionId: exception.id,
        action,
        error: error.message
      });
      return null;
    }
  }

  async notifyScheduleChange(therapistId, changeData) {
    try {
      logger.info('Notifying schedule change', { therapistId, changeData });

      const notificationData = {
        therapist_id: therapistId,
        change_data: changeData,
        timestamp: new Date().toISOString()
      };

      const response = await apiClient.post(
        ENDPOINTS.availability.notifyScheduleChange,
        notificationData
      );

      return response;
    } catch (error) {
      logger.warn('Failed to notify schedule change', { therapistId, error });
      return null;
    }
  }

  setupPeriodicSync() {
    // Setup sync every 30 minutes
    setInterval(async () => {
      try {
        await this.performPeriodicSync();
      } catch (error) {
        logger.error('Periodic sync failed', error);
      }
    }, 30 * 60 * 1000);
  }

  async performPeriodicSync() {
    try {
      logger.debug('Performing periodic external calendar sync');

      const response = await apiClient.post(ENDPOINTS.availability.performPeriodicSync);

      const { syncedTherapists, errorCount } = response;

      if (syncedTherapists > 0) {
        logger.info('Periodic sync completed', { syncedTherapists, errorCount });
      }

      return response;
    } catch (error) {
      logger.warn('Failed to perform periodic sync', error);
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

      logger.debug('Availability service cache invalidated', { tags, specificTherapistId });
    } catch (error) {
      logger.warn('Failed to invalidate cache', error);
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('availability');
      cache.deleteByTag('schedule');
      logger.info('Availability service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear availability service cache', error);
    }
  }

  getStats() {
    return {
      service: 'AvailabilityService',
      initialized: this.isInitialized,
      cacheStats: {
        availability: cache.getStatsByTag('availability'),
        schedule: cache.getStatsByTag('schedule')
      },
      constants: {
        recurrenceTypes: this.recurrenceTypes,
        dayOfWeek: this.dayOfWeek,
        blockTypes: this.blockTypes,
        externalCalendarTypes: this.externalCalendarTypes,
        syncStatus: this.syncStatus,
        conflictResolution: this.conflictResolution
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const availabilityService = new AvailabilityService();

export const {
  createTimeBlock,
  getAvailability,
  getTimeBlock,
  getTimeBlocksByTherapist,
  updateTimeBlock,
  deleteTimeBlock,
  createException,
  getExceptions,
  syncWithExternalCalendar,
  resolveConflicts,
  generateAvailabilityReport,
  bulkUpdateAvailability
} = availabilityService;

export default availabilityService;