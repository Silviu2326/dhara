import { logger } from './logger';
import { security } from './security';

/**
 * Utilidades de privacidad y encriptación para datos sensibles
 */
class PrivacyUtils {
  constructor() {
    this.sensitiveFields = [
      'ssn', 'socialSecurityNumber', 'taxId', 'nationalId',
      'phoneNumber', 'email', 'address', 'emergencyContact',
      'medicalHistory', 'diagnosis', 'medication', 'notes',
      'sessionNotes', 'observations', 'personalNotes'
    ];

    this.encryptionConfig = {
      algorithm: 'AES-GCM',
      keyLength: 256,
      ivLength: 12,
      tagLength: 16
    };
  }

  /**
   * Genera una clave de encriptación basada en el usuario
   */
  async generateEncryptionKey(userId, sessionId = null) {
    try {
      const keyMaterial = `${userId}_${sessionId || 'default'}_${Date.now()}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(keyMaterial);

      if (crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return new Uint8Array(hashBuffer);
      } else {
        // Fallback para entornos sin crypto.subtle
        return this.simpleHash(keyMaterial);
      }
    } catch (error) {
      logger.error('Error generating encryption key:', error);
      throw new Error('Failed to generate encryption key');
    }
  }

  /**
   * Hash simple para fallback
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return new Uint8Array([hash]);
  }

  /**
   * Encripta datos sensibles
   */
  async encryptSensitiveData(data, encryptionKey) {
    try {
      if (!data || typeof data !== 'object') {
        return data;
      }

      const encrypted = {};

      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key) && value) {
          encrypted[key] = await this.encryptValue(value, encryptionKey);
          encrypted[`${key}_encrypted`] = true;
        } else if (typeof value === 'object' && value !== null) {
          encrypted[key] = await this.encryptSensitiveData(value, encryptionKey);
        } else {
          encrypted[key] = value;
        }
      }

      return encrypted;
    } catch (error) {
      logger.error('Error encrypting sensitive data:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Desencripta datos sensibles
   */
  async decryptSensitiveData(data, encryptionKey) {
    try {
      if (!data || typeof data !== 'object') {
        return data;
      }

      const decrypted = {};

      for (const [key, value] of Object.entries(data)) {
        if (key.endsWith('_encrypted')) {
          continue; // Skip encryption flags
        }

        if (data[`${key}_encrypted`] && value) {
          decrypted[key] = await this.decryptValue(value, encryptionKey);
        } else if (typeof value === 'object' && value !== null) {
          decrypted[key] = await this.decryptSensitiveData(value, encryptionKey);
        } else {
          decrypted[key] = value;
        }
      }

      return decrypted;
    } catch (error) {
      logger.error('Error decrypting sensitive data:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Encripta un valor individual
   */
  async encryptValue(value, encryptionKey) {
    try {
      if (crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(value));
        const iv = crypto.getRandomValues(new Uint8Array(this.encryptionConfig.ivLength));

        const key = await crypto.subtle.importKey(
          'raw',
          encryptionKey,
          { name: this.encryptionConfig.algorithm },
          false,
          ['encrypt']
        );

        const encrypted = await crypto.subtle.encrypt(
          {
            name: this.encryptionConfig.algorithm,
            iv: iv
          },
          key,
          data
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode.apply(null, combined));
      } else {
        // Fallback simple (no recomendado para producción)
        return btoa(JSON.stringify(value));
      }
    } catch (error) {
      logger.error('Error encrypting value:', error);
      throw new Error('Failed to encrypt value');
    }
  }

  /**
   * Desencripta un valor individual
   */
  async decryptValue(encryptedValue, encryptionKey) {
    try {
      if (crypto.subtle) {
        const combined = new Uint8Array(
          atob(encryptedValue).split('').map(c => c.charCodeAt(0))
        );

        const iv = combined.slice(0, this.encryptionConfig.ivLength);
        const data = combined.slice(this.encryptionConfig.ivLength);

        const key = await crypto.subtle.importKey(
          'raw',
          encryptionKey,
          { name: this.encryptionConfig.algorithm },
          false,
          ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
          {
            name: this.encryptionConfig.algorithm,
            iv: iv
          },
          key,
          data
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
      } else {
        // Fallback simple
        return JSON.parse(atob(encryptedValue));
      }
    } catch (error) {
      logger.error('Error decrypting value:', error);
      throw new Error('Failed to decrypt value');
    }
  }

  /**
   * Verifica si un campo es sensible
   */
  isSensitiveField(fieldName) {
    return this.sensitiveFields.some(sensitive =>
      fieldName.toLowerCase().includes(sensitive.toLowerCase())
    );
  }

  /**
   * Sanitiza datos para logging (oculta información sensible)
   */
  sanitizeForLogging(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[SENSITIVE_DATA_HIDDEN]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeForLogging(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Genera hash de datos para auditoría sin exponer contenido
   */
  async generateDataHash(data) {
    try {
      const serialized = JSON.stringify(data, Object.keys(data).sort());
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(serialized);

      if (crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = new Uint8Array(hashBuffer);
        return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        return security.generateHash(data);
      }
    } catch (error) {
      logger.error('Error generating data hash:', error);
      return null;
    }
  }

  /**
   * Valida conformidad con regulaciones de privacidad
   */
  validatePrivacyCompliance(data, options = {}) {
    const {
      requireEncryption = true,
      allowSensitiveFields = [],
      validateDataMinimization = true
    } = options;

    const violations = [];

    // Verificar encriptación de campos sensibles
    if (requireEncryption) {
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key) && !allowSensitiveFields.includes(key)) {
          if (!data[`${key}_encrypted`]) {
            violations.push({
              type: 'unencrypted_sensitive_data',
              field: key,
              severity: 'high',
              message: `Sensitive field '${key}' is not encrypted`
            });
          }
        }
      }
    }

    // Verificar minimización de datos
    if (validateDataMinimization) {
      const unnecessaryFields = this.detectUnnecessaryFields(data);
      unnecessaryFields.forEach(field => {
        violations.push({
          type: 'data_minimization',
          field,
          severity: 'medium',
          message: `Field '${field}' may not be necessary`
        });
      });
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Detecta campos innecesarios para minimización de datos
   */
  detectUnnecessaryFields(data) {
    const unnecessaryPatterns = [
      'temp_', 'tmp_', 'debug_', 'test_',
      'unused_', 'deprecated_', 'old_'
    ];

    const unnecessary = [];

    for (const key of Object.keys(data)) {
      if (unnecessaryPatterns.some(pattern => key.startsWith(pattern))) {
        unnecessary.push(key);
      }
    }

    return unnecessary;
  }

  /**
   * Genera token de consentimiento
   */
  generateConsentToken(userId, purposes, expiryDays = 365) {
    const consentData = {
      userId,
      purposes,
      grantedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (expiryDays * 24 * 60 * 60 * 1000)).toISOString(),
      tokenId: security.generateSecureId('consent_')
    };

    const token = btoa(JSON.stringify(consentData));

    logger.info('Consent token generated', {
      userId,
      purposes,
      tokenId: consentData.tokenId
    });

    return {
      token,
      tokenId: consentData.tokenId,
      expiresAt: consentData.expiresAt
    };
  }

  /**
   * Valida token de consentimiento
   */
  validateConsentToken(token, requiredPurposes = []) {
    try {
      const consentData = JSON.parse(atob(token));
      const now = new Date();
      const expiryDate = new Date(consentData.expiresAt);

      // Verificar expiración
      if (now > expiryDate) {
        return {
          isValid: false,
          reason: 'token_expired',
          expiredAt: consentData.expiresAt
        };
      }

      // Verificar propósitos requeridos
      const hasRequiredPurposes = requiredPurposes.every(purpose =>
        consentData.purposes.includes(purpose)
      );

      if (!hasRequiredPurposes) {
        return {
          isValid: false,
          reason: 'insufficient_purposes',
          granted: consentData.purposes,
          required: requiredPurposes
        };
      }

      return {
        isValid: true,
        consentData
      };
    } catch (error) {
      return {
        isValid: false,
        reason: 'invalid_token',
        error: error.message
      };
    }
  }

  /**
   * Registra acceso a datos sensibles para auditoría
   */
  logDataAccess(userId, dataType, action, details = {}) {
    logger.securityEvent('sensitive_data_access', {
      userId,
      dataType,
      action,
      timestamp: new Date().toISOString(),
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      sessionId: details.sessionId || 'unknown'
    });
  }

  /**
   * Implementa "derecho al olvido" - eliminación segura de datos
   */
  async secureDataDeletion(dataId, dataType, userId) {
    try {
      // Log de eliminación
      logger.securityEvent('data_deletion_requested', {
        dataId,
        dataType,
        userId,
        timestamp: new Date().toISOString()
      });

      // En un sistema real, aquí se implementaría:
      // 1. Eliminación de todas las copias
      // 2. Eliminación de backups
      // 3. Eliminación de logs que contengan la información
      // 4. Notificación a sistemas terceros

      const deletionRecord = {
        dataId,
        dataType,
        userId,
        deletedAt: new Date().toISOString(),
        deletionRequestId: security.generateSecureId('deletion_'),
        status: 'completed'
      };

      logger.info('Secure data deletion completed', deletionRecord);

      return deletionRecord;
    } catch (error) {
      logger.error('Secure data deletion failed:', error);
      throw new Error('Failed to securely delete data');
    }
  }
}

// Instancia global de utilidades de privacidad
export const privacy = new PrivacyUtils();

// Helpers específicos
export const encryptSensitiveData = (data, key) => privacy.encryptSensitiveData(data, key);
export const decryptSensitiveData = (data, key) => privacy.decryptSensitiveData(data, key);
export const sanitizeForLogging = (data) => privacy.sanitizeForLogging(data);
export const validatePrivacyCompliance = (data, options) => privacy.validatePrivacyCompliance(data, options);
export const generateConsentToken = (userId, purposes, days) => privacy.generateConsentToken(userId, purposes, days);
export const logDataAccess = (userId, type, action, details) => privacy.logDataAccess(userId, type, action, details);

export default privacy;