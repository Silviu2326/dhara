import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

/**
 * @typedef {Object} UseDebounceOptions
 * @property {number} delay - Debounce delay in milliseconds
 * @property {boolean} leading - Execute on leading edge
 * @property {boolean} trailing - Execute on trailing edge
 * @property {number} maxWait - Maximum wait time before execution
 * @property {Function} onDebounce - Callback when debouncing starts
 * @property {Function} onExecute - Callback when function executes
 * @property {Function} onCancel - Callback when debouncing is cancelled
 */

/**
 * @typedef {Object} UseDebounceReturn
 * @property {any} debouncedValue - Debounced value
 * @property {boolean} isDebouncing - Whether debouncing is active
 * @property {Function} cancel - Cancel pending execution
 * @property {Function} flush - Execute immediately
 * @property {Function} reset - Reset to initial value
 */

/**
 * Basic debounce hook for values
 * @param {any} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @param {UseDebounceOptions} options - Additional options
 * @returns {UseDebounceReturn}
 */
export const useDebounce = (value, delay = 300, options = {}) => {
  const {
    leading = false,
    trailing = true,
    maxWait = null,
    onDebounce = null,
    onExecute = null,
    onCancel = null
  } = options;

  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const lastExecutionTimeRef = useRef(0);
  const lastValueRef = useRef(value);
  const mountedRef = useRef(true);

  /**
   * Execute the value update
   */
  const executeUpdate = useCallback(() => {
    if (!mountedRef.current) return;

    setDebouncedValue(lastValueRef.current);
    setIsDebouncing(false);
    lastExecutionTimeRef.current = Date.now();

    if (onExecute) {
      onExecute(lastValueRef.current);
    }

    logger.debug('Debounced value updated', { value: lastValueRef.current, delay });
  }, [delay, onExecute]);

  /**
   * Cancel pending execution
   */
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }

    if (mountedRef.current) {
      setIsDebouncing(false);
    }

    if (onCancel) {
      onCancel();
    }

    logger.debug('Debounce cancelled');
  }, [onCancel]);

  /**
   * Execute immediately (flush)
   */
  const flush = useCallback(() => {
    cancel();
    executeUpdate();
  }, [cancel, executeUpdate]);

  /**
   * Reset to initial value
   */
  const reset = useCallback(() => {
    cancel();
    lastValueRef.current = value;
    if (mountedRef.current) {
      setDebouncedValue(value);
    }
  }, [cancel, value]);

  // Main debounce effect
  useEffect(() => {
    lastValueRef.current = value;

    // Skip if value hasn't changed
    if (value === debouncedValue && !isDebouncing) {
      return;
    }

    // Execute immediately on leading edge
    if (leading && !isDebouncing) {
      executeUpdate();
      return;
    }

    // Start debouncing
    if (!isDebouncing && mountedRef.current) {
      setIsDebouncing(true);
      if (onDebounce) {
        onDebounce(value);
      }
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up new timeout for trailing execution
    if (trailing) {
      timeoutRef.current = setTimeout(executeUpdate, delay);
    }

    // Set up max wait timeout if specified
    if (maxWait && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        executeUpdate();
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
          maxTimeoutRef.current = null;
        }
      }, maxWait);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    value,
    delay,
    leading,
    trailing,
    maxWait,
    isDebouncing,
    debouncedValue,
    executeUpdate,
    onDebounce
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return {
    debouncedValue,
    isDebouncing,
    cancel,
    flush,
    reset
  };
};

/**
 * Debounce hook for functions
 * @param {Function} func - Function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @param {UseDebounceOptions} options - Additional options
 * @returns {Object}
 */
