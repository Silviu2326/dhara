import { logger } from './logger';
import { APP_CONSTANTS } from '../config/constants';

/**
 * Abstracción segura del almacenamiento del navegador
 * Maneja localStorage, sessionStorage y fallback en memoria
 */
class StorageManager {
  constructor() {
    this.memoryStorage = new Map();
    this.isLocalStorageAvailable = this.checkStorageAvailability('localStorage');
    this.isSessionStorageAvailable = this.checkStorageAvailability('sessionStorage');

    // Configuración de cache
    this.cache = new Map();
    this.cacheConfig = APP_CONSTANTS.CACHE;

    // Prefijo para todas las claves
    this.keyPrefix = 'dhara_';

    logger.debug('Storage Manager initialized', {
      localStorage: this.isLocalStorageAvailable,
      sessionStorage: this.isSessionStorageAvailable
    });
  }

  /**
   * Verifica la disponibilidad de un tipo de almacenamiento
   */
  checkStorageAvailability(storageType) {
    try {
      if (typeof window === 'undefined') return false;

      const storage = window[storageType];
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      logger.warn(`${storageType} not available`, { error: error.message });
      return false;
    }
  }

  /**
   * Genera una clave con prefijo
   */
  getKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Serializa datos para almacenamiento
   */
  serialize(data) {
    try {
      return JSON.stringify({
        data,
        timestamp: Date.now(),
        version: APP_CONSTANTS.APP_VERSION
      });
    } catch (error) {
      logger.error('Failed to serialize data', { error: error.message });
      throw new Error('Serialization failed');
    }
  }

  /**
   * Deserializa datos del almacenamiento
   */
  deserialize(serializedData) {
    try {
      if (!serializedData) return null;

      const parsed = JSON.parse(serializedData);

      // Verificar estructura válida
      if (!parsed || typeof parsed !== 'object' || !parsed.hasOwnProperty('data')) {
        return serializedData; // Retrocompatibilidad con datos antiguos
      }

      return parsed.data;
    } catch (error) {
      logger.error('Failed to deserialize data', { error: error.message });
      return null;
    }
  }

  /**
   * Obtiene un item del localStorage
   */
  getItem(key, options = {}) {
    const { useCache = true, defaultValue = null } = options;
    const fullKey = this.getKey(key);

    try {
      // Verificar cache primero
      if (useCache && this.cache.has(fullKey)) {
        const cached = this.cache.get(fullKey);
        if (Date.now() - cached.timestamp < this.cacheConfig.DEFAULT_TTL) {
          return cached.data;
        } else {
          this.cache.delete(fullKey);
        }
      }

      let value = null;

      // Intentar localStorage
      if (this.isLocalStorageAvailable) {
        value = localStorage.getItem(fullKey);
      }

      // Fallback a sessionStorage
      else if (this.isSessionStorageAvailable) {
        value = sessionStorage.getItem(fullKey);
      }

      // Fallback a memoria
      else {
        value = this.memoryStorage.get(fullKey);
      }

      const deserializedValue = this.deserialize(value);
      const result = deserializedValue !== null ? deserializedValue : defaultValue;

      // Actualizar cache
      if (useCache && result !== null) {
        this.cache.set(fullKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to get item from storage', {
        key: fullKey,
        error: error.message
      });
      return defaultValue;
    }
  }

  /**
   * Guarda un item en localStorage
   */
  setItem(key, value, options = {}) {
    const {
      useSessionStorage = false,
      ttl = null,
      compress = false
    } = options;

    const fullKey = this.getKey(key);

    try {
      let dataToStore = value;

      // Aplicar compresión si está habilitada (para datos grandes)
      if (compress && typeof value === 'object') {
        dataToStore = this.compressData(value);
      }

      const serializedValue = this.serialize(dataToStore);

      // Guardar según disponibilidad y preferencias
      if (useSessionStorage && this.isSessionStorageAvailable) {
        sessionStorage.setItem(fullKey, serializedValue);
      } else if (this.isLocalStorageAvailable) {
        localStorage.setItem(fullKey, serializedValue);
      } else if (this.isSessionStorageAvailable) {
        sessionStorage.setItem(fullKey, serializedValue);
      } else {
        // Fallback a memoria
        this.memoryStorage.set(fullKey, serializedValue);
      }

      // Actualizar cache
      this.cache.set(fullKey, {
        data: value,
        timestamp: Date.now()
      });

      // Configurar expiración si se especifica TTL
      if (ttl) {
        setTimeout(() => {
          this.removeItem(key);
        }, ttl);
      }

      logger.debug('Item stored successfully', { key: fullKey });
      return true;
    } catch (error) {
      logger.error('Failed to set item in storage', {
        key: fullKey,
        error: error.message
      });

      // Si falla por quota excedida, intentar limpiar espacio
      if (error.name === 'QuotaExceededError') {
        this.clearOldItems();
        // Intentar de nuevo
        try {
          const serializedValue = this.serialize(value);
          localStorage.setItem(fullKey, serializedValue);
          return true;
        } catch (retryError) {
          logger.error('Failed to store item after cleanup', {
            key: fullKey,
            error: retryError.message
          });
        }
      }

      return false;
    }
  }

