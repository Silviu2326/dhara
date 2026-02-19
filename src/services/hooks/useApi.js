import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../config/apiClient';
import { cache, apiCache } from '../utils/cache';
import { logger } from '../utils/logger';

/**
 * @typedef {'idle' | 'loading' | 'success' | 'error'} RequestStatus
 */

/**
 * @typedef {Object} ApiState
 * @property {any} data - Response data
 * @property {boolean} isLoading - Loading state
 * @property {boolean} isSuccess - Success state
 * @property {boolean} isError - Error state
 * @property {Error|null} error - Error object
 * @property {RequestStatus} status - Current status
 */

/**
 * @typedef {Object} ApiActions
 * @property {Function} execute - Execute the request
 * @property {Function} reset - Reset the state
 * @property {Function} cancel - Cancel the request
 * @property {Function} retry - Retry the request
 * @property {Function} mutate - Update data optimistically
 */

/**
 * @typedef {ApiState & ApiActions} UseApiReturn
 */

/**
 * @typedef {Object} UseApiOptions
 * @property {boolean} immediate - Execute immediately on mount
 * @property {boolean} cache - Enable caching
 * @property {number} cacheTTL - Cache time to live in milliseconds
 * @property {number} retryCount - Number of retry attempts
 * @property {number} retryDelay - Delay between retries in milliseconds
 * @property {Function} onSuccess - Success callback
 * @property {Function} onError - Error callback
 * @property {boolean} enableOptimisticUpdates - Enable optimistic updates
 * @property {any} initialData - Initial data value
 * @property {string} cacheKey - Custom cache key
 * @property {boolean} dedupe - Deduplicate identical requests
 * @property {number} timeout - Request timeout in milliseconds
 */

/**
 * Generic API hook for making HTTP requests
 * @param {string|Function} urlOrFunction - URL string or function that returns URL
 * @param {UseApiOptions} options - Hook options
 * @returns {UseApiReturn}
 */