export const useDebouncedFunction = (func, delay = 300, options = {}) => {
  const {
    leading = false,
    trailing = true,
    maxWait = null,
    onDebounce = null,
    onExecute = null,
    onCancel = null
  } = options;

  const [isDebouncing, setIsDebouncing] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const argsRef = useRef(null);
  const mountedRef = useRef(true);

  /**
   * Execute the function
   */
  const executeFunction = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const result = await func(...(argsRef.current || []));

      if (mountedRef.current) {
        setLastResult(result);
        setIsDebouncing(false);
      }

      if (onExecute) {
        onExecute(result);
      }

      logger.debug('Debounced function executed', { delay });
      return result;

    } catch (error) {
      logger.error('Error in debounced function:', error);

      if (mountedRef.current) {
        setIsDebouncing(false);
      }

      throw error;
    }
  }, [func, delay, onExecute]);

  /**
   * Cancel pending execution
   */
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }

    if (mountedRef.current) {
      setIsDebouncing(false);
    }

    if (onCancel) {
      onCancel();
    }

    logger.debug('Debounced function cancelled');
  }, [onCancel]);

  /**
   * Execute immediately (flush)
   */
  const flush = useCallback(() => {
    cancel();
    return executeFunction();
  }, [cancel, executeFunction]);

  /**
   * The debounced function
   */
  const debouncedFunction = useCallback((...args) => {
    argsRef.current = args;

    // Execute immediately on leading edge
    if (leading && !isDebouncing) {
      return executeFunction();
    }

    // Start debouncing
    if (!isDebouncing && mountedRef.current) {
      setIsDebouncing(true);
      if (onDebounce) {
        onDebounce(args);
      }
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up new timeout for trailing execution
    if (trailing) {
      timeoutRef.current = setTimeout(executeFunction, delay);
    }

    // Set up max wait timeout if specified
    if (maxWait && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        executeFunction();
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
          maxTimeoutRef.current = null;
        }
      }, maxWait);
    }

    // Return a promise that resolves when the function executes
    return new Promise((resolve) => {
      const checkExecution = () => {
        if (!isDebouncing) {
          resolve(lastResult);
        } else {
          setTimeout(checkExecution, 10);
        }
      };
      checkExecution();
    });
  }, [
    leading,
    trailing,
    delay,
    maxWait,
    isDebouncing,
    executeFunction,
    onDebounce,
    lastResult
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return {
    debouncedFunction,
    isDebouncing,
    lastResult,
    cancel,
    flush
  };
};

/**
 * Debounced callback hook
 * @param {Function} callback - Callback function
 * @param {Array} dependencies - Dependencies array
 * @param {number} delay - Debounce delay
 * @param {UseDebounceOptions} options - Additional options
 * @returns {Function}
 */
export const useDebouncedCallback = (callback, dependencies, delay = 300, options = {}) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCallback = useCallback(callback, dependencies);

  const { debouncedFunction } = useDebouncedFunction(memoizedCallback, delay, options);

  return debouncedFunction;
};

/**
 * Debounced effect hook
 * @param {Function} effect - Effect function
 * @param {Array} dependencies - Dependencies array
 * @param {number} delay - Debounce delay
 * @param {UseDebounceOptions} options - Additional options
 */
export const useDebouncedEffect = (effect, dependencies, delay = 300, options = {}) => {
  const { debouncedValue } = useDebounce(dependencies, delay, options);

  useEffect(() => {
    effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);
};

/**
 * Hook for debouncing API calls
 * @param {Function} apiCall - API call function
 * @param {number} delay - Debounce delay
 * @param {UseDebounceOptions} options - Additional options
 * @returns {Object}
 */
export const useDebouncedApi = (apiCall, delay = 500, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    debouncedFunction,
    isDebouncing,
    cancel
  } = useDebouncedFunction(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiCall(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    delay,
    {
      ...options,
      onCancel: () => {
        setLoading(false);
        if (options.onCancel) {
          options.onCancel();
        }
      }
    }
  );

  const reset = useCallback(() => {
    cancel();
    setData(null);
    setError(null);
    setLoading(false);
  }, [cancel]);

  return {
    call: debouncedFunction,
    data,
    loading: loading || isDebouncing,
    error,
    isDebouncing,
    cancel,
    reset
  };
};

/**
 * Hook for debouncing search queries
 * @param {string} query - Search query
 * @param {Function} searchFunction - Search function
 * @param {number} delay - Debounce delay
 * @param {Object} options - Additional options
 * @returns {Object}
 */
export const useDebouncedSearch = (query, searchFunction, delay = 300, options = {}) => {
  const { minLength = 2, ...restOptions } = options;

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { debouncedValue: debouncedQuery } = useDebounce(query, delay, restOptions);

  const {
    call: search,
    cancel
  } = useDebouncedApi(searchFunction, 0, {
    ...restOptions,
    onExecute: (result) => {
      setResults(result || []);
    }
  });

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= minLength) {
      search(debouncedQuery);
    } else {
      setResults([]);
      setError(null);
    }
  }, [debouncedQuery, minLength, search]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    cancel();
  }, [cancel]);

  return {
    query: debouncedQuery,
    results,
    loading,
    error,
    clearResults,
    isSearching: debouncedQuery !== query
  };
};

/**
 * Hook for throttling (rate limiting) values
 * @param {any} value - Value to throttle
 * @param {number} interval - Throttle interval in milliseconds
 * @returns {any}
 */
export const useThrottle = (value, interval = 300) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    if (timeSinceLastExecution >= interval) {
      setThrottledValue(value);
      lastExecuted.current = now;
    } else {
      const timeout = setTimeout(() => {
        setThrottledValue(value);
        lastExecuted.current = Date.now();
      }, interval - timeSinceLastExecution);

      return () => clearTimeout(timeout);
    }
  }, [value, interval]);

  return throttledValue;
};

export default useDebounce;