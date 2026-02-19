// Archivo principal de exportación de servicios

// Configuración principal
export { default as apiClient, apiMethods, api } from './config/apiClient';
import apiClientInstance from './config/apiClient';

// Import services for default export
import { authService } from './api/authService';
import { userService } from './api/userService';
import { professionalProfileService } from './api/professionalProfileService';
import { credentialsService } from './api/credentialsService';
import { verificationService } from './api/verificationService';
import { clientService } from './api/clientService';
import { clientPlanProgressService } from './api/clientPlanProgressService';
import { sessionNoteService } from './api/sessionNoteService';
import { bookingService } from './api/bookingService';
import { availabilityService } from './api/availabilityService';
import { workLocationService } from './api/workLocationService';
import { therapyPlanService } from './api/therapyPlanService';
import { planAssignmentService } from './api/planAssignmentService';
import { chatService } from './api/chatService';
import { notificationService } from './api/notificationService';
import { notificationSettingsService } from './api/notificationSettingsService';
import { paymentService } from './api/paymentService';
import { ratesService } from './api/ratesService';
import { pricingPackageService } from './api/pricingPackageService';
import { couponService } from './api/couponService';
import { documentService } from './api/documentService';
import { reviewService } from './api/reviewService';
import { subscriptionService } from './api/subscriptionService';
import { integrationService } from './api/integrationService';
import { webhookService } from './api/webhookService';
import { auditLogService } from './api/auditLogService';
import { tokenManager } from './utils/tokenManager';
import { errorHandler } from './utils/errorHandler';
import { logger } from './utils/logger';
import { security } from './utils/security';
import { privacy } from './utils/privacy';
import { auditService } from './utils/auditService';
import { storage } from './utils/storage';
import { cache } from './utils/cache';
import { validators } from './utils/validators';
import { formatters } from './utils/formatters';
import { fileHandler } from './utils/fileHandler';
import { securityAudit, dataAudit, complianceAudit } from './api/auditLogService';
import { useAuth } from './hooks/useAuth.jsx';
import { useApi } from './hooks/useApi';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDebounce } from './hooks/useDebounce';
import { usePagination } from './hooks/usePagination';
import { ENVIRONMENTS } from './config/environments';
import { APP_CONSTANTS } from './config/constants';
import { ENDPOINTS } from './config/endpoints';

export { ENDPOINTS, buildEndpoint, buildQueryString, buildFullUrl } from './config/endpoints';
export { ENVIRONMENTS } from './config/environments';
export { APP_CONSTANTS } from './config/constants';

// Utilidades principales
export { tokenManager } from './utils/tokenManager';
export { errorHandler } from './utils/errorHandler';
export { logger } from './utils/logger';
export { security } from './utils/security';
export { privacy } from './utils/privacy';
export { auditService } from './utils/auditService';
export { storage, userStorage, settingsStorage, cacheStorage } from './utils/storage';
export { cache, userCache, apiCache, staticCache } from './utils/cache';

// Servicio de logs de auditoría
export {
  auditLogService,
  securityAudit,
  dataAudit,
  complianceAudit
} from './api/auditLogService';

// Utilidades avanzadas
export { validators } from './utils/validators';
export { formatters } from './utils/formatters';
export { fileHandler } from './utils/fileHandler';

// Custom React Hooks
export { useAuth, AuthProvider, withAuth, useAuthGuard } from './hooks/useAuth.jsx';
export { useApi, useGet, usePost, usePut, useDelete, usePatch, useInfiniteApi } from './hooks/useApi';
export { useLocalStorage, useSessionStorage, useStoredObject, useStoredArray, useStoredPrimitive, useStoredBoolean, useStoredList, useUserPreferences, useFormPersistence } from './hooks/useLocalStorage';
export { useDebounce, useDebouncedFunction, useDebouncedCallback, useDebouncedEffect, useDebouncedApi, useDebouncedSearch, useThrottle } from './hooks/useDebounce';
export { usePagination, useInfiniteScroll, useCursorPagination } from './hooks/usePagination';

// Servicios de API principales
export {
  authService,
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  hasPermission,
  hasRole
} from './api/authService';

// Servicios de API avanzados
export { userService } from './api/userService';
export { professionalProfileService } from './api/professionalProfileService';
export { credentialsService } from './api/credentialsService';
export { verificationService } from './api/verificationService';

// Servicios de gestión de clientes y terapia
export { clientService } from './api/clientService';
export { clientPlanProgressService } from './api/clientPlanProgressService';
export { sessionNoteService } from './api/sessionNoteService';

// Servicios de gestión de citas y disponibilidad
export { bookingService } from './api/bookingService';
export { availabilityService } from './api/availabilityService';
export { workLocationService } from './api/workLocationService';

// Servicios de planes terapéuticos y asignaciones
export { therapyPlanService } from './api/therapyPlanService';
export { planAssignmentService } from './api/planAssignmentService';

// Servicios de comunicación y notificaciones
export { chatService } from './api/chatService';
export { notificationService } from './api/notificationService';
export { notificationSettingsService } from './api/notificationSettingsService';

