import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { errorHandler } from '../utils/errorHandler';
import { privacy } from '../utils/privacy';
import { security } from '../utils/security';
import { auditService } from '../utils/auditService';

class NotificationSettingsService {
  constructor() {
    this.baseEndpoint = 'notification-settings';
    this.cachePrefix = 'notif_settings_';
    this.cacheTags = ['notification-settings', 'preferences'];
    this.defaultCacheTTL = 900; // 15 minutes for settings
    this.isInitialized = false;

    this.deliveryChannels = {
      IN_APP: 'in_app',
      EMAIL: 'email',
      SMS: 'sms',
      PUSH: 'push',
      WEBHOOK: 'webhook'
    };

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

    this.frequencies = {
      IMMEDIATE: 'immediate',
      HOURLY: 'hourly',
      DAILY: 'daily',
      WEEKLY: 'weekly',
      NEVER: 'never'
    };

    this.priorityFilters = {
      ALL: 'all',
      HIGH_ONLY: 'high_only',
      CRITICAL_ONLY: 'critical_only',
      NONE: 'none'
    };

    this.quietModes = {
      DISABLED: 'disabled',
      NIGHT_HOURS: 'night_hours',
      CUSTOM_SCHEDULE: 'custom_schedule',
      DO_NOT_DISTURB: 'do_not_disturb'
    };

    this.groupingOptions = {
      INDIVIDUAL: 'individual',
      BY_TYPE: 'by_type',
      BY_SENDER: 'by_sender',
      DIGEST: 'digest'
    };

    this.defaultSettings = {
      [this.notificationTypes.APPOINTMENT]: {
        enabled: true,
        channels: [this.deliveryChannels.IN_APP, this.deliveryChannels.EMAIL, this.deliveryChannels.PUSH],
        frequency: this.frequencies.IMMEDIATE,
        priorityFilter: this.priorityFilters.ALL,
        grouping: this.groupingOptions.INDIVIDUAL,
        customTiming: {
          enabled: false,
          reminders: [24 * 60, 2 * 60, 15] // 24h, 2h, 15min before
        }
      },
      [this.notificationTypes.MESSAGE]: {
        enabled: true,
        channels: [this.deliveryChannels.IN_APP, this.deliveryChannels.PUSH],
        frequency: this.frequencies.IMMEDIATE,
        priorityFilter: this.priorityFilters.ALL,
        grouping: this.groupingOptions.BY_SENDER,
        customTiming: { enabled: false }
      },
      [this.notificationTypes.PAYMENT]: {
        enabled: true,
        channels: [this.deliveryChannels.IN_APP, this.deliveryChannels.EMAIL],
        frequency: this.frequencies.IMMEDIATE,
        priorityFilter: this.priorityFilters.HIGH_ONLY,
        grouping: this.groupingOptions.BY_TYPE,
        customTiming: { enabled: false }
      },
      [this.notificationTypes.SYSTEM]: {
        enabled: true,
        channels: [this.deliveryChannels.IN_APP],
        frequency: this.frequencies.DAILY,
        priorityFilter: this.priorityFilters.HIGH_ONLY,
        grouping: this.groupingOptions.DIGEST,
        customTiming: { enabled: false }
      },
      [this.notificationTypes.EMERGENCY]: {
        enabled: true,
        channels: [this.deliveryChannels.IN_APP, this.deliveryChannels.EMAIL, this.deliveryChannels.SMS, this.deliveryChannels.PUSH],
        frequency: this.frequencies.IMMEDIATE,
        priorityFilter: this.priorityFilters.ALL,
        grouping: this.groupingOptions.INDIVIDUAL,
        customTiming: { enabled: false }
      }
    };

    this.defaultQuietHours = {
      enabled: true,
      mode: this.quietModes.NIGHT_HOURS,
      schedule: {
        start: '22:00',
        end: '07:00',
        timezone: 'auto'
      },
      exceptions: [this.notificationTypes.EMERGENCY],
      weekendMode: 'same' // 'same', 'extended', 'disabled'
    };

    this.validationRules = {
      maxChannelsPerType: 4,
      maxCustomReminders: 10,
      minQuietHoursDuration: 4,
      maxQuietHoursDuration: 12
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing NotificationSettingsService');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize NotificationSettingsService', error);
      throw error;
    }
  }

  async getUserSettings(userId, options = {}) {
    try {
      const {
        includeDefaults = true,
        decryptSensitiveData = true
      } = options;

      const cacheKey = `${this.cachePrefix}user_${userId}`;
      let settings = cache.get(cacheKey);

      if (!settings) {
        logger.info('Fetching user notification settings from API', { userId });

        const params = {
          include_defaults: includeDefaults
        };

        const response = await apiClient.get(
          ENDPOINTS.notificationSettings.getByUserId.replace(':userId', userId),
          { params }
        );

        settings = response.data;
        cache.set(cacheKey, settings, this.defaultCacheTTL, this.cacheTags);
      }

      // Merge with defaults if settings are incomplete
      if (includeDefaults) {
        settings = this.mergeWithDefaults(settings);
      }

      if (decryptSensitiveData && settings._encryptionKeyId) {
        try {
          const encryptionKey = await privacy.generateEncryptionKey(
            userId,
            settings._encryptionKeyId
          );
          settings = await privacy.decryptSensitiveData(settings, encryptionKey);
        } catch (decryptError) {
          logger.warn('Failed to decrypt notification settings', {
            userId,
            error: decryptError.message
          });
        }
      }

      privacy.logDataAccess(
        userId,
        'notification_settings',
        'read',
        { userId }
      );

      return settings;
    } catch (error) {
      logger.error('Failed to get user notification settings', { userId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateUserSettings(userId, settingsUpdate, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validateSettings = true,
        createAuditLog = true,
        notifyChanges = false
      } = options;

      logger.info('Updating user notification settings', {
        userId,
        updateKeys: Object.keys(settingsUpdate)
      });

      // Validate settings
      if (validateSettings) {
        const validation = this.validateSettings(settingsUpdate);
        if (!validation.isValid) {
          throw errorHandler.createValidationError(
            'Settings validation failed',
            validation.errors
          );
        }
      }

      const currentSettings = await this.getUserSettings(userId, { decryptSensitiveData: false });

      let processedUpdate = {
        ...settingsUpdate,
        updatedAt: new Date().toISOString(),
        version: (currentSettings.version || 1) + 1
      };

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          userId,
          currentSettings._encryptionKeyId || userId
        );

        processedUpdate = await privacy.encryptSensitiveData(processedUpdate, encryptionKey);
        processedUpdate._encryptionKeyId = currentSettings._encryptionKeyId || userId;
      }

      const response = await apiClient.put(
        ENDPOINTS.notificationSettings.updateByUserId.replace(':userId', userId),
        processedUpdate
      );

      const updatedSettings = response.data;

      // Clear user cache
      this.invalidateUserCache(userId);

      // Notify about important setting changes
      if (notifyChanges && this.hasSignificantChanges(settingsUpdate)) {
        await this.notifySettingsChanged(userId, settingsUpdate);
      }

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'notification_settings',
          entityId: userId,
          action: 'update_settings',
          changes: privacy.sanitizeForLogging(settingsUpdate),
          previousData: privacy.sanitizeForLogging(currentSettings),
          timestamp: new Date().toISOString(),
          userId
        });
      }

      privacy.logDataAccess(
        userId,
        'notification_settings',
        'update',
        { userId, changes: Object.keys(settingsUpdate) }
      );

      logger.info('User notification settings updated successfully', { userId });

      return updatedSettings;
    } catch (error) {
      logger.error('Failed to update user notification settings', { userId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateTypeSettings(userId, notificationType, typeSettings, options = {}) {
    try {
      const { createAuditLog = true } = options;

      logger.info('Updating notification type settings', {
        userId,
        notificationType,
        settings: typeSettings
      });

      // Validate type settings
      this.validateTypeSettings(notificationType, typeSettings);

      const currentSettings = await this.getUserSettings(userId);
      const updatedSettings = {
        ...currentSettings,
        typeSettings: {
          ...currentSettings.typeSettings,
          [notificationType]: {
            ...currentSettings.typeSettings[notificationType],
            ...typeSettings
          }
        }
      };

      const result = await this.updateUserSettings(userId, updatedSettings, {
        createAuditLog: false // We'll create our own audit log
      });

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'notification_settings',
          entityId: userId,
          action: 'update_type_settings',
          details: {
            notificationType,
            settings: privacy.sanitizeForLogging(typeSettings)
          },
          userId
        });
      }

      logger.info('Notification type settings updated successfully', {
        userId,
        notificationType
      });

      return result;
    } catch (error) {
      logger.error('Failed to update notification type settings', {
        userId,
        notificationType,
        error
      });
      throw errorHandler.handle(error);
    }
  }

  async updateQuietHours(userId, quietHoursSettings, options = {}) {
    try {
      const { createAuditLog = true } = options;

      logger.info('Updating quiet hours settings', {
        userId,
        quietHours: quietHoursSettings
      });

      // Validate quiet hours
      this.validateQuietHours(quietHoursSettings);

      const currentSettings = await this.getUserSettings(userId);
      const updatedSettings = {
        ...currentSettings,
        quietHours: {
          ...currentSettings.quietHours,
          ...quietHoursSettings
        }
      };

      const result = await this.updateUserSettings(userId, updatedSettings, {
        createAuditLog: false
      });

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'notification_settings',
          entityId: userId,
          action: 'update_quiet_hours',
          details: {
            quietHours: privacy.sanitizeForLogging(quietHoursSettings)
          },
          userId
        });
      }

      logger.info('Quiet hours settings updated successfully', { userId });

      return result;
    } catch (error) {
      logger.error('Failed to update quiet hours settings', { userId, error });
      throw errorHandler.handle(error);
    }
  }

  async resetToDefaults(userId, options = {}) {
    try {
      const {
        preserveCustomSettings = false,
        createAuditLog = true
      } = options;

      logger.info('Resetting notification settings to defaults', {
        userId,
        preserveCustomSettings
      });

      const currentSettings = await this.getUserSettings(userId, { decryptSensitiveData: false });

      let defaultSettings = this.getDefaultSettings();

      // Preserve some custom settings if requested
      if (preserveCustomSettings && currentSettings.customSettings) {
        defaultSettings.customSettings = currentSettings.customSettings;
      }

      const result = await this.updateUserSettings(userId, defaultSettings, {
        createAuditLog: false
      });

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'notification_settings',
          entityId: userId,
          action: 'reset_to_defaults',
          details: {
            preserveCustomSettings,
            previousVersion: currentSettings.version
          },
          userId
        });
      }

      logger.info('Notification settings reset to defaults successfully', { userId });

      return result;
    } catch (error) {
      logger.error('Failed to reset notification settings to defaults', { userId, error });
      throw errorHandler.handle(error);
    }
  }

  async enableAllNotifications(userId, options = {}) {
    try {
      const {
        excludeTypes = [],
        createAuditLog = true
      } = options;

      logger.info('Enabling all notifications', { userId, excludeTypes });

      const currentSettings = await this.getUserSettings(userId);
      const typeSettings = { ...currentSettings.typeSettings };

      // Enable all notification types except excluded ones
      Object.keys(this.notificationTypes).forEach(typeKey => {
        const type = this.notificationTypes[typeKey];
        if (!excludeTypes.includes(type)) {
          if (typeSettings[type]) {
            typeSettings[type].enabled = true;
          }
        }
      });

      const updatedSettings = {
        ...currentSettings,
        typeSettings,
        globalEnabled: true
      };

      const result = await this.updateUserSettings(userId, updatedSettings, {
        createAuditLog: false
      });

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'notification_settings',
          entityId: userId,
          action: 'enable_all_notifications',
          details: { excludeTypes },
          userId
        });
      }

      logger.info('All notifications enabled successfully', { userId });

      return result;
    } catch (error) {
      logger.error('Failed to enable all notifications', { userId, error });
      throw errorHandler.handle(error);
    }
  }

  async disableAllNotifications(userId, options = {}) {
    try {
      const {
        preserveEmergency = true,
        createAuditLog = true
      } = options;

      logger.info('Disabling all notifications', { userId, preserveEmergency });

      const currentSettings = await this.getUserSettings(userId);
      const typeSettings = { ...currentSettings.typeSettings };

      // Disable all notification types except emergency if preserved
      Object.keys(this.notificationTypes).forEach(typeKey => {
        const type = this.notificationTypes[typeKey];
        if (!(preserveEmergency && type === this.notificationTypes.EMERGENCY)) {
          if (typeSettings[type]) {
            typeSettings[type].enabled = false;
          }
        }
      });

      const updatedSettings = {
        ...currentSettings,
        typeSettings,
        globalEnabled: preserveEmergency // Keep global enabled if preserving emergency
      };

      const result = await this.updateUserSettings(userId, updatedSettings, {
        createAuditLog: false
      });

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'notification_settings',
          entityId: userId,
          action: 'disable_all_notifications',
          details: { preserveEmergency },
          userId
        });
      }

      logger.info('All notifications disabled successfully', { userId });

      return result;
    } catch (error) {
      logger.error('Failed to disable all notifications', { userId, error });
      throw errorHandler.handle(error);
    }
  }

  async testNotificationSettings(userId, testType = 'all', options = {}) {
    try {
      const {
        testData = {},
        realDelivery = false
      } = options;

      logger.info('Testing notification settings', { userId, testType, realDelivery });

      const settings = await this.getUserSettings(userId);

      const testPayload = {
        user_id: userId,
        test_type: testType,
        test_data: testData,
        real_delivery: realDelivery,
        settings_snapshot: privacy.sanitizeForLogging(settings)
      };

      const response = await apiClient.post(
        ENDPOINTS.notificationSettings.testSettings.replace(':userId', userId),
        testPayload
      );

      const testResults = response.data;

      logger.info('Notification settings test completed', {
        userId,
        testType,
        successful: testResults.successful,
        failed: testResults.failed
      });

      return testResults;
    } catch (error) {
      logger.error('Failed to test notification settings', { userId, testType, error });
      throw errorHandler.handle(error);
    }
  }

  async getEffectiveSettings(userId, notificationType, options = {}) {
    try {
      const {
        currentTime = new Date(),
        includeQuietHours = true
      } = options;

      logger.info('Getting effective notification settings', {
        userId,
        notificationType,
        currentTime
      });

      const userSettings = await this.getUserSettings(userId);
      const typeSettings = userSettings.typeSettings[notificationType];

      if (!typeSettings || !typeSettings.enabled || !userSettings.globalEnabled) {
        return {
          enabled: false,
          reason: 'disabled',
          channels: [],
          frequency: this.frequencies.NEVER
        };
      }

      // Check quiet hours
      if (includeQuietHours && this.isInQuietHours(currentTime, userSettings.quietHours)) {
        const exceptions = userSettings.quietHours.exceptions || [];
        if (!exceptions.includes(notificationType)) {
          return {
            enabled: false,
            reason: 'quiet_hours',
            channels: [],
            frequency: this.frequencies.NEVER,
            resumeAt: this.getQuietHoursEndTime(currentTime, userSettings.quietHours)
          };
        }
      }

      return {
        enabled: true,
        channels: typeSettings.channels || [],
        frequency: typeSettings.frequency || this.frequencies.IMMEDIATE,
        priorityFilter: typeSettings.priorityFilter || this.priorityFilters.ALL,
        grouping: typeSettings.grouping || this.groupingOptions.INDIVIDUAL,
        customTiming: typeSettings.customTiming || { enabled: false }
      };
    } catch (error) {
      logger.error('Failed to get effective notification settings', {
        userId,
        notificationType,
        error
      });
      throw errorHandler.handle(error);
    }
  }

  async getClientSettings(clientId, options = {}) {
    try {
      const { therapistId = null } = options;

      logger.info('Getting client notification settings', { clientId, therapistId });

      const params = {
        client_id: clientId,
        therapistId: therapistId
      };

      const response = await apiClient.get(
        ENDPOINTS.notificationSettings.getClientSettings,
        { params }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get client notification settings', { clientId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateClientSettings(clientId, settingsUpdate, options = {}) {
    try {
      const {
        therapistId = null,
        createAuditLog = true
      } = options;

      logger.info('Updating client notification settings', {
        clientId,
        therapistId,
        settings: settingsUpdate
      });

      const updatePayload = {
        client_id: clientId,
        therapistId: therapistId,
        settings: settingsUpdate,
        updated_at: new Date().toISOString()
      };

      const response = await apiClient.put(
        ENDPOINTS.notificationSettings.updateClientSettings,
        updatePayload
      );

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'client_notification_settings',
          entityId: clientId,
          action: 'update_client_settings',
          details: {
            therapistId,
            settings: privacy.sanitizeForLogging(settingsUpdate)
          },
          userId: therapistId || 'system'
        });
      }

      logger.info('Client notification settings updated successfully', { clientId });

      return response.data;
    } catch (error) {
      logger.error('Failed to update client notification settings', { clientId, error });
      throw errorHandler.handle(error);
    }
  }

  // Validation methods
  validateSettings(settings) {
    const errors = [];

    // Validate type settings
    if (settings.typeSettings) {
      Object.entries(settings.typeSettings).forEach(([type, typeSettings]) => {
        const typeValidation = this.validateTypeSettings(type, typeSettings);
        if (!typeValidation.isValid) {
          errors.push(...typeValidation.errors.map(err => `${type}: ${err}`));
        }
      });
    }

    // Validate quiet hours
    if (settings.quietHours) {
      const quietValidation = this.validateQuietHours(settings.quietHours);
      if (!quietValidation.isValid) {
        errors.push(...quietValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateTypeSettings(notificationType, typeSettings) {
    const errors = [];

    // Validate notification type
    if (!Object.values(this.notificationTypes).includes(notificationType)) {
      errors.push('Invalid notification type');
    }

    // Validate channels
    if (typeSettings.channels) {
      if (!Array.isArray(typeSettings.channels)) {
        errors.push('Channels must be an array');
      } else {
        if (typeSettings.channels.length > this.validationRules.maxChannelsPerType) {
          errors.push(`Maximum ${this.validationRules.maxChannelsPerType} channels allowed`);
        }

        typeSettings.channels.forEach(channel => {
          if (!Object.values(this.deliveryChannels).includes(channel)) {
            errors.push(`Invalid delivery channel: ${channel}`);
          }
        });
      }
    }

    // Validate frequency
    if (typeSettings.frequency && !Object.values(this.frequencies).includes(typeSettings.frequency)) {
      errors.push('Invalid frequency');
    }

    // Validate priority filter
    if (typeSettings.priorityFilter && !Object.values(this.priorityFilters).includes(typeSettings.priorityFilter)) {
      errors.push('Invalid priority filter');
    }

    // Validate grouping
    if (typeSettings.grouping && !Object.values(this.groupingOptions).includes(typeSettings.grouping)) {
      errors.push('Invalid grouping option');
    }

    // Validate custom timing
    if (typeSettings.customTiming && typeSettings.customTiming.enabled) {
      if (typeSettings.customTiming.reminders) {
        if (typeSettings.customTiming.reminders.length > this.validationRules.maxCustomReminders) {
          errors.push(`Maximum ${this.validationRules.maxCustomReminders} custom reminders allowed`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateQuietHours(quietHours) {
    const errors = [];

    if (quietHours.enabled && quietHours.mode !== this.quietModes.DISABLED) {
      if (quietHours.schedule) {
        const { start, end } = quietHours.schedule;

        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (start && !timeRegex.test(start)) {
          errors.push('Invalid start time format');
        }
        if (end && !timeRegex.test(end)) {
          errors.push('Invalid end time format');
        }

        // Validate duration
        if (start && end) {
          const duration = this.calculateQuietHoursDuration(start, end);
          if (duration < this.validationRules.minQuietHoursDuration) {
            errors.push(`Quiet hours duration must be at least ${this.validationRules.minQuietHoursDuration} hours`);
          }
          if (duration > this.validationRules.maxQuietHoursDuration) {
            errors.push(`Quiet hours duration cannot exceed ${this.validationRules.maxQuietHoursDuration} hours`);
          }
        }
      }

      // Validate exceptions
      if (quietHours.exceptions) {
        quietHours.exceptions.forEach(exception => {
          if (!Object.values(this.notificationTypes).includes(exception)) {
            errors.push(`Invalid exception type: ${exception}`);
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper methods
  mergeWithDefaults(userSettings) {
    const defaults = this.getDefaultSettings();

    return {
      ...defaults,
      ...userSettings,
      typeSettings: {
        ...defaults.typeSettings,
        ...userSettings.typeSettings
      },
      quietHours: {
        ...defaults.quietHours,
        ...userSettings.quietHours
      }
    };
  }

  getDefaultSettings() {
    return {
      globalEnabled: true,
      typeSettings: { ...this.defaultSettings },
      quietHours: { ...this.defaultQuietHours },
      createdAt: new Date().toISOString(),
      version: 1
    };
  }

  hasSignificantChanges(settingsUpdate) {
    const significantFields = [
      'globalEnabled',
      'typeSettings',
      'quietHours'
    ];

    return significantFields.some(field => settingsUpdate.hasOwnProperty(field));
  }

  isInQuietHours(currentTime, quietHours) {
    if (!quietHours.enabled || quietHours.mode === this.quietModes.DISABLED) {
      return false;
    }

    if (quietHours.mode === this.quietModes.DO_NOT_DISTURB) {
      return true;
    }

    if (quietHours.schedule) {
      const { start, end, timezone } = quietHours.schedule;
      return this.isTimeInRange(currentTime, start, end, timezone);
    }

    return false;
  }

  isTimeInRange(currentTime, startTime, endTime, timezone = 'auto') {
    // Convert times to minutes for comparison
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    if (startMinutes <= endMinutes) {
      // Same day range
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  calculateQuietHoursDuration(startTime, endTime) {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    if (startMinutes <= endMinutes) {
      return (endMinutes - startMinutes) / 60;
    } else {
      return (24 * 60 - startMinutes + endMinutes) / 60;
    }
  }

  getQuietHoursEndTime(currentTime, quietHours) {
    if (!quietHours.schedule) return null;

    const endTime = quietHours.schedule.end;
    const endMinutes = this.timeToMinutes(endTime);

    const endDate = new Date(currentTime);
    endDate.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

    // If end time is before current time, it's tomorrow
    if (endDate <= currentTime) {
      endDate.setDate(endDate.getDate() + 1);
    }

    return endDate.toISOString();
  }

  async notifySettingsChanged(userId, changes) {
    try {
      await apiClient.post(
        ENDPOINTS.notificationSettings.notifyChanges.replace(':userId', userId),
        {
          changes: privacy.sanitizeForLogging(changes),
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      logger.warn('Failed to notify settings changes', { userId, error });
    }
  }

  invalidateUserCache(userId) {
    try {
      cache.deleteByPattern(`${this.cachePrefix}user_${userId}*`);
      logger.debug('User notification settings cache invalidated', { userId });
    } catch (error) {
      logger.warn('Failed to invalidate user cache', { userId, error });
    }
  }

  invalidateCache(tags = []) {
    try {
      tags.forEach(tag => {
        cache.deleteByTag(tag);
      });

      logger.debug('Notification settings cache invalidated', { tags });
    } catch (error) {
      logger.warn('Failed to invalidate cache', error);
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('notification-settings');
      cache.deleteByTag('preferences');
      logger.info('Notification settings service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear notification settings service cache', error);
    }
  }

  getStats() {
    return {
      service: 'NotificationSettingsService',
      initialized: this.isInitialized,
      cacheStats: {
        notificationSettings: cache.getStatsByTag('notification-settings'),
        preferences: cache.getStatsByTag('preferences')
      },
      constants: {
        deliveryChannels: this.deliveryChannels,
        notificationTypes: this.notificationTypes,
        frequencies: this.frequencies,
        priorityFilters: this.priorityFilters,
        quietModes: this.quietModes,
        groupingOptions: this.groupingOptions
      },
      defaults: {
        defaultSettings: this.defaultSettings,
        defaultQuietHours: this.defaultQuietHours,
        validationRules: this.validationRules
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const notificationSettingsService = new NotificationSettingsService();

export const {
  getUserSettings,
  updateUserSettings,
  updateTypeSettings,
  updateQuietHours,
  resetToDefaults,
  enableAllNotifications,
  disableAllNotifications,
  testNotificationSettings,
  getEffectiveSettings,
  getClientSettings,
  updateClientSettings
} = notificationSettingsService;

export default notificationSettingsService;