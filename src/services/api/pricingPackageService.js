import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { cache, apiCache } from '../utils/cache';
import { privacy, encryptSensitiveData, decryptSensitiveData } from '../utils/privacy';
import { security, generateSecureId } from '../utils/security';
import { auditService } from '../utils/auditService';

class PricingPackageService {
  constructor() {
    this.cachePrefix = 'pricingPackage_';
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutos
    this.maxRetries = 3;
    this.auditContext = 'pricing_package_service';

    // Estados de paquetes
    this.packageStatus = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      DRAFT: 'draft',
      ARCHIVED: 'archived',
      EXPIRED: 'expired'
    };

    // Tipos de paquetes - Adaptado para servicios terapéuticos
    this.packageTypes = {
      THERAPY_SESSION_BUNDLE: 'therapy_session_bundle',
      SPECIALIZED_PROGRAM: 'specialized_program',
      ASSESSMENT_PACKAGE: 'assessment_package',
      MAINTENANCE_PLAN: 'maintenance_plan',
      INTENSIVE_TREATMENT: 'intensive_treatment',
      GROUP_THERAPY: 'group_therapy',
      FAMILY_THERAPY: 'family_therapy',
      COUPLES_THERAPY: 'couples_therapy'
    };

    // Tipos de descuento - Para servicios de salud mental
    this.discountTypes = {
      PERCENTAGE: 'percentage',
      FIXED_AMOUNT: 'fixed_amount',
      SESSIONS_FREE: 'sessions_free',
      EARLY_BIRD: 'early_bird',
      STUDENT_DISCOUNT: 'student_discount',
      SENIOR_DISCOUNT: 'senior_discount',
      SOLIDARITY_PRICING: 'solidarity_pricing',
      INSURANCE_COPAY: 'insurance_copay'
    };

    // Frecuencias de suscripción
    this.subscriptionFrequencies = {
      WEEKLY: 'weekly',
      BIWEEKLY: 'biweekly',
      MONTHLY: 'monthly',
      QUARTERLY: 'quarterly',
      SEMI_ANNUAL: 'semi_annual',
      ANNUAL: 'annual'
    };

    // Características incluidas - Específicas para terapia
    this.includedFeatures = {
      PRIORITY_SCHEDULING: 'priority_scheduling',
      EXTENDED_SESSIONS: 'extended_sessions', // 90 min vs 50 min
      HOME_VISITS: 'home_visits',
      TELETHERAPY_ACCESS: 'teletherapy_access',
      CRISIS_SUPPORT: 'crisis_support',
      PROGRESS_TRACKING: 'progress_tracking',
      FAMILY_SESSIONS: 'family_sessions',
      GROUP_SESSIONS: 'group_sessions',
      PSYCHOEDUCATIONAL_MATERIALS: 'psychoeducational_materials',
      FLEXIBLE_CANCELLATION: 'flexible_cancellation',
      THERAPIST_MATCHING: 'therapist_matching',
      HOMEWORK_ASSIGNMENTS: 'homework_assignments',
      DIGITAL_WORKBOOKS: 'digital_workbooks',
      MINDFULNESS_RESOURCES: 'mindfulness_resources',
      OUTCOME_ASSESSMENTS: 'outcome_assessments',
      RELAPSE_PREVENTION: 'relapse_prevention',
      PEER_SUPPORT_ACCESS: 'peer_support_access',
      PSYCHIATRIC_CONSULTATION: 'psychiatric_consultation',
      CASE_MANAGEMENT: 'case_management',
      CULTURAL_ADAPTATION: 'cultural_adaptation'
    };

