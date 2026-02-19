import { APP_CONSTANTS } from '../config/constants';
import { logger } from './logger';

/**
 * Utilidades de seguridad para la aplicación
 */
class SecurityUtils {
  constructor() {
    this.xssRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    this.sqlInjectionRegex = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi;
    this.sensitiveDataPatterns = {
      password: /password/gi,
      token: /token/gi,
      key: /key/gi,
      secret: /secret/gi,
      auth: /authorization/gi
    };
  }

  /**
   * Sanitiza entrada de texto para prevenir XSS
   */
  sanitizeHtml(input) {
    if (typeof input !== 'string') return input;

    // Reemplazar caracteres peligrosos
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Detecta posibles ataques XSS
   */
  detectXSS(input) {
    if (typeof input !== 'string') return false;

    return this.xssRegex.test(input);
  }

  /**
   * Detecta posibles intentos de inyección SQL
   */
  detectSQLInjection(input) {
    if (typeof input !== 'string') return false;

    return this.sqlInjectionRegex.test(input);
  }

  /**
   * Valida la fortaleza de una contraseña
   */
  validatePasswordStrength(password) {
    const result = {
      isValid: false,
      score: 0,
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        noCommonPasswords: false
      },
      suggestions: []
    };

    if (!password || typeof password !== 'string') {
      result.suggestions.push('La contraseña es requerida');
      return result;
    }

    // Verificar longitud mínima
    if (password.length >= APP_CONSTANTS.AUTH.PASSWORD_MIN_LENGTH) {
      result.requirements.minLength = true;
      result.score += 1;
    } else {
      result.suggestions.push(`Mínimo ${APP_CONSTANTS.AUTH.PASSWORD_MIN_LENGTH} caracteres`);
    }

    // Verificar mayúsculas
    if (/[A-Z]/.test(password)) {
      result.requirements.hasUppercase = true;
      result.score += 1;
    } else {
      result.suggestions.push('Incluye al menos una letra mayúscula');
    }

    // Verificar minúsculas
    if (/[a-z]/.test(password)) {
      result.requirements.hasLowercase = true;
      result.score += 1;
    } else {
      result.suggestions.push('Incluye al menos una letra minúscula');
    }

    // Verificar números
    if (/\d/.test(password)) {
      result.requirements.hasNumber = true;
      result.score += 1;
    } else {
      result.suggestions.push('Incluye al menos un número');
    }

    // Verificar caracteres especiales
    if (/[@$!%*?&]/.test(password)) {
      result.requirements.hasSpecialChar = true;
      result.score += 1;
    } else {
      result.suggestions.push('Incluye al menos un carácter especial (@$!%*?&)');
    }

    // Verificar contraseñas comunes
    if (!this.isCommonPassword(password)) {
      result.requirements.noCommonPasswords = true;
      result.score += 1;
    } else {
      result.suggestions.push('Evita contraseñas comunes');
    }

    // Verificaciones adicionales para mayor seguridad
    if (password.length >= 12) result.score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) result.score += 1;
    if (!/(.)\1{2,}/.test(password)) result.score += 1; // No caracteres repetidos

    result.isValid = result.score >= 5;

