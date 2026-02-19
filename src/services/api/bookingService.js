import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { errorHandler } from '../utils/errorHandler';
import { privacy } from '../utils/privacy';
import { security } from '../utils/security';
import { auditService } from '../utils/auditService';

class BookingService {
  constructor() {
    this.baseEndpoint = 'bookings';
    this.cachePrefix = 'booking_';
    this.cacheTags = ['bookings', 'appointments', 'calendar'];
    this.defaultCacheTTL = 300;
    this.isInitialized = false;

    this.appointmentStates = {
      SCHEDULED: 'scheduled',
      CONFIRMED: 'confirmed',
      UPCOMING: 'upcoming',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      NO_SHOW: 'no_show',
      RESCHEDULED: 'rescheduled'
    };

    this.appointmentTypes = {
      INITIAL_CONSULTATION: 'initial_consultation',
      FOLLOW_UP: 'follow_up',
      THERAPY_SESSION: 'therapy_session',
      GROUP_SESSION: 'group_session',
      ASSESSMENT: 'assessment',
      EMERGENCY: 'emergency',
      VIRTUAL: 'virtual',
      IN_PERSON: 'in_person'
    };

    this.reminderTypes = {
      SMS: 'sms',
      EMAIL: 'email',
      PUSH: 'push_notification',
      CALL: 'phone_call'
    };

    this.reminderTiming = {
      '24_HOURS': 24 * 60,      // 24 hours in minutes
      '2_HOURS': 2 * 60,        // 2 hours in minutes
      '30_MINUTES': 30,         // 30 minutes
      '15_MINUTES': 15          // 15 minutes
    };

    this.exportFormats = {
      ICAL: 'ical',
      GOOGLE: 'google_calendar',
      OUTLOOK: 'outlook',
      CSV: 'csv',
      PDF: 'pdf'
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing BookingService');

      // Setup reminder scheduling
      this.setupReminderScheduling();

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize BookingService', error);
      throw error;
    }
  }

  async createAppointment(appointmentData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validateAvailability = true,
        sendConfirmation = true,
        createReminders = true,
        syncExternalCalendar = false,
        requireConsentValidation = true
      } = options;

      logger.info('Creating appointment', {
        clientId: appointmentData.clientId,
        therapistId: appointmentData.therapistId,
        dateTime: appointmentData.dateTime,
        type: appointmentData.type,
        duration: appointmentData.duration
      });

      if (requireConsentValidation && appointmentData.clientId) {
        const consentValidation = privacy.validateConsentToken(
          appointmentData.consentToken,
          ['appointments', 'scheduling', 'notifications']
        );

        if (!consentValidation.isValid) {
          throw errorHandler.createAuthError(
            'Valid consent required for appointment booking',
            consentValidation
          );
        }
      }

      // Validate availability if requested
      if (validateAvailability) {
        const availability = await this.checkAvailability(
          appointmentData.therapistId,
          appointmentData.dateTime,
          appointmentData.duration,
          appointmentData.locationId
        );

        if (!availability.available) {
          throw errorHandler.createConflictError(
            'Time slot not available',
            availability.conflicts
          );
        }
      }

