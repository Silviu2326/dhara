import { apiMethods } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { APP_CONSTANTS } from '../config/constants';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { security } from '../utils/security';

/**
 * Servicio completo de credenciales y certificaciones profesionales
 */
class CredentialsService {
  constructor() {
    this.endpoints = ENDPOINTS.CREDENTIALS;
    this.cacheKeys = {
      education: 'credentials_education',
      licenses: 'credentials_licenses',
      certifications: 'credentials_certifications',
      experience: 'credentials_experience',
      verificationStatus: 'credentials_verification'
    };

    // Tipos de documentos permitidos
    this.allowedDocumentTypes = [
      'diploma',
      'certificate',
      'license',
      'transcript',
      'recommendation_letter',
      'portfolio',
      'other'
    ];

    // Estados de verificación
    this.verificationStates = {
      PENDING: 'pending',
      VERIFIED: 'verified',
      REJECTED: 'rejected',
      EXPIRED: 'expired',
      NOT_SUBMITTED: 'not_submitted'
    };
  }

  // ==================== EDUCACIÓN ====================

  /**
   * Obtiene historial educativo
   */
  async getEducation() {
    try {
      const cached = cache.get(this.cacheKeys.education);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.EDUCATION);

      cache.set(this.cacheKeys.education, response, APP_CONSTANTS.CACHE.LONG_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting education history:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Agrega nueva educación
   */
  async addEducation(educationData) {
    try {
      this.validateEducationData(educationData);

      const response = await apiMethods.post(this.endpoints.EDUCATION, educationData);

      cache.remove(this.cacheKeys.education);

      logger.info('Education added successfully', {
        institution: educationData.institution,
        degree: educationData.degree
      });
      return response;
    } catch (error) {
      logger.error('Error adding education:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza información educativa
   */
  async updateEducation(educationId, updates) {
    try {
      if (updates.institution || updates.degree || updates.startDate || updates.endDate) {
        this.validateEducationData(updates);
      }

      const response = await apiMethods.put(`${this.endpoints.EDUCATION}/${educationId}`, updates);

      cache.remove(this.cacheKeys.education);

      logger.info('Education updated successfully', { educationId });
      return response;
    } catch (error) {
      logger.error('Error updating education:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Elimina registro educativo
   */
  async deleteEducation(educationId) {
    try {
      const response = await apiMethods.delete(`${this.endpoints.EDUCATION}/${educationId}`);

      cache.remove(this.cacheKeys.education);

      logger.info('Education deleted successfully', { educationId });
      return response;
    } catch (error) {
      logger.error('Error deleting education:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Sube documento educativo
   */
  async uploadEducationDocument(educationId, file, documentType, onProgress) {
    try {
      this.validateDocumentFile(file);
      this.validateDocumentType(documentType);

      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', documentType);
      formData.append('uploadedAt', new Date().toISOString());

      const response = await apiMethods.upload(
        `${this.endpoints.EDUCATION}/${educationId}/documents`,
        formData,
        { onProgress }
      );

      cache.remove(this.cacheKeys.education);

      logger.info('Education document uploaded successfully', {
        educationId,
        documentType,
        fileName: file.name
      });
      return response;
    } catch (error) {
      logger.error('Error uploading education document:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== LICENCIAS ====================

  /**
   * Obtiene licencias profesionales
   */
  async getLicenses() {
    try {
      const cached = cache.get(this.cacheKeys.licenses);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.LICENSES);

      cache.set(this.cacheKeys.licenses, response, APP_CONSTANTS.CACHE.LONG_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting licenses:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Agrega nueva licencia
   */
  async addLicense(licenseData) {
    try {
      this.validateLicenseData(licenseData);

      const response = await apiMethods.post(this.endpoints.LICENSES, licenseData);

      cache.remove(this.cacheKeys.licenses);

      logger.info('License added successfully', {
        licenseNumber: licenseData.licenseNumber,
        issuingBody: licenseData.issuingBody
      });
      return response;
    } catch (error) {
      logger.error('Error adding license:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza licencia
   */
  async updateLicense(licenseId, updates) {
    try {
      if (Object.keys(updates).some(key => ['licenseNumber', 'issuingBody', 'issueDate', 'expiryDate'].includes(key))) {
        this.validateLicenseData(updates);
      }

      const response = await apiMethods.put(`${this.endpoints.LICENSES}/${licenseId}`, updates);

      cache.remove(this.cacheKeys.licenses);

      logger.info('License updated successfully', { licenseId });
      return response;
    } catch (error) {
      logger.error('Error updating license:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Elimina licencia
   */
  async deleteLicense(licenseId) {
    try {
      const response = await apiMethods.delete(`${this.endpoints.LICENSES}/${licenseId}`);

      cache.remove(this.cacheKeys.licenses);

      logger.info('License deleted successfully', { licenseId });
      return response;
    } catch (error) {
      logger.error('Error deleting license:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Verifica estado de licencia con la autoridad emisora
   */
  async verifyLicenseWithAuthority(licenseId) {
    try {
      const response = await apiMethods.post(`${this.endpoints.LICENSES}/${licenseId}/verify`);

      cache.remove(this.cacheKeys.licenses);

      logger.info('License verification requested', { licenseId });
      return response;
    } catch (error) {
      logger.error('Error verifying license:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene licencias próximas a vencer
   */
  async getExpiringLicenses(daysAhead = 30) {
    try {
      const response = await apiMethods.get(`${this.endpoints.LICENSES}/expiring?days=${daysAhead}`);
      return response;
    } catch (error) {
      logger.error('Error getting expiring licenses:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== CERTIFICACIONES ====================

  /**
   * Obtiene certificaciones
   */
  async getCertifications() {
    try {
      const cached = cache.get(this.cacheKeys.certifications);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.CERTIFICATIONS);

      cache.set(this.cacheKeys.certifications, response, APP_CONSTANTS.CACHE.LONG_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting certifications:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Agrega nueva certificación
   */
  async addCertification(certificationData) {
    try {
      this.validateCertificationData(certificationData);

      const response = await apiMethods.post(this.endpoints.CERTIFICATIONS, certificationData);

      cache.remove(this.cacheKeys.certifications);

      logger.info('Certification added successfully', {
        name: certificationData.name,
        issuingOrganization: certificationData.issuingOrganization
      });
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
      const response = await apiMethods.put(`${this.endpoints.CERTIFICATIONS}/${certificationId}`, updates);

      cache.remove(this.cacheKeys.certifications);

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
      const response = await apiMethods.delete(`${this.endpoints.CERTIFICATIONS}/${certificationId}`);

      cache.remove(this.cacheKeys.certifications);

      logger.info('Certification deleted successfully', { certificationId });
      return response;
    } catch (error) {
      logger.error('Error deleting certification:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Sube certificado de certificación
   */
  async uploadCertificationDocument(certificationId, file, onProgress) {
    try {
      this.validateDocumentFile(file);

      const formData = new FormData();
      formData.append('certificate', file);
      formData.append('uploadedAt', new Date().toISOString());

      const response = await apiMethods.upload(
        `${this.endpoints.CERTIFICATIONS}/${certificationId}/document`,
        formData,
        { onProgress }
      );

      cache.remove(this.cacheKeys.certifications);

      logger.info('Certification document uploaded successfully', {
        certificationId,
        fileName: file.name
      });
      return response;
    } catch (error) {
      logger.error('Error uploading certification document:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== EXPERIENCIA PROFESIONAL ====================

  /**
   * Obtiene experiencia profesional
   */
  async getExperience() {
    try {
      const cached = cache.get(this.cacheKeys.experience);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.EXPERIENCE);

      cache.set(this.cacheKeys.experience, response, APP_CONSTANTS.CACHE.LONG_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting experience:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Agrega experiencia profesional
   */
  async addExperience(experienceData) {
    try {
      this.validateExperienceData(experienceData);

      const response = await apiMethods.post(this.endpoints.EXPERIENCE, experienceData);

      cache.remove(this.cacheKeys.experience);

      logger.info('Experience added successfully', {
        position: experienceData.position,
        organization: experienceData.organization
      });
      return response;
    } catch (error) {
      logger.error('Error adding experience:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Actualiza experiencia profesional
   */
  async updateExperience(experienceId, updates) {
    try {
      const response = await apiMethods.put(`${this.endpoints.EXPERIENCE}/${experienceId}`, updates);

      cache.remove(this.cacheKeys.experience);

      logger.info('Experience updated successfully', { experienceId });
      return response;
    } catch (error) {
      logger.error('Error updating experience:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Elimina experiencia profesional
   */
  async deleteExperience(experienceId) {
    try {
      const response = await apiMethods.delete(`${this.endpoints.EXPERIENCE}/${experienceId}`);

      cache.remove(this.cacheKeys.experience);

      logger.info('Experience deleted successfully', { experienceId });
      return response;
    } catch (error) {
      logger.error('Error deleting experience:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== VERIFICACIÓN GENERAL ====================

  /**
   * Obtiene estado general de verificación
   */
  async getVerificationStatus() {
    try {
      const cached = cache.get(this.cacheKeys.verificationStatus);
      if (cached) return cached;

      const response = await apiMethods.get(this.endpoints.VERIFY);

      cache.set(this.cacheKeys.verificationStatus, response, APP_CONSTANTS.CACHE.SHORT_TTL);

      return response;
    } catch (error) {
      logger.error('Error getting verification status:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Solicita verificación completa de credenciales
   */
  async requestFullVerification() {
    try {
      const response = await apiMethods.post(this.endpoints.VERIFY, {
        requestedAt: new Date().toISOString(),
        requestType: 'full_verification'
      });

      cache.remove(this.cacheKeys.verificationStatus);

      logger.info('Full verification requested');
      return response;
    } catch (error) {
      logger.error('Error requesting verification:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Solicita verificación específica de un credential
   */
  async requestSpecificVerification(credentialType, credentialId) {
    try {
      const response = await apiMethods.post(`${this.endpoints.VERIFY}/specific`, {
        credentialType,
        credentialId,
        requestedAt: new Date().toISOString()
      });

      cache.remove(this.cacheKeys.verificationStatus);

      logger.info('Specific verification requested', { credentialType, credentialId });
      return response;
    } catch (error) {
      logger.error('Error requesting specific verification:', error);
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Obtiene historial de verificaciones
   */
  async getVerificationHistory() {
    try {
      const response = await apiMethods.get(`${this.endpoints.VERIFY}/history`);
      return response;
    } catch (error) {
      logger.error('Error getting verification history:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== VALIDACIONES ====================

  /**
   * Valida datos de educación
   */
  validateEducationData(data) {
    const errors = [];

    if (!data.institution || data.institution.trim().length < 2) {
      errors.push('Institution name is required (minimum 2 characters)');
    }

    if (!data.degree || data.degree.trim().length < 2) {
      errors.push('Degree is required (minimum 2 characters)');
    }

    if (!data.startDate) {
      errors.push('Start date is required');
    }

    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (endDate <= startDate) {
        errors.push('End date must be after start date');
      }

      if (startDate > new Date()) {
        errors.push('Start date cannot be in the future');
      }
    }

    if (data.gpa && (data.gpa < 0 || data.gpa > 4.0)) {
      errors.push('GPA must be between 0 and 4.0');
    }

    if (errors.length > 0) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Education data validation failed',
        { errors }
      );
    }
  }

  /**
   * Valida datos de licencia
   */
  validateLicenseData(data) {
    const errors = [];

    if (!data.licenseNumber || data.licenseNumber.trim().length < 3) {
      errors.push('License number is required (minimum 3 characters)');
    }

    if (!data.issuingBody || data.issuingBody.trim().length < 2) {
      errors.push('Issuing body is required (minimum 2 characters)');
    }

    if (!data.issueDate) {
      errors.push('Issue date is required');
    }

    if (data.issueDate) {
      const issueDate = new Date(data.issueDate);

      if (issueDate > new Date()) {
        errors.push('Issue date cannot be in the future');
      }

      if (data.expiryDate) {
        const expiryDate = new Date(data.expiryDate);

        if (expiryDate <= issueDate) {
          errors.push('Expiry date must be after issue date');
        }
      }
    }

    if (data.jurisdiction && data.jurisdiction.trim().length < 2) {
      errors.push('Jurisdiction must be at least 2 characters');
    }

    if (errors.length > 0) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'License data validation failed',
        { errors }
      );
    }
  }

  /**
   * Valida datos de certificación
   */
  validateCertificationData(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Certification name is required (minimum 2 characters)');
    }

    if (!data.issuingOrganization || data.issuingOrganization.trim().length < 2) {
      errors.push('Issuing organization is required (minimum 2 characters)');
    }

    if (!data.issueDate) {
      errors.push('Issue date is required');
    }

    if (data.issueDate) {
      const issueDate = new Date(data.issueDate);

      if (issueDate > new Date()) {
        errors.push('Issue date cannot be in the future');
      }

      if (data.expiryDate) {
        const expiryDate = new Date(data.expiryDate);

        if (expiryDate <= issueDate) {
          errors.push('Expiry date must be after issue date');
        }
      }
    }

    if (data.credentialId && data.credentialId.trim().length < 3) {
      errors.push('Credential ID must be at least 3 characters');
    }

    if (errors.length > 0) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Certification data validation failed',
        { errors }
      );
    }
  }

  /**
   * Valida datos de experiencia
   */
  validateExperienceData(data) {
    const errors = [];

    if (!data.position || data.position.trim().length < 2) {
      errors.push('Position is required (minimum 2 characters)');
    }

    if (!data.organization || data.organization.trim().length < 2) {
      errors.push('Organization is required (minimum 2 characters)');
    }

    if (!data.startDate) {
      errors.push('Start date is required');
    }

    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (endDate <= startDate) {
        errors.push('End date must be after start date');
      }

      if (startDate > new Date()) {
        errors.push('Start date cannot be in the future');
      }
    }

    if (data.description && data.description.length > 2000) {
      errors.push('Description must be less than 2000 characters');
    }

    if (errors.length > 0) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        'Experience data validation failed',
        { errors }
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

    if (!APP_CONSTANTS.FILES.ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      throw errorHandler.createError(
        errorHandler.errorCodes.INVALID_FILE_TYPE,
        'Invalid document type. Only PDF, DOC, DOCX, and TXT files are allowed.'
      );
    }

    if (file.size > APP_CONSTANTS.FILES.MAX_UPLOAD_SIZE) {
      throw errorHandler.createError(
        errorHandler.errorCodes.FILE_TOO_LARGE,
        'Document file size exceeds maximum allowed size'
      );
    }
  }

  /**
   * Valida tipo de documento
   */
  validateDocumentType(documentType) {
    if (!this.allowedDocumentTypes.includes(documentType)) {
      throw errorHandler.createError(
        errorHandler.errorCodes.VALIDATION_ERROR,
        `Invalid document type. Allowed types: ${this.allowedDocumentTypes.join(', ')}`
      );
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Calcula años de experiencia total
   */
  calculateTotalExperience(experiences) {
    if (!Array.isArray(experiences) || experiences.length === 0) {
      return 0;
    }

    let totalMonths = 0;

    experiences.forEach(exp => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date();

      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                        (endDate.getMonth() - startDate.getMonth());

      totalMonths += Math.max(0, monthsDiff);
    });

    return Math.round(totalMonths / 12 * 10) / 10; // Redondear a 1 decimal
  }

  /**
   * Obtiene credenciales próximas a vencer
   */
  getExpiringCredentials(credentials, daysAhead = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    return credentials.filter(credential => {
      if (!credential.expiryDate) return false;

      const expiryDate = new Date(credential.expiryDate);
      return expiryDate <= cutoffDate && expiryDate > new Date();
    });
  }

  /**
   * Genera resumen de credenciales para verificación
   */
  async generateCredentialsSummary() {
    try {
      const [education, licenses, certifications, experience] = await Promise.all([
        this.getEducation(),
        this.getLicenses(),
        this.getCertifications(),
        this.getExperience()
      ]);

      const summary = {
        education: {
          count: education.length,
          verified: education.filter(e => e.verificationStatus === 'verified').length,
          pending: education.filter(e => e.verificationStatus === 'pending').length
        },
        licenses: {
          count: licenses.length,
          active: licenses.filter(l => !l.expiryDate || new Date(l.expiryDate) > new Date()).length,
          expiring: this.getExpiringCredentials(licenses).length,
          verified: licenses.filter(l => l.verificationStatus === 'verified').length
        },
        certifications: {
          count: certifications.length,
          active: certifications.filter(c => !c.expiryDate || new Date(c.expiryDate) > new Date()).length,
          expiring: this.getExpiringCredentials(certifications).length,
          verified: certifications.filter(c => c.verificationStatus === 'verified').length
        },
        experience: {
          positions: experience.length,
          totalYears: this.calculateTotalExperience(experience),
          verified: experience.filter(e => e.verificationStatus === 'verified').length
        }
      };

      logger.info('Credentials summary generated', summary);
      return summary;
    } catch (error) {
      logger.error('Error generating credentials summary:', error);
      throw errorHandler.handleError(error);
    }
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Limpia toda la cache del servicio
   */
  clearCache() {
    Object.values(this.cacheKeys).forEach(key => {
      cache.remove(key);
    });

    logger.debug('Credentials service cache cleared');
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

export const credentialsService = new CredentialsService();
export default credentialsService;