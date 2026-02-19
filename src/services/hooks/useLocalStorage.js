import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

/**
 * @typedef {Object} UseLocalStorageOptions
 * @property {any} defaultValue - Default value if key doesn't exist
 * @property {Function} serializer - Custom serialization function
 * @property {Function} deserializer - Custom deserialization function
 * @property {boolean} syncAcrossTabs - Sync changes across browser tabs
 * @property {boolean} useSessionStorage - Use sessionStorage instead of localStorage
 * @property {Function} onError - Error callback function
 * @property {Function} validator - Function to validate stored values
 * @property {boolean} enableBackup - Enable backup to sessionStorage
 * @property {number} debounceMs - Debounce writes to storage
 */

/**
 * @typedef {Object} UseLocalStorageReturn
 * @property {any} value - Current value
 * @property {Function} setValue - Function to set value
 * @property {Function} removeValue - Function to remove value
 * @property {Function} resetValue - Function to reset to default
 * @property {boolean} isLoading - Loading state
 * @property {Error|null} error - Current error
 * @property {boolean} isAvailable - Storage availability
 */

/**
 * Default serialization function
 * @param {any} value
 * @returns {string}
 */
const defaultSerializer = (value) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    logger.error('Serialization error:', error);
    throw new Error(`Unable to serialize value: ${error.message}`);
  }
};

/**
 * Default deserialization function
 * @param {string} value
 * @returns {any}
 */
const defaultDeserializer = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    logger.error('Deserialization error:', error);
    throw new Error(`Unable to deserialize value: ${error.message}`);
  }
};

/**
 * Check if storage is available
 * @param {Storage} storage
 * @returns {boolean}
 */
