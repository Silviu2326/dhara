import axios from 'axios';
import { tokenManager } from '../utils/tokenManager';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { security } from '../utils/security';
import { ENVIRONMENTS } from './environments';
import { APP_CONSTANTS } from './constants';

/**
 * Configuración de interceptors para axios
 */

// Contador para IDs de request únicos
let requestIdCounter = 0;

/**
 * Genera un ID único para cada request
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${++requestIdCounter}`;
};

/**
 * Request Interceptor - Procesamiento antes de enviar
 */
export const requestInterceptor = {
  onFulfilled: (config) => {
    try {
      // Generar ID único para tracking
      const requestId = generateRequestId();
      config.metadata = {
        requestId,
        startTime: Date.now(),
        retryCount: config.retryCount || 0
      };

      // Añadir headers de seguridad
      config.headers = {
        ...config.headers,
        'X-Request-ID': requestId,
        'X-Client-Version': APP_CONSTANTS.APP_VERSION,
        'X-Timestamp': Date.now().toString()
      };

      // Añadir token de autorización automáticamente
      let token = tokenManager.getAccessToken();

      // Si no hay token y estamos en desarrollo, usar un token demo
      if (!token && ENVIRONMENTS.config.demo?.enableDemoAuth) {
        token = ENVIRONMENTS.config.demo.demoAuthToken;
        logger.debug('Using demo auth token');
      }

      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Sanitizar datos sensibles para logging
      const sanitizedConfig = {
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: security.sanitizeForLogging(config.headers),
        data: security.sanitizeForLogging(config.data),
        params: config.params
      };

      // Log del request en desarrollo
      if (ENVIRONMENTS.config.debug?.enableNetworkLogging) {
        logger.apiRequest(
          config.method || 'GET',
          config.url,
          sanitizedConfig
        );
      }

      // Validar datos del request
      if (config.data) {
        validateRequestData(config.data);
      }

      // Rate limiting del lado del cliente
      if (config.enableRateLimit !== false) {
        const isAllowed = checkRateLimit(config.url);
        if (!isAllowed) {
          const error = errorHandler.createError(
            errorHandler.errorCodes.RATE_LIMIT,
            'Rate limit exceeded',
            { url: config.url }
          );
          return Promise.reject(error);
        }
      }

      return config;
    } catch (error) {
      logger.error('Request interceptor error:', {
        error: error.message,
        config: security.sanitizeForLogging(config)
      });
      return Promise.reject(errorHandler.handleRequestError(error));
    }
  },

  onRejected: (error) => {
    logger.error('Request configuration error:', error);
    return Promise.reject(errorHandler.handleRequestError(error));
  }
};

/**
 * Response Interceptor - Procesamiento después de recibir
 */
export const responseInterceptor = {
  onFulfilled: (response) => {
    try {
      const { config } = response;
      const duration = Date.now() - (config.metadata?.startTime || 0);

      // Log de response exitoso
      if (ENVIRONMENTS.config.debug?.enableNetworkLogging) {
        logger.apiResponse(
          config.method || 'GET',
          config.url,
          response.status,
          security.sanitizeForLogging(response.data),
          duration
        );
      }

      // Procesar headers de respuesta
      processResponseHeaders(response);

      // Validar integridad de datos si está habilitada
      if (response.headers['x-data-integrity']) {
        validateResponseIntegrity(response);
      }

      // Retornar solo los datos o la respuesta completa según configuración
      return config.returnFullResponse ? response : response.data;
    } catch (error) {
      logger.error('Response processing error:', {
        error: error.message,
        url: response.config?.url
      });
      return response.data || response;
    }
  },

  onRejected: async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      logger.error('Response error without config:', error);
      return Promise.reject(errorHandler.handleError(error));
    }

    const duration = Date.now() - (originalRequest.metadata?.startTime || 0);

    // Log del error
    logger.apiResponse(
      originalRequest.method || 'GET',
      originalRequest.url,
      error.response?.status || 0,
      error.response?.data || error.message,
      duration
    );

    // Manejo automático de token expirado (401)
    if (error.response?.status === 401 && !originalRequest._isRetrying) {
      return handleTokenRefresh(originalRequest, error);
    }

    // Reintentos automáticos para errores de red
    if (shouldRetryRequest(error, originalRequest)) {
      return retryRequest(originalRequest, error);
    }

    // Manejo específico de errores HTTP
    const handledError = errorHandler.handleError(error);
    return Promise.reject(handledError);
  }
};

/**
 * Maneja la renovación automática de tokens
 */
async function handleTokenRefresh(originalRequest, error) {
  originalRequest._isRetrying = true;

  try {
    const refreshToken = tokenManager.getRefreshToken();

    if (!refreshToken || tokenManager.isRefreshTokenExpired()) {
      // No hay refresh token válido, redirigir a login
      tokenManager.clearTokens();
      redirectToLogin();
      throw errorHandler.createError(
        errorHandler.errorCodes.TOKEN_EXPIRED,
        'Session expired'
      );
    }

    // Intentar renovar el token
    const refreshResponse = await refreshAccessToken(refreshToken);

    if (refreshResponse.accessToken) {
      // Actualizar tokens
      tokenManager.setTokens(
        refreshResponse.accessToken,
        refreshResponse.refreshToken || refreshToken
      );

      // Reintentar request original con nuevo token
      originalRequest.headers.Authorization = `Bearer ${refreshResponse.accessToken}`;

      // Crear nueva instancia de axios para evitar loops infinitos
      const axios = require('axios');
      return axios(originalRequest);
    }

    throw new Error('Token refresh failed');
  } catch (refreshError) {
    logger.error('Token refresh failed:', {
      error: refreshError.message,
      originalUrl: originalRequest.url
    });

    tokenManager.clearTokens();
    redirectToLogin();

    return Promise.reject(errorHandler.handleAuthError(refreshError));
  }
}

