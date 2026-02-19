import axios from 'axios';
import { tokenManager } from '../utils/tokenManager';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { security } from '../utils/security';
import { ENVIRONMENTS } from './environments';
import { setupInterceptors } from './interceptors';
import { MOCK_DATA, mockResponse } from './mockData';

// Configuración base del cliente
const API_CONFIG = {
  baseURL: ENVIRONMENTS.API_BASE_URL,
  timeout: ENVIRONMENTS.config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Client-Type': 'web'
  },
  validateStatus: (status) => status < 500 // Considerar errores 4xx como respuestas válidas
  // Mock adapter removido - axios usará el adapter HTTP nativo
};

// Crear instancia principal de axios
const apiClient = axios.create(API_CONFIG);

// Configurar interceptors
setupInterceptors(apiClient);

// Métodos helper para requests comunes
export const apiMethods = {
  /**
   * GET request
   */
  get: async (url, config = {}) => {
    try {
      return await apiClient.get(url, {
        ...config,
        metadata: {
          operation: 'GET',
          ...config.metadata
        }
      });
    } catch (error) {
      throw errorHandler.handleError(error);
    }
  },

  /**
   * POST request
   */
  post: async (url, data = {}, config = {}) => {
    try {
      return await apiClient.post(url, data, {
        ...config,
        metadata: {
          operation: 'POST',
          ...config.metadata
        }
      });
    } catch (error) {
      throw errorHandler.handleError(error);
    }
  },

  /**
   * PUT request
   */
  put: async (url, data = {}, config = {}) => {
    try {
      return await apiClient.put(url, data, {
        ...config,
        metadata: {
          operation: 'PUT',
          ...config.metadata
        }
      });
    } catch (error) {
      throw errorHandler.handleError(error);
    }
  },

  /**
   * PATCH request
   */
  patch: async (url, data = {}, config = {}) => {
    try {
      return await apiClient.patch(url, data, {
        ...config,
        metadata: {
          operation: 'PATCH',
          ...config.metadata
        }
      });
    } catch (error) {
      throw errorHandler.handleError(error);
    }
  },

  /**
   * DELETE request
   */
  delete: async (url, config = {}) => {
    try {
      return await apiClient.delete(url, {
        ...config,
        metadata: {
          operation: 'DELETE',
          ...config.metadata
        }
      });
    } catch (error) {
      throw errorHandler.handleError(error);
    }
  },

  /**
   * Upload de archivos con progress tracking
   */
  upload: async (url, formData, options = {}) => {
    const {
      onProgress,
      chunkSize = 1024 * 1024, // 1MB chunks
      retries = 3
    } = options;

    try {
      // Verificar si el archivo es muy grande para chunked upload
      const fileSize = formData.get('file')?.size || 0;

      if (fileSize > chunkSize * 10) {
        return apiMethods.uploadChunked(url, formData, options);
      }

      // Upload normal
      return await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted, progressEvent);
          }
        },
        timeout: 300000, // 5 minutos para uploads
        maxRetries: retries
      });
    } catch (error) {
      throw errorHandler.handleFileError(formData.get('file'), error.message);
    }
  },

  /**
   * Upload en chunks para archivos grandes
   */
  uploadChunked: async (url, formData, options = {}) => {
    const {
      onProgress,
      chunkSize = 1024 * 1024 // 1MB chunks
    } = options;

    const file = formData.get('file');
    if (!file) {
      throw new Error('No file provided for chunked upload');
    }

    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedChunks = 0;

    try {
      // Inicializar upload
      const initResponse = await apiClient.post(`${url}/init`, {
        fileName: file.name,
        fileSize: file.size,
        totalChunks,
        contentType: file.type
      });

      const uploadId = initResponse.uploadId;

      // Subir chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const chunkFormData = new FormData();
        chunkFormData.append('chunk', chunk);
        chunkFormData.append('chunkIndex', i);
        chunkFormData.append('uploadId', uploadId);

        await apiClient.post(`${url}/chunk`, chunkFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        uploadedChunks++;

        if (onProgress) {
          const percentCompleted = Math.round((uploadedChunks * 100) / totalChunks);
          onProgress(percentCompleted, {
            loaded: uploadedChunks * chunkSize,
            total: file.size
          });
        }
      }

      // Finalizar upload
      return await apiClient.post(`${url}/complete`, {
        uploadId,
        fileName: file.name
      });
    } catch (error) {
      throw errorHandler.handleFileError(file, error.message);
    }
  },

  /**
   * Download de archivos con progress tracking
   */
  download: async (url, filename, options = {}) => {
    const { onProgress } = options;

    try {
      const response = await apiClient.get(url, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted, progressEvent);
          }
        }
      });

      // Crear y descargar archivo
      if (typeof window !== 'undefined') {
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }

      return response;
    } catch (error) {
      throw errorHandler.handleError(error);
    }
  },

  /**
   * Request con cache automático
   */
  getWithCache: async (url, config = {}) => {
    const {
      cacheTTL = 5 * 60 * 1000, // 5 minutos
      cacheKey = url,
      forceRefresh = false
    } = config;

    const cache = apiMethods._cache = apiMethods._cache || new Map();

    // Verificar cache
    if (!forceRefresh && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTTL) {
        logger.debug('Cache hit', { url, cacheKey });
        return cached.data;
      }
    }

    try {
      const response = await apiMethods.get(url, config);

      // Guardar en cache
      cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      // Limpiar cache antiguo
      apiMethods.cleanCache();

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Limpia entradas de cache antigas
   */
  cleanCache: () => {
    const cache = apiMethods._cache;
    if (!cache) return;

    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutos

    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > maxAge) {
        cache.delete(key);
      }
    }
  },

  /**
   * Request con reintentos automáticos
   */
  requestWithRetry: async (config, maxRetries = 3) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiClient(config);
      } catch (error) {
        lastError = error;

        // No reintentar para errores 4xx (excepto 408, 429)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          if (![408, 429].includes(error.response.status)) {
            throw error;
          }
        }

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          logger.info(`Request failed, retrying in ${delay}ms`, {
            url: config.url,
            attempt,
            maxRetries
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  },

  /**
   * Batch de requests en paralelo
   */
  batch: async (requests) => {
    try {
      const promises = requests.map(request => {
        const { method = 'GET', url, data, config = {} } = request;
        return apiMethods[method.toLowerCase()](url, data, config);
      });

      const results = await Promise.allSettled(promises);

      return results.map((result, index) => ({
        ...requests[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    } catch (error) {
      throw errorHandler.handleError(error);
    }
  },

  /**
   * Server-Sent Events (SSE)
   */
  createEventSource: (url, options = {}) => {
    const {
      onMessage,
      onError,
      onOpen,
      onClose
    } = options;

    const token = tokenManager.getAccessToken();
    const eventSourceUrl = token
      ? `${ENVIRONMENTS.API_BASE_URL}${url}?token=${token}`
      : `${ENVIRONMENTS.API_BASE_URL}${url}`;

    const eventSource = new EventSource(eventSourceUrl);

    eventSource.onopen = (event) => {
      logger.info('SSE connection opened', { url });
      onOpen?.(event);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data, event);
      } catch (error) {
        logger.error('Failed to parse SSE message', { error: error.message });
      }
    };

    eventSource.onerror = (event) => {
      logger.error('SSE connection error', { url });
      onError?.(event);
    };

    // Retornar objeto con métodos de control
    return {
      close: () => {
        eventSource.close();
        onClose?.();
        logger.info('SSE connection closed', { url });
      },
      readyState: eventSource.readyState
    };
  },

  /**
   * WebSocket connection helper
   */
  createWebSocket: (url, options = {}) => {
    const {
      onMessage,
      onError,
      onOpen,
      onClose,
      protocols = []
    } = options;

    const token = tokenManager.getAccessToken();
    const wsUrl = url.replace('http', 'ws');
    const fullUrl = token
      ? `${wsUrl}?token=${token}`
      : wsUrl;

    const ws = new WebSocket(fullUrl, protocols);

    ws.onopen = (event) => {
      logger.info('WebSocket connection opened', { url });
      onOpen?.(event);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data, event);
      } catch (error) {
        onMessage?.(event.data, event);
      }
    };

    ws.onerror = (event) => {
      logger.error('WebSocket connection error', { url });
      onError?.(event);
    };

    ws.onclose = (event) => {
      logger.info('WebSocket connection closed', { url, code: event.code });
      onClose?.(event);
    };

    return ws;
  }
};

// Configurar limpieza automática de cache
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiMethods.cleanCache();
  }, 10 * 60 * 1000); // Limpiar cada 10 minutos
}

// Exportar instancia principal y métodos
export { apiClient as default, apiClient };

// Compatibilidad con import por defecto
export const api = apiMethods;