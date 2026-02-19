import { apiMethods } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { APP_CONSTANTS } from '../config/constants';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { security } from '../utils/security';

/**
 * Servicio avanzado de perfiles profesionales para terapeutas
 */
class ProfessionalProfileService {
  constructor() {
    this.endpoints = ENDPOINTS.PROFESSIONAL_PROFILE;
    this.cacheKeys = {
      profile: 'professional_profile',
      statistics: 'professional_statistics',
      specialties: 'professional_specialties',
      portfolio: 'professional_portfolio',
      reviews: 'professional_reviews',
      availability: 'professional_availability'
    };
  }

  // ==================== PERFIL PROFESIONAL ====================

  /**
   * Obtiene el perfil profesional completo
   */
  async getProfile() {
    try {
      const cached = cache.get(this.cacheKeys.profile);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.BASE);

      cache.set(this.cacheKeys.profile, response, APP_CONSTANTS.CACHE.LONG_TTL);

      logger.info('Professional profile retrieved successfully');
      return response;
    } catch (error) {
      logger.error('Error getting professional profile:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza el perfil profesional
   */
  async updateProfile(profileData) {
    try {
      this.validateProfileData(profileData);

      const response = await apiMethods.put(this.endpoints.BASE, profileData);

      // Invalidar caches relacionados
      this.clearProfileCache();

      logger.info('Professional profile updated successfully', {
        fields: Object.keys(profileData)
      });
      return response;
    } catch (error) {
      logger.error('Error updating professional profile:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Publica o despublica el perfil profesional
   */
  async toggleProfileVisibility(isPublished) {
    try {
      const response = await apiMethods.patch(this.endpoints.BASE, {
        isPublished,
        publishedAt: isPublished ? new Date().toISOString() : null
      });

      cache.remove(this.cacheKeys.profile);

      logger.info('Profile visibility updated', { isPublished });
      return response;
    } catch (error) {
      logger.error('Error updating profile visibility:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== ESPECIALIDADES Y TERAPIAS ====================

  /**
   * Obtiene especialidades disponibles
   */
  async getAvailableSpecialties() {
    try {
      const cached = cache.get(this.cacheKeys.specialties);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.SPECIALTIES);

      cache.set(this.cacheKeys.specialties, response, APP_CONSTANTS.CACHE.LONG_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting specialties:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza especialidades del terapeuta
   */
  async updateSpecialties(specialties) {
    try {
      this.validateSpecialties(specialties);

      const response = await apiMethods.put(this.endpoints.SPECIALTIES, { specialties });

      cache.remove(this.cacheKeys.profile);

      logger.info('Specialties updated successfully', { count: specialties.length });
      return response;
    } catch (error) {
      logger.error('Error updating specialties:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene tipos de terapia disponibles
   */
  async getTherapyTypes() {
    try {
      const response = await apiMethods.get(this.endpoints.THERAPIES);
      return response;
    } catch (error) {
      logger.error('Error getting therapy types:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza tipos de terapia ofrecidos
   */
  async updateTherapyTypes(therapyTypes) {
    try {
      this.validateTherapyTypes(therapyTypes);

      const response = await apiMethods.put(this.endpoints.THERAPIES, { therapyTypes });

      cache.remove(this.cacheKeys.profile);

      logger.info('Therapy types updated successfully', { count: therapyTypes.length });
      return response;
    } catch (error) {
      logger.error('Error updating therapy types:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== VIDEO PRESENTACIÓN ====================

  /**
   * Sube video de presentación
   */
  async uploadVideoPresentation(file, metadata, onProgress) {
    try {
      this.validateVideoFile(file);

      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', metadata.title || 'Video de presentación');
      formData.append('description', metadata.description || '');
      formData.append('duration', metadata.duration || '');

      const response = await apiMethods.upload(
        this.endpoints.VIDEO_PRESENTATION,
        formData,
        {
          onProgress,
          timeout: 600000 // 10 minutos para videos
        }
      );

      cache.remove(this.cacheKeys.profile);

      logger.info('Video presentation uploaded successfully', {
        size: file.size,
        duration: metadata.duration
      });
      return response;
    } catch (error) {
      logger.error('Error uploading video presentation:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza metadatos del video
   */
  async updateVideoMetadata(metadata) {
    try {
      const response = await apiMethods.patch(this.endpoints.VIDEO_PRESENTATION, metadata);

      cache.remove(this.cacheKeys.profile);

      logger.info('Video metadata updated successfully');
      return response;
    } catch (error) {
      logger.error('Error updating video metadata:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Elimina video de presentación
   */
  async deleteVideoPresentation() {
    try {
      const response = await apiMethods.delete(this.endpoints.VIDEO_PRESENTATION);

      cache.remove(this.cacheKeys.profile);

      logger.info('Video presentation deleted successfully');
      return response;
    } catch (error) {
      logger.error('Error deleting video presentation:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== ESTADÍSTICAS PROFESIONALES ====================

  /**
   * Obtiene estadísticas profesionales
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
      logger.error('Error getting professional statistics:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene métricas detalladas de rendimiento
   */
  async getPerformanceMetrics(options = {}) {
    try {
      const {
        startDate,
        endDate,
        metrics = ['bookings', 'revenue', 'rating', 'completion_rate'],
        granularity = 'day'
      } = options;

      const params = {
        startDate,
        endDate,
        metrics: metrics.join(','),
        granularity
      };

      const queryString = new URLSearchParams(params).toString();
      const response = await apiMethods.get(`${this.endpoints.STATISTICS}/performance?${queryString}`);

      return response;
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene estadísticas de clientes
   */
  async getClientStatistics() {
    try {
      const response = await apiMethods.get(`${this.endpoints.STATISTICS}/clients`);
      return response;
    } catch (error) {
      logger.error('Error getting client statistics:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== DISPONIBILIDAD ====================

  /**
   * Obtiene estado de disponibilidad actual
   */
  async getAvailabilityStatus() {
    try {
      const cached = cache.get(this.cacheKeys.availability);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.AVAILABILITY_STATUS);

      cache.set(this.cacheKeys.availability, response, APP_CONSTANTS.CACHE.SHORT_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting availability status:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza estado de disponibilidad
   */
  async updateAvailabilityStatus(isAvailable, statusMessage = '', autoReturn = null) {
    try {
      const availabilityData = {
        isAvailable,
        statusMessage,
        lastUpdated: new Date().toISOString()
      };

      if (autoReturn) {
        availabilityData.autoReturnAt = autoReturn;
      }

      const response = await apiMethods.put(this.endpoints.AVAILABILITY_STATUS, availabilityData);

      cache.remove(this.cacheKeys.availability);
      cache.remove(this.cacheKeys.profile);

      logger.info('Availability status updated', { isAvailable, hasMessage: !!statusMessage });
      return response;
    } catch (error) {
      logger.error('Error updating availability status:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Establece disponibilidad temporal
   */
  async setTemporaryAvailability(isAvailable, duration) {
    try {
      const autoReturnAt = new Date(Date.now() + duration).toISOString();

      return await this.updateAvailabilityStatus(
        isAvailable,
        `Disponibilidad temporal por ${Math.round(duration / 60000)} minutos`,
        autoReturnAt
      );
    } catch (error) {
      logger.error('Error setting temporary availability:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== PORTFOLIO ====================

  /**
   * Obtiene portfolio del profesional
   */
  async getPortfolio() {
    try {
      const cached = cache.get(this.cacheKeys.portfolio);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.PORTFOLIO);

      cache.set(this.cacheKeys.portfolio, response, APP_CONSTANTS.CACHE.DEFAULT_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting portfolio:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Agrega elemento al portfolio
   */
  async addPortfolioItem(item) {
    try {
      this.validatePortfolioItem(item);

      const response = await apiMethods.post(this.endpoints.PORTFOLIO, item);

      cache.remove(this.cacheKeys.portfolio);

      logger.info('Portfolio item added successfully', { type: item.type });
      return response;
    } catch (error) {
      logger.error('Error adding portfolio item:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza elemento del portfolio
   */
  async updatePortfolioItem(itemId, updates) {
    try {
      const response = await apiMethods.put(`${this.endpoints.PORTFOLIO}/${itemId}`, updates);

      cache.remove(this.cacheKeys.portfolio);

      logger.info('Portfolio item updated successfully', { itemId });
      return response;
    } catch (error) {
      logger.error('Error updating portfolio item:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Elimina elemento del portfolio
   */
  async deletePortfolioItem(itemId) {
    try {
      const response = await apiMethods.delete(`${this.endpoints.PORTFOLIO}/${itemId}`);

      cache.remove(this.cacheKeys.portfolio);

      logger.info('Portfolio item deleted successfully', { itemId });
      return response;
    } catch (error) {
      logger.error('Error deleting portfolio item:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Reordena elementos del portfolio
   */
  async reorderPortfolio(itemIds) {
    try {
      const response = await apiMethods.put(`${this.endpoints.PORTFOLIO}/reorder`, {
        order: itemIds
      });

      cache.remove(this.cacheKeys.portfolio);

      logger.info('Portfolio reordered successfully');
      return response;
    } catch (error) {
      logger.error('Error reordering portfolio:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== CERTIFICACIONES ====================

  /**
   * Obtiene certificaciones del profesional
   */
  async getCertifications() {
    try {
      const response = await apiMethods.get(this.endpoints.CERTIFICATIONS);
      return response;
    } catch (error) {
      logger.error('Error getting certifications:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Agrega nueva certificación
   */
  async addCertification(certification) {
    try {
      this.validateCertification(certification);

      const response = await apiMethods.post(this.endpoints.CERTIFICATIONS, certification);

      cache.remove(this.cacheKeys.profile);

      logger.info('Certification added successfully', { name: certification.name });
      return response;
    } catch (error) {
      logger.error('Error adding certification:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza certificación
   */
  async updateCertification(certificationId, updates) {
    try {
      const response = await apiMethods.put(
        `${this.endpoints.CERTIFICATIONS}/${certificationId}`,
        updates
      );

      cache.remove(this.cacheKeys.profile);

      logger.info('Certification updated successfully', { certificationId });
      return response;
    } catch (error) {
      logger.error('Error updating certification:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Elimina certificación
   */
  async deleteCertification(certificationId) {
    try {
      const response = await apiMethods.delete(
        `${this.endpoints.CERTIFICATIONS}/${certificationId}`
      );

      cache.remove(this.cacheKeys.profile);

      logger.info('Certification deleted successfully', { certificationId });
      return response;
    } catch (error) {
      logger.error('Error deleting certification:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== IDIOMAS ====================

  /**
   * Obtiene idiomas disponibles
   */
  async getAvailableLanguages() {
    try {
      const response = await apiMethods.get(`${this.endpoints.LANGUAGES}/available`);
      return response;
    } catch (error) {
      logger.error('Error getting available languages:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza idiomas hablados
   */
  async updateLanguages(languages) {
    try {
      this.validateLanguages(languages);

      const response = await apiMethods.put(this.endpoints.LANGUAGES, { languages });

      cache.remove(this.cacheKeys.profile);

      logger.info('Languages updated successfully', { count: languages.length });
      return response;
    } catch (error) {
      logger.error('Error updating languages:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== REDES SOCIALES ====================

  /**
   * Actualiza enlaces de redes sociales
   */
  async updateSocialMedia(socialMediaLinks) {
    try {
      this.validateSocialMediaLinks(socialMediaLinks);

      const response = await apiMethods.put(this.endpoints.SOCIAL_MEDIA, { socialMediaLinks });

      cache.remove(this.cacheKeys.profile);

      logger.info('Social media links updated successfully', {
        platforms: Object.keys(socialMediaLinks)
      });
      return response;
    } catch (error) {
      logger.error('Error updating social media links:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== REVIEWS Y CALIFICACIONES ====================

  /**
   * Obtiene reviews del profesional
   */
  async getReviews(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        rating = null,
        startDate = null,
        endDate = null
      } = options;

      const params = { page, limit };
      if (rating) params.rating = rating;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const queryString = new URLSearchParams(params).toString();
      const response = await apiMethods.get(`${this.endpoints.BASE}/reviews?${queryString}`);

      return response;
    } catch (error) {
      logger.error('Error getting reviews:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Responde a una review
   */
  async replyToReview(reviewId, reply) {
    try {
      this.validateReviewReply(reply);

      const response = await apiMethods.post(`${this.endpoints.BASE}/reviews/${reviewId}/reply`, {
        reply,
        repliedAt: new Date().toISOString()
      });

      logger.info('Review reply posted successfully', { reviewId });
      return response;
    } catch (error) {
      logger.error('Error replying to review:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene estadísticas de reviews
   */
  async getReviewsStatistics() {
    try {
      const response = await apiMethods.get(`${this.endpoints.BASE}/reviews/statistics`);
      return response;
    } catch (error) {
      logger.error('Error getting reviews statistics:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== VALIDACIONES ====================

  /**
   * Valida datos del perfil profesional
   */
  validateProfileData(data) {
    const errors = [];

    console.log('🔍 [VALIDATION] Validating profile data:', data);

    if (data.about && data.about.length > 2000) {
      errors.push('About section must be less than 2000 characters');
    }

    // Comentado: permitir especialidades vacías durante edición
    // if (data.specialties && data.specialties.length === 0) {
    //   errors.push('At least one specialty is required');
    // }

    if (data.experience && (data.experience < 0 || data.experience > 50)) {
      errors.push('Experience must be between 0 and 50 years');
    }

    if (data.hourlyRate && (data.hourlyRate < 0 || data.hourlyRate > 10000)) {
      errors.push('Hourly rate must be between 0 and 10000');
    }

    if (data.sessionDuration && (data.sessionDuration < 30 || data.sessionDuration > 180)) {
      errors.push('Session duration must be between 30 and 180 minutes');
    }

    if (errors.length > 0) {
      console.log('❌ [VALIDATION] Validation errors found:', errors);
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Profile validation failed',
        { errors }
      );
    }

    console.log('✅ [VALIDATION] Profile data validation passed');
  }

  /**
   * Valida especialidades
   */
  validateSpecialties(specialties) {
    if (!Array.isArray(specialties) || specialties.length === 0) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'At least one specialty is required'
      );
    }

    if (specialties.length > 10) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Maximum 10 specialties allowed'
      );
    }
  }

  /**
   * Valida tipos de terapia
   */
  validateTherapyTypes(therapyTypes) {
    if (!Array.isArray(therapyTypes) || therapyTypes.length === 0) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'At least one therapy type is required'
      );
    }
  }

  /**
   * Valida archivo de video
   */
  validateVideoFile(file) {
    if (!file) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'No video file provided'
      );
    }

    if (!APP_CONSTANTS.FILES.ALLOWED_VIDEO_TYPES.includes(file.type)) {
      throw errorHandler.createError(
        errorHandler.errorCodes.INVALID_FILE_TYPE,
        'Invalid video format. Only MP4, WebM, and OGG are allowed.'
      );
    }

    if (file.size > APP_CONSTANTS.FILES.MAX_UPLOAD_SIZE) {
      throw errorHandler.createError(
        errorHandler.errorCodes.FILE_TOO_LARGE,
        'Video file size exceeds maximum allowed size'
      );
    }

    // Validar duración del video (máximo 5 minutos)
    const maxDuration = 5 * 60 * 1000; // 5 minutos en ms
    if (file.duration && file.duration > maxDuration) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Video duration cannot exceed 5 minutes'
      );
    }
  }

  /**
   * Valida elemento del portfolio
   */
  validatePortfolioItem(item) {
    const requiredFields = ['type', 'title', 'description'];
    const missingFields = requiredFields.filter(field => !item[field]);

    if (missingFields.length > 0) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    const allowedTypes = ['case_study', 'article', 'video', 'image', 'document'];
    if (!allowedTypes.includes(item.type)) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        `Invalid portfolio item type. Allowed: ${allowedTypes.join(', ')}`
      );
    }

    if (item.description.length > 1000) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Description must be less than 1000 characters'
      );
    }
  }

  /**
   * Valida certificación
   */
  validateCertification(certification) {
    const requiredFields = ['name', 'issuingOrganization', 'issueDate'];
    const missingFields = requiredFields.filter(field => !certification[field]);

    if (missingFields.length > 0) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // Validar fecha
    const issueDate = new Date(certification.issueDate);
    if (issueDate > new Date()) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Issue date cannot be in the future'
      );
    }

    if (certification.expiryDate) {
      const expiryDate = new Date(certification.expiryDate);
      if (expiryDate <= issueDate) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          'Expiry date must be after issue date'
        );
      }
    }
  }

  /**
   * Valida idiomas
   */
  validateLanguages(languages) {
    if (!Array.isArray(languages)) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Languages must be an array'
      );
    }

    const validLevels = ['basic', 'intermediate', 'advanced', 'native'];

    languages.forEach(lang => {
      if (!lang.code || !lang.level) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          'Each language must have code and level'
        );
      }

      if (!validLevels.includes(lang.level)) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          `Invalid language level. Allowed: ${validLevels.join(', ')}`
        );
      }
    });
  }

  /**
   * Valida enlaces de redes sociales
   */
  validateSocialMediaLinks(links) {
    const allowedPlatforms = ['facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'website'];

    Object.entries(links).forEach(([platform, url]) => {
      if (!allowedPlatforms.includes(platform)) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          `Invalid social media platform: ${platform}`
        );
      }

      const urlValidation = security.validateUrl(url);
      if (!urlValidation.isValid) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          `Invalid URL for ${platform}: ${urlValidation.error}`
        );
      }
    });
  }

  /**
   * Valida respuesta a review
   */
  validateReviewReply(reply) {
    if (!reply || typeof reply !== 'string') {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Reply text is required'
      );
    }

    if (reply.length < 10) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Reply must be at least 10 characters long'
      );
    }

    if (reply.length > 500) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Reply must be less than 500 characters'
      );
    }
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Limpia cache relacionado con el perfil
   */
  clearProfileCache() {
    const relatedKeys = [
      this.cacheKeys.profile,
      this.cacheKeys.portfolio,
      this.cacheKeys.availability
    ];

    relatedKeys.forEach(key => cache.remove(key));

    logger.debug('Professional profile cache cleared');
  }

  /**
   * Limpia toda la cache del servicio
   */
  clearCache() {
    Object.values(this.cacheKeys).forEach(key => {
      cache.remove(key);
    });

    logger.debug('Professional profile service cache cleared');
  }

  /**
   * Obtiene información de cache
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

export const professionalProfileService = new ProfessionalProfileService();
export default professionalProfileService;