// Servicios de pagos y facturación
export { paymentService } from './api/paymentService';
export { ratesService } from './api/ratesService';
export { pricingPackageService } from './api/pricingPackageService';
export { couponService } from './api/couponService';

// Servicios de documentos y archivos
export { documentService } from './api/documentService';
export { reviewService } from './api/reviewService';

// Servicios de suscripciones e integraciones
export { subscriptionService } from './api/subscriptionService';
export { integrationService } from './api/integrationService';
export { webhookService } from './api/webhookService';

// Tipos y constantes de autenticación
export {
  AUTH_EVENTS,
  USER_ROLES,
  PERMISSIONS,
  VERIFICATION_STATES,
  ACCOUNT_STATES,
  AUTH_TYPES,
  PASSWORD_CONFIG,
  TOKEN_CONFIG,
  SESSION_CONFIG,
  DEVICE_TYPES,
  VALIDATORS,
  AuthTypeHelpers
} from './types/auth.types';

// Re-exportar helpers comunes
export {
  sanitizeHtml,
  validatePassword,
  validateEmail,
  generateSecureId,
  sanitizeForLogging
} from './utils/security';

export {
  encryptSensitiveData,
  decryptSensitiveData,
  validatePrivacyCompliance,
  generateConsentToken,
  logDataAccess
} from './utils/privacy';

export {
  logEvent as logAuditEvent,
  getAuditTrail,
  searchAuditEvents,
  generateComplianceReport
} from './utils/auditService';

export {
  createValidationError,
  createFileError,
  isNetworkError,
  isAuthError
} from './utils/errorHandler';

// Re-exportar utilidades avanzadas
export {
  isRequired,
  isEmail,
  isPhone,
  isPassword,
  isDate,
  isValidFile,
  validateForm,
  getSchemas
} from './utils/validators';

export {
  formatDate,
  formatTime,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatText,
  formatFileSize,
  formatDuration,
  setLocale
} from './utils/formatters';

export {
  validateFile,
  uploadFile,
  compressImage,
  generateThumbnail,
  generatePreview,
  cancelUpload,
  getActiveUploads
} from './utils/fileHandler';

