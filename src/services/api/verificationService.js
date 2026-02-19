import { apiMethods } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { APP_CONSTANTS } from '../config/constants';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { security } from '../utils/security';

/**
 * Servicio completo de verificación y validación de documentos
 */
class VerificationService {
  constructor() {
    this.endpoints = ENDPOINTS.VERIFICATION;
    this.cacheKeys = {
      status: 'verification_status',
      documents: 'verification_documents',
      requirements: 'verification_requirements',
      history: 'verification_history'
    };

    // Estados de verificación
    this.verificationStates = {
      NOT_SUBMITTED: 'not_submitted',
      PENDING: 'pending',
      UNDER_REVIEW: 'under_review',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      EXPIRED: 'expired',
      RESUBMISSION_REQUIRED: 'resubmission_required'
    };

    // Tipos de documentos requeridos
    this.requiredDocumentTypes = {
      IDENTITY: 'identity_document',
      PROFESSIONAL_LICENSE: 'professional_license',
      EDUCATION_CERTIFICATE: 'education_certificate',
      INSURANCE_CERTIFICATE: 'insurance_certificate',
      BACKGROUND_CHECK: 'background_check',
      PROFESSIONAL_REFERENCES: 'professional_references',
      PHOTO: 'professional_photo'
    };

    // Prioridades de verificación
    this.verificationPriorities = {
      LOW: 'low',
      NORMAL: 'normal',
      HIGH: 'high',
      URGENT: 'urgent'
    };
  }

  // ==================== ESTADO DE VERIFICACIÓN ====================