/**
 * Renueva el access token usando el refresh token
 */
async function refreshAccessToken(refreshToken) {
  const axios = require('axios');

  const response = await axios.post(`${ENVIRONMENTS.API_BASE_URL}/auth/refresh`, {
    refreshToken
  }, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 10000 // Timeout específico para refresh
  });

  return response.data;
}

/**
 * Redirige al usuario a la página de login
 */
function redirectToLogin() {
  if (typeof window !== 'undefined') {
    // Preservar la URL actual para redirección después del login
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }

    // Redirigir a login
    window.location.href = '/login';
  }
}

/**
 * Determina si un request debe ser reintentado
 */
function shouldRetryRequest(error, config) {
  // No reintentar si ya se agotaron los intentos
  const maxRetries = config.maxRetries || APP_CONSTANTS.API.MAX_RETRIES;
  const currentRetries = config.retryCount || 0;

  if (currentRetries >= maxRetries) {
    return false;
  }

  // Solo reintentar para errores específicos
  const retryableErrors = [
    'ECONNABORTED', // Timeout
    'ENOTFOUND',    // DNS error
    'ECONNREFUSED', // Connection refused
    'NETWORK_ERROR' // Network error
  ];

  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

  // Verificar si es un error de red
  if (!error.response && retryableErrors.some(code =>
    error.code === code || error.message.includes(code)
  )) {
    return true;
  }

  // Verificar código de estado HTTP
  if (error.response && retryableStatusCodes.includes(error.response.status)) {
    return true;
  }

  return false;
}

/**
 * Reintenta un request con backoff exponencial
 */
async function retryRequest(originalRequest, error) {
  const retryCount = (originalRequest.retryCount || 0) + 1;
  const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000); // Max 10s

  logger.info('Retrying request', {
    url: originalRequest.url,
    attempt: retryCount,
    delay,
    error: error.message
  });

  // Esperar antes del reintento
  await new Promise(resolve => setTimeout(resolve, delay));

  // Actualizar configuración para el reintento
  originalRequest.retryCount = retryCount;
  originalRequest.metadata = {
    ...originalRequest.metadata,
    startTime: Date.now(),
    retryCount
  };

  // Crear nueva instancia de axios para evitar interceptors
  return axios(originalRequest);
}

/**
 * Valida los datos del request
 */
function validateRequestData(data) {
  if (!data || typeof data !== 'object') return;

  // Detectar posibles ataques XSS
  const checkForXSS = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && security.detectXSS(value)) {
        logger.warn('Potential XSS detected in request data', {
          field: key,
          value: value.substring(0, 100)
        });
      } else if (typeof value === 'object' && value !== null) {
        checkForXSS(value);
      }
    }
  };

  checkForXSS(data);
}

/**
 * Procesa headers de respuesta
 */
function processResponseHeaders(response) {
  const headers = response.headers;

  // Procesar rate limiting headers
  if (headers['x-ratelimit-remaining']) {
    const remaining = parseInt(headers['x-ratelimit-remaining']);
    if (remaining < 10) {
      logger.warn('Rate limit warning', {
        remaining,
        reset: headers['x-ratelimit-reset']
      });
    }
  }

  // Procesar warnings del servidor
  if (headers['x-warning']) {
    logger.warn('Server warning', {
      warning: headers['x-warning'],
      url: response.config.url
    });
  }

  // Procesar información de deprecación
  if (headers['x-deprecated']) {
    logger.warn('Deprecated endpoint used', {
      endpoint: response.config.url,
      deprecationInfo: headers['x-deprecated']
    });
  }
}

/**
 * Valida la integridad de la respuesta
 */
function validateResponseIntegrity(response) {
  try {
    const expectedHash = response.headers['x-data-integrity'];
    const actualHash = security.generateHash(response.data);

    if (actualHash !== expectedHash) {
      logger.error('Data integrity validation failed', {
        url: response.config.url,
        expectedHash,
        actualHash
      });
    }
  } catch (error) {
    logger.error('Integrity validation error:', error);
  }
}

/**
 * Rate limiting del lado del cliente
 */
const rateLimiters = new Map();

function checkRateLimit(url) {
  // Verificar si url existe y es un string
  if (!url || typeof url !== 'string') {
    logger.warn('Invalid URL in checkRateLimit, skipping rate limit', { url });
    return true; // Permitir request si no hay URL válida
  }
  
  const baseUrl = url.split('?')[0]; // Remover query params

  if (!rateLimiters.has(baseUrl)) {
    rateLimiters.set(baseUrl, security.createRateLimiter(
      APP_CONSTANTS.API.RATE_LIMIT_REQUESTS,
      APP_CONSTANTS.API.RATE_LIMIT_WINDOW
    ));
  }

  const limiter = rateLimiters.get(baseUrl);
  return limiter.isAllowed();
}

/**
 * Configuración completa de interceptors
 */
export const setupInterceptors = (axiosInstance) => {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    requestInterceptor.onFulfilled,
    requestInterceptor.onRejected
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    responseInterceptor.onFulfilled,
    responseInterceptor.onRejected
  );

  logger.info('Axios interceptors configured successfully');
};

export default {
  requestInterceptor,
  responseInterceptor,
  setupInterceptors
};