// Configuración de inicialización
export const initializeServices = async () => {
  try {
    // Verificar configuración del entorno
    const envValidation = await import('./config/environments').then(module =>
      module.validateEnvironmentConfig()
    );

    if (!envValidation) {
      console.warn('Environment configuration validation failed');
    }

    // Inicializar servicio de autenticación
    const { authService } = await import('./api/authService');
    if (!authService.isInitialized) {
      await authService.initialize();
    }

    // Verificar seguridad del entorno
    const { security } = await import('./utils/security');
    const securityCheck = security.checkEnvironmentSecurity();

    if (securityCheck.warnings.length > 0) {
      console.warn('Security warnings:', securityCheck.warnings);
    }

    // Inicializar servicios de privacidad y auditoría
    const { auditService } = await import('./utils/auditService');
    await auditService.initialize();

    // Log de inicialización en auditoría
    await auditService.logEvent({
      eventType: 'system_change',
      entityType: 'system',
      entityId: 'services',
      action: 'initialize',
      details: {
        environment: ENVIRONMENTS.current,
        timestamp: new Date().toISOString()
      }
    });

    // Inicializar cache
    const { cache } = await import('./utils/cache');
    cache.cleanup(); // Limpiar cache expirado

    // Log de inicialización exitosa
    const { logger } = await import('./utils/logger');
    logger.info('Services initialized successfully', {
      environment: ENVIRONMENTS.current,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    return false;
  }
};

// Helpers para uso común
export const ServiceHelpers = {
  /**
   * Verifica la salud de todos los servicios
   */
  async checkServicesHealth() {
    const results = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    try {
      // Verificar autenticación
      results.services.auth = {
        status: 'ok',
        authenticated: isAuthenticated()
      };
    } catch (error) {
      results.services.auth = {
        status: 'error',
        error: error.message
      };
    }

    try {
      // Verificar cache
      const { cache } = await import('./utils/cache');
      results.services.cache = {
        status: 'ok',
        stats: cache.getStats()
      };
    } catch (error) {
      results.services.cache = {
        status: 'error',
        error: error.message
      };
    }

    try {
      // Verificar storage
      const { storage } = await import('./utils/storage');
      results.services.storage = {
        status: 'ok',
        stats: storage.getStats()
      };
    } catch (error) {
      results.services.storage = {
        status: 'error',
        error: error.message
      };
    }

    return results;
  },

  /**
   * Limpia todos los caches de servicios
   */
  async clearAllCaches() {
    try {
      const { cache } = await import('./utils/cache');
      const { userService } = await import('./api/userService');
      const { professionalProfileService } = await import('./api/professionalProfileService');
      const { credentialsService } = await import('./api/credentialsService');
      const { verificationService } = await import('./api/verificationService');

      // Limpiar cache principal
      cache.clear();

      // Limpiar caches específicos de servicios
      userService.clearCache();
      professionalProfileService.clearCache();
      credentialsService.clearCache();
      verificationService.clearCache();

      // Limpiar caches de servicios de cliente
      const { clientService } = await import('./api/clientService');
      const { clientPlanProgressService } = await import('./api/clientPlanProgressService');
      const { sessionNoteService } = await import('./api/sessionNoteService');
      const { auditService } = await import('./utils/auditService');

      clientService.clearCache();
      clientPlanProgressService.clearCache();
      sessionNoteService.clearCache();
      auditService.clearCache();

      // Limpiar caches de servicios de citas y disponibilidad
      const { bookingService } = await import('./api/bookingService');
      const { availabilityService } = await import('./api/availabilityService');
      const { workLocationService } = await import('./api/workLocationService');

      bookingService.clearCache();
      availabilityService.clearCache();
      workLocationService.clearCache();

      // Limpiar caches de servicios de planes terapéuticos
      const { therapyPlanService } = await import('./api/therapyPlanService');
      const { planAssignmentService } = await import('./api/planAssignmentService');

      therapyPlanService.clearCache();
      planAssignmentService.clearCache();

      // Limpiar caches de servicios de comunicación
      const { chatService } = await import('./api/chatService');
      const { notificationService } = await import('./api/notificationService');
      const { notificationSettingsService } = await import('./api/notificationSettingsService');

      chatService.clearCache();
      notificationService.clearCache();
      notificationSettingsService.clearCache();

      // Limpiar caches de servicios de pagos y facturación
      const { paymentService } = await import('./api/paymentService');
      const { ratesService } = await import('./api/ratesService');
      const { pricingPackageService } = await import('./api/pricingPackageService');
      const { couponService } = await import('./api/couponService');

      paymentService.clearCache();
      ratesService.clearCache();
      pricingPackageService.clearCache();
      couponService.clearCache();

      // Limpiar caches de servicios de documentos y archivos
      const { documentService } = await import('./api/documentService');
      const { reviewService } = await import('./api/reviewService');

      documentService.clearCache();
      reviewService.clearCache();

      // Limpiar caches de servicios de suscripciones e integraciones
      const { subscriptionService } = await import('./api/subscriptionService');
      const { integrationService } = await import('./api/integrationService');
      const { webhookService } = await import('./api/webhookService');
      const { auditLogService } = await import('./api/auditLogService');

      subscriptionService.clearCache();
      integrationService.clearCache();
      webhookService.clearCache();
      auditLogService.clearCache();

      const { logger } = await import('./utils/logger');
      logger.info('All service caches cleared');

      return true;
    } catch (error) {
      console.error('Failed to clear caches:', error);
      return false;
    }
  },

  /**
   * Genera reporte de estado de servicios
   */
  async generateServiceReport() {
    try {
      const health = await this.checkServicesHealth();
      const { logger } = await import('./utils/logger');
      const logReport = logger.generateReport({ format: 'json' });

      return {
        ...health,
        logging: logReport,
        environment: ENVIRONMENTS.current,
        version: APP_CONSTANTS.APP_VERSION
      };
    } catch (error) {
      return {
        error: 'Failed to generate service report',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Ejecuta limpieza de mantenimiento
   */
  async performMaintenance() {
    try {
      const { logger } = await import('./utils/logger');
      logger.info('Starting maintenance tasks');

      // Limpiar logs antiguos
      const oldLogs = logger.filterLogs({
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Más de 7 días
      });

      if (oldLogs.length > 100) {
        logger.clearLogs();
        logger.info('Old logs cleared during maintenance');
      }

      // Limpiar cache expirado
      const { cache } = await import('./utils/cache');
      cache.cleanup();

      // Limpiar storage expirado
      const { storage } = await import('./utils/storage');
      storage.clearOldItems();

      logger.info('Maintenance tasks completed');
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};

// Exportar configuración por defecto
export default {
  // Servicios principales
  apiClient: apiClientInstance,
  authService,
  userService,
  professionalProfileService,
  credentialsService,
  verificationService,
  clientService,
  clientPlanProgressService,
  sessionNoteService,
  bookingService,
  availabilityService,
  workLocationService,
  therapyPlanService,
  planAssignmentService,
  chatService,
  notificationService,
  notificationSettingsService,
  paymentService,
  ratesService,
  pricingPackageService,
  couponService,
  documentService,
  reviewService,
  subscriptionService,
  integrationService,
  webhookService,
  auditLogService,

  // Utilidades
  tokenManager,
  errorHandler,
  logger,
  security,
  privacy,
  auditService,
  storage,
  cache,
  validators,
  formatters,
  fileHandler,

  // Helpers de auditoría
  securityAudit,
  dataAudit,
  complianceAudit,

  // Custom React Hooks (for direct access)
  useAuth,
  useApi,
  useLocalStorage,
  useDebounce,
  usePagination,

  // Configuración
  ENVIRONMENTS,
  APP_CONSTANTS,
  ENDPOINTS,

  // Helpers
  ServiceHelpers,

  // Inicialización
  initializeServices
};