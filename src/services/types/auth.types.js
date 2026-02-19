/**
 * Definiciones de tipos para autenticación
 * Estas definiciones sirven como documentación y referencia para TypeScript
 */

/**
 * @typedef {Object} User
 * @property {string} id - ID único del usuario
 * @property {string} email - Email del usuario
 * @property {string} firstName - Nombre del usuario
 * @property {string} lastName - Apellido del usuario
 * @property {string} role - Rol del usuario (therapist, admin, moderator)
 * @property {string[]} permissions - Lista de permisos del usuario
 * @property {boolean} emailVerified - Si el email está verificado
 * @property {boolean} twoFactorEnabled - Si 2FA está habilitado
 * @property {string} avatar - URL del avatar del usuario
 * @property {string} phone - Teléfono del usuario
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 * @property {Object} profile - Información adicional del perfil
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email - Email del usuario
 * @property {string} password - Contraseña del usuario
 * @property {boolean} [rememberMe] - Si mantener la sesión activa
 * @property {string} [twoFactorCode] - Código de 2FA si está habilitado
 */

/**
 * @typedef {Object} RegistrationData
 * @property {string} email - Email del usuario
 * @property {string} password - Contraseña del usuario
 * @property {string} confirmPassword - Confirmación de contraseña
 * @property {string} firstName - Nombre del usuario
 * @property {string} lastName - Apellido del usuario
 * @property {string} [phone] - Teléfono del usuario
 * @property {boolean} acceptTerms - Aceptación de términos y condiciones
 * @property {boolean} [acceptMarketing] - Aceptación de marketing
 * @property {string} [referralCode] - Código de referido
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} accessToken - Token de acceso JWT
 * @property {string} refreshToken - Token de renovación
 * @property {User} user - Información del usuario
 * @property {boolean} [requiresTwoFactor] - Si requiere verificación 2FA
 * @property {number} expiresIn - Tiempo de expiración en segundos
 */

/**
 * @typedef {Object} AuthState
 * @property {boolean} isAuthenticated - Si el usuario está autenticado
 * @property {User|null} user - Información del usuario autenticado
 * @property {boolean} loading - Si hay una operación en progreso
 * @property {Error|null} error - Error actual si existe
 */

/**
 * @typedef {Object} PasswordResetData
 * @property {string} token - Token de reseteo de contraseña
 * @property {string} newPassword - Nueva contraseña
 * @property {string} confirmPassword - Confirmación de nueva contraseña
 */

/**
 * @typedef {Object} PasswordChangeData
 * @property {string} currentPassword - Contraseña actual
 * @property {string} newPassword - Nueva contraseña
 * @property {string} confirmPassword - Confirmación de nueva contraseña
 */

/**
 * @typedef {Object} TwoFactorSetup
 * @property {string} secret - Secret para 2FA
 * @property {string} qrCode - QR code para configurar 2FA
 * @property {string[]} backupCodes - Códigos de respaldo
 */

/**
 * @typedef {Object} Session
 * @property {string} id - ID de la sesión
 * @property {string} deviceInfo - Información del dispositivo
 * @property {string} ipAddress - Dirección IP
 * @property {string} location - Ubicación geográfica
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} lastActiveAt - Última actividad
 * @property {boolean} isCurrent - Si es la sesión actual
 */

/**
 * @typedef {Object} DeviceInfo
 * @property {string} userAgent - User agent del navegador
 * @property {string} platform - Plataforma del dispositivo
 * @property {string} language - Idioma del navegador
 * @property {string} timezone - Zona horaria
 * @property {string} screenResolution - Resolución de pantalla
 * @property {string} timestamp - Timestamp del dispositivo
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Si la validación pasó
 * @property {string} [error] - Error de validación si falló
 * @property {Object} [errors] - Errores específicos por campo
 * @property {string[]} [suggestions] - Sugerencias para corregir
 */