export const useApi = (urlOrFunction, options = {}) => {
  const {
    immediate = false,
    cache: enableCache = false,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    retryCount = 2,
    retryDelay = 1000,
    onSuccess = null,
    onError = null,
    enableOptimisticUpdates = false,
    initialData = null,
    cacheKey = null,
    dedupe = true,
    timeout = 30000,
    ...requestOptions
  } = options;

  // State management
  const [state, setState] = useState({
    data: initialData,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    status: 'idle'
  });

  // Refs for cleanup and cancellation
  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  // Active requests map for deduplication
  const activeRequestsRef = useRef(new Map());

  /**
   * Update state safely (only if component is mounted)
   * @param {Partial<ApiState>} updates
   */
  const updateState = useCallback((updates) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  /**
   * Generate cache key for the request
   * @param {string} url
   * @param {Object} config
   * @returns {string}
   */
  const generateCacheKey = useCallback((url, config) => {
    if (cacheKey) return cacheKey;

    const method = config.method || 'GET';
    const params = config.params ? JSON.stringify(config.params) : '';
    const data = config.data ? JSON.stringify(config.data) : '';

    return `api_${method}_${url}_${params}_${data}`;
  }, [cacheKey]);

  /**
   * Get cached data
   * @param {string} key
   * @returns {any|null}
   */
  const getCachedData = useCallback((key) => {
    if (!enableCache) return null;
    return apiCache.get(key);
  }, [enableCache]);

  /**
   * Set cached data
   * @param {string} key
   * @param {any} data
   */
  const setCachedData = useCallback((key, data) => {
    if (enableCache) {
      apiCache.set(key, data, cacheTTL);
    }
  }, [enableCache, cacheTTL]);

  /**
   * Execute the API request
   * @param {Object} overrideOptions - Options to override defaults
   * @returns {Promise<any>}
   */
  const execute = useCallback(async (overrideOptions = {}) => {
    const requestId = ++requestIdRef.current;

    try {
      // Generate URL
      const url = typeof urlOrFunction === 'function'
        ? urlOrFunction(overrideOptions)
        : urlOrFunction;

      if (!url) {
        throw new Error('URL is required');
      }

      // Merge options
      const config = {
        ...requestOptions,
        ...overrideOptions,
        timeout
      };

      // Generate cache key
      const key = generateCacheKey(url, config);

      // Check cache first
      if (enableCache && config.method === 'GET') {
        const cachedData = getCachedData(key);
        if (cachedData) {
          updateState({
            data: cachedData,
            isLoading: false,
            isSuccess: true,
            isError: false,
            error: null,
            status: 'success'
          });

          if (onSuccess) {
            onSuccess(cachedData);
          }

          logger.debug('API cache hit', { url, cacheKey: key });
          return cachedData;
        }
      }

      // Check for duplicate requests
      if (dedupe && activeRequestsRef.current.has(key)) {
        logger.debug('Deduplicating API request', { url, cacheKey: key });
        return activeRequestsRef.current.get(key);
      }

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      config.signal = abortControllerRef.current.signal;

      // Update loading state
      updateState({
        isLoading: true,
        isSuccess: false,
        isError: false,
        error: null,
        status: 'loading'
      });

      // Create request promise
      const requestPromise = apiClient(url, config);

      // Store active request for deduplication
      if (dedupe) {
        activeRequestsRef.current.set(key, requestPromise);
      }

      logger.debug('API request started', { url, method: config.method || 'GET' });

      // Execute request
      const response = await requestPromise;
      const data = response.data || response;

      // Only update if this is the latest request
      if (requestId === requestIdRef.current && mountedRef.current) {
        updateState({
          data,
          isLoading: false,
          isSuccess: true,
          isError: false,
          error: null,
          status: 'success'
        });

        // Cache successful GET requests
        if (enableCache && (config.method === 'GET' || !config.method)) {
          setCachedData(key, data);
        }

        // Success callback
        if (onSuccess) {
          onSuccess(data);
        }

        logger.debug('API request successful', { url });
      }

      // Clean up active request
      if (dedupe) {
        activeRequestsRef.current.delete(key);
      }

      return data;

    } catch (error) {
      // Clean up active request
      const key = generateCacheKey(
        typeof urlOrFunction === 'function' ? urlOrFunction(overrideOptions) : urlOrFunction,
        { ...requestOptions, ...overrideOptions }
      );
      if (dedupe) {
        activeRequestsRef.current.delete(key);
      }

      // Only update if this is the latest request and not cancelled
      if (requestId === requestIdRef.current && mountedRef.current && !error.name === 'AbortError') {
        updateState({
          isLoading: false,
          isSuccess: false,
          isError: true,
          error,
          status: 'error'
        });

        // Error callback
        if (onError) {
          onError(error);
        }

        logger.error('API request failed', {
          url: typeof urlOrFunction === 'function' ? urlOrFunction(overrideOptions) : urlOrFunction,
          error: error.message
        });
      }

      throw error;
    }
  }, [
    urlOrFunction,
    requestOptions,
    timeout,
    generateCacheKey,
    enableCache,
    getCachedData,
    setCachedData,
    dedupe,
    onSuccess,
    onError,
    updateState
  ]);

  /**
   * Execute request with retry logic
   * @param {Object} overrideOptions
   * @param {number} attempt
   * @returns {Promise<any>}
   */
  const executeWithRetry = useCallback(async (overrideOptions = {}, attempt = 0) => {
    try {
      return await execute(overrideOptions);
    } catch (error) {
      // Don't retry if cancelled or if we've exceeded retry count
      if (error.name === 'AbortError' || attempt >= retryCount) {
        throw error;
      }

      // Retry with delay
      logger.debug(`API request retry ${attempt + 1}/${retryCount}`, {
        url: typeof urlOrFunction === 'function' ? urlOrFunction(overrideOptions) : urlOrFunction,
        delay: retryDelay
      });

      return new Promise((resolve, reject) => {
        retryTimeoutRef.current = setTimeout(async () => {
          try {
            const result = await executeWithRetry(overrideOptions, attempt + 1);
            resolve(result);
          } catch (retryError) {
            reject(retryError);
          }
        }, retryDelay * Math.pow(2, attempt)); // Exponential backoff
      });
    }
  }, [execute, retryCount, retryDelay, urlOrFunction]);

  /**
   * Reset the state to initial values
   */
  const reset = useCallback(() => {
    updateState({
      data: initialData,
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      status: 'idle'
    });
  }, [initialData, updateState]);

  /**
   * Cancel the current request
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    updateState({
      isLoading: false,
      status: 'idle'
    });

    logger.debug('API request cancelled');
  }, [updateState]);

  /**
   * Retry the last request
   * @returns {Promise<any>}
   */
  const retry = useCallback(() => {
    return executeWithRetry();
  }, [executeWithRetry]);

  /**
   * Update data optimistically
   * @param {any|Function} newData - New data or function to update data
   */
  const mutate = useCallback((newData) => {
    if (!enableOptimisticUpdates) {
      logger.warn('Optimistic updates are disabled');
      return;
    }

    const updatedData = typeof newData === 'function' ? newData(state.data) : newData;

    updateState({
      data: updatedData,
      isSuccess: true,
      isError: false,
      error: null
    });

    // Update cache if enabled
    if (enableCache) {
      const url = typeof urlOrFunction === 'function' ? urlOrFunction() : urlOrFunction;
      const key = generateCacheKey(url, requestOptions);
      setCachedData(key, updatedData);
    }

    logger.debug('Data mutated optimistically');
  }, [
    enableOptimisticUpdates,
    state.data,
    updateState,
    enableCache,
    urlOrFunction,
    generateCacheKey,
    requestOptions,
    setCachedData
  ]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      executeWithRetry();
    }
  }, [immediate, executeWithRetry]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return {
    // State
    data: state.data,
    isLoading: state.isLoading,
    isSuccess: state.isSuccess,
    isError: state.isError,
    error: state.error,
    status: state.status,

    // Actions
    execute: executeWithRetry,
    reset,
    cancel,
    retry,
    mutate
  };
};