    return result;
  }

  /**
   * Verifica si una contraseña es común/débil
   */
  isCommonPassword(password) {
    const commonPasswords = [
      '123456', 'password', '123456789', '12345678', '12345',
      '1234567', '1234567890', 'qwerty', 'abc123', 'million2',
      '000000', '1234', 'iloveyou', 'aaron431', 'password1',
      'qqww1122', '123', 'omgpop', '123321', '654321'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Genera una contraseña segura
   */
  generateSecurePassword(length = 16) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '@$!%*?&';

    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';

    // Asegurar al menos un carácter de cada tipo
    password += this.getRandomChar(lowercase);
    password += this.getRandomChar(uppercase);
    password += this.getRandomChar(numbers);
    password += this.getRandomChar(symbols);

    // Llenar el resto de la longitud
    for (let i = 4; i < length; i++) {
      password += this.getRandomChar(allChars);
    }

    // Mezclar la contraseña
    return this.shuffleString(password);
  }

  /**
   * Obtiene un carácter aleatorio de una cadena
   */
  getRandomChar(str) {
    return str.charAt(Math.floor(Math.random() * str.length));
  }

  /**
   * Mezcla los caracteres de una cadena
   */
  shuffleString(str) {
    return str.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Valida formato de email
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email es requerido' };
    }

    if (!APP_CONSTANTS.VALIDATION.EMAIL_REGEX.test(email)) {
      return { isValid: false, error: 'Formato de email inválido' };
    }

    if (email.length > 254) {
      return { isValid: false, error: 'Email demasiado largo' };
    }

    return { isValid: true };
  }

  /**
   * Valida formato de teléfono
   */
  validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, error: 'Teléfono es requerido' };
    }

    const cleanPhone = phone.replace(/\s|-|\(|\)/g, '');

    if (!APP_CONSTANTS.VALIDATION.PHONE_REGEX.test(cleanPhone)) {
      return { isValid: false, error: 'Formato de teléfono inválido' };
    }

    return { isValid: true, cleanPhone };
  }

  /**
   * Genera un hash simple para verificación de integridad
   */
  generateHash(data) {
    let hash = 0;
    const str = JSON.stringify(data);

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }

    return hash.toString(36);
  }

  /**
   * Verifica la integridad de datos usando hash
   */
  verifyIntegrity(data, expectedHash) {
    const actualHash = this.generateHash(data);
    return actualHash === expectedHash;
  }

  /**
   * Remueve datos sensibles de objetos para logging
   */
  sanitizeForLogging(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = { ...obj };

    const sanitizeValue = (key, value) => {
      if (typeof value === 'string') {
        // Verificar si la clave contiene información sensible
        for (const [pattern, regex] of Object.entries(this.sensitiveDataPatterns)) {
          if (regex.test(key)) {
            return '[REDACTED]';
          }
        }

        // Verificar si el valor parece ser un token o clave
        if (value.length > 20 && /^[a-zA-Z0-9+/=]+$/.test(value)) {
          return '[REDACTED_TOKEN]';
        }
      }

      return value;
    };

    const sanitizeObject = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item =>
          typeof item === 'object' ? sanitizeObject(item) : item
        );
      }

      if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = sanitizeValue(key, value);
          }
        }
        return sanitized;
      }

      return obj;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Genera un identificador único seguro
   */
  generateSecureId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    const counter = (++this.idCounter).toString(36);

    return `${prefix}${timestamp}_${random}_${counter}`;
  }

  /**
   * Valida que una URL sea segura
   */
  validateUrl(url) {
    try {
      const urlObj = new URL(url);

      // Solo permitir HTTPS en producción
      if (window.location.protocol === 'https:' && urlObj.protocol !== 'https:') {
        return { isValid: false, error: 'URL debe usar HTTPS' };
      }

      // Verificar que no sea un esquema peligroso
      const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
      if (dangerousSchemes.includes(urlObj.protocol)) {
        return { isValid: false, error: 'Esquema de URL no permitido' };
      }

      return { isValid: true, url: urlObj };
    } catch (error) {
      return { isValid: false, error: 'URL inválida' };
    }
  }

  /**
   * Implementa rate limiting básico del lado del cliente
   */
  createRateLimiter(maxRequests = 100, windowMs = 60000) {
    const requests = [];

    return {
      isAllowed: () => {
        const now = Date.now();

        // Limpiar requests antiguos
        while (requests.length > 0 && requests[0] < now - windowMs) {
          requests.shift();
        }

        // Verificar si se ha excedido el límite
        if (requests.length >= maxRequests) {
          logger.warn('Rate limit exceeded', {
            requests: requests.length,
            maxRequests,
            windowMs
          });
          return false;
        }

        // Agregar request actual
        requests.push(now);
        return true;
      },
      getRemainingRequests: () => Math.max(0, maxRequests - requests.length),
      getResetTime: () => requests.length > 0 ? requests[0] + windowMs : Date.now()
    };
  }

  /**
   * Verifica la seguridad del entorno de ejecución
   */
  checkEnvironmentSecurity() {
    const checks = {
      https: window.location.protocol === 'https:',
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      crypto: !!window.crypto,
      csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null
    };

    const warnings = [];

    if (!checks.https && window.location.hostname !== 'localhost') {
      warnings.push('Conexión no segura (HTTP)');
    }

    if (!checks.crypto) {
      warnings.push('Web Crypto API no disponible');
    }

    if (!checks.csp) {
      warnings.push('Content Security Policy no configurado');
    }

    if (warnings.length > 0) {
      logger.warn('Security warnings detected', { warnings, checks });
    }

    return { checks, warnings };
  }

  /**
   * Cifra datos sensibles para almacenamiento local (implementación básica)
   */
  encryptData(data, key) {
    try {
      // Implementación simple - en producción usar Web Crypto API
      const jsonData = JSON.stringify(data);
      const encrypted = btoa(jsonData);
      return encrypted;
    } catch (error) {
      logger.error('Encryption failed', { error: error.message });
      return null;
    }
  }

  /**
   * Descifra datos del almacenamiento local
   */
  decryptData(encryptedData, key) {
    try {
      const decrypted = atob(encryptedData);
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Decryption failed', { error: error.message });
      return null;
    }
  }
}

// Contador para IDs únicos
SecurityUtils.prototype.idCounter = 0;

// Instancia global de utilidades de seguridad
export const security = new SecurityUtils();

// Helpers específicos
export const sanitizeHtml = (input) => security.sanitizeHtml(input);
export const validatePassword = (password) => security.validatePasswordStrength(password);
export const validateEmail = (email) => security.validateEmail(email);
export const generateSecureId = (prefix) => security.generateSecureId(prefix);
export const sanitizeForLogging = (obj) => security.sanitizeForLogging(obj);

export default security;