/**
 * @typedef {Object} PasswordStrengthResult
 * @property {boolean} isValid - Si la contraseña es válida
 * @property {number} score - Puntuación de fortaleza (0-10)
 * @property {Object} requirements - Requerimientos cumplidos
 * @property {boolean} requirements.minLength - Longitud mínima
 * @property {boolean} requirements.hasUppercase - Tiene mayúsculas
 * @property {boolean} requirements.hasLowercase - Tiene minúsculas
 * @property {boolean} requirements.hasNumber - Tiene números
 * @property {boolean} requirements.hasSpecialChar - Tiene caracteres especiales
 * @property {boolean} requirements.noCommonPasswords - No es contraseña común
 * @property {string[]} suggestions - Sugerencias para mejorar
 */

/**
 * @typedef {Object} AuthError
 * @property {string} code - Código del error
 * @property {string} message - Mensaje del error
 * @property {string} userMessage - Mensaje amigable para el usuario
 * @property {Object} details - Detalles adicionales del error
 * @property {string} timestamp - Timestamp del error
 */

/**
 * @typedef {Object} AuthConfig
 * @property {number} sessionTimeout - Timeout de sesión en ms
 * @property {number} refreshThreshold - Umbral para renovar token en ms
 * @property {number} maxRetryAttempts - Máximo número de reintentos
 * @property {number} passwordMinLength - Longitud mínima de contraseña
 * @property {RegExp} passwordRegex - Regex para validar contraseña
 */

/**
 * @typedef {Object} SecuritySettings
 * @property {boolean} twoFactorEnabled - Si 2FA está habilitado
 * @property {string[]} backupCodes - Códigos de respaldo disponibles
 * @property {Date} lastPasswordChange - Fecha del último cambio de contraseña
 * @property {Session[]} activeSessions - Sesiones activas
 * @property {boolean} loginNotifications - Notificaciones de login
 * @property {string[]} trustedDevices - Dispositivos de confianza
 */

/**
 * @typedef {Object} AuthEvents
 * @property {string} LOGIN_SUCCESS - Usuario inició sesión exitosamente
 * @property {string} LOGIN_FAILED - Falló el inicio de sesión
 * @property {string} LOGOUT - Usuario cerró sesión
 * @property {string} TOKEN_REFRESHED - Token renovado exitosamente
 * @property {string} TOKEN_EXPIRED - Token expiró
 * @property {string} PASSWORD_CHANGED - Contraseña cambiada
 * @property {string} EMAIL_VERIFIED - Email verificado
 * @property {string} TWO_FACTOR_ENABLED - 2FA habilitado
 * @property {string} TWO_FACTOR_DISABLED - 2FA deshabilitado
 */

// Constantes de eventos de autenticación
export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth:login_success',
  LOGIN_FAILED: 'auth:login_failed',
  LOGOUT: 'auth:logout',
  TOKEN_REFRESHED: 'auth:token_refreshed',
  TOKEN_EXPIRED: 'auth:token_expired',
  PASSWORD_CHANGED: 'auth:password_changed',
  EMAIL_VERIFIED: 'auth:email_verified',
  TWO_FACTOR_ENABLED: 'auth:two_factor_enabled',
  TWO_FACTOR_DISABLED: 'auth:two_factor_disabled',
  USER_UPDATED: 'auth:user_updated',
  SESSION_EXPIRED: 'auth:session_expired'
};

// Roles de usuario disponibles
export const USER_ROLES = {
  THERAPIST: 'therapist',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPPORT: 'support'
};

// Permisos disponibles en el sistema
export const PERMISSIONS = {
  // Permisos de usuario
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Permisos de perfil profesional
  PROFILE_READ: 'profile:read',
  PROFILE_UPDATE: 'profile:update',
  PROFILE_PUBLISH: 'profile:publish',

  // Permisos de citas
  BOOKING_READ: 'booking:read',
  BOOKING_CREATE: 'booking:create',
  BOOKING_UPDATE: 'booking:update',
  BOOKING_DELETE: 'booking:delete',

  // Permisos de clientes
  CLIENT_READ: 'client:read',
  CLIENT_UPDATE: 'client:update',
  CLIENT_DELETE: 'client:delete',

  // Permisos de documentos
  DOCUMENT_READ: 'document:read',
  DOCUMENT_CREATE: 'document:create',
  DOCUMENT_UPDATE: 'document:update',
  DOCUMENT_DELETE: 'document:delete',

  // Permisos de mensajería
  MESSAGE_READ: 'message:read',
  MESSAGE_SEND: 'message:send',
  MESSAGE_DELETE: 'message:delete',

  // Permisos de pagos
  PAYMENT_READ: 'payment:read',
  PAYMENT_PROCESS: 'payment:process',
  PAYMENT_REFUND: 'payment:refund',

  // Permisos administrativos
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write',
  ADMIN_DELETE: 'admin:delete',

  // Permisos de verificación
  VERIFICATION_SUBMIT: 'verification:submit',
  VERIFICATION_REVIEW: 'verification:review',
  VERIFICATION_APPROVE: 'verification:approve',

  // Permisos de moderación
  MODERATE_CONTENT: 'moderate:content',
  MODERATE_USERS: 'moderate:users',
  MODERATE_REVIEWS: 'moderate:reviews'
};