  /**
   * Elimina un item del almacenamiento
   */
  removeItem(key) {
    const fullKey = this.getKey(key);

    try {
      if (this.isLocalStorageAvailable) {
        localStorage.removeItem(fullKey);
      }

      if (this.isSessionStorageAvailable) {
        sessionStorage.removeItem(fullKey);
      }

      this.memoryStorage.delete(fullKey);
      this.cache.delete(fullKey);

      logger.debug('Item removed successfully', { key: fullKey });
      return true;
    } catch (error) {
      logger.error('Failed to remove item from storage', {
        key: fullKey,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Verifica si existe una clave
   */
  hasItem(key) {
    const fullKey = this.getKey(key);

    if (this.cache.has(fullKey)) {
      return true;
    }

    try {
      if (this.isLocalStorageAvailable) {
        return localStorage.getItem(fullKey) !== null;
      }

      if (this.isSessionStorageAvailable) {
        return sessionStorage.getItem(fullKey) !== null;
      }

      return this.memoryStorage.has(fullKey);
    } catch (error) {
      logger.error('Failed to check item existence', {
        key: fullKey,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Obtiene el tamaño aproximado del almacenamiento
   */
  getStorageSize() {
    try {
      let totalSize = 0;

      if (this.isLocalStorageAvailable) {
        for (let key in localStorage) {
          if (key.startsWith(this.keyPrefix)) {
            totalSize += localStorage[key].length;
          }
        }
      }

      return totalSize;
    } catch (error) {
      logger.error('Failed to calculate storage size', { error: error.message });
      return 0;
    }
  }

  /**
   * Limpia items antiguos para liberar espacio
   */
  clearOldItems() {
    try {
      const now = Date.now();
      const itemsToRemove = [];

      if (this.isLocalStorageAvailable) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.keyPrefix)) {
            try {
              const value = localStorage.getItem(key);
              const parsed = JSON.parse(value);

              // Eliminar items más antiguos de 30 días
              if (parsed.timestamp && (now - parsed.timestamp) > (30 * 24 * 60 * 60 * 1000)) {
                itemsToRemove.push(key);
              }
            } catch (parseError) {
              // Eliminar items que no se pueden parsear
              itemsToRemove.push(key);
            }
          }
        }
      }

      itemsToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      logger.info('Storage cleanup completed', {
        itemsRemoved: itemsToRemove.length
      });
    } catch (error) {
      logger.error('Storage cleanup failed', { error: error.message });
    }
  }

  /**
   * Limpia todo el almacenamiento de la app
   */
  clear() {
    try {
      const keysToRemove = [];

      // Recopilar claves a eliminar
      if (this.isLocalStorageAvailable) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.keyPrefix)) {
            keysToRemove.push(key);
          }
        }
      }

      // Eliminar del localStorage
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Limpiar sessionStorage
      if (this.isSessionStorageAvailable) {
        const sessionKeys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(this.keyPrefix)) {
            sessionKeys.push(key);
          }
        }
        sessionKeys.forEach(key => {
          sessionStorage.removeItem(key);
        });
      }

      // Limpiar memoria y cache
      this.memoryStorage.clear();
      this.cache.clear();

      logger.info('Storage cleared successfully');
      return true;
    } catch (error) {
      logger.error('Failed to clear storage', { error: error.message });
      return false;
    }
  }

  /**
   * Comprime datos grandes (implementación simple)
   */
  compressData(data) {
    // Implementación básica - en producción usar una librería como lz-string
    return data;
  }

  /**
   * Obtiene estadísticas del almacenamiento
   */
  getStats() {
    try {
      const stats = {
        totalItems: 0,
        totalSize: 0,
        itemsByPrefix: {},
        storageAvailability: {
          localStorage: this.isLocalStorageAvailable,
          sessionStorage: this.isSessionStorageAvailable
        },
        cacheSize: this.cache.size
      };

      if (this.isLocalStorageAvailable) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.keyPrefix)) {
            stats.totalItems++;
            const value = localStorage.getItem(key);
            stats.totalSize += value ? value.length : 0;

            // Categorizar por tipo de clave
            const keyType = key.split('_')[1] || 'other';
            stats.itemsByPrefix[keyType] = (stats.itemsByPrefix[keyType] || 0) + 1;
          }
        }
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get storage stats', { error: error.message });
      return null;
    }
  }

  /**
   * Migra datos de versiones anteriores
   */
  migrateData() {
    try {
      // Implementar lógica de migración según sea necesario
      logger.info('Data migration completed');
    } catch (error) {
      logger.error('Data migration failed', { error: error.message });
    }
  }
}

// Instancia global del gestor de almacenamiento
export const storage = new StorageManager();

// Helpers específicos para tipos de datos comunes
export const userStorage = {
  setUser: (userData) => storage.setItem('user', userData),
  getUser: () => storage.getItem('user'),
  clearUser: () => storage.removeItem('user'),
  hasUser: () => storage.hasItem('user')
};

export const settingsStorage = {
  setSetting: (key, value) => storage.setItem(`setting_${key}`, value),
  getSetting: (key, defaultValue = null) => storage.getItem(`setting_${key}`, { defaultValue }),
  removeSetting: (key) => storage.removeItem(`setting_${key}`),
  clearAllSettings: () => {
    // Implementar limpieza de todos los settings
  }
};

export const cacheStorage = {
  setCache: (key, value, ttl = APP_CONSTANTS.CACHE.DEFAULT_TTL) =>
    storage.setItem(`cache_${key}`, value, { ttl }),
  getCache: (key) => storage.getItem(`cache_${key}`),
  clearCache: () => {
    // Implementar limpieza de cache
  }
};

export default storage;