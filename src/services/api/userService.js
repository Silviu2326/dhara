import { apiMethods } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { APP_CONSTANTS } from '../config/constants';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { security } from '../utils/security';

/**
 * Servicio integral de gestión de usuarios
 */
class UserService {
  constructor() {
    this.endpoints = ENDPOINTS.USERS;
    this.cacheKeys = {
      profile: 'user_profile',
      preferences: 'user_preferences',
      statistics: 'user_statistics',
      activityLog: 'user_activity_log'
    };
  }

  // ==================== CRUD BÁSICO ====================

  /**
   * Obtiene el perfil del usuario actual
   */
  async getProfile() {
    try {
      const cached = cache.get(this.cacheKeys.profile);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.PROFILE);

      // Cache el perfil por 15 minutos
      cache.set(this.cacheKeys.profile, response, APP_CONSTANTS.CACHE.LONG_TTL);

      logger.info('User profile retrieved successfully');
      return response;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza el perfil del usuario
   */
  async updateProfile(profileData) {
    try {
      // Validar datos antes de enviar
      this.validateProfileData(profileData);

      // Sanitizar datos sensibles
      const sanitizedData = security.sanitizeForLogging(profileData);

      const response = await apiMethods.put(this.endpoints.PROFILE, profileData);

      // Invalidar cache del perfil
      cache.remove(this.cacheKeys.profile);

      logger.info('User profile updated successfully', {
        userId: response.id,
        fields: Object.keys(profileData)
      });
      return response;
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Sube y actualiza el avatar del usuario
   */
  async updateAvatar(file, onProgress) {
    try {
      // Validar archivo de imagen
      this.validateImageFile(file);

      // Comprimir imagen si es necesario
      const compressedFile = await this.compressImageIfNeeded(file);

      const formData = new FormData();
      formData.append('avatar', compressedFile);

      const response = await apiMethods.upload(this.endpoints.AVATAR, formData, {
        onProgress
      });

      // Invalidar cache del perfil
      cache.remove(this.cacheKeys.profile);

      logger.info('Avatar updated successfully', {
        originalSize: file.size,
        compressedSize: compressedFile.size
      });
      return response;
    } catch (error) {
      logger.error('Error updating avatar:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Elimina el avatar del usuario
   */
  async deleteAvatar() {
    try {
      const response = await apiMethods.delete(this.endpoints.AVATAR);

      // Invalidar cache del perfil
      cache.remove(this.cacheKeys.profile);

      logger.info('Avatar deleted successfully');
      return response;
    } catch (error) {
      logger.error('Error deleting avatar:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== PREFERENCIAS ====================

  /**
   * Obtiene las preferencias del usuario
   */
  async getPreferences() {
    try {
      const cached = cache.get(this.cacheKeys.preferences);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.PREFERENCES);

      cache.set(this.cacheKeys.preferences, response, APP_CONSTANTS.CACHE.DEFAULT_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza las preferencias del usuario
   */
  async updatePreferences(preferences) {
    try {
      this.validatePreferences(preferences);

      const response = await apiMethods.put(this.endpoints.PREFERENCES, preferences);

      // Invalidar cache de preferencias
      cache.remove(this.cacheKeys.preferences);

      logger.info('User preferences updated successfully', {
        categories: Object.keys(preferences)
      });
      return response;
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza una preferencia específica
   */
  async updatePreference(key, value) {
    try {
      const currentPreferences = await this.getPreferences();
      const updatedPreferences = {
        ...currentPreferences,
        [key]: value
      };

      return await this.updatePreferences(updatedPreferences);
    } catch (error) {
      logger.error('Error updating single preference:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtiene estadísticas del usuario
   */
  async getStatistics(timeRange = '30d') {
    try {
      const cacheKey = `${this.cacheKeys.statistics}_${timeRange}`;
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const response = await apiMethods.get(`${this.endpoints.STATISTICS}?range=${timeRange}`);

      cache.set(cacheKey, response, APP_CONSTANTS.CACHE.SHORT_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting user statistics:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene métricas detalladas del usuario
   */
  async getDetailedMetrics(options = {}) {
    try {
      const {
        startDate,
        endDate,
        metrics = ['sessions', 'bookings', 'revenue', 'reviews'],
        granularity = 'day'
      } = options;

      const params = {
        startDate,
        endDate,
        metrics: metrics.join(','),
        granularity
      };

      const queryString = new URLSearchParams(params).toString();
      const response = await apiMethods.get(`${this.endpoints.STATISTICS}/detailed?${queryString}`);

      return response;
    } catch (error) {
      logger.error('Error getting detailed metrics:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== ACTIVIDAD ====================

  /**
   * Obtiene el log de actividad del usuario
   */
  async getActivityLog(params = {}) {
    try {
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 20,
        startDate: params.startDate,
        endDate: params.endDate,
        action: params.action,
        category: params.category
      };

      // Filtrar parámetros undefined
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      const queryString = new URLSearchParams(queryParams).toString();
      const response = await apiMethods.get(`${this.endpoints.ACTIVITY_LOG}?${queryString}`);

      return response;
    } catch (error) {
      logger.error('Error getting activity log:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Registra una actividad del usuario
   */
  async logActivity(activity) {
    try {
      const activityData = {
        action: activity.action,
        category: activity.category || 'general',
        description: activity.description,
        metadata: activity.metadata || {},
        timestamp: new Date().toISOString()
      };

      const response = await apiMethods.post(this.endpoints.ACTIVITY_LOG, activityData);

      logger.debug('Activity logged successfully', { action: activity.action });
      return response;
    } catch (error) {
      logger.error('Error logging activity:', error);
      // No propagar el error para actividades de logging
      return null;
    }
  }

  // ==================== EXPORTACIÓN DE DATOS ====================

  /**
   * Solicita exportación de datos del usuario
   */
  async requestDataExport(format = 'json', options = {}) {
    try {
      const exportRequest = {
        format,
        includeProfile: options.includeProfile !== false,
        includeBookings: options.includeBookings !== false,
        includeMessages: options.includeMessages !== false,
        includeDocuments: options.includeDocuments !== false,
        dateRange: options.dateRange,
        ...options
      };

      const response = await apiMethods.post(this.endpoints.EXPORT_DATA, exportRequest);

      logger.info('Data export requested successfully', { format, options });
      return response;
    } catch (error) {
      logger.error('Error requesting data export:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene el estado de una exportación
   */
  async getExportStatus(exportId) {
    try {
      const response = await apiMethods.get(`${this.endpoints.EXPORT_DATA}/${exportId}/status`);
      return response;
    } catch (error) {
      logger.error('Error getting export status:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Descarga una exportación completada
   */
  async downloadExport(exportId) {
    try {
      const response = await apiMethods.download(
        `${this.endpoints.EXPORT_DATA}/${exportId}/download`,
        `user-data-export-${exportId}.zip`
      );

      logger.info('Export downloaded successfully', { exportId });
      return response;
    } catch (error) {
      logger.error('Error downloading export:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== AUTENTICACIÓN DE DOS FACTORES ====================

  /**
   * Habilita autenticación de dos factores
   */
  async enableTwoFactor() {
    try {
      const response = await apiMethods.post(this.endpoints.TWO_FACTOR.ENABLE);

      // Invalidar cache del perfil para reflejar cambios
      cache.remove(this.cacheKeys.profile);

      logger.info('Two-factor authentication enabled');
      return response;
    } catch (error) {
      logger.error('Error enabling two-factor authentication:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Deshabilita autenticación de dos factores
   */
  async disableTwoFactor(password) {
    try {
      const response = await apiMethods.post(this.endpoints.TWO_FACTOR.DISABLE, { password });

      // Invalidar cache del perfil
      cache.remove(this.cacheKeys.profile);

      logger.info('Two-factor authentication disabled');
      return response;
    } catch (error) {
      logger.error('Error disabling two-factor authentication:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Verifica código de dos factores
   */
  async verifyTwoFactor(code) {
    try {
      const response = await apiMethods.post(this.endpoints.TWO_FACTOR.VERIFY, { code });
      return response;
    } catch (error) {
      logger.error('Error verifying two-factor code:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene códigos de respaldo para 2FA
   */
  async getBackupCodes() {
    try {
      const response = await apiMethods.get(this.endpoints.TWO_FACTOR.BACKUP_CODES);
      return response;
    } catch (error) {
      logger.error('Error getting backup codes:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Regenera códigos de respaldo
   */
  async regenerateBackupCodes() {
    try {
      const response = await apiMethods.post(this.endpoints.TWO_FACTOR.BACKUP_CODES);

      logger.info('Backup codes regenerated successfully');
      return response;
    } catch (error) {
      logger.error('Error regenerating backup codes:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== ELIMINACIÓN DE CUENTA ====================

  /**
   * Solicita eliminación de cuenta
   */
  async requestAccountDeletion(reason, password) {
    try {
      const deletionRequest = {
        reason,
        password,
        requestedAt: new Date().toISOString()
      };

      const response = await apiMethods.post(this.endpoints.DELETE_ACCOUNT, deletionRequest);

      logger.warn('Account deletion requested', { reason });
      return response;
    } catch (error) {
      logger.error('Error requesting account deletion:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Cancela solicitud de eliminación de cuenta
   */
  async cancelAccountDeletion() {
    try {
      const response = await apiMethods.delete(`${this.endpoints.DELETE_ACCOUNT}/cancel`);

      logger.info('Account deletion cancelled');
      return response;
    } catch (error) {
      logger.error('Error cancelling account deletion:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== VALIDACIONES ====================

  /**
   * Valida datos del perfil
   */
  validateProfileData(data) {
    const errors = [];

    if (data.firstName && (data.firstName.length < APP_CONSTANTS.VALIDATION.NAME_MIN_LENGTH ||
                           data.firstName.length > APP_CONSTANTS.VALIDATION.NAME_MAX_LENGTH)) {
      errors.push(`First name must be between ${APP_CONSTANTS.VALIDATION.NAME_MIN_LENGTH} and ${APP_CONSTANTS.VALIDATION.NAME_MAX_LENGTH} characters`);
    }

    if (data.lastName && (data.lastName.length < APP_CONSTANTS.VALIDATION.NAME_MIN_LENGTH ||
                          data.lastName.length > APP_CONSTANTS.VALIDATION.NAME_MAX_LENGTH)) {
      errors.push(`Last name must be between ${APP_CONSTANTS.VALIDATION.NAME_MIN_LENGTH} and ${APP_CONSTANTS.VALIDATION.NAME_MAX_LENGTH} characters`);
    }

    if (data.email && !APP_CONSTANTS.VALIDATION.EMAIL_REGEX.test(data.email)) {
      errors.push('Invalid email format');
    }

    if (data.phone && !APP_CONSTANTS.VALIDATION.PHONE_REGEX.test(data.phone)) {
      errors.push('Invalid phone format');
    }

    if (data.bio && data.bio.length > 1000) {
      errors.push('Bio must be less than 1000 characters');
    }

    if (errors.length > 0) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Profile validation failed',
        { errors }
      );
    }
  }

  /**
   * Valida archivo de imagen
   */
  validateImageFile(file) {
    if (!file) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'No file provided'
      );
    }

    if (!APP_CONSTANTS.FILES.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw errorHandler.createError(
        errorHandler.errorCodes.INVALID_FILE_TYPE,
        'Invalid file type. Only images are allowed.'
      );
    }

    if (file.size > APP_CONSTANTS.FILES.MAX_UPLOAD_SIZE) {
      throw errorHandler.createError(
        errorHandler.errorCodes.FILE_TOO_LARGE,
        'File size exceeds maximum allowed size'
      );
    }
  }

  /**
   * Valida preferencias de usuario
   */
  validatePreferences(preferences) {
    const allowedKeys = [
      'language',
      'timezone',
      'notifications',
      'privacy',
      'theme',
      'accessibility'
    ];

    const invalidKeys = Object.keys(preferences).filter(key => !allowedKeys.includes(key));

    if (invalidKeys.length > 0) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        `Invalid preference keys: ${invalidKeys.join(', ')}`
      );
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Comprime imagen si es necesario
   */
  async compressImageIfNeeded(file) {
    try {
      // Si el archivo es menor a 1MB, no comprimir
      if (file.size < 1024 * 1024) {
        return file;
      }

      // Usar canvas para comprimir
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          const maxDimension = APP_CONSTANTS.FILES.MAX_IMAGE_DIMENSION;
          let { width, height } = img;

          // Calcular nuevas dimensiones manteniendo aspect ratio
          if (width > height) {
            if (width > maxDimension) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a blob
          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            },
            file.type,
            APP_CONSTANTS.FILES.IMAGE_QUALITY
          );
        };

        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      logger.warn('Image compression failed, using original', { error: error.message });
      return file;
    }
  }

  /**
   * Limpia toda la cache del usuario
   */
  clearCache() {
    Object.values(this.cacheKeys).forEach(key => {
      cache.remove(key);
    });

    logger.debug('User service cache cleared');
  }

  /**
   * Obtiene información de uso de cache
   */
  getCacheInfo() {
    const cacheInfo = {};

    Object.entries(this.cacheKeys).forEach(([name, key]) => {
      cacheInfo[name] = {
        cached: cache.has(key),
        key
      };
    });

    return cacheInfo;
  }
}

export const userService = new UserService();
export default userService;