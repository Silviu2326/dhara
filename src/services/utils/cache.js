import { APP_CONSTANTS } from "../config/constants";
import { logger } from "./logger";

/**
 * Sistema de cache avanzado con TTL, persistencia y estadísticas
 */
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.config = APP_CONSTANTS.CACHE;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
    };

    // Limpiar cache expirado cada 5 minutos
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );

    // Cargar cache persistente al inicializar
    this.loadPersistentCache();
  }

  /**
   * Obtiene un valor del cache
   */
  get(key, options = {}) {
    const {
      defaultValue = null,
      useMemoryOnly = false,
      onMiss = null,
    } = options;

    try {
      // Verificar cache en memoria primero
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem && !this.isExpired(memoryItem)) {
        this.stats.hits++;
        logger.debug("Cache hit (memory)", { key });
        return memoryItem.data;
      }

      // Si no está en memoria, verificar localStorage
      if (!useMemoryOnly) {
        const persistentItem = this.getPersistent(key);
        if (persistentItem && !this.isExpired(persistentItem)) {
          // Restaurar a memoria para acceso rápido
          this.memoryCache.set(key, persistentItem);
          this.stats.hits++;
          logger.debug("Cache hit (persistent)", { key });
          return persistentItem.data;
        }
      }

      // Cache miss
      this.stats.misses++;
      logger.debug("Cache miss", { key });

      if (onMiss && typeof onMiss === "function") {
        return onMiss();
      }

      return defaultValue;
    } catch (error) {
      logger.error("Cache get error", { key, error: error.message });
      return defaultValue;
    }
  }

  /**
   * Establece un valor en el cache
   */
  set(key, data, ttl = this.config.DEFAULT_TTL, options = {}) {
    const { persistToDisk = true, priority = "normal", tags = [] } = options;

    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl,
        priority,
        tags,
        accessCount: 0,
        lastAccess: Date.now(),
      };

      // Guardar en memoria
      this.memoryCache.set(key, item);

      // Guardar persistente si está habilitado
      if (persistToDisk) {
        this.setPersistent(key, item);
      }

      this.stats.sets++;
      logger.debug("Cache set", { key, ttl, persistToDisk });

      // Verificar límites de memoria
      this.enforceLimits();

      return true;
    } catch (error) {
      logger.error("Cache set error", { key, error: error.message });
      return false;
    }
  }

  /**
   * Elimina un valor del cache
   */
  remove(key) {
    try {
      const memoryDeleted = this.memoryCache.delete(key);
      const persistentDeleted = this.removePersistent(key);

      if (memoryDeleted || persistentDeleted) {
        this.stats.deletes++;
        logger.debug("Cache remove", { key });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Cache remove error", { key, error: error.message });
      return false;
    }
  }

  /**
   * Verifica si una clave existe en cache
   */
  has(key) {
    try {
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem && !this.isExpired(memoryItem)) {
        return true;
      }

      const persistentItem = this.getPersistent(key);
      return persistentItem && !this.isExpired(persistentItem);
    } catch (error) {
      logger.error("Cache has error", { key, error: error.message });
      return false;
    }
  }

  /**
   * Limpia todo el cache
   */
  clear(options = {}) {
    const { clearPersistent = true, pattern = null } = options;

    try {
      if (pattern) {
        // Limpiar por patrón
        this.clearByPattern(pattern, clearPersistent);
      } else {
        // Limpiar todo
        this.memoryCache.clear();

        if (clearPersistent) {
          this.clearPersistent();
        }
      }

      this.stats.clears++;
      logger.info("Cache cleared", { pattern, clearPersistent });
    } catch (error) {
      logger.error("Cache clear error", { error: error.message });
    }
  }

  /**
   * Limpia cache por patrón
   */
  clearByPattern(pattern, clearPersistent = true) {
    const regex = new RegExp(pattern);

    // Limpiar memoria
    for (const [key] of this.memoryCache) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Limpiar persistente
    if (clearPersistent) {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith("dhara_cache_") && regex.test(key)) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        logger.error("Error clearing persistent cache by pattern", {
          pattern,
          error,
        });
      }
    }
  }

  /**
   * Limpia cache por tags
   */
  clearByTags(tags) {
    if (!Array.isArray(tags)) {
      tags = [tags];
    }

    for (const [key, item] of this.memoryCache) {
      if (item.tags && item.tags.some((tag) => tags.includes(tag))) {
        this.remove(key);
      }
    }

    logger.debug("Cache cleared by tags", { tags });
  }

  /**
   * Obtiene o establece un valor (get with fallback)
   */
  async getOrSet(
    key,
    fetchFunction,
    ttl = this.config.DEFAULT_TTL,
    options = {},
  ) {
    try {
      // Intentar obtener del cache
      const cached = this.get(key, options);
      if (cached !== null) {
        return cached;
      }

      // Si no está en cache, ejecutar función
      logger.debug("Cache getOrSet: fetching", { key });
      const data = await fetchFunction();

      // Guardar en cache
      this.set(key, data, ttl, options);

      return data;
    } catch (error) {
      logger.error("Cache getOrSet error", { key, error: error.message });
      throw error;
    }
  }

  /**
   * Obtiene múltiples valores del cache
   */
  mget(keys) {
    const results = {};

    keys.forEach((key) => {
      results[key] = this.get(key);
    });

    return results;
  }

  /**
   * Establece múltiples valores en el cache
   */
  mset(items, ttl = this.config.DEFAULT_TTL, options = {}) {
    const results = {};

    Object.entries(items).forEach(([key, data]) => {
      results[key] = this.set(key, data, ttl, options);
    });

    return results;
  }

  /**
   * Incrementa un valor numérico en cache
   */
  increment(key, delta = 1, initialValue = 0, ttl = this.config.DEFAULT_TTL) {
    try {
      const current = this.get(key, { defaultValue: initialValue });
      const newValue =
        (typeof current === "number" ? current : initialValue) + delta;

      this.set(key, newValue, ttl);
      return newValue;
    } catch (error) {
      logger.error("Cache increment error", { key, error: error.message });
      return initialValue;
    }
  }

  /**
   * Decrementa un valor numérico en cache
   */
  decrement(key, delta = 1, initialValue = 0, ttl = this.config.DEFAULT_TTL) {
    return this.increment(key, -delta, initialValue, ttl);
  }

  /**
   * Verifica si un item ha expirado
   */
  isExpired(item) {
    if (!item || !item.timestamp || !item.ttl) {
      return true;
    }

    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Obtiene del cache persistente (localStorage)
   */
  getPersistent(key) {
    try {
      const item = localStorage.getItem(`dhara_cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logger.error("Error getting persistent cache", { key, error });
      return null;
    }
  }

  /**
   * Guarda en cache persistente
   */
  setPersistent(key, item) {
    try {
      localStorage.setItem(`dhara_cache_${key}`, JSON.stringify(item));
      return true;
    } catch (error) {
      logger.error("Error setting persistent cache", { key, error });

      // Si falla por quota, intentar limpiar y reintentar
      if (error.name === "QuotaExceededError") {
        this.clearExpiredPersistent();
        try {
          localStorage.setItem(`dhara_cache_${key}`, JSON.stringify(item));
          return true;
        } catch (retryError) {
          logger.error("Persistent cache retry failed", {
            key,
            error: retryError,
          });
        }
      }

      return false;
    }
  }

  /**
   * Elimina del cache persistente
   */
  removePersistent(key) {
    try {
      localStorage.removeItem(`dhara_cache_${key}`);
      return true;
    } catch (error) {
      logger.error("Error removing persistent cache", { key, error });
      return false;
    }
  }

  /**
   * Limpia todo el cache persistente
   */
  clearPersistent() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("dhara_cache_")) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      logger.error("Error clearing persistent cache", { error });
    }
  }

  /**
   * Limpia cache persistente expirado
   */
  clearExpiredPersistent() {
    try {
      const keys = Object.keys(localStorage);
      let removedCount = 0;

      keys.forEach((key) => {
        if (key.startsWith("dhara_cache_")) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (this.isExpired(item)) {
              localStorage.removeItem(key);
              removedCount++;
            }
          } catch (parseError) {
            // Eliminar items corruptos
            localStorage.removeItem(key);
            removedCount++;
          }
        }
      });

      if (removedCount > 0) {
        logger.info("Expired persistent cache cleared", { removedCount });
      }
    } catch (error) {
      logger.error("Error clearing expired persistent cache", { error });
    }
  }

  /**
   * Carga cache persistente a memoria
   */
  loadPersistentCache() {
    try {
      const keys = Object.keys(localStorage);
      let loadedCount = 0;

      keys.forEach((fullKey) => {
        if (fullKey.startsWith("dhara_cache_")) {
          try {
            const key = fullKey.replace("dhara_cache_", "");
            const item = JSON.parse(localStorage.getItem(fullKey));

            if (!this.isExpired(item)) {
              this.memoryCache.set(key, item);
              loadedCount++;
            } else {
              // Eliminar item expirado
              localStorage.removeItem(fullKey);
            }
          } catch (parseError) {
            // Eliminar item corrupto
            localStorage.removeItem(fullKey);
          }
        }
      });

      if (loadedCount > 0) {
        logger.info("Persistent cache loaded", { loadedCount });
      }
    } catch (error) {
      logger.error("Error loading persistent cache", { error });
    }
  }

  /**
   * Limpia items expirados
   */
  cleanup() {
    try {
      let removedCount = 0;

      // Limpiar memoria
      for (const [key, item] of this.memoryCache) {
        if (this.isExpired(item)) {
          this.memoryCache.delete(key);
          removedCount++;
        }
      }

      // Limpiar persistente
      this.clearExpiredPersistent();

      if (removedCount > 0) {
        logger.debug("Cache cleanup completed", { removedCount });
      }
    } catch (error) {
      logger.error("Cache cleanup error", { error: error.message });
    }
  }

  /**
   * Aplica límites de memoria
   */
  enforceLimits() {
    const maxEntries = this.config.MAX_ENTRIES || 1000;

    if (this.memoryCache.size <= maxEntries) {
      return;
    }

    // Convertir a array y ordenar por prioridad y uso
    const entries = Array.from(this.memoryCache.entries())
      .map(([key, item]) => ({ key, ...item }))
      .sort((a, b) => {
        // Prioridad: high > normal > low
        const priorityWeight = { high: 3, normal: 2, low: 1 };
        const aPriority = priorityWeight[a.priority] || 2;
        const bPriority = priorityWeight[b.priority] || 2;

        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }

        // Si misma prioridad, ordenar por último acceso
        return a.lastAccess - b.lastAccess;
      });

    // Eliminar el 20% menos importantes
    const toRemove = Math.floor(maxEntries * 0.2);
    const keysToRemove = entries.slice(-toRemove).map((entry) => entry.key);

    keysToRemove.forEach((key) => {
      this.memoryCache.delete(key);
    });

    logger.debug("Cache limits enforced", {
      removed: keysToRemove.length,
      remaining: this.memoryCache.size,
    });
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (
            (this.stats.hits / (this.stats.hits + this.stats.misses)) *
            100
          ).toFixed(2)
        : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memorySize: this.memoryCache.size,
      memoryEntries: Array.from(this.memoryCache.keys()),
      persistentEntries: this.getPersistentKeys().length,
    };
  }

  /**
   * Obtiene claves del cache persistente
   */
  getPersistentKeys() {
    try {
      return Object.keys(localStorage)
        .filter((key) => key.startsWith("dhara_cache_"))
        .map((key) => key.replace("dhara_cache_", ""));
    } catch (error) {
      return [];
    }
  }

  /**
   * Resetea estadísticas
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
    };
  }

  /**
   * Alias para clearByPattern - elimina cache por patrón
   */
  deleteByPattern(pattern, clearPersistent = true) {
    this.clearByPattern(pattern, clearPersistent);
  }

  /**
   * Destructor - limpia intervalos
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Instancia global del cache
export const cache = new CacheManager();

// Helpers específicos para tipos de cache comunes
export const userCache = {
  get: (key) => cache.get(`user_${key}`),
  set: (key, data, ttl) =>
    cache.set(`user_${key}`, data, ttl, { tags: ["user"] }),
  remove: (key) => cache.remove(`user_${key}`),
  clear: () => cache.clearByTags(["user"]),
};

export const apiCache = {
  get: (key) => cache.get(`api_${key}`),
  set: (key, data, ttl = APP_CONSTANTS.CACHE.SHORT_TTL) =>
    cache.set(`api_${key}`, data, ttl, { tags: ["api"] }),
  remove: (key) => cache.remove(`api_${key}`),
  clear: () => cache.clearByTags(["api"]),
};

export const staticCache = {
  get: (key) => cache.get(`static_${key}`),
  set: (key, data, ttl = APP_CONSTANTS.CACHE.LONG_TTL) =>
    cache.set(`static_${key}`, data, ttl, {
      tags: ["static"],
      priority: "high",
    }),
  remove: (key) => cache.remove(`static_${key}`),
  clear: () => cache.clearByTags(["static"]),
};

export default cache;
