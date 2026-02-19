import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { cache, apiCache } from '../utils/cache';
import { privacy, encryptSensitiveData, decryptSensitiveData } from '../utils/privacy';
import { security, generateSecureId } from '../utils/security';
import { auditService } from '../utils/auditService';

class CouponService {
  constructor() {
    this.cachePrefix = 'coupon_';
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutos
    this.maxRetries = 3;
    this.auditContext = 'coupon_service';

    // Estados de cupones
    this.couponStatus = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      EXPIRED: 'expired',
      USED_UP: 'used_up',
      SUSPENDED: 'suspended',
      DRAFT: 'draft'
    };

    // Tipos de descuento
    this.discountTypes = {
      PERCENTAGE: 'percentage',
      FIXED_AMOUNT: 'fixed_amount',
      FREE_SESSIONS: 'free_sessions',
      SHIPPING_FREE: 'shipping_free',
      BUNDLE_DISCOUNT: 'bundle_discount'
    };

    // Tipos de cupones
    this.couponTypes = {
      GENERAL: 'general',
      FIRST_TIME: 'first_time',
      REFERRAL: 'referral',
      LOYALTY: 'loyalty',
      SEASONAL: 'seasonal',
      PROMOTIONAL: 'promotional',
      VIP: 'vip',
      VOLUME_DISCOUNT: 'volume_discount'
    };

    // Métodos de aplicación
    this.applicationMethods = {
      AUTOMATIC: 'automatic',
      MANUAL_CODE: 'manual_code',
      LINK_BASED: 'link_based',
      USER_SPECIFIC: 'user_specific'
    };

    // Restricciones de uso
    this.usageRestrictions = {
      ONCE_PER_USER: 'once_per_user',
      UNLIMITED_PER_USER: 'unlimited_per_user',
      LIMITED_TOTAL_USES: 'limited_total_uses',
      TIME_LIMITED: 'time_limited',
      USER_GROUP_RESTRICTED: 'user_group_restricted',
      SERVICE_RESTRICTED: 'service_restricted'
    };

