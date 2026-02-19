import { logger } from './logger';
import { APP_CONSTANTS } from '../config/constants';
import { ENVIRONMENTS } from '../config/environments';

/**
 * Sistema centralizado de manejo de errores
 */
class ErrorHandler {
  constructor() {
    this.errorCodes = {
      // Errores de red
      NETWORK_ERROR: 'NETWORK_ERROR',
      TIMEOUT_ERROR: 'TIMEOUT_ERROR',
      OFFLINE_ERROR: 'OFFLINE_ERROR',

      // Errores de autenticación
      AUTH_ERROR: 'AUTH_ERROR',
      TOKEN_EXPIRED: 'TOKEN_EXPIRED',
      UNAUTHORIZED: 'UNAUTHORIZED',
      FORBIDDEN: 'FORBIDDEN',

      // Errores de validación
      VALIDATION_ERROR: 'VALIDATION_ERROR',
      REQUIRED_FIELD: 'REQUIRED_FIELD',
      INVALID_FORMAT: 'INVALID_FORMAT',

      // Errores del servidor
      SERVER_ERROR: 'SERVER_ERROR',
      NOT_FOUND: 'NOT_FOUND',
      CONFLICT: 'CONFLICT',
      RATE_LIMIT: 'RATE_LIMIT',

      // Errores de archivo
      FILE_TOO_LARGE: 'FILE_TOO_LARGE',
      INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
      UPLOAD_FAILED: 'UPLOAD_FAILED',

      // Errores generales
      UNKNOWN_ERROR: 'UNKNOWN_ERROR',
      CLIENT_ERROR: 'CLIENT_ERROR'
    };

    this.userMessages = {
      [this.errorCodes.NETWORK_ERROR]: 'Error de conexión. Verifica tu internet.',
      [this.errorCodes.TIMEOUT_ERROR]: 'La solicitud tardó demasiado. Intenta de nuevo.',
      [this.errorCodes.OFFLINE_ERROR]: 'Sin conexión a internet. Verifica tu conexión.',
      [this.errorCodes.AUTH_ERROR]: 'Error de autenticación. Inicia sesión nuevamente.',
      [this.errorCodes.TOKEN_EXPIRED]: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
      [this.errorCodes.UNAUTHORIZED]: 'No tienes permisos para acceder a este recurso.',
      [this.errorCodes.FORBIDDEN]: 'Acceso denegado.',
      [this.errorCodes.VALIDATION_ERROR]: 'Los datos proporcionados no son válidos.',
      [this.errorCodes.SERVER_ERROR]: 'Error del servidor. Intenta más tarde.',
      [this.errorCodes.NOT_FOUND]: 'El recurso solicitado no existe.',
      [this.errorCodes.CONFLICT]: 'Conflicto con el estado actual del recurso.',
      [this.errorCodes.RATE_LIMIT]: 'Demasiadas solicitudes. Espera un momento.',
      [this.errorCodes.FILE_TOO_LARGE]: 'El archivo es demasiado grande.',
      [this.errorCodes.INVALID_FILE_TYPE]: 'Tipo de archivo no permitido.',
      [this.errorCodes.UPLOAD_FAILED]: 'Error al subir el archivo.',
      [this.errorCodes.UNKNOWN_ERROR]: 'Ha ocurrido un error inesperado.',
      [this.errorCodes.CLIENT_ERROR]: 'Error en la aplicación.'
    };

    // Configurar listeners globales de errores
    this.setupGlobalErrorHandling();
  }

  /**
   * Configura el manejo global de errores
   */
  setupGlobalErrorHandling() {
    if (typeof window === 'undefined') return;

    // Errores de JavaScript no capturados
    window.addEventListener('error', (event) => {
      this.handleGlobalError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError({
        message: 'Unhandled Promise Rejection',
        error: event.reason
      });
    });
  }

  /**
   * Maneja errores globales no capturados
   */
  handleGlobalError(errorInfo) {
    logger.error('Global error caught', {
      type: 'global_error',
      ...errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });

    // Enviar al servicio de reporte de errores en producción
    if (ENVIRONMENTS.ERROR_REPORTING_ENABLED) {
      this.reportError(errorInfo);
    }
  }

  /**
   * Crea un error estandarizado
   */
  createError(code, message, details = {}) {
    const error = new Error(message || 'Unknown error');
    error.code = code || this.errorCodes.UNKNOWN_ERROR;
    error.details = details || {};
    error.timestamp = new Date().toISOString();
    error.userMessage = this.getUserMessage(error.code);

    return error;
  }

  /**
   * Obtiene un mensaje amigable para el usuario
   */
  getUserMessage(code) {
    return this.userMessages[code] || this.userMessages[this.errorCodes.UNKNOWN_ERROR];
  }