const isStorageAvailable = (storage) => {
  try {
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Custom hook for localStorage with advanced features
 * @param {string} key - Storage key
 * @param {UseLocalStorageOptions} options - Hook options
 * @returns {UseLocalStorageReturn}
 */
export const useLocalStorage = (key, options = {}) => {
  const {
    defaultValue = null,
    serializer = defaultSerializer,
    deserializer = defaultDeserializer,
    syncAcrossTabs = true,
    useSessionStorage = false,
    onError = null,
    validator = null,
    enableBackup = true,
    debounceMs = 0
  } = options;

  // Choose storage type
  const storage = useSessionStorage ? sessionStorage : localStorage;
  const backupStorage = useSessionStorage ? localStorage : sessionStorage;

  // State management
  const [value, setValue] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAvailable] = useState(() => isStorageAvailable(storage));

  // Refs for cleanup and debouncing
  const mountedRef = useRef(true);
  const debounceTimeoutRef = useRef(null);
  const lastValueRef = useRef(value);

  /**
   * Get backup key for fallback storage
   * @param {string} originalKey
   * @returns {string}
   */
  const getBackupKey = useCallback((originalKey) => {
    return `backup_${originalKey}`;
  }, []);

  /**
   * Read value from storage
   * @returns {any}
   */
  const readFromStorage = useCallback(() => {
    if (!isAvailable) {
      logger.warn('Storage is not available');
      return defaultValue;
    }

    try {
      const item = storage.getItem(key);

      if (item === null) {
        // Try backup storage if enabled
        if (enableBackup && isStorageAvailable(backupStorage)) {
          const backupItem = backupStorage.getItem(getBackupKey(key));
          if (backupItem !== null) {
            const backupValue = deserializer(backupItem);

            // Restore to primary storage
            storage.setItem(key, serializer(backupValue));

            logger.debug('Value restored from backup storage', { key });
            return backupValue;
          }
        }

        return defaultValue;
      }

      const parsedValue = deserializer(item);

      // Validate if validator is provided
      if (validator && !validator(parsedValue)) {
        logger.warn('Stored value failed validation', { key });
        return defaultValue;
      }

      return parsedValue;

    } catch (error) {
      logger.error('Error reading from storage:', { key, error: error.message });

      if (onError) {
        onError(error);
      }

      setError(error);
      return defaultValue;
    }
  }, [
    isAvailable,
    storage,
    key,
    deserializer,
    defaultValue,
    validator,
    onError,
    enableBackup,
    backupStorage,
    getBackupKey,
    serializer
  ]);

  /**
   * Write value to storage with debouncing
   * @param {any} newValue
   */
  const writeToStorage = useCallback((newValue) => {
    if (!isAvailable) {
      logger.warn('Storage is not available');
      return;
    }

    const performWrite = () => {
      try {
        if (newValue === null || newValue === undefined) {
          storage.removeItem(key);

          // Remove from backup storage too
          if (enableBackup && isStorageAvailable(backupStorage)) {
            backupStorage.removeItem(getBackupKey(key));
          }
        } else {
          const serializedValue = serializer(newValue);
          storage.setItem(key, serializedValue);

          // Backup to secondary storage if enabled
          if (enableBackup && isStorageAvailable(backupStorage)) {
            try {
              backupStorage.setItem(getBackupKey(key), serializedValue);
            } catch (backupError) {
              logger.warn('Failed to backup to secondary storage:', backupError);
            }
          }
        }

        setError(null);
        logger.debug('Value written to storage', { key, hasValue: newValue !== null });

      } catch (error) {
        logger.error('Error writing to storage:', { key, error: error.message });

        if (onError) {
          onError(error);
        }

        setError(error);
      }
    };

    // Debounce writes if specified
    if (debounceMs > 0) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(performWrite, debounceMs);
    } else {
      performWrite();
    }
  }, [
    isAvailable,
    storage,
    key,
    serializer,
    onError,
    enableBackup,
    backupStorage,
    getBackupKey,
    debounceMs
  ]);

  /**
   * Set new value
   * @param {any|Function} newValue - New value or function to update value
   */
  const setStoredValue = useCallback((newValue) => {
    try {
      // Allow functional updates
      const valueToStore = typeof newValue === 'function'
        ? newValue(lastValueRef.current)
        : newValue;

      lastValueRef.current = valueToStore;

      if (mountedRef.current) {
        setValue(valueToStore);
      }

      writeToStorage(valueToStore);

    } catch (error) {
      logger.error('Error setting value:', { key, error: error.message });

      if (onError) {
        onError(error);
      }

      if (mountedRef.current) {
        setError(error);
      }
    }
  }, [key, writeToStorage, onError]);

  /**
   * Remove value from storage
   */
  const removeValue = useCallback(() => {
    setStoredValue(null);
  }, [setStoredValue]);

  /**
   * Reset to default value
   */
  const resetValue = useCallback(() => {
    setStoredValue(defaultValue);
  }, [setStoredValue, defaultValue]);

  /**
   * Handle storage events (for cross-tab synchronization)
   */
  const handleStorageChange = useCallback((event) => {
    if (event.key === key && event.storageArea === storage) {
      try {
        const newValue = event.newValue
          ? deserializer(event.newValue)
          : defaultValue;

        // Validate if validator is provided
        if (validator && newValue !== defaultValue && !validator(newValue)) {
          logger.warn('Storage event value failed validation', { key });
          return;
        }

        lastValueRef.current = newValue;

        if (mountedRef.current) {
          setValue(newValue);
          setError(null);
        }

        logger.debug('Storage synchronized across tabs', { key });

      } catch (error) {
        logger.error('Error handling storage event:', { key, error: error.message });

        if (onError) {
          onError(error);
        }

        if (mountedRef.current) {
          setError(error);
        }
      }
    }
  }, [key, storage, deserializer, defaultValue, validator, onError]);

  // Initialize value on mount
  useEffect(() => {
    try {
      const initialValue = readFromStorage();
      lastValueRef.current = initialValue;

      if (mountedRef.current) {
        setValue(initialValue);
        setIsLoading(false);
        setError(null);
      }
    } catch (error) {
      logger.error('Error initializing localStorage hook:', { key, error: error.message });

      if (mountedRef.current) {
        setValue(defaultValue);
        setIsLoading(false);
        setError(error);
      }
    }
  }, [key, readFromStorage, defaultValue]);

  // Set up cross-tab synchronization
  useEffect(() => {
    if (syncAcrossTabs && isAvailable) {
      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [syncAcrossTabs, isAvailable, handleStorageChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    value,
    setValue: setStoredValue,
    removeValue,
    resetValue,
    isLoading,
    error,
    isAvailable
  };
};

/**
 * Hook for sessionStorage
 * @param {string} key
 * @param {UseLocalStorageOptions} options
 * @returns {UseLocalStorageReturn}
 */
export const useSessionStorage = (key, options = {}) => {
  return useLocalStorage(key, {
    ...options,
    useSessionStorage: true
  });
};

/**
 * Hook for storing objects with automatic serialization
 * @param {string} key
 * @param {Object} defaultValue
 * @param {UseLocalStorageOptions} options
 * @returns {UseLocalStorageReturn}
 */
export const useStoredObject = (key, defaultValue = {}, options = {}) => {
  return useLocalStorage(key, {
    defaultValue,
    validator: (value) => typeof value === 'object' && value !== null,
    ...options
  });
};

/**
 * Hook for storing arrays with automatic serialization
 * @param {string} key
 * @param {Array} defaultValue
 * @param {UseLocalStorageOptions} options
 * @returns {UseLocalStorageReturn}
 */
export const useStoredArray = (key, defaultValue = [], options = {}) => {
  return useLocalStorage(key, {
    defaultValue,
    validator: (value) => Array.isArray(value),
    ...options
  });
};

/**
 * Hook for storing primitives with type validation
 * @param {string} key
 * @param {string|number|boolean} defaultValue
 * @param {UseLocalStorageOptions} options
 * @returns {UseLocalStorageReturn}
 */
export const useStoredPrimitive = (key, defaultValue, options = {}) => {
  const expectedType = typeof defaultValue;

  return useLocalStorage(key, {
    defaultValue,
    validator: (value) => typeof value === expectedType,
    ...options
  });
};

/**
 * Hook for boolean values with toggle functionality
 * @param {string} key
 * @param {boolean} defaultValue
 * @param {UseLocalStorageOptions} options
 * @returns {Object}
 */
export const useStoredBoolean = (key, defaultValue = false, options = {}) => {
  const result = useLocalStorage(key, {
    defaultValue,
    validator: (value) => typeof value === 'boolean',
    ...options
  });

  const toggle = useCallback(() => {
    result.setValue(prev => !prev);
  }, [result.setValue]);

  const setTrue = useCallback(() => {
    result.setValue(true);
  }, [result.setValue]);

  const setFalse = useCallback(() => {
    result.setValue(false);
  }, [result.setValue]);

  return {
    ...result,
    toggle,
    setTrue,
    setFalse
  };
};

/**
 * Hook for managing a list with common operations
 * @param {string} key
 * @param {Array} defaultValue
 * @param {UseLocalStorageOptions} options
 * @returns {Object}
 */
export const useStoredList = (key, defaultValue = [], options = {}) => {
  const result = useStoredArray(key, defaultValue, options);

  const addItem = useCallback((item) => {
    result.setValue(prev => [...prev, item]);
  }, [result.setValue]);

  const removeItem = useCallback((index) => {
    result.setValue(prev => prev.filter((_, i) => i !== index));
  }, [result.setValue]);

  const updateItem = useCallback((index, newItem) => {
    result.setValue(prev =>
      prev.map((item, i) => i === index ? newItem : item)
    );
  }, [result.setValue]);

  const clearList = useCallback(() => {
    result.setValue([]);
  }, [result.setValue]);

  const insertItem = useCallback((index, item) => {
    result.setValue(prev => {
      const newList = [...prev];
      newList.splice(index, 0, item);
      return newList;
    });
  }, [result.setValue]);

  return {
    ...result,
    addItem,
    removeItem,
    updateItem,
    clearList,
    insertItem,
    items: result.value,
    length: result.value.length
  };
};

/**
 * Hook for managing user preferences
 * @param {string} userId
 * @param {Object} defaultPreferences
 * @param {UseLocalStorageOptions} options
 * @returns {UseLocalStorageReturn}
 */
export const useUserPreferences = (userId, defaultPreferences = {}, options = {}) => {
  const key = `user_preferences_${userId}`;

  return useStoredObject(key, defaultPreferences, {
    syncAcrossTabs: true,
    enableBackup: true,
    ...options
  });
};

/**
 * Hook for managing form data persistence
 * @param {string} formId
 * @param {Object} defaultData
 * @param {UseLocalStorageOptions} options
 * @returns {Object}
 */
export const useFormPersistence = (formId, defaultData = {}, options = {}) => {
  const key = `form_data_${formId}`;

  const result = useStoredObject(key, defaultData, {
    debounceMs: 500,
    useSessionStorage: true,
    ...options
  });

  const updateField = useCallback((fieldName, value) => {
    result.setValue(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, [result.setValue]);

  const clearForm = useCallback(() => {
    result.setValue(defaultData);
  }, [result.setValue, defaultData]);

  return {
    ...result,
    updateField,
    clearForm,
    formData: result.value
  };
};

export default useLocalStorage;