    // Métricas de rendimiento
    this.packageMetrics = {
      TOTAL_PACKAGES: 'total_packages',
      ACTIVE_PACKAGES: 'active_packages',
      REVENUE_BY_PACKAGE: 'revenue_by_package',
      CONVERSION_RATE: 'conversion_rate',
      MOST_POPULAR: 'most_popular',
      AVERAGE_PACKAGE_VALUE: 'average_package_value',
      CHURN_RATE: 'churn_rate',
      UTILIZATION_RATE: 'utilization_rate'
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await auditService.logEvent({
        eventType: 'system_change',
        entityType: 'service',
        entityId: 'pricing_package_service',
        action: 'initialize',
        details: { timestamp: new Date().toISOString() }
      });

      this.initialized = true;
      logger.info('PricingPackageService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize PricingPackageService:', error);
      throw error;
    }
  }

  // Validación de datos de paquete
  validatePackageData(packageData) {
    const requiredFields = ['name', 'type', 'currency'];
    const missingFields = requiredFields.filter(field => !packageData[field]);

    if (missingFields.length > 0) {
      throw errorHandler.createValidationError(
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // Validar tipo de paquete
    if (!Object.values(this.packageTypes).includes(packageData.type)) {
      throw errorHandler.createValidationError(
        `Invalid package type: ${packageData.type}`
      );
    }

    // Validar precios según el tipo
    if (packageData.type === this.packageTypes.SESSION_BUNDLE && !packageData.sessionCount) {
      throw errorHandler.createValidationError('Session bundles require sessionCount');
    }

    if (packageData.type === this.packageTypes.SUBSCRIPTION && !packageData.frequency) {
      throw errorHandler.createValidationError('Subscriptions require frequency');
    }

    // Validar descuentos
    if (packageData.discount) {
      this.validateDiscountData(packageData.discount);
    }

    // Validar fechas
    if (packageData.validFrom && packageData.validTo) {
      const from = new Date(packageData.validFrom);
      const to = new Date(packageData.validTo);

      if (from >= to) {
        throw errorHandler.createValidationError('validFrom must be before validTo');
      }
    }

    return true;
  }

  validateDiscountData(discountData) {
    if (!Object.values(this.discountTypes).includes(discountData.type)) {
      throw errorHandler.createValidationError(
        `Invalid discount type: ${discountData.type}`
      );
    }

    if (discountData.type === this.discountTypes.PERCENTAGE) {
      if (!discountData.percentage || discountData.percentage <= 0 || discountData.percentage > 100) {
        throw errorHandler.createValidationError('Percentage discount must be between 0 and 100');
      }
    }

    if (discountData.type === this.discountTypes.FIXED_AMOUNT) {
      if (!discountData.amount || discountData.amount <= 0) {
        throw errorHandler.createValidationError('Fixed amount discount must be greater than 0');
      }
    }

    return true;
  }

  // Crear paquete de precios
  async createPackage(packageData, options = {}) {
    try {
      const { validateConflicts = true, auditEvent = true } = options;

      // Validar datos del paquete
      this.validatePackageData(packageData);

      // Verificar conflictos con paquetes existentes
      if (validateConflicts) {
        const conflicts = await this.checkPackageConflicts(packageData);
        if (conflicts.hasConflicts) {
          throw errorHandler.createConflictError('Package conflicts with existing packages', conflicts.conflicts);
        }
      }

      // Procesar datos del paquete
      let processedData = {
        ...packageData,
        packageId: security.generateSecureId('pkg_'),
        status: this.packageStatus.DRAFT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Encriptar datos sensibles
      if (processedData.pricing) {
        processedData.pricing = await encryptSensitiveData(processedData.pricing);
      }

      if (processedData.features) {
        processedData.features = await encryptSensitiveData(processedData.features);
      }

      // Crear paquete
      const response = await apiClient.post(ENDPOINTS.pricing.packages, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache(response.data.packageId);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'financial_change',
          entityType: 'pricing_package',
          entityId: response.data.packageId,
          action: 'create',
          userId: processedData.createdBy,
          details: {
            packageType: processedData.type,
            currency: processedData.currency,
            pricing: 'encrypted'
          }
        });
      }

      logger.info('Pricing package created', {
        packageId: response.data.packageId,
        type: processedData.type,
        status: processedData.status
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating pricing package:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener paquete por ID
  async getPackageById(packageId, options = {}) {
    try {
      const { includeInactive = false, decryptSensitive = false } = options;
      const cacheKey = `${this.cachePrefix}${packageId}_${includeInactive}_${decryptSensitive}`;

      // Verificar cache
      let packageData = cache.get(cacheKey);
      if (packageData) {
        return packageData;
      }

      const params = { includeInactive };
      const response = await apiClient.get(`${ENDPOINTS.pricing.packages}/${packageId}`, { params });

      packageData = response.data;

      // Desencriptar datos sensibles si es necesario
      if (decryptSensitive && packageData.pricing) {
        packageData.pricing = await decryptSensitiveData(packageData.pricing);
      }

      if (decryptSensitive && packageData.features) {
        packageData.features = await decryptSensitiveData(packageData.features);
      }

      // Guardar en cache
      cache.set(cacheKey, packageData, this.cacheTimeout);

      return packageData;
    } catch (error) {
      logger.error('Error getting package by ID:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Listar paquetes con filtros
  async getPackages(filters = {}, options = {}) {
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
      let packages = cache.get(cacheKey);
      if (packages) {
        return packages;
      }

      const params = {
        ...filters,
        page,
        limit,
        sortBy,
        sortOrder,
        includeInactive
      };

      const response = await apiClient.get(ENDPOINTS.pricing.packages, { params });
      packages = response.data;

      // Guardar en cache
      cache.set(cacheKey, packages, this.cacheTimeout);

      return packages;
    } catch (error) {
      logger.error('Error getting packages:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Actualizar paquete
  async updatePackage(packageId, updateData, options = {}) {
    try {
      const { validateConflicts = true, auditEvent = true } = options;

      // Validar datos de actualización
      if (updateData.type || updateData.pricing || updateData.discount) {
        this.validatePackageData({ ...await this.getPackageById(packageId), ...updateData });
      }

      // Verificar conflictos si hay cambios relevantes
      if (validateConflicts && (updateData.name || updateData.type || updateData.pricing)) {
        const packageData = await this.getPackageById(packageId);
        const conflicts = await this.checkPackageConflicts({ ...packageData, ...updateData }, packageId);
        if (conflicts.hasConflicts) {
          throw errorHandler.createConflictError('Package update conflicts with existing packages', conflicts.conflicts);
        }
      }

      // Procesar datos de actualización
      let processedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Encriptar datos sensibles si están incluidos
      if (processedData.pricing) {
        processedData.pricing = await encryptSensitiveData(processedData.pricing);
      }

      if (processedData.features) {
        processedData.features = await encryptSensitiveData(processedData.features);
      }

      const response = await apiClient.put(`${ENDPOINTS.pricing.packages}/${packageId}`, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache(packageId);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'financial_change',
          entityType: 'pricing_package',
          entityId: packageId,
          action: 'update',
          userId: processedData.updatedBy,
          details: {
            updatedFields: Object.keys(updateData),
            sensitiveFields: ['pricing', 'features'].filter(field => updateData[field])
          }
        });
      }

      logger.info('Pricing package updated', {
        packageId,
        updatedFields: Object.keys(updateData)
      });

      return response.data;
    } catch (error) {
      logger.error('Error updating pricing package:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Activar/Desactivar paquete
  async togglePackageStatus(packageId, status, options = {}) {
    try {
      const { auditEvent = true, userId } = options;

      if (!Object.values(this.packageStatus).includes(status)) {
        throw errorHandler.createValidationError(`Invalid package status: ${status}`);
      }

      const updateData = {
        status,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      };

      if (status === this.packageStatus.ACTIVE) {
        updateData.activatedAt = new Date().toISOString();
      }

      const response = await apiClient.put(`${ENDPOINTS.pricing.packages}/${packageId}/status`, updateData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache(packageId);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'financial_change',
          entityType: 'pricing_package',
          entityId: packageId,
          action: 'status_change',
          userId: userId,
          details: {
            newStatus: status,
            timestamp: new Date().toISOString()
          }
        });
      }

      logger.info('Pricing package status changed', {
        packageId,
        newStatus: status
      });

      return response.data;
    } catch (error) {
      logger.error('Error changing package status:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Verificar conflictos de paquetes
  async checkPackageConflicts(packageData, excludePackageId = null) {
    try {
      const params = {
        name: packageData.name,
        type: packageData.type,
        status: this.packageStatus.ACTIVE,
        excludePackageId
      };

      const response = await apiClient.get(`${ENDPOINTS.pricing.packages}/conflicts`, { params });
      return response.data;
    } catch (error) {
      logger.error('Error checking package conflicts:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener paquetes por tipo
  async getPackagesByType(packageType, options = {}) {
    try {
      const { includeInactive = false } = options;

      if (!Object.values(this.packageTypes).includes(packageType)) {
        throw errorHandler.createValidationError(`Invalid package type: ${packageType}`);
      }

      const filters = { type: packageType };
      return await this.getPackages(filters, { ...options, includeInactive });
    } catch (error) {
      logger.error('Error getting packages by type:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener paquetes activos
  async getActivePackages(options = {}) {
    try {
      const filters = { status: this.packageStatus.ACTIVE };
      return await this.getPackages(filters, options);
    } catch (error) {
      logger.error('Error getting active packages:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Calcular precio del paquete
  async calculatePackagePrice(packageId, options = {}) {
    try {
      const { sessionCount, additionalFeatures = [], promoCode } = options;

      const params = {
        sessionCount,
        additionalFeatures: additionalFeatures.join(','),
        promoCode
      };

      const response = await apiClient.get(`${ENDPOINTS.pricing.packages}/${packageId}/calculate`, { params });

      // Log de cálculo para auditoría
      await auditService.logEvent({
        eventType: 'financial_access',
        entityType: 'pricing_package',
        entityId: packageId,
        action: 'price_calculation',
        details: {
          sessionCount,
          additionalFeatures,
          promoCode: promoCode ? 'provided' : 'none',
          calculatedPrice: response.data.totalPrice
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error calculating package price:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener estadísticas de paquetes
  async getPackageStatistics(filters = {}, options = {}) {
    try {
      const { dateRange, groupBy = 'package' } = options;
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

      const response = await apiClient.get(`${ENDPOINTS.pricing.packages}/statistics`, { params });
      stats = response.data;

      // Guardar en cache por menos tiempo para estadísticas
      cache.set(cacheKey, stats, 10 * 60 * 1000); // 10 minutos

      // Log de acceso a estadísticas
      await auditService.logEvent({
        eventType: 'data_access',
        entityType: 'pricing_package',
        entityId: 'statistics',
        action: 'view',
        details: {
          filters,
          groupBy,
          dateRange
        }
      });

      return stats;
    } catch (error) {
      logger.error('Error getting package statistics:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Duplicar paquete
  async duplicatePackage(packageId, newName, options = {}) {
    try {
      const { auditEvent = true, userId } = options;

      // Obtener paquete original
      const originalPackage = await this.getPackageById(packageId, { decryptSensitive: true });

      // Crear datos del nuevo paquete
      const newPackageData = {
        ...originalPackage,
        name: newName,
        status: this.packageStatus.DRAFT,
        createdBy: userId
      };

      // Remover campos que no deben duplicarse
      delete newPackageData.packageId;
      delete newPackageData.createdAt;
      delete newPackageData.updatedAt;
      delete newPackageData.activatedAt;

      // Crear el nuevo paquete
      const newPackage = await this.createPackage(newPackageData, { auditEvent });

      logger.info('Package duplicated', {
        originalPackageId: packageId,
        newPackageId: newPackage.packageId,
        newName
      });

      return newPackage;
    } catch (error) {
      logger.error('Error duplicating package:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Exportar paquetes
  async exportPackages(filters = {}, format = 'json') {
    try {
      const params = {
        ...filters,
        format,
        export: true
      };

      const response = await apiClient.get(ENDPOINTS.pricing.packages, { params });

      // Log de exportación
      await auditService.logEvent({
        eventType: 'data_export',
        entityType: 'pricing_package',
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
      logger.error('Error exporting packages:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Validar fecha de vigencia del paquete
  isPackageValid(packageData, targetDate = new Date()) {
    const now = targetDate instanceof Date ? targetDate : new Date(targetDate);

    if (packageData.status !== this.packageStatus.ACTIVE) {
      return false;
    }

    if (packageData.validFrom && new Date(packageData.validFrom) > now) {
      return false;
    }

    if (packageData.validTo && new Date(packageData.validTo) < now) {
      return false;
    }

    return true;
  }

  // Obtener paquetes válidos para una fecha
  async getValidPackages(targetDate = new Date(), options = {}) {
    try {
      const allPackages = await this.getActivePackages(options);

      const validPackages = allPackages.data.filter(pkg =>
        this.isPackageValid(pkg, targetDate)
      );

      return {
        ...allPackages,
        data: validPackages,
        total: validPackages.length
      };
    } catch (error) {
      logger.error('Error getting valid packages:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Invalidar cache relacionado
  invalidateRelatedCache(packageId = null) {
    try {
      if (packageId) {
        // Invalidar cache específico del paquete
        const patterns = [
          `${this.cachePrefix}${packageId}*`,
          `${this.cachePrefix}list*`,
          `${this.cachePrefix}stats*`
        ];

        patterns.forEach(pattern => cache.deleteByPattern(pattern));
      } else {
        // Invalidar todo el cache de paquetes
        cache.deleteByPattern(`${this.cachePrefix}*`);
      }

      // También invalidar cache de API relacionado
      apiCache.deleteByPattern('pricing*');
      apiCache.deleteByPattern('packages*');

    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }

  // Limpiar cache
  clearCache() {
    try {
      cache.deleteByPattern(`${this.cachePrefix}*`);
      logger.info('PricingPackageService cache cleared');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  // Verificar salud del servicio
  async checkHealth() {
    try {
      const healthData = {
        service: 'PricingPackageService',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cache: {
          size: cache.size(),
          enabled: true
        }
      };

      // Verificar conectividad básica
      await apiClient.get(`${ENDPOINTS.pricing.packages}/health`);

      return healthData;
    } catch (error) {
      return {
        service: 'PricingPackageService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Crear instancia única del servicio
export const pricingPackageService = new PricingPackageService();

// Métodos de conveniencia para exportación directa
export const createPackage = (packageData, options) => pricingPackageService.createPackage(packageData, options);
export const getPackageById = (packageId, options) => pricingPackageService.getPackageById(packageId, options);
export const getPackages = (filters, options) => pricingPackageService.getPackages(filters, options);
export const updatePackage = (packageId, updateData, options) => pricingPackageService.updatePackage(packageId, updateData, options);
export const togglePackageStatus = (packageId, status, options) => pricingPackageService.togglePackageStatus(packageId, status, options);
export const getPackagesByType = (packageType, options) => pricingPackageService.getPackagesByType(packageType, options);
export const getActivePackages = (options) => pricingPackageService.getActivePackages(options);
export const calculatePackagePrice = (packageId, options) => pricingPackageService.calculatePackagePrice(packageId, options);
export const getPackageStatistics = (filters, options) => pricingPackageService.getPackageStatistics(filters, options);
export const duplicatePackage = (packageId, newName, options) => pricingPackageService.duplicatePackage(packageId, newName, options);
export const exportPackages = (filters, format) => pricingPackageService.exportPackages(filters, format);
export const getValidPackages = (targetDate, options) => pricingPackageService.getValidPackages(targetDate, options);

export default pricingPackageService;