      let processedData = {
        ...appointmentData,
        appointmentId: security.generateSecureId('apt_'),
        status: this.appointmentStates.SCHEDULED,
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        confirmationCode: security.generateSecureId('conf_'),
        version: 1
      };

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          appointmentData.clientId,
          processedData.appointmentId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.appointmentId;
      }

      const sanitizedData = privacy.sanitizeForLogging(processedData);
      logger.info('Creating appointment with sanitized data', { data: sanitizedData });

      const response = await apiClient.post(
        ENDPOINTS.bookings.create,
        processedData
      );

      const appointment = response.data;

      // Create automatic reminders
      if (createReminders) {
        await this.scheduleReminders(appointment.id, appointmentData.dateTime, {
          clientId: appointmentData.clientId,
          reminderTypes: appointmentData.reminderPreferences || ['email']
        });
      }

      // Send confirmation
      if (sendConfirmation) {
        await this.sendAppointmentConfirmation(appointment.id);
      }

      // Sync with external calendar
      if (syncExternalCalendar && appointmentData.externalCalendarConfig) {
        await this.syncWithExternalCalendar(appointment, 'create');
      }

      this.invalidateCache(['bookings', 'appointments'], appointmentData.therapistId);

      // Audit log
      await auditService.logEvent({
        eventType: 'create',
        entityType: 'appointment',
        entityId: appointment.id,
        action: 'create',
        details: {
          clientId: appointmentData.clientId,
          therapistId: appointmentData.therapistId,
          dateTime: appointmentData.dateTime,
          type: appointmentData.type
        },
        userId: appointmentData.createdBy || appointmentData.therapistId
      });

      privacy.logDataAccess(
        appointmentData.clientId,
        'appointment',
        'create',
        { appointmentId: appointment.id }
      );

      logger.info('Appointment created successfully', {
        appointmentId: appointment.id,
        confirmationCode: appointment.confirmationCode
      });

      return appointment;
    } catch (error) {
      logger.error('Failed to create appointment', error);
      throw errorHandler.handle(error);
    }
  }

  async getAppointment(appointmentId, options = {}) {
    try {
      const {
        decryptSensitiveData = true,
        includeHistory = false,
        includeReminders = false,
        validateAccess = true
      } = options;

      const cacheKey = `${this.cachePrefix}${appointmentId}`;
      let appointment = cache.get(cacheKey);

      if (!appointment) {
        logger.info('Fetching appointment from API', { appointmentId });

        const params = {
          include_history: includeHistory,
          include_reminders: includeReminders
        };

        const response = await apiClient.get(
          ENDPOINTS.bookings.getById.replace(':id', appointmentId),
          { params }
        );

        appointment = response.data;
        cache.set(cacheKey, appointment, this.defaultCacheTTL, this.cacheTags);
      }

      if (decryptSensitiveData && appointment._encryptionKeyId) {
        try {
          const encryptionKey = await privacy.generateEncryptionKey(
            appointment.clientId,
            appointment._encryptionKeyId
          );
          appointment = await privacy.decryptSensitiveData(appointment, encryptionKey);
        } catch (decryptError) {
          logger.warn('Failed to decrypt appointment data', {
            appointmentId,
            error: decryptError.message
          });
        }
      }

      privacy.logDataAccess(
        appointment.clientId,
        'appointment',
        'read',
        { appointmentId }
      );

      return appointment;
    } catch (error) {
      logger.error('Failed to get appointment', { appointmentId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateAppointment(appointmentId, updates, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        notifyParties = true,
        syncExternalCalendar = false,
        createAuditLog = true,
        incrementVersion = true
      } = options;

      logger.info('Updating appointment', {
        appointmentId,
        updateKeys: Object.keys(updates)
      });

      const currentAppointment = await this.getAppointment(appointmentId, { decryptSensitiveData: false });

      let processedUpdates = { ...updates };

      if (incrementVersion) {
        processedUpdates.version = (currentAppointment.version || 1) + 1;
        processedUpdates.lastModifiedAt = new Date().toISOString();
      }

      // Check if this is a reschedule
      const isReschedule = updates.dateTime && updates.dateTime !== currentAppointment.dateTime;

      if (isReschedule) {
        // Validate new time availability
        const availability = await this.checkAvailability(
          currentAppointment.therapistId,
          updates.dateTime,
          updates.duration || currentAppointment.duration,
          updates.locationId || currentAppointment.locationId
        );

        if (!availability.available) {
          throw errorHandler.createConflictError(
            'New time slot not available',
            availability.conflicts
          );
        }

        processedUpdates.status = this.appointmentStates.RESCHEDULED;
        processedUpdates.previousDateTime = currentAppointment.dateTime;
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          currentAppointment.clientId,
          currentAppointment._encryptionKeyId || appointmentId
        );

        processedUpdates = await privacy.encryptSensitiveData(processedUpdates, encryptionKey);
      }

      if (createAuditLog) {
        const auditData = {
          entityType: 'appointment',
          entityId: appointmentId,
          action: isReschedule ? 'reschedule' : 'update',
          changes: processedUpdates,
          previousData: privacy.sanitizeForLogging(currentAppointment),
          timestamp: new Date().toISOString(),
          clientId: currentAppointment.clientId,
          therapistId: currentAppointment.therapistId
        };

        await auditService.logEvent({
          eventType: 'update',
          ...auditData
        });
      }

      const response = await apiClient.put(
        ENDPOINTS.bookings.update.replace(':id', appointmentId),
        processedUpdates
      );

      const updatedAppointment = response.data;

      // Handle rescheduling specific actions
      if (isReschedule) {
        // Cancel old reminders and create new ones
        await this.cancelReminders(appointmentId);
        await this.scheduleReminders(appointmentId, updates.dateTime, {
          clientId: currentAppointment.clientId,
          reminderTypes: currentAppointment.reminderPreferences || ['email']
        });

        // Notify parties about reschedule
        if (notifyParties) {
          await this.sendRescheduleNotification(appointmentId, {
            oldDateTime: currentAppointment.dateTime,
            newDateTime: updates.dateTime
          });
        }
      }

      // Sync with external calendar
      if (syncExternalCalendar) {
        await this.syncWithExternalCalendar(updatedAppointment, 'update');
      }

      this.invalidateCache(['bookings', 'appointments'], currentAppointment.therapistId);

      privacy.logDataAccess(
        currentAppointment.clientId,
        'appointment',
        'update',
        { appointmentId, changes: Object.keys(updates) }
      );

      logger.info('Appointment updated successfully', { appointmentId });

      return updatedAppointment;
    } catch (error) {
      logger.error('Failed to update appointment', { appointmentId, error });
      throw errorHandler.handle(error);
    }
  }

  async cancelAppointment(appointmentId, options = {}) {
    try {
      const {
        reason = 'client_request',
        notifyParties = true,
        cancelReminders = true,
        refundAmount = null,
        createAuditLog = true
      } = options;

      logger.info('Cancelling appointment', { appointmentId, reason });

      const appointment = await this.getAppointment(appointmentId, { decryptSensitiveData: false });

      const cancellationData = {
        status: this.appointmentStates.CANCELLED,
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
        refundAmount,
        lastModifiedAt: new Date().toISOString(),
        version: (appointment.version || 1) + 1
      };

      const response = await apiClient.patch(
        ENDPOINTS.bookings.cancel.replace(':id', appointmentId),
        cancellationData
      );

      const cancelledAppointment = response.data;

      // Cancel reminders
      if (cancelReminders) {
        await this.cancelReminders(appointmentId);
      }

      // Notify parties
      if (notifyParties) {
        await this.sendCancellationNotification(appointmentId, reason);
      }

      // Sync with external calendar
      await this.syncWithExternalCalendar(cancelledAppointment, 'cancel');

      this.invalidateCache(['bookings', 'appointments'], appointment.therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'appointment',
          entityId: appointmentId,
          action: 'cancel',
          details: {
            reason,
            refundAmount,
            originalDateTime: appointment.dateTime
          },
          userId: appointment.therapistId,
          severity: 'medium'
        });
      }

      privacy.logDataAccess(
        appointment.clientId,
        'appointment',
        'cancel',
        { appointmentId, reason }
      );

      logger.info('Appointment cancelled successfully', { appointmentId });

      return cancelledAppointment;
    } catch (error) {
      logger.error('Failed to cancel appointment', { appointmentId, error });
      throw errorHandler.handle(error);
    }
  }

  async getAppointments(filters = {}, options = {}) {
    try {
      const {
        therapistId = null,
        clientId = null,
        dateFrom = null,
        dateTo = null,
        status = 'all',
        type = 'all',
        locationId = null,
        page = 1,
        limit = 20,
        sortBy = 'dateTime',
        sortOrder = 'asc',
        includeStatistics = false,
        decryptSensitiveData = false
      } = { ...filters, ...options };

      // Filtrar parámetros nulos para evitar enviar valores undefined
      const params = {};
      if (therapistId) params.therapistId = therapistId;
      if (clientId) params.clientId = clientId;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      if (status && status !== 'all') params.status = status;
      if (type && type !== 'all') params.therapyType = type;
      params.page = page;
      params.limit = limit;
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;

      const cacheKey = `${this.cachePrefix}list_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        logger.info('Fetching appointments from API', { filters: params });

        response = await apiClient.get(ENDPOINTS.BOOKINGS.LIST, { params });
        let responseData = response.data || response;
        // Handle nested data structure from backend
        if (responseData.success && responseData.data !== undefined) {
          responseData = responseData.data;
        }
        cache.set(cacheKey, responseData, this.defaultCacheTTL, this.cacheTags);
        response = { data: responseData };
      } else {
        response = { data: response };
      }

      let appointments = response.data.data || response.data.appointments || response.data;

      // Debug: Log the received data structure
      console.log('🔍 BookingService.getAppointments - Raw response data:', {
        responseData: response.data,
        appointments: appointments,
        appointmentsLength: Array.isArray(appointments) ? appointments.length : 'not array',
        firstAppointment: Array.isArray(appointments) && appointments.length > 0 ? appointments[0] : null,
        filters: filters
      });

      if (decryptSensitiveData) {
        appointments = await Promise.all(
          appointments.map(async (appointment) => {
            if (appointment._encryptionKeyId) {
              try {
                const encryptionKey = await privacy.generateEncryptionKey(
                  appointment.clientId,
                  appointment._encryptionKeyId
                );
                return await privacy.decryptSensitiveData(appointment, encryptionKey);
              } catch (error) {
                logger.warn('Failed to decrypt appointment data', {
                  appointmentId: appointment.id,
                  error: error.message
                });
                return appointment;
              }
            }
            return appointment;
          })
        );
      }

      logger.info('Appointments retrieved successfully', {
        count: appointments.length,
        page,
        hasMore: response.data.hasMore
      });

      return {
        appointments,
        pagination: {
          page,
          limit,
          total: response.data.pagination?.totalItems || appointments.length,
          hasMore: response.data.pagination?.hasNextPage || false,
          totalPages: response.data.pagination?.totalPages || 1
        },
        filters: params,
        statistics: response.data.statistics || null
      };
    } catch (error) {
      logger.error('Failed to get appointments', { filters, error });

      // Return empty result for missing endpoints or authentication issues
      if (error.response?.status === 404 || error.response?.status === 401 || error.response?.status === 403) {
        logger.warn('Returning empty appointments due to endpoint/authentication issues');
        return {
          appointments: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            hasMore: false
          },
          filters: {},
          statistics: null
        };
      }

      throw errorHandler.handle(error);
    }
  }

  async getCalendarView(therapistId, viewType, date, options = {}) {
    try {
      const {
        includeAvailability = true,
        includeBlocked = false,
        timezone = 'UTC',
        decryptSensitiveData = false
      } = options;

      logger.info('Getting calendar view', {
        therapistId,
        viewType,
        date,
        timezone
      });

      const params = {
        therapist_id: therapistId,
        view_type: viewType, // 'day', 'week', 'month'
        date,
        include_availability: includeAvailability,
        include_blocked: includeBlocked,
        timezone
      };

      const cacheKey = `${this.cachePrefix}calendar_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        response = await apiClient.get(ENDPOINTS.bookings.getCalendarView, { params });
        cache.set(cacheKey, response.data, 300, [...this.cacheTags, 'calendar']);
      } else {
        response = { data: response };
      }

      let calendarData = response.data;

      if (decryptSensitiveData && calendarData.appointments) {
        calendarData.appointments = await Promise.all(
          calendarData.appointments.map(async (appointment) => {
            if (appointment._encryptionKeyId) {
              try {
                const encryptionKey = await privacy.generateEncryptionKey(
                  appointment.clientId,
                  appointment._encryptionKeyId
                );
                return await privacy.decryptSensitiveData(appointment, encryptionKey);
              } catch (error) {
                logger.warn('Failed to decrypt calendar appointment', {
                  appointmentId: appointment.id,
                  error: error.message
                });
                return appointment;
              }
            }
            return appointment;
          })
        );
      }

      return calendarData;
    } catch (error) {
      logger.error('Failed to get calendar view', { therapistId, viewType, date, error });
      throw errorHandler.handle(error);
    }
  }

  async checkAvailability(therapistId, dateTime, duration, locationId = null, options = {}) {
    try {
      const {
        includeReasons = true,
        timezone = 'UTC'
      } = options;

      const params = {
        therapist_id: therapistId,
        date_time: dateTime,
        duration,
        location_id: locationId,
        include_reasons: includeReasons,
        timezone
      };

      logger.info('Checking availability', params);

      const response = await apiClient.get(ENDPOINTS.bookings.checkAvailability, { params });

      return response.data;
    } catch (error) {
      logger.error('Failed to check availability', { therapistId, dateTime, error });
      throw errorHandler.handle(error);
    }
  }

  async scheduleReminders(appointmentId, appointmentDateTime, options = {}) {
    try {
      const {
        clientId,
        reminderTypes = ['email'],
        customTiming = null
      } = options;

      logger.info('Scheduling reminders', {
        appointmentId,
        appointmentDateTime,
        reminderTypes
      });

      const timing = customTiming || [
        this.reminderTiming['24_HOURS'],
        this.reminderTiming['2_HOURS']
      ];

      const reminderData = {
        appointment_id: appointmentId,
        client_id: clientId,
        appointment_date_time: appointmentDateTime,
        reminder_types: reminderTypes,
        reminder_timing: timing
      };

      const response = await apiClient.post(
        ENDPOINTS.bookings.scheduleReminders.replace(':appointmentId', appointmentId),
        reminderData
      );

      logger.info('Reminders scheduled successfully', {
        appointmentId,
        reminderCount: response.data.scheduledReminders?.length || 0
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to schedule reminders', { appointmentId, error });
      // Don't throw here as reminders are not critical for booking
      return null;
    }
  }

  async cancelReminders(appointmentId) {
    try {
      logger.info('Cancelling reminders', { appointmentId });

      await apiClient.delete(
        ENDPOINTS.bookings.cancelReminders.replace(':appointmentId', appointmentId)
      );

      logger.info('Reminders cancelled successfully', { appointmentId });
    } catch (error) {
      logger.warn('Failed to cancel reminders', { appointmentId, error });
    }
  }

  async sendAppointmentConfirmation(appointmentId) {
    try {
      logger.info('Sending appointment confirmation', { appointmentId });

      const response = await apiClient.post(
        ENDPOINTS.bookings.sendConfirmation.replace(':appointmentId', appointmentId)
      );

      return response.data;
    } catch (error) {
      logger.warn('Failed to send confirmation', { appointmentId, error });
      return null;
    }
  }

  async sendRescheduleNotification(appointmentId, scheduleData) {
    try {
      logger.info('Sending reschedule notification', { appointmentId });

      const response = await apiClient.post(
        ENDPOINTS.bookings.sendRescheduleNotification.replace(':appointmentId', appointmentId),
        scheduleData
      );

      return response.data;
    } catch (error) {
      logger.warn('Failed to send reschedule notification', { appointmentId, error });
      return null;
    }
  }

  async sendCancellationNotification(appointmentId, reason) {
    try {
      logger.info('Sending cancellation notification', { appointmentId, reason });

      const response = await apiClient.post(
        ENDPOINTS.bookings.sendCancellationNotification.replace(':appointmentId', appointmentId),
        { reason }
      );

      return response.data;
    } catch (error) {
      logger.warn('Failed to send cancellation notification', { appointmentId, error });
      return null;
    }
  }

  async getAppointmentStatistics(therapistId, options = {}) {
    try {
      console.log('🔍 [BOOKING SERVICE] getAppointmentStatistics called');
      console.log('  - therapistId:', therapistId);
      console.log('  - options:', options);

      const {
        dateFrom = null,
        dateTo = null,
        groupBy = 'day', // 'day', 'week', 'month'
        includeRevenue = true,
        includeNoShows = true,
        includeCancellations = true
      } = options;

      const params = {
        therapist_id: therapistId,
        date_from: dateFrom,
        date_to: dateTo,
        group_by: groupBy,
        include_revenue: includeRevenue,
        include_no_shows: includeNoShows,
        include_cancellations: includeCancellations
      };

      console.log('📋 [BOOKING SERVICE] Prepared params:', params);

      const cacheKey = `${this.cachePrefix}stats_${security.generateHash(params)}`;
      let stats = cache.get(cacheKey);

      if (!stats) {
        console.log('🌐 [BOOKING SERVICE] Making HTTP request to:', ENDPOINTS.BOOKINGS.STATISTICS);
        logger.info('Fetching appointment statistics', params);

        const response = await apiClient.get(ENDPOINTS.BOOKINGS.STATISTICS, { params });
        console.log('✅ [BOOKING SERVICE] API response received:', response);
        stats = response.data;
        cache.set(cacheKey, stats, 600, [...this.cacheTags, 'statistics']);
      } else {
        console.log('💾 [BOOKING SERVICE] Using cached data');
      }

      console.log('📊 [BOOKING SERVICE] Returning stats:', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to get appointment statistics', { therapistId, error });
      throw errorHandler.handle(error);
    }
  }

  async exportCalendar(therapistId, format, options = {}) {
    try {
      const {
        dateFrom = null,
        dateTo = null,
        includePrivateInfo = false,
        timezone = 'UTC'
      } = options;

      logger.info('Exporting calendar', {
        therapistId,
        format,
        dateRange: { dateFrom, dateTo }
      });

      const params = {
        therapist_id: therapistId,
        format,
        date_from: dateFrom,
        date_to: dateTo,
        include_private_info: includePrivateInfo,
        timezone
      };

      const response = await apiClient.get(ENDPOINTS.bookings.exportCalendar, {
        params,
        responseType: format === 'pdf' ? 'blob' : 'text'
      });

      privacy.logDataAccess(
        therapistId,
        'calendar_export',
        'export',
        { format, dateRange: { dateFrom, dateTo } }
      );

      logger.info('Calendar exported successfully', { therapistId, format });

      return response.data;
    } catch (error) {
      logger.error('Failed to export calendar', { therapistId, format, error });
      throw errorHandler.handle(error);
    }
  }

  async syncWithExternalCalendar(appointment, action = 'create') {
    try {
      logger.info('Syncing with external calendar', {
        appointmentId: appointment.id,
        action
      });

      const syncData = {
        appointment,
        action, // 'create', 'update', 'cancel'
        timestamp: new Date().toISOString()
      };

      const response = await apiClient.post(
        ENDPOINTS.bookings.syncExternalCalendar,
        syncData
      );

      return response.data;
    } catch (error) {
      logger.warn('Failed to sync with external calendar', {
        appointmentId: appointment.id,
        action,
        error: error.message
      });
      return null;
    }
  }

  async bulkOperations(operation, appointmentIds, data = {}, options = {}) {
    try {
      const {
        notifyParties = false,
        createAuditLog = true,
        batchSize = 25
      } = options;

      logger.info('Performing bulk appointment operations', {
        operation,
        appointmentCount: appointmentIds.length,
        batchSize
      });

      if (appointmentIds.length > batchSize) {
        const batches = [];
        for (let i = 0; i < appointmentIds.length; i += batchSize) {
          batches.push(appointmentIds.slice(i, i + batchSize));
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
        appointment_ids: appointmentIds,
        data,
        options: {
          notify_parties: notifyParties,
          create_audit_log: createAuditLog
        }
      };

      const response = await apiClient.post(ENDPOINTS.bookings.bulkOperations, payload);

      this.invalidateCache(['bookings', 'appointments']);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'appointment',
          entityId: 'bulk_operation',
          action: `bulk_${operation}`,
          details: {
            operation,
            appointmentIds,
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

  setupReminderScheduling() {
    // Setup periodic reminder checking every 5 minutes
    setInterval(async () => {
      try {
        await this.processPendingReminders();
      } catch (error) {
        logger.error('Failed to process pending reminders', error);
      }
    }, 5 * 60 * 1000);
  }

  async processPendingReminders() {
    try {
      logger.debug('Processing pending reminders');

      const response = await apiClient.post(ENDPOINTS.bookings.processPendingReminders);

      const { processedCount, errorCount } = response.data;

      if (processedCount > 0) {
        logger.info('Reminders processed', { processedCount, errorCount });
      }

      return response.data;
    } catch (error) {
      logger.warn('Failed to process pending reminders', error);
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

      logger.debug('Booking service cache invalidated', { tags, specificTherapistId });
    } catch (error) {
      logger.warn('Failed to invalidate cache', error);
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('bookings');
      cache.deleteByTag('appointments');
      cache.deleteByTag('calendar');
      logger.info('Booking service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear booking service cache', error);
    }
  }

  getStats() {
    return {
      service: 'BookingService',
      initialized: this.isInitialized,
      cacheStats: {
        bookings: cache.getStatsByTag('bookings'),
        appointments: cache.getStatsByTag('appointments'),
        calendar: cache.getStatsByTag('calendar')
      },
      constants: {
        appointmentStates: this.appointmentStates,
        appointmentTypes: this.appointmentTypes,
        reminderTypes: this.reminderTypes,
        reminderTiming: this.reminderTiming,
        exportFormats: this.exportFormats
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const bookingService = new BookingService();

export const {
  createAppointment,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  getAppointments,
  getCalendarView,
  checkAvailability,
  getAppointmentStatistics,
  exportCalendar,
  bulkOperations
} = bookingService;

export default bookingService;