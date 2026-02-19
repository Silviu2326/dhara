import { logger } from './logger';

class Validators {
  constructor() {
    // Expresiones regulares comunes
    this.patterns = {
      email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      phone: /^[\+]?[1-9][\d]{0,15}$/,
      phoneInternational: /^\+[1-9]\d{1,14}$/,
      phoneLocal: /^[0-9]{7,15}$/,
      strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      mediumPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]/,
      url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
      zipCode: /^\d{5}(-\d{4})?$/,
      creditCard: /^[0-9]{13,19}$/,
      cvv: /^[0-9]{3,4}$/,
      alphanumeric: /^[a-zA-Z0-9]+$/,
      alphabetic: /^[a-zA-Z\s]+$/,
      numeric: /^[0-9]+$/,
      decimal: /^\d+(\.\d{1,2})?$/,
      time24: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      time12: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$/,
      hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    };

    // Configuraciones de validación
    this.config = {
      password: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        forbiddenPasswords: ['password', '123456789', 'qwerty', 'admin']
      },
      file: {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        allowedVideoTypes: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo'],
        allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
      },
      medical: {
        minAge: 0,
        maxAge: 150,
        minHeight: 30, // cm
        maxHeight: 250, // cm
        minWeight: 1, // kg
        maxWeight: 500 // kg
      }
    };

    // Códigos de país para validación de teléfonos
    this.countryCodes = {
      'US': { code: '+1', length: 10 },
      'MX': { code: '+52', length: 10 },
      'ES': { code: '+34', length: 9 },
      'AR': { code: '+54', length: 10 },
      'CO': { code: '+57', length: 10 },
      'CL': { code: '+56', length: 9 },
      'PE': { code: '+51', length: 9 },
      'BR': { code: '+55', length: 11 }
    };
  }

  // Validaciones básicas
  isRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  isEmail(email) {
    if (!this.isRequired(email)) return false;

    const normalizedEmail = email.toLowerCase().trim();

    // Verificar patrón básico
    if (!this.patterns.email.test(normalizedEmail)) return false;

    // Verificar longitud
    if (normalizedEmail.length > 254) return false;

    // Verificar partes del email
    const [localPart, domain] = normalizedEmail.split('@');
    if (localPart.length > 64) return false;

    // Verificar caracteres especiales consecutivos
    if (localPart.includes('..') || localPart.startsWith('.') || localPart.endsWith('.')) return false;

    return true;
  }

  isPhone(phone, countryCode = null) {
    if (!this.isRequired(phone)) return false;

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    if (countryCode && this.countryCodes[countryCode]) {
      const countryInfo = this.countryCodes[countryCode];
      const expectedLength = countryInfo.length;

      if (cleanPhone.startsWith(countryInfo.code)) {
        const numberPart = cleanPhone.substring(countryInfo.code.length);
        return numberPart.length === expectedLength && this.patterns.numeric.test(numberPart);
      } else {
        return cleanPhone.length === expectedLength && this.patterns.numeric.test(cleanPhone);
      }
    }

    return this.patterns.phone.test(cleanPhone);
  }

  isPassword(password, options = {}) {
    if (!this.isRequired(password)) return { valid: false, errors: ['Password is required'] };

    const config = { ...this.config.password, ...options };
    const errors = [];

    // Verificar longitud
    if (password.length < config.minLength) {
      errors.push(`Password must be at least ${config.minLength} characters long`);
    }

    if (password.length > config.maxLength) {
      errors.push(`Password must be no more than ${config.maxLength} characters long`);
    }

    // Verificar complejidad
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (config.requireSpecialChars && !/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    // Verificar contraseñas prohibidas
    if (config.forbiddenPasswords.includes(password.toLowerCase())) {
      errors.push('This password is too common and not allowed');
    }

    return {
      valid: errors.length === 0,
      errors,
      strength: this.getPasswordStrength(password)
    };
  }

  getPasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[@$!%*?&]/.test(password)) score += 1;
    if (password.length >= 16) score += 1;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    if (score <= 6) return 'strong';
    return 'very-strong';
  }

  // Validaciones de fecha y hora
  isDate(date, format = 'YYYY-MM-DD') {
    if (!this.isRequired(date)) return false;

    const dateObj = new Date(date);

    // Verificar si es una fecha válida
    if (isNaN(dateObj.getTime())) return false;

    // Verificar formato si se especifica
    if (format === 'YYYY-MM-DD') {
      return /^\d{4}-\d{2}-\d{2}$/.test(date);
    }

    return true;
  }

  isDateInRange(date, minDate = null, maxDate = null) {
    if (!this.isDate(date)) return false;

    const dateObj = new Date(date);

    if (minDate && dateObj < new Date(minDate)) return false;
    if (maxDate && dateObj > new Date(maxDate)) return false;

    return true;
  }

  isTime(time, format = '24h') {
    if (!this.isRequired(time)) return false;

    if (format === '24h') {
      return this.patterns.time24.test(time);
    } else if (format === '12h') {
      return this.patterns.time12.test(time);
    }

    return false;
  }

  isAge(age, minAge = null, maxAge = null) {
    if (!this.isRequired(age)) return false;

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0) return false;

    const min = minAge !== null ? minAge : this.config.medical.minAge;
    const max = maxAge !== null ? maxAge : this.config.medical.maxAge;

    return ageNum >= min && ageNum <= max;
  }

  // Validaciones de archivos
  isValidFile(file, options = {}) {
    if (!file || !(file instanceof File)) {
      return { valid: false, errors: ['Invalid file object'] };
    }

    const errors = [];
    const config = { ...this.config.file, ...options };

    // Verificar tamaño
    if (file.size > config.maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${this.formatFileSize(config.maxSize)}`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Verificar tipo MIME
    const allowedTypes = [
      ...(config.allowedImageTypes || []),
      ...(config.allowedDocumentTypes || []),
      ...(config.allowedVideoTypes || []),
      ...(config.allowedAudioTypes || [])
    ];

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Verificar extensión del archivo
    const fileName = file.name.toLowerCase();
    const extension = fileName.substring(fileName.lastIndexOf('.'));

    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js'];
    if (dangerousExtensions.includes(extension)) {
      errors.push('File type is not allowed for security reasons');
    }

    return {
      valid: errors.length === 0,
      errors,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    };
  }

  isImage(file) {
    if (!file) return false;
    return this.config.file.allowedImageTypes.includes(file.type);
  }

  isDocument(file) {
    if (!file) return false;
    return this.config.file.allowedDocumentTypes.includes(file.type);
  }

  // Validaciones médicas
  isHeight(height, unit = 'cm') {
    if (!this.isRequired(height)) return false;

    const heightNum = parseFloat(height);
    if (isNaN(heightNum) || heightNum <= 0) return false;

    if (unit === 'cm') {
      return heightNum >= this.config.medical.minHeight && heightNum <= this.config.medical.maxHeight;
    } else if (unit === 'ft') {
      const cmHeight = heightNum * 30.48; // Conversión aproximada
      return cmHeight >= this.config.medical.minHeight && cmHeight <= this.config.medical.maxHeight;
    }

    return false;
  }

  isWeight(weight, unit = 'kg') {
    if (!this.isRequired(weight)) return false;

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) return false;

    if (unit === 'kg') {
      return weightNum >= this.config.medical.minWeight && weightNum <= this.config.medical.maxWeight;
    } else if (unit === 'lbs') {
      const kgWeight = weightNum * 0.453592;
      return kgWeight >= this.config.medical.minWeight && kgWeight <= this.config.medical.maxWeight;
    }

    return false;
  }

  isBloodPressure(systolic, diastolic) {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);

    if (isNaN(sys) || isNaN(dia)) return false;

    // Rangos normales de presión arterial
    return sys >= 70 && sys <= 250 && dia >= 40 && dia <= 150 && sys > dia;
  }

  isHeartRate(heartRate, age = null) {
    const hr = parseInt(heartRate);
    if (isNaN(hr) || hr <= 0) return false;

    // Rango general para adultos
    let minHR = 60;
    let maxHR = 220;

    if (age) {
      maxHR = 220 - age; // Frecuencia cardíaca máxima estimada
      minHR = Math.max(40, maxHR * 0.5); // Mínimo del 50% de la máxima
    }

    return hr >= minHR && hr <= maxHR;
  }

  // Validaciones de formulario
  validateForm(formData, schema) {
    const errors = {};
    let isValid = true;

    for (const [fieldName, rules] of Object.entries(schema)) {
      const fieldValue = formData[fieldName];
      const fieldErrors = [];

      for (const rule of rules) {
        const result = this.validateField(fieldValue, rule);
        if (!result.valid) {
          fieldErrors.push(...result.errors);
          isValid = false;
        }
      }

      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
      }
    }

    return { valid: isValid, errors };
  }

  validateField(value, rule) {
    const { type, options = {} } = rule;

    switch (type) {
      case 'required':
        return { valid: this.isRequired(value), errors: this.isRequired(value) ? [] : ['This field is required'] };

      case 'email':
        return { valid: this.isEmail(value), errors: this.isEmail(value) ? [] : ['Invalid email format'] };

      case 'phone':
        return { valid: this.isPhone(value, options.countryCode), errors: this.isPhone(value, options.countryCode) ? [] : ['Invalid phone number'] };

      case 'password':
        return this.isPassword(value, options);

      case 'date':
        return { valid: this.isDate(value, options.format), errors: this.isDate(value, options.format) ? [] : ['Invalid date format'] };

      case 'dateRange':
        return { valid: this.isDateInRange(value, options.minDate, options.maxDate), errors: this.isDateInRange(value, options.minDate, options.maxDate) ? [] : ['Date is out of allowed range'] };

      case 'file':
        return this.isValidFile(value, options);

      case 'minLength':
        const minValid = !value || value.length >= options.length;
        return { valid: minValid, errors: minValid ? [] : [`Must be at least ${options.length} characters long`] };

      case 'maxLength':
        const maxValid = !value || value.length <= options.length;
        return { valid: maxValid, errors: maxValid ? [] : [`Must be no more than ${options.length} characters long`] };

      case 'pattern':
        const patternValid = !value || new RegExp(options.pattern).test(value);
        return { valid: patternValid, errors: patternValid ? [] : [options.message || 'Invalid format'] };

      case 'custom':
        return options.validator(value);

      default:
        return { valid: true, errors: [] };
    }
  }

  // Schemas de validación predefinidos
  getSchemas() {
    return {
      userRegistration: {
        email: [
          { type: 'required' },
          { type: 'email' }
        ],
        password: [
          { type: 'required' },
          { type: 'password' }
        ],
        confirmPassword: [
          { type: 'required' },
          {
            type: 'custom',
            validator: (value, formData) => {
              const valid = value === formData.password;
              return { valid, errors: valid ? [] : ['Passwords do not match'] };
            }
          }
        ],
        firstName: [
          { type: 'required' },
          { type: 'minLength', options: { length: 2 } },
          { type: 'pattern', options: { pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$', message: 'Only letters are allowed' } }
        ],
        lastName: [
          { type: 'required' },
          { type: 'minLength', options: { length: 2 } },
          { type: 'pattern', options: { pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$', message: 'Only letters are allowed' } }
        ],
        phone: [
          { type: 'required' },
          { type: 'phone' }
        ],
        birthDate: [
          { type: 'required' },
          { type: 'date' },
          { type: 'dateRange', options: { minDate: '1900-01-01', maxDate: new Date().toISOString().split('T')[0] } }
        ]
      },

      therapeutProfile: {
        licenseNumber: [
          { type: 'required' },
          { type: 'minLength', options: { length: 5 } },
          { type: 'pattern', options: { pattern: '^[A-Z0-9]+$', message: 'License number must contain only uppercase letters and numbers' } }
        ],
        specializations: [
          { type: 'required' },
          {
            type: 'custom',
            validator: (value) => {
              const valid = Array.isArray(value) && value.length > 0;
              return { valid, errors: valid ? [] : ['At least one specialization is required'] };
            }
          }
        ],
        experience: [
          { type: 'required' },
          { type: 'pattern', options: { pattern: '^[0-9]+$', message: 'Experience must be a number' } },
          {
            type: 'custom',
            validator: (value) => {
              const num = parseInt(value);
              const valid = num >= 0 && num <= 50;
              return { valid, errors: valid ? [] : ['Experience must be between 0 and 50 years'] };
            }
          }
        ]
      },

      appointment: {
        date: [
          { type: 'required' },
          { type: 'date' },
          {
            type: 'dateRange',
            options: {
              minDate: new Date().toISOString().split('T')[0],
              maxDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          }
        ],
        time: [
          { type: 'required' },
          { type: 'pattern', options: { pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$', message: 'Invalid time format (HH:MM)' } }
        ],
        duration: [
          { type: 'required' },
          {
            type: 'custom',
            validator: (value) => {
              const validDurations = [30, 45, 60, 90, 120];
              const valid = validDurations.includes(parseInt(value));
              return { valid, errors: valid ? [] : ['Invalid session duration'] };
            }
          }
        ]
      }
    };
  }

  // Utilidades
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') return input;

    let sanitized = input.trim();

    if (options.removeHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    if (options.removeSpecialChars) {
      sanitized = sanitized.replace(/[^\w\s.-]/gi, '');
    }

    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  }

  // Validaciones personalizadas por país
  getCountryValidators(countryCode) {
    const validators = {
      'MX': {
        curp: (curp) => {
          const pattern = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
          return pattern.test(curp);
        },
        rfc: (rfc) => {
          const pattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-V1-9][A-Z1-9][0-9A]$/;
          return pattern.test(rfc);
        }
      },
      'US': {
        ssn: (ssn) => {
          const pattern = /^[0-9]{3}-?[0-9]{2}-?[0-9]{4}$/;
          return pattern.test(ssn);
        }
      },
      'ES': {
        dni: (dni) => {
          const pattern = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
          return pattern.test(dni);
        }
      }
    };

    return validators[countryCode] || {};
  }
}

// Crear instancia única
export const validators = new Validators();

// Exportar métodos individuales para conveniencia
export const isRequired = (value) => validators.isRequired(value);
export const isEmail = (email) => validators.isEmail(email);
export const isPhone = (phone, countryCode) => validators.isPhone(phone, countryCode);
export const isPassword = (password, options) => validators.isPassword(password, options);
export const isDate = (date, format) => validators.isDate(date, format);
export const isValidFile = (file, options) => validators.isValidFile(file, options);
export const validateForm = (formData, schema) => validators.validateForm(formData, schema);
export const getSchemas = () => validators.getSchemas();

export default validators;