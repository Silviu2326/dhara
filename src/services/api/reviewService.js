import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { cache, apiCache } from '../utils/cache';
import { privacy, encryptSensitiveData, decryptSensitiveData } from '../utils/privacy';
import { security, generateSecureId } from '../utils/security';
import { auditService } from '../utils/auditService';

class ReviewService {
  constructor() {
    this.cachePrefix = 'review_';
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutos
    this.maxRetries = 3;
    this.auditContext = 'review_service';

    // Estados de reseñas
    this.reviewStatus = {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      FLAGGED: 'flagged',
      HIDDEN: 'hidden',
      DELETED: 'deleted'
    };

    // Tipos de reseñas
    this.reviewTypes = {
      SESSION: 'session',
      THERAPIST: 'therapist',
      SERVICE: 'service',
      PLATFORM: 'platform',
      PACKAGE: 'package'
    };

    // Escalas de calificación
    this.ratingScales = {
      FIVE_STAR: { min: 1, max: 5, step: 1 },
      TEN_POINT: { min: 1, max: 10, step: 1 },
      HUNDRED_POINT: { min: 1, max: 100, step: 1 },
      DECIMAL: { min: 1, max: 5, step: 0.1 }
    };

    // Aspectos evaluables
    this.ratingAspects = {
      OVERALL: 'overall',
      COMMUNICATION: 'communication',
      PROFESSIONALISM: 'professionalism',
      EFFECTIVENESS: 'effectiveness',
      PUNCTUALITY: 'punctuality',
      ENVIRONMENT: 'environment',
      VALUE_FOR_MONEY: 'value_for_money',
      RECOMMENDATION: 'recommendation'
    };

    // Categorías de moderación
    this.moderationCategories = {
      SPAM: 'spam',
      INAPPROPRIATE_LANGUAGE: 'inappropriate_language',
      FAKE_REVIEW: 'fake_review',
      PERSONAL_ATTACK: 'personal_attack',
      OFF_TOPIC: 'off_topic',
      MEDICAL_ADVICE: 'medical_advice',
      CONFIDENTIAL_INFO: 'confidential_info',
      DUPLICATE: 'duplicate'
    };

    // Niveles de gravedad
    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    // Fuentes de reseñas
    this.reviewSources = {
      INTERNAL: 'internal',
      GOOGLE: 'google',
      FACEBOOK: 'facebook',
      THIRD_PARTY: 'third_party',
      EMAIL_INVITE: 'email_invite'
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await auditService.logEvent({
        eventType: 'system_change',
        entityType: 'service',
        entityId: 'review_service',
        action: 'initialize',
        details: { timestamp: new Date().toISOString() }
      });

      this.initialized = true;
      logger.info('ReviewService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ReviewService:', error);
      throw error;
    }
  }

