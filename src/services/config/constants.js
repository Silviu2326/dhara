// Constantes globales de la aplicación

export const APP_CONSTANTS = {
  // Información de la aplicación
  APP_NAME: 'Dharaterapeutas',
  APP_VERSION: '1.0.0',
  APP_DESCRIPTION: 'Plataforma profesional para terapeutas',

  // Configuración de autenticación
  AUTH: {
    TOKEN_KEY: 'dhara_access_token',
    REFRESH_TOKEN_KEY: 'dhara_refresh_token',
    USER_KEY: 'dhara_user_data',
    SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 horas
    REFRESH_THRESHOLD: 15 * 60 * 1000,   // 15 minutos antes
    MAX_RETRY_ATTEMPTS: 3,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },

  // Configuración de archivos
  FILES: {
    MAX_UPLOAD_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
    CHUNK_SIZE: 1024 * 1024, // 1MB chunks para upload
    IMAGE_QUALITY: 0.8,
    MAX_IMAGE_DIMENSION: 2048
  },

  // Configuración de API
  API: {
    TIMEOUT: 30000,
    RETRY_DELAY: 1000,
    MAX_RETRIES: 3,
    RATE_LIMIT_REQUESTS: 100,
    RATE_LIMIT_WINDOW: 60 * 1000, // 1 minuto
    CACHE_TTL: 5 * 60 * 1000      // 5 minutos
  },

  // Estados de la aplicación
  STATUS: {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
    PENDING: 'pending'
  },

  // Tipos de usuario
  USER_TYPES: {
    THERAPIST: 'therapist',
    ADMIN: 'admin',
    MODERATOR: 'moderator'
  },

  // Estados de verificación
  VERIFICATION_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    NOT_SUBMITTED: 'not_submitted',
    EXPIRED: 'expired'
  },

  // Tipos de especialidades terapéuticas
  THERAPY_SPECIALTIES: {
    ANXIETY: 'ansiedad',
    DEPRESSION: 'depresion',
    COUPLES: 'pareja',
    TRAUMA: 'trauma',
    ADDICTION: 'adicciones',
    FAMILY: 'familia',
    GRIEF: 'duelo',
    STRESS: 'estres',
    PHOBIAS: 'fobias',
    EATING_DISORDERS: 'trastornos_alimentarios'
  },

  // Estados de citas
  BOOKING_STATUS: {
    UPCOMING: 'upcoming',
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
    RESCHEDULED: 'rescheduled'
  },

  // Tipos de notificación
  NOTIFICATION_TYPES: {
    APPOINTMENT: 'appointment',
    MESSAGE: 'message',
    DOCUMENT: 'document',
    PAYMENT: 'payment',
    SYSTEM: 'system',
    REMINDER: 'reminder',
    ALERT: 'alert'
  },

  // Configuración de validaciones
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    MESSAGE_MAX_LENGTH: 5000,
    NOTES_MAX_LENGTH: 10000
  },

  // Configuración de paginación
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DEFAULT_PAGE: 1
  },

  // Configuración de cache
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000,   // 5 minutos
    LONG_TTL: 30 * 60 * 1000,     // 30 minutos
    SHORT_TTL: 60 * 1000,         // 1 minuto
    MAX_ENTRIES: 1000
  },

  // Configuración de logging
  LOGGING: {
    LEVELS: {
      ERROR: 'error',
      WARN: 'warn',
      INFO: 'info',
      DEBUG: 'debug'
    },
    MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_LOG_FILES: 5
  },

  // URLs externas
  EXTERNAL_URLS: {
    PRIVACY_POLICY: '/privacy-policy',
    TERMS_OF_SERVICE: '/terms-of-service',
    CONTACT_SUPPORT: '/support',
    DOCUMENTATION: '/docs',
    STATUS_PAGE: 'https://status.dharaterapeutas.com'
  },

  // Configuración de fechas
  DATE_FORMATS: {
    DISPLAY_DATE: 'DD/MM/YYYY',
    DISPLAY_TIME: 'HH:mm',
    DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm',
    API_DATE: 'YYYY-MM-DD',
    API_DATETIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
  },

  // Configuración de moneda
  CURRENCY: {
    DEFAULT: 'USD',
    SYMBOL: '$',
    DECIMAL_PLACES: 2,
    THOUSANDS_SEPARATOR: ',',
    DECIMAL_SEPARATOR: '.'
  }
};

// Configuración por ambiente
export const ENVIRONMENT_CONFIG = {
  development: {
    API_BASE_URL: 'https://dharaback-production.up.railway.app/api',
    LOG_LEVEL: 'debug',
    ENABLE_MOCK_DATA: true,
    ENABLE_REDUX_DEVTOOLS: true
  },
  staging: {
    API_BASE_URL: 'https://staging-api.dharaterapeutas.com/api',
    LOG_LEVEL: 'info',
    ENABLE_MOCK_DATA: false,
    ENABLE_REDUX_DEVTOOLS: true
  },
  production: {
    API_BASE_URL: 'https://api.dharaterapeutas.com/api',
    LOG_LEVEL: 'error',
    ENABLE_MOCK_DATA: false,
    ENABLE_REDUX_DEVTOOLS: false
  }
};

// Helper para obtener configuración actual
export const getCurrentEnvironmentConfig = () => {
  const env = import.meta.env.MODE || 'development';
  return ENVIRONMENT_CONFIG[env] || ENVIRONMENT_CONFIG.development;
};

export default APP_CONSTANTS;