  /**
   * Maneja errores de red
   */
  handleNetworkError(error) {
    let code = this.errorCodes.NETWORK_ERROR;
    let message = 'Network error occurred';

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      code = this.errorCodes.TIMEOUT_ERROR;
      message = 'Request timeout';
    } else if (!navigator.onLine) {
      code = this.errorCodes.OFFLINE_ERROR;
      message = 'No internet connection';
    }

    const networkError = this.createError(code, message, {
      originalError: error.message,
      config: error.config
    });

    logger.error('Network error handled', {
      type: 'network_error',
      code,
      message,
      originalError: error.message
    });

    return networkError;
  }

  /**
   * Maneja errores HTTP
   */
  handleHTTPError(error) {
    const { response } = error || {};
    let code = this.errorCodes.SERVER_ERROR;
    let message = 'HTTP error occurred';
    let details = {};

    if (response) {
      const status = response.status;
      details = {
        status,
        statusText: response.statusText || 'Unknown',
        data: response.data || null,
        headers: response.headers || {}
      };

      switch (status) {
        case 400:
          code = this.errorCodes.VALIDATION_ERROR;
          message = (response.data && typeof response.data === 'object' && response.data.message) || 'Bad request';
          break;
        case 401:
          code = this.errorCodes.UNAUTHORIZED;
          message = 'Unauthorized access';
          break;
        case 403:
          code = this.errorCodes.FORBIDDEN;
          message = 'Forbidden access';
          break;
        case 404:
          code = this.errorCodes.NOT_FOUND;
          message = 'Resource not found';
          break;
        case 409:
          code = this.errorCodes.CONFLICT;
          message = 'Resource conflict';
          break;
        case 429:
          code = this.errorCodes.RATE_LIMIT;
          message = 'Rate limit exceeded';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          code = this.errorCodes.SERVER_ERROR;
          message = 'Server error';
          break;
        default:
          code = this.errorCodes.UNKNOWN_ERROR;
          message = `HTTP ${status} error`;
      }
    }

    const httpError = this.createError(code, message, details);

    logger.error('HTTP error handled', {
      type: 'http_error',
      code,
      status: response?.status || 'unknown',
      message,
      url: error?.config?.url || 'unknown'
    });

    return httpError;
  }

  /**
   * Maneja errores de autenticación
   */
  handleAuthError(error) {
    const code = this.errorCodes.AUTH_ERROR;
    const message = 'Authentication error';

    const authError = this.createError(code, message, {
      originalError: error.message,
      response: error.response?.data
    });

    logger.error('Authentication error handled', {
      type: 'auth_error',
      code,
      message
    });

    return authError;
  }

  /**
   * Maneja errores de request
   */
  handleRequestError(error) {
    const code = this.errorCodes.CLIENT_ERROR;
    const message = 'Request configuration error';

    const requestError = this.createError(code, message, {
      originalError: error.message,
      config: error.config
    });

    logger.error('Request error handled', {
      type: 'request_error',
      code,
      message
    });

    return requestError;
  }

  /**
   * Maneja errores de validación
   */
  handleValidationError(validationErrors) {
    const code = this.errorCodes.VALIDATION_ERROR;
    const message = 'Validation failed';

    const validationError = this.createError(code, message, {
      validationErrors,
      fields: Object.keys(validationErrors || {})
    });

    logger.warn('Validation error handled', {
      type: 'validation_error',
      code,
      fields: Object.keys(validationErrors || {})
    });

    return validationError;
  }

  /**
   * Maneja errores de archivo
   */
  handleFileError(file, reason) {
    let code = this.errorCodes.UPLOAD_FAILED;
    let message = 'File error';

    if (file.size > APP_CONSTANTS.FILES.MAX_UPLOAD_SIZE) {
      code = this.errorCodes.FILE_TOO_LARGE;
      message = 'File too large';
    } else if (!this.isValidFileType(file)) {
      code = this.errorCodes.INVALID_FILE_TYPE;
      message = 'Invalid file type';
    }

    const fileError = this.createError(code, message, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      reason
    });

    logger.warn('File error handled', {
      type: 'file_error',
      code,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    return fileError;
  }

  /**
   * Verifica si un tipo de archivo es válido
   */
  isValidFileType(file) {
    const allowedTypes = [
      ...APP_CONSTANTS.FILES.ALLOWED_IMAGE_TYPES,
      ...APP_CONSTANTS.FILES.ALLOWED_DOCUMENT_TYPES,
      ...APP_CONSTANTS.FILES.ALLOWED_VIDEO_TYPES
    ];

    return allowedTypes.includes(file.type);
  }

  /**
   * Maneja errores de manera genérica
   */
  handleError(error, context = {}) {
    // Si ya es un error procesado, devolverlo
    if (error && error.code && this.userMessages[error.code]) {
      return error;
    }

    // Manejar casos donde error es undefined o null
    if (!error) {
      const nullError = this.createError(
        this.errorCodes.UNKNOWN_ERROR,
        'Unknown error occurred - error object is null or undefined',
        { originalError: null, context }
      );

      logger.error('Null error handled', {
        type: 'null_error',
        context
      });

      return nullError;
    }

    // Determinar el tipo de error y manejarlo apropiadamente
    if (error.response) {
      return this.handleHTTPError(error);
    }

    if (error.request) {
      return this.handleNetworkError(error);
    }

    if (error.config) {
      return this.handleRequestError(error);
    }

    // Error genérico
    const genericError = this.createError(
      this.errorCodes.UNKNOWN_ERROR,
      error.message || 'Unknown error occurred',
      { originalError: error, context }
    );

    logger.error('Generic error handled', {
      type: 'generic_error',
      message: error.message || 'No message',
      context
    });

    return genericError;
  }

  /**
   * Alias para handleError - usado por los servicios
   */
  handle(error, context = {}) {
    return this.handleError(error, context);
  }

  /**
   * Crea errores específicos para validación
   */
  createValidationError(message, details = {}) {
    return this.createError(this.errorCodes.VALIDATION_ERROR, message, details);
  }

  /**
   * Crea errores específicos para autenticación
   */
  createAuthError(message, details = {}) {
    return this.createError(this.errorCodes.AUTH_ERROR, message, details);
  }

  /**
   * Crea errores específicos para conflictos
   */
  createConflictError(message, details = {}) {
    return this.createError(this.errorCodes.CONFLICT, message, details);
  }

  /**
   * Reporta errores críticos al servidor
   */
  async reportError(errorInfo) {
    try {
      if (!ENVIRONMENTS.ERROR_REPORTING_ENABLED) return;

      const report = {
        ...errorInfo,
        environment: ENVIRONMENTS.current,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId()
      };

      // Enviar al endpoint de reporte de errores
      await fetch(`${ENVIRONMENTS.API_BASE_URL}/errors/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      });
    } catch (reportError) {
      // Fallar silenciosamente para evitar loops infinitos
      logger.debug('Failed to report error', { error: reportError.message });
    }
  }

  /**
   * Obtiene el ID del usuario actual
   */
  getCurrentUserId() {
    try {
      // Implementar según el sistema de autenticación
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtiene el ID de sesión actual
   */
  getSessionId() {
    try {
      return sessionStorage.getItem('dhara_session_id') || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Determina si un error es crítico
   */
  isCriticalError(error) {
    const criticalCodes = [
      this.errorCodes.SERVER_ERROR,
      this.errorCodes.AUTH_ERROR,
      this.errorCodes.UNKNOWN_ERROR
    ];

    return criticalCodes.includes(error.code);
  }

  /**
   * Determina si un error es recuperable
   */
  isRecoverableError(error) {
    const recoverableCodes = [
      this.errorCodes.NETWORK_ERROR,
      this.errorCodes.TIMEOUT_ERROR,
      this.errorCodes.RATE_LIMIT
    ];

    return recoverableCodes.includes(error.code);
  }

  /**
   * Obtiene sugerencias de solución para un error
   */
  getErrorSuggestions(error) {
    const suggestions = {
      [this.errorCodes.NETWORK_ERROR]: [
        'Verifica tu conexión a internet',
        'Intenta recargar la página',
        'Espera unos momentos y vuelve a intentar'
      ],
      [this.errorCodes.TOKEN_EXPIRED]: [
        'Inicia sesión nuevamente',
        'Verifica que tu cuenta esté activa'
      ],
      [this.errorCodes.VALIDATION_ERROR]: [
        'Revisa los campos marcados en rojo',
        'Asegúrate de completar todos los campos requeridos'
      ],
      [this.errorCodes.FILE_TOO_LARGE]: [
        `El archivo no debe superar ${APP_CONSTANTS.FILES.MAX_UPLOAD_SIZE / 1024 / 1024}MB`,
        'Comprime el archivo antes de subirlo'
      ]
    };

    return suggestions[error.code] || [
      'Intenta recargar la página',
      'Si el problema persiste, contacta soporte'
    ];
  }
}

// Instancia global del manejador de errores
export const errorHandler = new ErrorHandler();

// Helpers para tipos específicos de errores
export const createValidationError = (errors) =>
  errorHandler.handleValidationError(errors);

export const createFileError = (file, reason) =>
  errorHandler.handleFileError(file, reason);

export const isNetworkError = (error) =>
  error.code === errorHandler.errorCodes.NETWORK_ERROR;

export const isAuthError = (error) =>
  [errorHandler.errorCodes.AUTH_ERROR, errorHandler.errorCodes.UNAUTHORIZED].includes(error.code);

export default errorHandler;