  // Validación de datos de reseña
  validateReviewData(reviewData) {
    const requiredFields = ['reviewerId', 'revieweeId', 'type', 'rating'];
    const missingFields = requiredFields.filter(field => !reviewData[field]);

    if (missingFields.length > 0) {
      throw errorHandler.createValidationError(
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // Validar tipo de reseña
    if (!Object.values(this.reviewTypes).includes(reviewData.type)) {
      throw errorHandler.createValidationError(
        `Invalid review type: ${reviewData.type}`
      );
    }

    // Validar calificación
    const scale = this.ratingScales.FIVE_STAR; // Escala por defecto
    if (reviewData.rating < scale.min || reviewData.rating > scale.max) {
      throw errorHandler.createValidationError(
        `Rating must be between ${scale.min} and ${scale.max}`
      );
    }

    // Validar calificaciones por aspectos
    if (reviewData.aspectRatings) {
      Object.entries(reviewData.aspectRatings).forEach(([aspect, rating]) => {
        if (!Object.values(this.ratingAspects).includes(aspect)) {
          throw errorHandler.createValidationError(`Invalid rating aspect: ${aspect}`);
        }
        if (rating < scale.min || rating > scale.max) {
          throw errorHandler.createValidationError(
            `Aspect rating for ${aspect} must be between ${scale.min} and ${scale.max}`
          );
        }
      });
    }

    // Validar longitud del comentario
    if (reviewData.comment) {
      if (reviewData.comment.length < 10) {
        throw errorHandler.createValidationError('Comment must be at least 10 characters long');
      }
      if (reviewData.comment.length > 2000) {
        throw errorHandler.createValidationError('Comment must not exceed 2000 characters');
      }
    }

    return true;
  }

  // Crear reseña
  async createReview(reviewData, options = {}) {
    try {
      const { autoModerate = true, auditEvent = true } = options;

      // Validar datos de la reseña
      this.validateReviewData(reviewData);

      // Verificar duplicados
      const existingReview = await this.checkDuplicateReview(
        reviewData.reviewerId,
        reviewData.revieweeId,
        reviewData.type,
        reviewData.sessionId
      );

      if (existingReview) {
        throw errorHandler.createConflictError('A review for this entity already exists');
      }

      // Procesar datos de la reseña
      let processedData = {
        ...reviewData,
        reviewId: security.generateSecureId('rev_'),
        status: autoModerate ? this.reviewStatus.PENDING : this.reviewStatus.APPROVED,
        source: this.reviewSources.INTERNAL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Moderación automática
      if (autoModerate) {
        const moderationResult = await this.automaticModeration(processedData);
        if (moderationResult.flagged) {
          processedData.status = this.reviewStatus.FLAGGED;
          processedData.moderationFlags = moderationResult.flags;
          processedData.moderationScore = moderationResult.score;
        } else {
          processedData.status = this.reviewStatus.APPROVED;
        }
      }

      // Encriptar datos sensibles si los hay
      if (processedData.personalInfo || processedData.sensitiveComment) {
        processedData.encryptedData = await encryptSensitiveData({
          personalInfo: processedData.personalInfo,
          sensitiveComment: processedData.sensitiveComment
        });

        // Remover datos sensibles sin encriptar
        delete processedData.personalInfo;
        delete processedData.sensitiveComment;
      }

      const response = await apiClient.post(ENDPOINTS.REVIEWS.BASE, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache(reviewData.revieweeId);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'review_change',
          entityType: 'review',
          entityId: response.data.reviewId,
          action: 'create',
          userId: reviewData.reviewerId,
          details: {
            revieweeId: reviewData.revieweeId,
            type: reviewData.type,
            rating: reviewData.rating,
            status: processedData.status,
            flagged: processedData.status === this.reviewStatus.FLAGGED
          }
        });
      }

      logger.info('Review created', {
        reviewId: response.data.reviewId,
        reviewerId: reviewData.reviewerId,
        revieweeId: reviewData.revieweeId,
        rating: reviewData.rating,
        status: processedData.status
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating review:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Obtener reseña por ID
  async getReviewById(reviewId, options = {}) {
    try {
      const { includeResponses = true, decryptSensitive = false } = options;
      const cacheKey = `${this.cachePrefix}${reviewId}_${includeResponses}_${decryptSensitive}`;

      // Verificar cache
      let reviewData = cache.get(cacheKey);
      if (reviewData) {
        return reviewData;
      }

      const params = { includeResponses };
      const response = await apiClient.get(`${ENDPOINTS.REVIEWS.BASE}/${reviewId}`, { params });

      reviewData = response.data;

      // Desencriptar datos sensibles si es necesario
      if (decryptSensitive && reviewData.encryptedData) {
        const decryptedData = await decryptSensitiveData(reviewData.encryptedData);
        reviewData = { ...reviewData, ...decryptedData };
        delete reviewData.encryptedData;
      }

      // Guardar en cache
      cache.set(cacheKey, reviewData, this.cacheTimeout);

      return reviewData;
    } catch (error) {
      logger.error('Error getting review by ID:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Listar reseñas con filtros
  async getReviews(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeHidden = false
      } = options;

      console.log('ReviewService.getReviews called with:', {
        filters,
        options: { page, limit, sortBy, sortOrder, includeHidden }
      });

      const cacheKey = `${this.cachePrefix}list_${JSON.stringify(filters)}_${page}_${limit}_${sortBy}_${sortOrder}_${includeHidden}`;

      // Verificar cache
      let reviews = cache.get(cacheKey);
      if (reviews) {
        console.log('ReviewService.getReviews: returning cached data:', reviews);
        return reviews;
      }

      const params = {
        ...filters,
        page,
        limit,
        sortBy,
        sortOrder,
        includeHidden
      };

      console.log('ReviewService.getReviews: making API call with params:', params);

      const response = await apiClient.get(ENDPOINTS.REVIEWS.BASE, { params });
      reviews = response?.data || null;

      console.log('ReviewService.getReviews: received API response:', {
        success: reviews?.success,
        reviewsCount: reviews?.data?.reviews?.length || 0,
        totalReviews: reviews?.data?.pagination?.total || 0,
        fullResponse: reviews
      });

      // Solo guardar en cache si hay datos válidos
      if (reviews) {
        cache.set(cacheKey, reviews, this.cacheTimeout);
      }

      return reviews;
    } catch (error) {
      console.error('ReviewService.getReviews: error occurred:', error);
      logger.error('Error getting reviews:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Actualizar reseña
  async updateReview(reviewId, updateData, options = {}) {
    try {
      const { auditEvent = true } = options;

      // Validar datos si incluyen campos críticos
      if (updateData.rating || updateData.aspectRatings || updateData.comment) {
        const currentReview = await this.getReviewById(reviewId);
        this.validateReviewData({ ...currentReview, ...updateData });
      }

      // Procesar datos de actualización
      let processedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Re-moderar si se actualiza el contenido
      if (updateData.comment) {
        const moderationResult = await this.automaticModeration(processedData);
        if (moderationResult.flagged) {
          processedData.status = this.reviewStatus.FLAGGED;
          processedData.moderationFlags = moderationResult.flags;
          processedData.moderationScore = moderationResult.score;
        }
      }

      // Encriptar datos sensibles si están incluidos
      if (updateData.personalInfo || updateData.sensitiveComment) {
        processedData.encryptedData = await encryptSensitiveData({
          personalInfo: updateData.personalInfo,
          sensitiveComment: updateData.sensitiveComment
        });

        delete processedData.personalInfo;
        delete processedData.sensitiveComment;
      }

      const response = await apiClient.put(`${ENDPOINTS.REVIEWS.BASE}/${reviewId}`, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'review_change',
          entityType: 'review',
          entityId: reviewId,
          action: 'update',
          userId: processedData.updatedBy,
          details: {
            updatedFields: Object.keys(updateData),
            moderationTriggered: processedData.status === this.reviewStatus.FLAGGED
          }
        });
      }

      logger.info('Review updated', {
        reviewId,
        updatedFields: Object.keys(updateData),
        newStatus: processedData.status
      });

      return response.data;
    } catch (error) {
      logger.error('Error updating review:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Eliminar reseña
  async deleteReview(reviewId, options = {}) {
    try {
      const { permanent = false, auditEvent = true, userId, reason } = options;

      const deleteData = {
        permanent,
        deletedBy: userId,
        deletedAt: new Date().toISOString(),
        reason
      };

      const response = await apiClient.delete(`${ENDPOINTS.REVIEWS.BASE}/${reviewId}`, {
        data: deleteData
      });

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'review_change',
          entityType: 'review',
          entityId: reviewId,
          action: permanent ? 'delete_permanent' : 'delete_soft',
          userId: userId,
          details: {
            permanent,
            reason,
            timestamp: new Date().toISOString()
          }
        });
      }

      logger.info('Review deleted', {
        reviewId,
        permanent,
        deletedBy: userId,
        reason
      });

      return response.data;
    } catch (error) {
      logger.error('Error deleting review:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Responder a reseña
  async respondToReview(reviewId, responseData, options = {}) {
    try {
      const { auditEvent = true } = options;

      const responsePayload = {
        responseId: security.generateSecureId('resp_'),
        reviewId,
        responderId: responseData.responderId,
        response: responseData.response,
        responseDate: new Date().toISOString(),
        ...responseData
      };

      const response = await apiClient.post(`${ENDPOINTS.REVIEWS.BASE}/${reviewId}/responses`, responsePayload);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'review_change',
          entityType: 'review',
          entityId: reviewId,
          action: 'respond',
          userId: responseData.responderId,
          details: {
            responseId: response.data.responseId,
            responseLength: responseData.response.length
          }
        });
      }

      logger.info('Review response created', {
        reviewId,
        responseId: response.data.responseId,
        responderId: responseData.responderId
      });

      return response.data;
    } catch (error) {
      logger.error('Error responding to review:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Moderar reseña
  async moderateReview(reviewId, moderationData, options = {}) {
    try {
      const { auditEvent = true } = options;

      const moderationPayload = {
        reviewId,
        moderatorId: moderationData.moderatorId,
        action: moderationData.action, // approve, reject, flag, hide
        reason: moderationData.reason,
        category: moderationData.category,
        severity: moderationData.severity,
        moderatedAt: new Date().toISOString(),
        ...moderationData
      };

      const response = await apiClient.post(`${ENDPOINTS.REVIEWS.BASE}/${reviewId}/moderate`, moderationPayload);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'content_moderation',
          entityType: 'review',
          entityId: reviewId,
          action: `moderate_${moderationData.action}`,
          userId: moderationData.moderatorId,
          details: {
            action: moderationData.action,
            reason: moderationData.reason,
            category: moderationData.category,
            severity: moderationData.severity
          }
        });
      }

      logger.info('Review moderated', {
        reviewId,
        action: moderationData.action,
        moderatorId: moderationData.moderatorId,
        category: moderationData.category
      });

      return response.data;
    } catch (error) {
      logger.error('Error moderating review:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Reportar reseña
  async reportReview(reviewId, reportData, options = {}) {
    try {
      const { auditEvent = true } = options;

      const reportPayload = {
        reportId: security.generateSecureId('rep_'),
        reviewId,
        reporterId: reportData.reporterId,
        category: reportData.category,
        reason: reportData.reason,
        details: reportData.details,
        reportedAt: new Date().toISOString()
      };

      const response = await apiClient.post(`${ENDPOINTS.REVIEWS.BASE}/${reviewId}/report`, reportPayload);

      // Auditoría del reporte
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'content_report',
          entityType: 'review',
          entityId: reviewId,
          action: 'report',
          userId: reportData.reporterId,
          details: {
            reportId: response.data.reportId,
            category: reportData.category,
            reason: reportData.reason
          }
        });
      }

      logger.info('Review reported', {
        reviewId,
        reportId: response.data.reportId,
        reporterId: reportData.reporterId,
        category: reportData.category
      });

      return response.data;
    } catch (error) {
      logger.error('Error reporting review:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Obtener estadísticas de reseñas
  async getReviewStatistics(filters = {}, options = {}) {
    try {
      console.log('🔍 [REVIEW SERVICE] getReviewStatistics called');
      console.log('  - filters:', filters);
      console.log('  - options:', options);

      const { dateRange, groupBy = 'rating' } = options;
      const cacheKey = `${this.cachePrefix}stats_${JSON.stringify(filters)}_${JSON.stringify(options)}`;

      // Verificar cache
      let stats = cache.get(cacheKey);
      if (stats) {
        console.log('💾 [REVIEW SERVICE] Using cached data');
        return stats;
      }

      const params = {
        ...filters,
        dateRange: dateRange ? JSON.stringify(dateRange) : undefined,
        groupBy
      };

      console.log('📋 [REVIEW SERVICE] Prepared params:', params);
      console.log('🌐 [REVIEW SERVICE] Making HTTP request to:', ENDPOINTS.REVIEWS.STATISTICS);

      const response = await apiClient.get(ENDPOINTS.REVIEWS.STATISTICS, { params });
      console.log('✅ [REVIEW SERVICE] API response received:', response);
      stats = response.data;

      // Guardar en cache por menos tiempo para estadísticas
      cache.set(cacheKey, stats, 10 * 60 * 1000); // 10 minutos

      return stats;
    } catch (error) {
      logger.error('Error getting review statistics:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Obtener resumen de satisfacción
  async getSatisfactionSummary(entityId, entityType, options = {}) {
    try {
      const { dateRange, includeAspects = true } = options;
      const cacheKey = `${this.cachePrefix}satisfaction_${entityId}_${entityType}_${JSON.stringify(options)}`;

      // Verificar cache
      let summary = cache.get(cacheKey);
      if (summary) {
        return summary;
      }

      const params = {
        entityId,
        entityType,
        dateRange: dateRange ? JSON.stringify(dateRange) : undefined,
        includeAspects
      };

      const response = await apiClient.get(ENDPOINTS.reviews.satisfaction, { params });
      summary = response.data;

      // Guardar en cache
      cache.set(cacheKey, summary, this.cacheTimeout);

      return summary;
    } catch (error) {
      logger.error('Error getting satisfaction summary:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Obtener reporte de reputación
  async getReputationReport(entityId, entityType, options = {}) {
    try {
      const { dateRange, includeComparisons = false } = options;
      const cacheKey = `${this.cachePrefix}reputation_${entityId}_${entityType}_${JSON.stringify(options)}`;

      // Verificar cache
      let report = cache.get(cacheKey);
      if (report) {
        return report;
      }

      const params = {
        entityId,
        entityType,
        dateRange: dateRange ? JSON.stringify(dateRange) : undefined,
        includeComparisons
      };

      const response = await apiClient.get(ENDPOINTS.reviews.reputation, { params });
      report = response.data;

      // Guardar en cache
      cache.set(cacheKey, report, this.cacheTimeout);

      return report;
    } catch (error) {
      logger.error('Error getting reputation report:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Moderación automática
  async automaticModeration(reviewData) {
    try {
      const moderationParams = {
        comment: reviewData.comment,
        rating: reviewData.rating,
        reviewerId: reviewData.reviewerId
      };

      const response = await apiClient.post(ENDPOINTS.reviews.autoModerate, moderationParams);

      return {
        flagged: response.data.flagged,
        flags: response.data.flags || [],
        score: response.data.score || 0,
        categories: response.data.categories || []
      };
    } catch (error) {
      logger.error('Error in automatic moderation:', error);
      // Si falla la moderación automática, no flaggear por defecto
      return {
        flagged: false,
        flags: [],
        score: 0,
        categories: []
      };
    }
  }

  // Verificar reseñas duplicadas
  async checkDuplicateReview(reviewerId, revieweeId, type, sessionId = null) {
    try {
      const params = {
        reviewerId,
        revieweeId,
        type,
        sessionId
      };

      const response = await apiClient.get(ENDPOINTS.reviews.checkDuplicate, { params });
      return response.data.exists ? response.data.review : null;
    } catch (error) {
      logger.error('Error checking duplicate review:', error);
      return null;
    }
  }

  // Obtener reseñas pendientes de moderación
  async getPendingReviews(options = {}) {
    try {
      const { page = 1, limit = 20, priority = 'all' } = options;

      const filters = { status: this.reviewStatus.PENDING };
      if (priority !== 'all') {
        filters.priority = priority;
      }

      return await this.getReviews(filters, { page, limit, sortBy: 'createdAt', sortOrder: 'asc' });
    } catch (error) {
      logger.error('Error getting pending reviews:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Obtener reseñas flaggeadas
  async getFlaggedReviews(options = {}) {
    try {
      const { page = 1, limit = 20, category = 'all' } = options;

      const filters = { status: this.reviewStatus.FLAGGED };
      if (category !== 'all') {
        filters.category = category;
      }

      return await this.getReviews(filters, { page, limit, sortBy: 'moderationScore', sortOrder: 'desc' });
    } catch (error) {
      logger.error('Error getting flagged reviews:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Exportar reseñas
  async exportReviews(filters = {}, format = 'json') {
    try {
      const params = {
        ...filters,
        format,
        export: true
      };

      const response = await apiClient.get(ENDPOINTS.REVIEWS.BASE, { params });

      // Log de exportación
      await auditService.logEvent({
        eventType: 'data_export',
        entityType: 'review',
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
      logger.error('Error exporting reviews:', error);
      throw errorHandler.handleError(error);
    }
  }

  // Calcular puntuación promedio
  calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10; // Redondear a 1 decimal
  }

  // Obtener distribución de calificaciones
  getRatingDistribution(reviews) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach(review => {
      const rating = Math.floor(review.rating);
      if (distribution.hasOwnProperty(rating)) {
        distribution[rating]++;
      }
    });

    return distribution;
  }

  // Invalidar cache relacionado
  invalidateRelatedCache(entityId = null) {
    try {
      if (entityId) {
        // Invalidar cache específico de la entidad
        const patterns = [
          `${this.cachePrefix}*${entityId}*`,
          `${this.cachePrefix}list*`,
          `${this.cachePrefix}stats*`,
          `${this.cachePrefix}satisfaction_${entityId}*`,
          `${this.cachePrefix}reputation_${entityId}*`
        ];

        patterns.forEach(pattern => cache.deleteByPattern(pattern));
      } else {
        // Invalidar todo el cache de reseñas
        cache.deleteByPattern(`${this.cachePrefix}*`);
      }

      // También invalidar cache de API relacionado
      apiCache.deleteByPattern('reviews*');

    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }

  // Limpiar cache
  clearCache() {
    try {
      cache.deleteByPattern(`${this.cachePrefix}*`);
      logger.info('ReviewService cache cleared');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  // Verificar salud del servicio
  async checkHealth() {
    try {
      const healthData = {
        service: 'ReviewService',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cache: {
          size: cache.size(),
          enabled: true
        }
      };

      // Verificar conectividad básica
      await apiClient.get(`${ENDPOINTS.REVIEWS.BASE}/health`);

      return healthData;
    } catch (error) {
      return {
        service: 'ReviewService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Crear instancia única del servicio
export const reviewService = new ReviewService();

// Métodos de conveniencia para exportación directa
export const createReview = (reviewData, options) => reviewService.createReview(reviewData, options);
export const getReviewById = (reviewId, options) => reviewService.getReviewById(reviewId, options);
export const getReviews = (filters, options) => reviewService.getReviews(filters, options);
export const updateReview = (reviewId, updateData, options) => reviewService.updateReview(reviewId, updateData, options);
export const deleteReview = (reviewId, options) => reviewService.deleteReview(reviewId, options);
export const respondToReview = (reviewId, responseData, options) => reviewService.respondToReview(reviewId, responseData, options);
export const moderateReview = (reviewId, moderationData, options) => reviewService.moderateReview(reviewId, moderationData, options);
export const reportReview = (reviewId, reportData, options) => reviewService.reportReview(reviewId, reportData, options);
export const getReviewStatistics = (filters, options) => reviewService.getReviewStatistics(filters, options);
export const getSatisfactionSummary = (entityId, entityType, options) => reviewService.getSatisfactionSummary(entityId, entityType, options);
export const getReputationReport = (entityId, entityType, options) => reviewService.getReputationReport(entityId, entityType, options);
export const getPendingReviews = (options) => reviewService.getPendingReviews(options);
export const getFlaggedReviews = (options) => reviewService.getFlaggedReviews(options);
export const exportReviews = (filters, format) => reviewService.exportReviews(filters, format);

export default reviewService;