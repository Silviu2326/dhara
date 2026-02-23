import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { errorHandler } from '../utils/errorHandler';
import { privacy } from '../utils/privacy';
import { security } from '../utils/security';
import { auditService } from '../utils/auditService';

class RatesService {
  constructor() {
    this.baseEndpoint = 'rates';
    this.cachePrefix = 'rate_';
    this.cacheTags = ['rates', 'pricing', 'services'];
    this.defaultCacheTTL = 900; // 15 minutes for pricing data
    this.isInitialized = false;

    this.serviceTypes = {
      INDIVIDUAL_THERAPY: 'individual_therapy',
      COUPLE_THERAPY: 'couple_therapy',
      FAMILY_THERAPY: 'family_therapy',
      GROUP_THERAPY: 'group_therapy',
      CHILD_THERAPY: 'child_therapy',
      ADOLESCENT_THERAPY: 'adolescent_therapy',
      PSYCHIATRIC_EVALUATION: 'psychiatric_evaluation',
      PSYCHOLOGICAL_ASSESSMENT: 'psychological_assessment',
      CONSULTATION: 'consultation',
      EMERGENCY_SESSION: 'emergency_session',
      INTENSIVE_SESSION: 'intensive_session',
      ONLINE_THERAPY: 'online_therapy',
      WORKSHOP: 'workshop',
      SUPERVISION: 'supervision'
    };

    this.sessionDurations = {
      '30_MIN': 30,
      '45_MIN': 45,
      '60_MIN': 60,
      '90_MIN': 90,
      '120_MIN': 120,
      '180_MIN': 180
    };

    this.rateTypes = {
      STANDARD: 'standard',
      PREMIUM: 'premium',
      SLIDING_SCALE: 'sliding_scale',
      EMERGENCY: 'emergency',
      AFTER_HOURS: 'after_hours',
      WEEKEND: 'weekend',
      HOLIDAY: 'holiday',
      INSURANCE: 'insurance',
      CASH_DISCOUNT: 'cash_discount'
    };

    this.currencies = {
      USD: 'USD',
      EUR: 'EUR',
      MXN: 'MXN',
      COP: 'COP',
      ARS: 'ARS',
      CLP: 'CLP',
      PEN: 'PEN',
      BRL: 'BRL'
    };

    this.rateStatus = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      PENDING: 'pending',
      EXPIRED: 'expired',
      ARCHIVED: 'archived'
    };

    this.validityTypes = {
      INDEFINITE: 'indefinite',
      DATE_RANGE: 'date_range',
      SESSION_COUNT: 'session_count',
      CLIENT_SPECIFIC: 'client_specific',
      PROMOTIONAL: 'promotional'
    };

    this.adjustmentTypes = {
      PERCENTAGE_INCREASE: 'percentage_increase',
      PERCENTAGE_DECREASE: 'percentage_decrease',
      FIXED_INCREASE: 'fixed_increase',
      FIXED_DECREASE: 'fixed_decrease',
      SET_AMOUNT: 'set_amount'
    };

    this.pricingTiers = {
      BASIC: 'basic',
      STANDARD: 'standard',
      PREMIUM: 'premium',
      EXECUTIVE: 'executive',
      SPECIALIZED: 'specialized'
    };