// Estados de verificación de usuario
export const VERIFICATION_STATES = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

// Estados de cuenta de usuario
export const ACCOUNT_STATES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
  PENDING_VERIFICATION: 'pending_verification'
};

// Tipos de autenticación soportados
export const AUTH_TYPES = {
  EMAIL_PASSWORD: 'email_password',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  APPLE: 'apple',
  TWO_FACTOR: 'two_factor'
};

// Configuración de seguridad de contraseñas
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  FORBIDDEN_PATTERNS: [
    'password',
    '123456',
    'qwerty',
    'admin',
    'user'
  ]
};

// Configuración de tokens
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_LIFETIME: 3600, // 1 hora en segundos
  REFRESH_TOKEN_LIFETIME: 2592000, // 30 días en segundos
  REFRESH_THRESHOLD: 900, // 15 minutos en segundos
  MAX_REFRESH_ATTEMPTS: 3
};

// Configuración de sesiones
export const SESSION_CONFIG = {
  MAX_CONCURRENT_SESSIONS: 5,
  SESSION_TIMEOUT: 28800000, // 8 horas en ms
  REMEMBER_ME_DURATION: 2592000000, // 30 días en ms
  IDLE_TIMEOUT: 3600000 // 1 hora en ms
};

// Tipos de dispositivos para tracking
export const DEVICE_TYPES = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
  TABLET: 'tablet',
  UNKNOWN: 'unknown'
};

// Validadores de formato
export const VALIDATORS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  NAME: /^[a-zA-ZÀ-ÿ\u0100-\u017F\s]+$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/
};

// Helpers para trabajar con tipos
export const AuthTypeHelpers = {
  /**
   * Verifica si un usuario tiene un rol específico
   * @param {User} user - Usuario a verificar
   * @param {string} role - Rol a verificar
   * @returns {boolean}
   */
  hasRole: (user, role) => user?.role === role,

  /**
   * Verifica si un usuario tiene un permiso específico
   * @param {User} user - Usuario a verificar
   * @param {string} permission - Permiso a verificar
   * @returns {boolean}
   */
  hasPermission: (user, permission) =>
    user?.permissions?.includes(permission) || false,

  /**
   * Verifica si un usuario es administrador
   * @param {User} user - Usuario a verificar
   * @returns {boolean}
   */
  isAdmin: (user) => user?.role === USER_ROLES.ADMIN,

  /**
   * Verifica si un usuario es terapeuta
   * @param {User} user - Usuario a verificar
   * @returns {boolean}
   */
  isTherapist: (user) => user?.role === USER_ROLES.THERAPIST,

  /**
   * Obtiene el nombre completo de un usuario
   * @param {User} user - Usuario
   * @returns {string}
   */
  getFullName: (user) =>
    user ? `${user.firstName} ${user.lastName}`.trim() : '',

  /**
   * Verifica si el email del usuario está verificado
   * @param {User} user - Usuario a verificar
   * @returns {boolean}
   */
  isEmailVerified: (user) => user?.emailVerified === true,

  /**
   * Verifica si el usuario tiene 2FA habilitado
   * @param {User} user - Usuario a verificar
   * @returns {boolean}
   */
  hasTwoFactorEnabled: (user) => user?.twoFactorEnabled === true
};

export default {
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
};