/**
 * Hook for GET requests
 * @param {string} url
 * @param {UseApiOptions} options
 * @returns {UseApiReturn}
 */
export const useGet = (url, options = {}) => {
  return useApi(url, {
    method: 'GET',
    immediate: true,
    cache: true,
    ...options
  });
};

/**
 * Hook for POST requests
 * @param {string} url
 * @param {UseApiOptions} options
 * @returns {UseApiReturn}
 */
export const usePost = (url, options = {}) => {
  return useApi(url, {
    method: 'POST',
    ...options
  });
};

/**
 * Hook for PUT requests
 * @param {string} url
 * @param {UseApiOptions} options
 * @returns {UseApiReturn}
 */
export const usePut = (url, options = {}) => {
  return useApi(url, {
    method: 'PUT',
    enableOptimisticUpdates: true,
    ...options
  });
};

/**
 * Hook for DELETE requests
 * @param {string} url
 * @param {UseApiOptions} options
 * @returns {UseApiReturn}
 */
export const useDelete = (url, options = {}) => {
  return useApi(url, {
    method: 'DELETE',
    ...options
  });
};

/**
 * Hook for PATCH requests
 * @param {string} url
 * @param {UseApiOptions} options
 * @returns {UseApiReturn}
 */
export const usePatch = (url, options = {}) => {
  return useApi(url, {
    method: 'PATCH',
    enableOptimisticUpdates: true,
    ...options
  });
};

/**
 * Hook for infinite/paginated data loading
 * @param {Function} getUrl - Function that returns URL for a given page
 * @param {UseApiOptions} options
 * @returns {Object}
 */
export const useInfiniteApi = (getUrl, options = {}) => {
  const {
    initialPage = 1,
    pageParam = 'page',
    ...restOptions
  } = options;

  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasNextPage, setHasNextPage] = useState(true);

  const {
    data,
    isLoading,
    isError,
    error,
    execute
  } = useApi(
    ({ page = initialPage } = {}) => getUrl({ [pageParam]: page }),
    {
      ...restOptions,
      immediate: false
    }
  );

  /**
   * Load next page
   */
  const fetchNextPage = useCallback(async () => {
    if (isLoading || !hasNextPage) return;

    try {
      const nextPageData = await execute({ page: currentPage + 1 });

      setPages(prev => [...prev, nextPageData]);
      setCurrentPage(prev => prev + 1);

      // Determine if there's a next page
      if (nextPageData && nextPageData.data && Array.isArray(nextPageData.data)) {
        setHasNextPage(nextPageData.data.length > 0);
      } else {
        setHasNextPage(false);
      }

    } catch (error) {
      logger.error('Error fetching next page:', error);
    }
  }, [isLoading, hasNextPage, currentPage, execute]);

  /**
   * Load first page
   */
  const fetchFirstPage = useCallback(async () => {
    try {
      const firstPageData = await execute({ page: initialPage });

      setPages([firstPageData]);
      setCurrentPage(initialPage);

      if (firstPageData && firstPageData.data && Array.isArray(firstPageData.data)) {
        setHasNextPage(firstPageData.data.length > 0);
      } else {
        setHasNextPage(false);
      }

    } catch (error) {
      logger.error('Error fetching first page:', error);
    }
  }, [execute, initialPage]);

  /**
   * Reset infinite data
   */
  const reset = useCallback(() => {
    setPages([]);
    setCurrentPage(initialPage);
    setHasNextPage(true);
  }, [initialPage]);

  // Load first page on mount
  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  // Flatten all pages data
  const allData = pages.reduce((acc, page) => {
    if (page && page.data && Array.isArray(page.data)) {
      return [...acc, ...page.data];
    }
    return acc;
  }, []);

  return {
    data: allData,
    pages,
    isLoading,
    isError,
    error,
    hasNextPage,
    currentPage,
    fetchNextPage,
    fetchFirstPage,
    reset
  };
};

export default useApi;