    // Condiciones de elegibilidad
    this.eligibilityConditions = {
      MIN_PURCHASE_AMOUNT: 'min_purchase_amount',
      MIN_SESSION_COUNT: 'min_session_count',
      NEW_USER_ONLY: 'new_user_only',
      SPECIFIC_SERVICES: 'specific_services',
      GEOGRAPHIC_RESTRICTION: 'geographic_restriction',
      USER_TIER: 'user_tier',
      PREVIOUS_PURCHASE: 'previous_purchase'
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await auditService.logEvent({
        eventType: 'system_change',
        entityType: 'service',
        entityId: 'coupon_service',
        action: 'initialize',
        details: { timestamp: new Date().toISOString() }
      });

      this.initialized = true;
      logger.info('CouponService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize CouponService:', error);
      throw error;
    }
  }

  // Validación de datos de cupón
  validateCouponData(couponData) {
    const requiredFields = ['name', 'code', 'discountType', 'discountValue'];
    const missingFields = requiredFields.filter(field => !couponData[field]);

    if (missingFields.length > 0) {
      throw errorHandler.createValidationError(
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // Validar código del cupón
    if (!/^[A-Z0-9_-]{3,20}$/i.test(couponData.code)) {
      throw errorHandler.createValidationError(
        'Coupon code must be 3-20 characters and contain only letters, numbers, hyphens, and underscores'
      );
    }

    // Validar tipo de descuento
    if (!Object.values(this.discountTypes).includes(couponData.discountType)) {
      throw errorHandler.createValidationError(
        `Invalid discount type: ${couponData.discountType}`
      );
    }

    // Validar valor del descuento
    if (couponData.discountType === this.discountTypes.PERCENTAGE) {
      if (couponData.discountValue <= 0 || couponData.discountValue > 100) {
        throw errorHandler.createValidationError('Percentage discount must be between 0 and 100');
      }
    } else if ([this.discountTypes.FIXED_AMOUNT, this.discountTypes.FREE_SESSIONS].includes(couponData.discountType)) {
      if (couponData.discountValue <= 0) {
        throw errorHandler.createValidationError('Discount value must be greater than 0');
      }
    }

    // Validar fechas de validez
    if (couponData.validFrom && couponData.validTo) {
      const from = new Date(couponData.validFrom);
      const to = new Date(couponData.validTo);

      if (from >= to) {
        throw errorHandler.createValidationError('validFrom must be before validTo');
      }
    }

    // Validar límites de uso
    if (couponData.usageLimit && couponData.usageLimit <= 0) {
      throw errorHandler.createValidationError('Usage limit must be greater than 0');
    }

    if (couponData.userUsageLimit && couponData.userUsageLimit <= 0) {
      throw errorHandler.createValidationError('User usage limit must be greater than 0');
    }

    return true;
  }

  // Crear cupón
  async createCoupon(couponData, options = {}) {
    try {
      const { validateUniqueness = true, auditEvent = true } = options;

      // Validar datos del cupón
      this.validateCouponData(couponData);

      // Verificar unicidad del código
      if (validateUniqueness) {
        const existingCoupon = await this.getCouponByCode(couponData.code, { throwOnNotFound: false });
        if (existingCoupon) {
          throw errorHandler.createConflictError(`Coupon code '${couponData.code}' already exists`);
        }
      }

      // Procesar datos del cupón
      let processedData = {
        ...couponData,
        couponId: security.generateSecureId('cpn_'),
        status: this.couponStatus.DRAFT,
        currentUsage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Encriptar datos sensibles
      if (processedData.eligibilityConditions) {
        processedData.eligibilityConditions = await encryptSensitiveData(processedData.eligibilityConditions);
      }

      if (processedData.restrictions) {
        processedData.restrictions = await encryptSensitiveData(processedData.restrictions);
      }

      // Crear cupón
      const response = await apiClient.post(ENDPOINTS.coupons.base, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'promotional_change',
          entityType: 'coupon',
          entityId: response.data.couponId,
          action: 'create',
          userId: processedData.createdBy,
          details: {
            couponCode: processedData.code,
            discountType: processedData.discountType,
            discountValue: processedData.discountValue
          }
        });
      }

      logger.info('Coupon created', {
        couponId: response.data.couponId,
        code: processedData.code,
        discountType: processedData.discountType
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating coupon:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener cupón por ID
  async getCouponById(couponId, options = {}) {
    try {
      const { includeInactive = false, decryptSensitive = false } = options;
      const cacheKey = `${this.cachePrefix}${couponId}_${includeInactive}_${decryptSensitive}`;

      // Verificar cache
      let couponData = cache.get(cacheKey);
      if (couponData) {
        return couponData;
      }

      const params = { includeInactive };
      const response = await apiClient.get(`${ENDPOINTS.coupons.base}/${couponId}`, { params });

      couponData = response.data;

      // Desencriptar datos sensibles si es necesario
      if (decryptSensitive && couponData.eligibilityConditions) {
        couponData.eligibilityConditions = await decryptSensitiveData(couponData.eligibilityConditions);
      }

      if (decryptSensitive && couponData.restrictions) {
        couponData.restrictions = await decryptSensitiveData(couponData.restrictions);
      }

      // Guardar en cache
      cache.set(cacheKey, couponData, this.cacheTimeout);

      return couponData;
    } catch (error) {
      logger.error('Error getting coupon by ID:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener cupón por código
  async getCouponByCode(code, options = {}) {
    try {
      const { includeInactive = false, throwOnNotFound = true } = options;
      const cacheKey = `${this.cachePrefix}code_${code}_${includeInactive}`;

      // Verificar cache
      let couponData = cache.get(cacheKey);
      if (couponData) {
        return couponData;
      }

      const params = { includeInactive };

      try {
        const response = await apiClient.get(`${ENDPOINTS.coupons.byCode}/${code}`, { params });
        couponData = response.data;

        // Guardar en cache
        cache.set(cacheKey, couponData, this.cacheTimeout);

        return couponData;
      } catch (error) {
        if (error.response?.status === 404 && !throwOnNotFound) {
          return null;
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error getting coupon by code:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Listar cupones con filtros
  async getCoupons(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeInactive = false
      } = options;

      const cacheKey = `${this.cachePrefix}list_${JSON.stringify(filters)}_${page}_${limit}_${sortBy}_${sortOrder}_${includeInactive}`;

      // Verificar cache
      let coupons = cache.get(cacheKey);
      if (coupons) {
        return coupons;
      }

      const params = {
        ...filters,
        page,
        limit,
        sortBy,
        sortOrder,
        includeInactive
      };

      const response = await apiClient.get(ENDPOINTS.coupons.base, { params });
      coupons = response.data;

      // Guardar en cache
      cache.set(cacheKey, coupons, this.cacheTimeout);

      return coupons;
    } catch (error) {
      logger.error('Error getting coupons:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Actualizar cupón
  async updateCoupon(couponId, updateData, options = {}) {
    try {
      const { validateCode = true, auditEvent = true } = options;

      // Validar datos si incluyen campos críticos
      if (updateData.code || updateData.discountType || updateData.discountValue) {
        const currentCoupon = await this.getCouponById(couponId);
        this.validateCouponData({ ...currentCoupon, ...updateData });
      }

      // Verificar unicidad del código si se está actualizando
      if (validateCode && updateData.code) {
        const existingCoupon = await this.getCouponByCode(updateData.code, { throwOnNotFound: false });
        if (existingCoupon && existingCoupon.couponId !== couponId) {
          throw errorHandler.createConflictError(`Coupon code '${updateData.code}' already exists`);
        }
      }

      // Procesar datos de actualización
      let processedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Encriptar datos sensibles si están incluidos
      if (processedData.eligibilityConditions) {
        processedData.eligibilityConditions = await encryptSensitiveData(processedData.eligibilityConditions);
      }

      if (processedData.restrictions) {
        processedData.restrictions = await encryptSensitiveData(processedData.restrictions);
      }

      const response = await apiClient.put(`${ENDPOINTS.coupons.base}/${couponId}`, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache(couponId);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'promotional_change',
          entityType: 'coupon',
          entityId: couponId,
          action: 'update',
          userId: processedData.updatedBy,
          details: {
            updatedFields: Object.keys(updateData),
            sensitiveFields: ['eligibilityConditions', 'restrictions'].filter(field => updateData[field])
          }
        });
      }

      logger.info('Coupon updated', {
        couponId,
        updatedFields: Object.keys(updateData)
      });

      return response.data;
    } catch (error) {
      logger.error('Error updating coupon:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Activar/Desactivar cupón
  async toggleCouponStatus(couponId, status, options = {}) {
    try {
      const { auditEvent = true, userId } = options;

      if (!Object.values(this.couponStatus).includes(status)) {
        throw errorHandler.createValidationError(`Invalid coupon status: ${status}`);
      }

      const updateData = {
        status,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      };

      if (status === this.couponStatus.ACTIVE) {
        updateData.activatedAt = new Date().toISOString();
      }

      const response = await apiClient.put(`${ENDPOINTS.coupons.base}/${couponId}/status`, updateData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache(couponId);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'promotional_change',
          entityType: 'coupon',
          entityId: couponId,
          action: 'status_change',
          userId: userId,
          details: {
            newStatus: status,
            timestamp: new Date().toISOString()
          }
        });
      }

      logger.info('Coupon status changed', {
        couponId,
        newStatus: status
      });

      return response.data;
    } catch (error) {
      logger.error('Error changing coupon status:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Validar cupón para uso
  async validateCoupon(code, validationContext = {}, options = {}) {
    try {
      const { userId, purchaseAmount, sessionCount, serviceIds, autoApply = false } = validationContext;
      const { auditEvent = true } = options;

      const params = {
        code,
        userId,
        purchaseAmount,
        sessionCount,
        serviceIds: serviceIds ? serviceIds.join(',') : undefined,
        validateOnly: !autoApply
      };

      const response = await apiClient.post(ENDPOINTS.coupons.validate, params);

      // Auditoría de validación
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'promotional_access',
          entityType: 'coupon',
          entityId: response.data.couponId,
          action: 'validate',
          userId: userId,
          details: {
            couponCode: code,
            isValid: response.data.isValid,
            validationContext: {
              purchaseAmount,
              sessionCount,
              serviceCount: serviceIds?.length || 0
            }
          }
        });
      }

      return response.data;
    } catch (error) {
      logger.error('Error validating coupon:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Aplicar cupón
  async applyCoupon(code, applicationContext = {}, options = {}) {
    try {
      const { userId, orderId, purchaseAmount, sessionCount, serviceIds } = applicationContext;
      const { auditEvent = true } = options;

      // Validar cupón antes de aplicar
      const validation = await this.validateCoupon(code, {
        userId,
        purchaseAmount,
        sessionCount,
        serviceIds
      }, { auditEvent: false });

      if (!validation.isValid) {
        throw errorHandler.createValidationError(`Coupon '${code}' is not valid: ${validation.reason}`);
      }

      const applicationData = {
        code,
        userId,
        orderId,
        purchaseAmount,
        sessionCount,
        serviceIds,
        appliedAt: new Date().toISOString()
      };

      const response = await apiClient.post(ENDPOINTS.coupons.apply, applicationData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache(response.data.couponId);

      // Auditoría de aplicación
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'promotional_use',
          entityType: 'coupon',
          entityId: response.data.couponId,
          action: 'apply',
          userId: userId,
          details: {
            couponCode: code,
            orderId,
            discountAmount: response.data.discountAmount,
            finalAmount: response.data.finalAmount
          }
        });
      }

      logger.info('Coupon applied', {
        couponId: response.data.couponId,
        code,
        userId,
        orderId,
        discountAmount: response.data.discountAmount
      });

      return response.data;
    } catch (error) {
      logger.error('Error applying coupon:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Revocar uso de cupón
  async revokeCouponUsage(usageId, options = {}) {
    try {
      const { auditEvent = true, userId, reason } = options;

      const revocationData = {
        usageId,
        revokedBy: userId,
        revokedAt: new Date().toISOString(),
        reason
      };

      const response = await apiClient.post(`${ENDPOINTS.coupons.usage}/${usageId}/revoke`, revocationData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría de revocación
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'promotional_change',
          entityType: 'coupon_usage',
          entityId: usageId,
          action: 'revoke',
          userId: userId,
          details: {
            reason,
            refundAmount: response.data.refundAmount
          }
        });
      }

      logger.info('Coupon usage revoked', {
        usageId,
        reason,
        refundAmount: response.data.refundAmount
      });

      return response.data;
    } catch (error) {
      logger.error('Error revoking coupon usage:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener estadísticas de cupones
  async getCouponStatistics(filters = {}, options = {}) {
    try {
      const { dateRange, groupBy = 'coupon' } = options;
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

      const response = await apiClient.get(`${ENDPOINTS.coupons.base}/statistics`, { params });
      stats = response.data;

      // Guardar en cache por menos tiempo para estadísticas
      cache.set(cacheKey, stats, 10 * 60 * 1000); // 10 minutos

      return stats;
    } catch (error) {
      logger.error('Error getting coupon statistics:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener historial de uso de cupón
  async getCouponUsageHistory(couponId, options = {}) {
    try {
      const { page = 1, limit = 20, dateRange } = options;
      const cacheKey = `${this.cachePrefix}usage_${couponId}_${page}_${limit}_${JSON.stringify(dateRange)}`;

      // Verificar cache
      let usage = cache.get(cacheKey);
      if (usage) {
        return usage;
      }

      const params = {
        page,
        limit,
        dateRange: dateRange ? JSON.stringify(dateRange) : undefined
      };

      const response = await apiClient.get(`${ENDPOINTS.coupons.base}/${couponId}/usage`, { params });
      usage = response.data;

      // Guardar en cache
      cache.set(cacheKey, usage, this.cacheTimeout);

      return usage;
    } catch (error) {
      logger.error('Error getting coupon usage history:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Generar código de cupón único
  async generateCouponCode(prefix = '', options = {}) {
    try {
      const { length = 8, type = 'alphanumeric', ensureUniqueness = true } = options;

      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const code = this.createCouponCode(prefix, length, type);

        if (ensureUniqueness) {
          const existing = await this.getCouponByCode(code, { throwOnNotFound: false });
          if (!existing) {
            return code;
          }
        } else {
          return code;
        }

        attempts++;
      }

      throw errorHandler.createValidationError('Unable to generate unique coupon code after maximum attempts');
    } catch (error) {
      logger.error('Error generating coupon code:', error);
      throw error;
    }
  }

  createCouponCode(prefix, length, type) {
    const chars = {
      alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      alphabetic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numeric: '0123456789'
    };

    const charset = chars[type] || chars.alphanumeric;
    let code = prefix;

    for (let i = 0; i < length; i++) {
      code += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return code;
  }

  // Crear cupón masivo
  async createBulkCoupons(couponTemplate, quantity, options = {}) {
    try {
      const { batchSize = 100, auditEvent = true } = options;

      const bulkData = {
        template: couponTemplate,
        quantity,
        batchSize,
        createdAt: new Date().toISOString()
      };

      const response = await apiClient.post(ENDPOINTS.coupons.bulk, bulkData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría de creación masiva
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'promotional_change',
          entityType: 'coupon',
          entityId: 'bulk_creation',
          action: 'bulk_create',
          userId: couponTemplate.createdBy,
          details: {
            quantity,
            templateType: couponTemplate.type,
            discountType: couponTemplate.discountType,
            jobId: response.data.jobId
          }
        });
      }

      logger.info('Bulk coupon creation initiated', {
        quantity,
        jobId: response.data.jobId,
        templateType: couponTemplate.type
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating bulk coupons:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Exportar cupones
  async exportCoupons(filters = {}, format = 'json') {
    try {
      const params = {
        ...filters,
        format,
        export: true
      };

      const response = await apiClient.get(ENDPOINTS.coupons.base, { params });

      // Log de exportación
      await auditService.logEvent({
        eventType: 'data_export',
        entityType: 'coupon',
        entityId: 'bulk_export',
        action: 'export',
        details: {
          format,
          filters,
          recordCount: response.data.length || response.data.total
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error exporting coupons:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Verificar si cupón está válido para fecha específica
  isCouponValid(couponData, targetDate = new Date()) {
    const now = targetDate instanceof Date ? targetDate : new Date(targetDate);

    // Verificar estado
    if (couponData.status !== this.couponStatus.ACTIVE) {
      return { valid: false, reason: 'Coupon is not active' };
    }

    // Verificar fechas de validez
    if (couponData.validFrom && new Date(couponData.validFrom) > now) {
      return { valid: false, reason: 'Coupon is not yet valid' };
    }

    if (couponData.validTo && new Date(couponData.validTo) < now) {
      return { valid: false, reason: 'Coupon has expired' };
    }

    // Verificar límites de uso
    if (couponData.usageLimit && couponData.currentUsage >= couponData.usageLimit) {
      return { valid: false, reason: 'Coupon usage limit exceeded' };
    }

    return { valid: true };
  }

  // Invalidar cache relacionado
  invalidateRelatedCache(couponId = null) {
    try {
      if (couponId) {
        // Invalidar cache específico del cupón
        const patterns = [
          `${this.cachePrefix}${couponId}*`,
          `${this.cachePrefix}code_*`,
          `${this.cachePrefix}list*`,
          `${this.cachePrefix}stats*`,
          `${this.cachePrefix}usage_${couponId}*`
        ];

        patterns.forEach(pattern => cache.deleteByPattern(pattern));
      } else {
        // Invalidar todo el cache de cupones
        cache.deleteByPattern(`${this.cachePrefix}*`);
      }

      // También invalidar cache de API relacionado
      apiCache.deleteByPattern('coupons*');
      apiCache.deleteByPattern('promotional*');

    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }

  // Limpiar cache
  clearCache() {
    try {
      cache.deleteByPattern(`${this.cachePrefix}*`);
      logger.info('CouponService cache cleared');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  // Verificar salud del servicio
  async checkHealth() {
    try {
      const healthData = {
        service: 'CouponService',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cache: {
          size: cache.size(),
          enabled: true
        }
      };

      // Verificar conectividad básica
      await apiClient.get(`${ENDPOINTS.coupons.base}/health`);

      return healthData;
    } catch (error) {
      return {
        service: 'CouponService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Crear instancia única del servicio
export const couponService = new CouponService();

// Métodos de conveniencia para exportación directa
export const createCoupon = (couponData, options) => couponService.createCoupon(couponData, options);
export const getCouponById = (couponId, options) => couponService.getCouponById(couponId, options);
export const getCouponByCode = (code, options) => couponService.getCouponByCode(code, options);
export const getCoupons = (filters, options) => couponService.getCoupons(filters, options);
export const updateCoupon = (couponId, updateData, options) => couponService.updateCoupon(couponId, updateData, options);
export const toggleCouponStatus = (couponId, status, options) => couponService.toggleCouponStatus(couponId, status, options);
export const validateCoupon = (code, validationContext, options) => couponService.validateCoupon(code, validationContext, options);
export const applyCoupon = (code, applicationContext, options) => couponService.applyCoupon(code, applicationContext, options);
export const revokeCouponUsage = (usageId, options) => couponService.revokeCouponUsage(usageId, options);
export const getCouponStatistics = (filters, options) => couponService.getCouponStatistics(filters, options);
export const getCouponUsageHistory = (couponId, options) => couponService.getCouponUsageHistory(couponId, options);
export const generateCouponCode = (prefix, options) => couponService.generateCouponCode(prefix, options);
export const createBulkCoupons = (couponTemplate, quantity, options) => couponService.createBulkCoupons(couponTemplate, quantity, options);
export const exportCoupons = (filters, format) => couponService.exportCoupons(filters, format);

export default couponService;