  /**
   * Obtiene el estado actual de verificación
   */
  async getVerificationStatus() {
    try {
      const cached = cache.get(this.cacheKeys.status);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.STATUS);

      cache.set(this.cacheKeys.status, response, APP_CONSTANTS.CACHE.SHORT_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting verification status:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene estado detallado de verificación
   */
  async getDetailedVerificationStatus() {
    try {
      const response = await apiMethods.get(`${this.endpoints.STATUS}/detailed`);
      return response;
    } catch (error) {
      logger.error('Error getting detailed verification status:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Verifica si el usuario está completamente verificado
   */
  async isFullyVerified() {
    try {
      const status = await this.getVerificationStatus();
      return status.overallStatus === this.verificationStates.APPROVED &&
             status.allRequirementsMet === true;
    } catch (error) {
      logger.error('Error checking if fully verified:', error);
      return false;
    }
  }

  // ==================== REQUERIMIENTOS ====================

  /**
   * Obtiene requerimientos de verificación
   */
  async getVerificationRequirements() {
    try {
      const cached = cache.get(this.cacheKeys.requirements);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.REQUIREMENTS);

      cache.set(this.cacheKeys.requirements, response, APP_CONSTANTS.CACHE.LONG_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting verification requirements:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene checklist de verificación personalizada
   */
  async getVerificationChecklist() {
    try {
      const response = await apiMethods.get(`${this.endpoints.REQUIREMENTS}/checklist`);
      return response;
    } catch (error) {
      logger.error('Error getting verification checklist:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Verifica si se cumplen los requerimientos mínimos
   */
  async checkMinimumRequirements() {
    try {
      const response = await apiMethods.get(`${this.endpoints.REQUIREMENTS}/check`);
      return response;
    } catch (error) {
      logger.error('Error checking minimum requirements:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== DOCUMENTOS ====================

  /**
   * Obtiene documentos de verificación
   */
  async getVerificationDocuments() {
    try {
      const cached = cache.get(this.cacheKeys.documents);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.DOCUMENTS);

      cache.set(this.cacheKeys.documents, response, APP_CONSTANTS.CACHE.DEFAULT_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting verification documents:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Sube documento de verificación
   */
  async uploadVerificationDocument(documentType, file, metadata = {}, onProgress) {
    try {
      this.validateDocumentType(documentType);
      this.validateDocumentFile(file);

      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', documentType);
      formData.append('metadata', JSON.stringify({
        ...metadata,
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        size: file.size
      }));

      const response = await apiMethods.upload(
        this.endpoints.DOCUMENTS,
        formData,
        { onProgress }
      );

      // Invalidar caches relacionados
      this.clearVerificationCache();

      logger.info('Verification document uploaded successfully', {
        documentType,
        fileName: file.name,
        size: file.size
      });

      return response;
    } catch (error) {
      logger.error('Error uploading verification document:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza metadatos de documento
   */
  async updateDocumentMetadata(documentId, metadata) {
    try {
      const response = await apiMethods.patch(
        `${this.endpoints.DOCUMENTS}/${documentId}`,
        { metadata }
      );

      cache.remove(this.cacheKeys.documents);

      logger.info('Document metadata updated successfully', { documentId });
      return response;
    } catch (error) {
      logger.error('Error updating document metadata:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Elimina documento de verificación
   */
  async deleteVerificationDocument(documentId) {
    try {
      const response = await apiMethods.delete(`${this.endpoints.DOCUMENTS}/${documentId}`);

      this.clearVerificationCache();

      logger.info('Verification document deleted successfully', { documentId });
      return response;
    } catch (error) {
      logger.error('Error deleting verification document:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Reemplaza documento existente
   */
  async replaceVerificationDocument(documentId, file, onProgress) {
    try {
      this.validateDocumentFile(file);

      const formData = new FormData();
      formData.append('document', file);
      formData.append('replacedAt', new Date().toISOString());

      const response = await apiMethods.upload(
        `${this.endpoints.DOCUMENTS}/${documentId}/replace`,
        formData,
        { onProgress }
      );

      this.clearVerificationCache();

      logger.info('Verification document replaced successfully', {
        documentId,
        fileName: file.name
      });

      return response;
    } catch (error) {
      logger.error('Error replacing verification document:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== PROCESO DE VERIFICACIÓN ====================

  /**
   * Inicia proceso de verificación
   */
  async startVerificationProcess(options = {}) {
    try {
      const verificationRequest = {
        startedAt: new Date().toISOString(),
        priority: options.priority || this.verificationPriorities.NORMAL,
        expedited: options.expedited || false,
        notes: options.notes || '',
        ...options
      };

      const response = await apiMethods.post(this.endpoints.BASE, verificationRequest);

      this.clearVerificationCache();

      logger.info('Verification process started', { priority: verificationRequest.priority });
      return response;
    } catch (error) {
      logger.error('Error starting verification process:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Envía documentos para verificación
   */
  async submitForVerification(submissionData = {}) {
    try {
      const submission = {
        submittedAt: new Date().toISOString(),
        completedChecklist: submissionData.completedChecklist || [],
        additionalNotes: submissionData.additionalNotes || '',
        requestExpedited: submissionData.requestExpedited || false,
        ...submissionData
      };

      const response = await apiMethods.post(this.endpoints.SUBMIT, submission);

      this.clearVerificationCache();

      logger.info('Documents submitted for verification');
      return response;
    } catch (error) {
      logger.error('Error submitting for verification:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Reenvía documentos después de rechazo
   */
  async resubmitForVerification(resubmissionData) {
    try {
      const resubmission = {
        resubmittedAt: new Date().toISOString(),
        previousRejectionId: resubmissionData.previousRejectionId,
        addressedIssues: resubmissionData.addressedIssues || [],
        additionalDocuments: resubmissionData.additionalDocuments || [],
        notes: resubmissionData.notes || '',
        ...resubmissionData
      };

      const response = await apiMethods.post(this.endpoints.RESUBMIT, resubmission);

      this.clearVerificationCache();

      logger.info('Documents resubmitted for verification', {
        previousRejectionId: resubmission.previousRejectionId
      });

      return response;
    } catch (error) {
      logger.error('Error resubmitting for verification:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Cancela proceso de verificación
   */
  async cancelVerificationProcess(reason = '') {
    try {
      const cancellation = {
        cancelledAt: new Date().toISOString(),
        reason
      };

      const response = await apiMethods.post(`${this.endpoints.BASE}/cancel`, cancellation);

      this.clearVerificationCache();

      logger.info('Verification process cancelled', { reason });
      return response;
    } catch (error) {
      logger.error('Error cancelling verification process:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== HISTORIAL Y SEGUIMIENTO ====================

  /**
   * Obtiene historial de verificación
   */
  async getVerificationHistory() {
    try {
      const cached = cache.get(this.cacheKeys.history);
      if (cached) return cached;

      const response = await apiMethods.get(`${this.endpoints.BASE}/history`);

      cache.set(this.cacheKeys.history, response, APP_CONSTANTS.CACHE.DEFAULT_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting verification history:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene timeline de verificación
   */
  async getVerificationTimeline() {
    try {
      const response = await apiMethods.get(`${this.endpoints.BASE}/timeline`);
      return response;
    } catch (error) {
      logger.error('Error getting verification timeline:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene notificaciones de verificación
   */
  async getVerificationNotifications(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false
      } = options;

      const params = { page, limit };
      if (unreadOnly) params.unread = true;

      const queryString = new URLSearchParams(params).toString();
      const response = await apiMethods.get(`${this.endpoints.BASE}/notifications?${queryString}`);

      return response;
    } catch (error) {
      logger.error('Error getting verification notifications:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== VALIDACIÓN Y ANÁLISIS ====================

  /**
   * Valida documento antes del upload
   */
  async validateDocumentBeforeUpload(file, documentType) {
    try {
      this.validateDocumentType(documentType);
      this.validateDocumentFile(file);

      // Análisis adicional del documento
      const analysis = await this.analyzeDocument(file);

      return {
        isValid: true,
        analysis,
        recommendations: this.getDocumentRecommendations(documentType, analysis)
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        recommendations: []
      };
    }
  }

  /**
   * Analiza documento para calidad y contenido
   */
  async analyzeDocument(file) {
    try {
      // Análisis básico del archivo
      const analysis = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        lastModified: new Date(file.lastModified),
        readability: this.assessDocumentReadability(file),
        estimatedProcessingTime: this.estimateProcessingTime(file)
      };

      // Verificaciones de seguridad
      analysis.securityChecks = {
        hasValidExtension: this.hasValidFileExtension(file),
        noMaliciousContent: await this.checkForMaliciousContent(file),
        appropriateSize: file.size <= APP_CONSTANTS.FILES.MAX_UPLOAD_SIZE
      };

      return analysis;
    } catch (error) {
      logger.error('Error analyzing document:', error);
      return {
        error: 'Failed to analyze document',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtiene recomendaciones para mejorar documento
   */
  getDocumentRecommendations(documentType, analysis) {
    const recommendations = [];

    // Recomendaciones basadas en el tipo de documento
    switch (documentType) {
      case this.requiredDocumentTypes.IDENTITY:
        recommendations.push('Asegúrate de que la foto sea clara y legible');
        recommendations.push('Incluye ambos lados del documento si aplica');
        break;

      case this.requiredDocumentTypes.PROFESSIONAL_LICENSE:
        recommendations.push('Verifica que el número de licencia sea visible');
        recommendations.push('Incluye fecha de expiración si está presente');
        break;

      case this.requiredDocumentTypes.EDUCATION_CERTIFICATE:
        recommendations.push('Asegúrate de que el nombre de la institución sea legible');
        recommendations.push('Incluye fecha de graduación y grado obtenido');
        break;
    }

    // Recomendaciones basadas en el análisis
    if (analysis.fileSize > 10 * 1024 * 1024) { // 10MB
      recommendations.push('Considera comprimir el archivo para acelerar el procesamiento');
    }

    if (analysis.readability === 'poor') {
      recommendations.push('Mejora la calidad de la imagen para facilitar la revisión');
    }

    return recommendations;
  }

  // ==================== VALIDACIONES ====================

  /**
   * Valida tipo de documento
   */
  validateDocumentType(documentType) {
    const allowedTypes = Object.values(this.requiredDocumentTypes);

    if (!allowedTypes.includes(documentType)) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        `Invalid document type. Allowed types: ${allowedTypes.join(', ')}`
      );
    }
  }

  /**
   * Valida archivo de documento
   */
  validateDocumentFile(file) {
    if (!file) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'No document file provided'
      );
    }

    // Verificar tipos de archivo permitidos
    const allowedTypes = [
      ...APP_CONSTANTS.FILES.ALLOWED_DOCUMENT_TYPES,
      ...APP_CONSTANTS.FILES.ALLOWED_IMAGE_TYPES
    ];

    if (!allowedTypes.includes(file.type)) {
      throw errorHandler.createError(
        errorHandler.errorCodes.INVALID_FILE_TYPE,
        'Invalid file type. Only documents and images are allowed.'
      );
    }

    // Verificar tamaño
    if (file.size > APP_CONSTANTS.FILES.MAX_UPLOAD_SIZE) {
      throw errorHandler.createError(
        errorHandler.errorCodes.FILE_TOO_LARGE,
        'File size exceeds maximum allowed size'
      );
    }

    // Verificar nombre de archivo
    if (file.name.length > 255) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'File name is too long (maximum 255 characters)'
      );
    }

    // Verificar caracteres especiales en nombre
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(file.name)) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'File name contains invalid characters'
      );
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Evalúa legibilidad del documento
   */
  assessDocumentReadability(file) {
    // Análisis básico basado en tamaño y tipo
    if (file.size < 50 * 1024) { // Menos de 50KB
      return 'poor';
    } else if (file.size < 500 * 1024) { // Menos de 500KB
      return 'fair';
    } else if (file.size < 2 * 1024 * 1024) { // Menos de 2MB
      return 'good';
    } else {
      return 'excellent';
    }
  }

  /**
   * Estima tiempo de procesamiento
   */
  estimateProcessingTime(file) {
    const baseTime = 2; // 2 días base
    const sizeMultiplier = Math.ceil(file.size / (1024 * 1024)); // Por MB
    const typeMultiplier = file.type.includes('pdf') ? 1 : 1.5; // PDFs más rápidos

    return Math.min(baseTime + sizeMultiplier * typeMultiplier, 10); // Máximo 10 días
  }

  /**
   * Verifica extensión válida
   */
  hasValidFileExtension(file) {
    const validExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];
    const fileName = file.name.toLowerCase();

    return validExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Verifica contenido malicioso
   */
  async checkForMaliciousContent(file) {
    try {
      // Verificaciones básicas de seguridad
      const fileName = file.name.toLowerCase();

      // Verificar extensiones dobles sospechosas
      const suspiciousPatterns = ['.exe', '.scr', '.bat', '.cmd', '.com', '.pif'];
      const hasSuspiciousExtension = suspiciousPatterns.some(pattern =>
        fileName.includes(pattern)
      );

      if (hasSuspiciousExtension) {
        return false;
      }

      // Otras verificaciones de seguridad aquí
      return true;
    } catch (error) {
      logger.error('Error checking for malicious content:', error);
      return false;
    }
  }

  /**
   * Obtiene progreso de verificación como porcentaje
   */
  async getVerificationProgress() {
    try {
      const status = await this.getVerificationStatus();
      const requirements = await this.getVerificationRequirements();

      if (!status || !requirements) {
        return 0;
      }

      const totalRequirements = requirements.length;
      const completedRequirements = status.completedRequirements || 0;

      return Math.round((completedRequirements / totalRequirements) * 100);
    } catch (error) {
      logger.error('Error calculating verification progress:', error);
      return 0;
    }
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Limpia cache de verificación
   */
  clearVerificationCache() {
    [
      this.cacheKeys.status,
      this.cacheKeys.documents
    ].forEach(key => cache.remove(key));

    logger.debug('Verification cache cleared');
  }

  /**
   * Limpia toda la cache del servicio
   */
  clearCache() {
    Object.values(this.cacheKeys).forEach(key => {
      cache.remove(key);
    });

    logger.debug('Verification service cache cleared');
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

export const verificationService = new VerificationService();
export default verificationService;