    this.geographicalZones = {
      URBAN: 'urban',
      SUBURBAN: 'suburban',
      RURAL: 'rural',
      METROPOLITAN: 'metropolitan',
      INTERNATIONAL: 'international'
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing RatesService');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize RatesService', error);
      throw error;
    }
  }

  async createRate(rateData, options = {}) {
    try {
      const {
        validateConflicts = true,
        createAuditLog = true,
        notifyClients = false,
        effectiveDate = null
      } = options;

      logger.info('Creating rate', {
        therapistId: rateData.therapistId,
        serviceType: rateData.serviceType,
        amount: rateData.amount,
        currency: rateData.currency
      });

      // Validate rate data
      this.validateRateData(rateData);

      // Check for conflicts with existing rates
      if (validateConflicts) {
        const conflicts = await this.checkRateConflicts(rateData);
        if (conflicts.hasConflicts) {
          throw errorHandler.createConflictError(
            'Rate conflicts with existing rates',
            conflicts.conflicts
          );
        }
      }

      let processedData = {
        ...rateData,
        rateId: security.generateSecureId('rate_'),
        status: this.rateStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        effectiveFrom: effectiveDate || rateData.effectiveFrom || new Date().toISOString(),
        version: 1
      };

      // Set expiration date if not provided
      if (!processedData.effectiveTo && processedData.validityType === this.validityTypes.DATE_RANGE) {
        // Default to 1 year if no end date specified
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        processedData.effectiveTo = expirationDate.toISOString();
      }

      const response = await apiClient.post(
        ENDPOINTS.rates.create,
        processedData
      );

      const rate = response.data;

      // Notify existing clients if rate affects them
      if (notifyClients) {
        await this.notifyClientsOfRateChange(rate.id, 'new_rate');
      }

      this.invalidateCache(['rates', 'pricing'], rateData.therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'rate',
          entityId: rate.id,
          action: 'create_rate',
          details: {
            therapistId: rateData.therapistId,
            serviceType: rateData.serviceType,
            amount: rateData.amount,
            currency: rateData.currency,
            rateType: rateData.rateType
          },
          userId: rateData.createdBy || rateData.therapistId
        });
      }

      logger.info('Rate created successfully', {
        rateId: rate.id,
        therapistId: rateData.therapistId
      });

      return rate;
    } catch (error) {
      logger.error('Failed to create rate', error);
      throw errorHandler.handle(error);
    }
  }

  async getRate(rateId, options = {}) {
    try {
      const {
        includeHistory = false,
        includeUsageStats = false
      } = options;

      const cacheKey = `${this.cachePrefix}${rateId}`;
      let rate = cache.get(cacheKey);

      if (!rate) {
        logger.info('Fetching rate from API', { rateId });

        const params = {
          include_history: includeHistory,
          include_usage_stats: includeUsageStats
        };

        const response = await apiClient.get(
          ENDPOINTS.rates.getById.replace(':id', rateId),
          { params }
        );

        rate = response.data;
        cache.set(cacheKey, rate, this.defaultCacheTTL, this.cacheTags);
      }

      return rate;
    } catch (error) {
      logger.error('Failed to get rate', { rateId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateRate(rateId, updates, options = {}) {
    try {
      const {
        validateConflicts = true,
        createNewVersion = true,
        notifyClients = false,
        createAuditLog = true
      } = options;

      logger.info('Updating rate', {
        rateId,
        updateKeys: Object.keys(updates)
      });

      const currentRate = await this.getRate(rateId);

      // Validate updates
      if (updates.amount || updates.currency || updates.serviceType) {
        this.validateRateData({ ...currentRate, ...updates });
      }

      // Check for conflicts if significant changes
      if (validateConflicts && (updates.amount || updates.serviceType || updates.effectiveFrom)) {
        const conflicts = await this.checkRateConflicts({ ...currentRate, ...updates }, rateId);
        if (conflicts.hasConflicts) {
          throw errorHandler.createConflictError(
            'Rate update conflicts with existing rates',
            conflicts.conflicts
          );
        }
      }

      let processedUpdates = { ...updates };

      if (createNewVersion) {
        processedUpdates.version = (currentRate.version || 1) + 1;
        processedUpdates.updatedAt = new Date().toISOString();
      }

      // Handle price changes with proper effective dates
      if (updates.amount && updates.amount !== currentRate.amount) {
        if (!updates.effectiveFrom) {
          processedUpdates.effectiveFrom = new Date().toISOString();
        }
        processedUpdates.previousAmount = currentRate.amount;
        processedUpdates.priceChangeDate = new Date().toISOString();
      }

      const response = await apiClient.put(
        ENDPOINTS.rates.update.replace(':id', rateId),
        processedUpdates
      );

      const updatedRate = response.data;

      // Notify clients of price changes
      if (notifyClients && updates.amount && updates.amount !== currentRate.amount) {
        await this.notifyClientsOfRateChange(rateId, 'price_change', {
          oldAmount: currentRate.amount,
          newAmount: updates.amount,
          effectiveDate: processedUpdates.effectiveFrom
        });
      }

      this.invalidateCache(['rates', 'pricing'], currentRate.therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'rate',
          entityId: rateId,
          action: 'update_rate',
          changes: processedUpdates,
          previousData: privacy.sanitizeForLogging(currentRate),
          timestamp: new Date().toISOString(),
          userId: currentRate.therapistId
        });
      }

      logger.info('Rate updated successfully', { rateId });

      return updatedRate;
    } catch (error) {
      logger.error('Failed to update rate', { rateId, error });
      throw errorHandler.handle(error);
    }
  }

  async deleteRate(rateId, options = {}) {
    try {
      const {
        reason = 'no_longer_offered',
        archiveInstead = true,
        notifyClients = true,
        createAuditLog = true
      } = options;

      logger.info('Deleting rate', { rateId, reason, archiveInstead });

      const rate = await this.getRate(rateId);

      // Check for active usage
      const usageCheck = await this.checkRateUsage(rateId);
      if (usageCheck.hasActiveUsage && !archiveInstead) {
        throw errorHandler.createConflictError(
          'Cannot delete rate with active usage. Consider archiving instead.',
          usageCheck.activeUsages
        );
      }

      let result;

      if (archiveInstead) {
        // Archive instead of delete
        result = await this.updateRate(rateId, {
          status: this.rateStatus.ARCHIVED,
          archivedAt: new Date().toISOString(),
          archiveReason: reason
        }, { createAuditLog: false });
      } else {
        // Actually delete
        await apiClient.delete(
          ENDPOINTS.rates.delete.replace(':id', rateId),
          { data: { reason, deletedAt: new Date().toISOString() } }
        );

        result = {
          success: true,
          rateId,
          deletedAt: new Date().toISOString(),
          reason
        };
      }

      // Notify clients
      if (notifyClients) {
        await this.notifyClientsOfRateChange(rateId, archiveInstead ? 'rate_archived' : 'rate_deleted');
      }

      this.invalidateCache(['rates', 'pricing'], rate.therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: archiveInstead ? 'update' : 'delete',
          entityType: 'rate',
          entityId: rateId,
          action: archiveInstead ? 'archive_rate' : 'delete_rate',
          details: { reason, archiveInstead },
          userId: rate.therapistId
        });
      }

      logger.info(`Rate ${archiveInstead ? 'archived' : 'deleted'} successfully`, { rateId });

      return result;
    } catch (error) {
      logger.error('Failed to delete rate', { rateId, error });
      throw errorHandler.handle(error);
    }
  }

  async getRates(filters = {}, options = {}) {
    try {
      const {
        therapistId = null,
        serviceType = null,
        rateType = null,
        currency = null,
        status = 'active',
        effectiveDate = null,
        minAmount = null,
        maxAmount = null,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeExpired = false
      } = { ...filters, ...options };

      const params = {
        therapistId: therapistId,
        service_type: serviceType,
        rate_type: rateType,
        currency,
        status,
        effective_date: effectiveDate,
        min_amount: minAmount,
        max_amount: maxAmount,
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        include_expired: includeExpired
      };

      const cacheKey = `${this.cachePrefix}list_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        logger.info('Fetching rates from API', { filters: params });

        response = await apiClient.get(ENDPOINTS.RATES.GET_ALL, { params });
        cache.set(cacheKey, response.data, this.defaultCacheTTL, this.cacheTags);
      } else {
        response = { data: response };
      }

      const rates = response.data.rates || response.data;

      return {
        rates,
        pagination: {
          page,
          limit,
          total: response.data.total || rates.length,
          hasMore: response.data.hasMore || false
        },
        filters: params
      };
    } catch (error) {
      logger.error('Failed to get rates', { filters, error });
      throw errorHandler.handle(error);
    }
  }

  async getCurrentRate(therapistId, serviceType, options = {}) {
    try {
      const {
        effectiveDate = new Date().toISOString(),
        rateType = this.rateTypes.STANDARD,
        clientId = null,
        duration = 60
      } = options;

      logger.info('Getting current rate', {
        therapistId,
        serviceType,
        rateType,
        effectiveDate
      });

      const params = {
        therapistId: therapistId,
        service_type: serviceType,
        rate_type: rateType,
        effective_date: effectiveDate,
        client_id: clientId,
        duration
      };

      const cacheKey = `${this.cachePrefix}current_${security.generateHash(params)}`;
      let rate = cache.get(cacheKey);

      if (!rate) {
        const response = await apiClient.get(ENDPOINTS.rates.getCurrent, { params });
        rate = response.data;
        cache.set(cacheKey, rate, this.defaultCacheTTL, this.cacheTags);
      }

      return rate;
    } catch (error) {
      logger.error('Failed to get current rate', { therapistId, serviceType, error });
      throw errorHandler.handle(error);
    }
  }

  async calculateSessionCost(calculationData, options = {}) {
    try {
      const {
        includeDiscounts = true,
        includeTaxes = true,
        includeInsurance = true
      } = options;

      logger.info('Calculating session cost', {
        therapistId: calculationData.therapistId,
        serviceType: calculationData.serviceType,
        duration: calculationData.duration
      });

      const calculationParams = {
        ...calculationData,
        include_discounts: includeDiscounts,
        include_taxes: includeTaxes,
        include_insurance: includeInsurance,
        calculation_date: new Date().toISOString()
      };

      const response = await apiClient.post(
        ENDPOINTS.rates.calculateCost,
        calculationParams
      );

      const calculation = response.data;

      logger.info('Session cost calculated', {
        baseAmount: calculation.baseAmount,
        finalAmount: calculation.finalAmount,
        discounts: calculation.discounts?.length || 0
      });

      return calculation;
    } catch (error) {
      logger.error('Failed to calculate session cost', { calculationData, error });
      throw errorHandler.handle(error);
    }
  }

  async bulkUpdateRates(therapistId, updateData, options = {}) {
    try {
      const {
        adjustmentType = this.adjustmentTypes.PERCENTAGE_INCREASE,
        adjustmentValue,
        effectiveDate = null,
        serviceTypes = [],
        rateTypes = [],
        createAuditLog = true,
        notifyClients = false
      } = options;

      logger.info('Performing bulk rate update', {
        therapistId,
        adjustmentType,
        adjustmentValue,
        serviceTypesCount: serviceTypes.length
      });

      const bulkUpdatePayload = {
        therapistId: therapistId,
        adjustment_type: adjustmentType,
        adjustment_value: adjustmentValue,
        effective_date: effectiveDate || new Date().toISOString(),
        service_types: serviceTypes,
        rate_types: rateTypes,
        update_data: updateData
      };

      const response = await apiClient.post(
        ENDPOINTS.rates.bulkUpdate,
        bulkUpdatePayload
      );

      const result = response.data;

      // Notify clients of bulk changes
      if (notifyClients && result.updatedRates?.length > 0) {
        await this.notifyClientsOfBulkRateChange(therapistId, {
          adjustmentType,
          adjustmentValue,
          effectiveDate: bulkUpdatePayload.effective_date,
          affectedServices: serviceTypes
        });
      }

      this.invalidateCache(['rates', 'pricing'], therapistId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'rates',
          entityId: `bulk_${therapistId}`,
          action: 'bulk_update_rates',
          details: {
            therapistId,
            adjustmentType,
            adjustmentValue,
            updatedCount: result.updatedRates?.length || 0,
            failedCount: result.failedUpdates?.length || 0
          },
          userId: therapistId
        });
      }

      logger.info('Bulk rate update completed', {
        therapistId,
        updated: result.updatedRates?.length || 0,
        failed: result.failedUpdates?.length || 0
      });

      return result;
    } catch (error) {
      logger.error('Failed to perform bulk rate update', { therapistId, error });
      throw errorHandler.handle(error);
    }
  }

  async getRateHistory(rateId, options = {}) {
    try {
      const {
        includeUsageData = false,
        dateFrom = null,
        dateTo = null,
        limit = 50
      } = options;

      const params = {
        include_usage_data: includeUsageData,
        date_from: dateFrom,
        date_to: dateTo,
        limit
      };

      logger.info('Fetching rate history', { rateId, params });

      const response = await apiClient.get(
        ENDPOINTS.rates.getHistory.replace(':rateId', rateId),
        { params }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get rate history', { rateId, error });
      throw errorHandler.handle(error);
    }
  }

  async cloneRate(sourceRateId, cloneData, options = {}) {
    try {
      const { createAuditLog = true } = options;

      logger.info('Cloning rate', { sourceRateId, cloneData });

      const sourceRate = await this.getRate(sourceRateId);

      const clonedRateData = {
        ...sourceRate,
        ...cloneData,
        clonedFrom: sourceRateId,
        clonedAt: new Date().toISOString()
      };

      // Remove original identifiers
      delete clonedRateData.id;
      delete clonedRateData.rateId;
      delete clonedRateData.createdAt;
      delete clonedRateData.version;

      const clonedRate = await this.createRate(clonedRateData, {
        validateConflicts: true,
        createAuditLog
      });

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'rate',
          entityId: clonedRate.id,
          action: 'clone_rate',
          details: {
            sourceRateId,
            therapistId: clonedRateData.therapistId,
            serviceType: clonedRateData.serviceType
          },
          userId: clonedRateData.therapistId
        });
      }

      logger.info('Rate cloned successfully', {
        sourceRateId,
        clonedRateId: clonedRate.id
      });

      return clonedRate;
    } catch (error) {
      logger.error('Failed to clone rate', { sourceRateId, error });
      throw errorHandler.handle(error);
    }
  }

  // Validation methods
  validateRateData(rateData) {
    const requiredFields = ['therapistId', 'serviceType', 'amount', 'currency'];

    for (const field of requiredFields) {
      if (!rateData[field]) {
        throw errorHandler.createValidationError(`Missing required field: ${field}`, rateData);
      }
    }

    // Validate amount
    if (rateData.amount <= 0) {
      throw errorHandler.createValidationError('Amount must be greater than 0');
    }

    // Validate service type
    if (!Object.values(this.serviceTypes).includes(rateData.serviceType)) {
      throw errorHandler.createValidationError('Invalid service type', {
        provided: rateData.serviceType,
        valid: Object.values(this.serviceTypes)
      });
    }

    // Validate currency
    if (!Object.values(this.currencies).includes(rateData.currency)) {
      throw errorHandler.createValidationError('Invalid currency', {
        provided: rateData.currency,
        valid: Object.values(this.currencies)
      });
    }

    // Validate rate type if provided
    if (rateData.rateType && !Object.values(this.rateTypes).includes(rateData.rateType)) {
      throw errorHandler.createValidationError('Invalid rate type', {
        provided: rateData.rateType,
        valid: Object.values(this.rateTypes)
      });
    }

    // Validate duration if provided
    if (rateData.duration && !Object.values(this.sessionDurations).includes(rateData.duration)) {
      throw errorHandler.createValidationError('Invalid session duration', {
        provided: rateData.duration,
        valid: Object.values(this.sessionDurations)
      });
    }

    // Validate date range
    if (rateData.effectiveFrom && rateData.effectiveTo) {
      const fromDate = new Date(rateData.effectiveFrom);
      const toDate = new Date(rateData.effectiveTo);

      if (fromDate >= toDate) {
        throw errorHandler.createValidationError('Effective from date must be before effective to date');
      }
    }

    return true;
  }

  async checkRateConflicts(rateData, excludeRateId = null) {
    try {
      const conflictCheckData = {
        therapistId: rateData.therapistId,
        service_type: rateData.serviceType,
        rate_type: rateData.rateType,
        effective_from: rateData.effectiveFrom,
        effective_to: rateData.effectiveTo,
        duration: rateData.duration,
        exclude_rate_id: excludeRateId
      };

      const response = await apiClient.post(
        ENDPOINTS.rates.checkConflicts,
        conflictCheckData
      );

      return response.data;
    } catch (error) {
      logger.warn('Rate conflict check failed, allowing creation', error);
      return { hasConflicts: false, conflicts: [] };
    }
  }

  async checkRateUsage(rateId) {
    try {
      const response = await apiClient.get(
        ENDPOINTS.rates.checkUsage.replace(':rateId', rateId)
      );

      return response.data;
    } catch (error) {
      logger.warn('Rate usage check failed', { rateId, error });
      return { hasActiveUsage: false, activeUsages: [] };
    }
  }

  // Notification methods
  async notifyClientsOfRateChange(rateId, changeType, changeData = {}) {
    try {
      await apiClient.post(
        ENDPOINTS.rates.notifyRateChange.replace(':rateId', rateId),
        {
          change_type: changeType,
          change_data: changeData,
          notification_date: new Date().toISOString()
        }
      );
      logger.info('Rate change notification sent', { rateId, changeType });
    } catch (error) {
      logger.warn('Failed to notify clients of rate change', { rateId, error });
    }
  }

  async notifyClientsOfBulkRateChange(therapistId, changeData) {
    try {
      await apiClient.post(
        ENDPOINTS.rates.notifyBulkRateChange.replace(':therapistId', therapistId),
        {
          change_data: changeData,
          notification_date: new Date().toISOString()
        }
      );
      logger.info('Bulk rate change notification sent', { therapistId });
    } catch (error) {
      logger.warn('Failed to notify clients of bulk rate change', { therapistId, error });
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

      logger.debug('Rates service cache invalidated', { tags, specificTherapistId });
    } catch (error) {
      logger.warn('Failed to invalidate cache', error);
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('rates');
      cache.deleteByTag('pricing');
      cache.deleteByTag('services');
      logger.info('Rates service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear rates service cache', error);
    }
  }

  getStats() {
    return {
      service: 'RatesService',
      initialized: this.isInitialized,
      cacheStats: {
        rates: cache.getStatsByTag('rates'),
        pricing: cache.getStatsByTag('pricing'),
        services: cache.getStatsByTag('services')
      },
      constants: {
        serviceTypes: this.serviceTypes,
        sessionDurations: this.sessionDurations,
        rateTypes: this.rateTypes,
        currencies: this.currencies,
        rateStatus: this.rateStatus,
        validityTypes: this.validityTypes,
        adjustmentTypes: this.adjustmentTypes,
        pricingTiers: this.pricingTiers,
        geographicalZones: this.geographicalZones
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const ratesService = new RatesService();

export const {
  createRate,
  getRate,
  updateRate,
  deleteRate,
  getRates,
  getCurrentRate,
  calculateSessionCost,
  bulkUpdateRates,
  getRateHistory,
  cloneRate
} = ratesService;

export default ratesService;