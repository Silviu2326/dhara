import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '../utils/logger';

/**
 * @typedef {Object} PaginationState
 * @property {number} currentPage - Current page number (1-based)
 * @property {number} pageSize - Number of items per page
 * @property {number} totalItems - Total number of items
 * @property {number} totalPages - Total number of pages
 * @property {boolean} hasNextPage - Whether there's a next page
 * @property {boolean} hasPreviousPage - Whether there's a previous page
 * @property {number} startIndex - Start index of current page items
 * @property {number} endIndex - End index of current page items
 */

/**
 * @typedef {Object} PaginationActions
 * @property {Function} goToPage - Go to specific page
 * @property {Function} nextPage - Go to next page
 * @property {Function} previousPage - Go to previous page
 * @property {Function} firstPage - Go to first page
 * @property {Function} lastPage - Go to last page
 * @property {Function} setPageSize - Set page size
 * @property {Function} setTotalItems - Set total items
 * @property {Function} reset - Reset pagination
 */

/**
 * @typedef {PaginationState & PaginationActions} UsePaginationReturn
 */

/**
 * @typedef {Object} UsePaginationOptions
 * @property {number} initialPage - Initial page number
 * @property {number} initialPageSize - Initial page size
 * @property {number} initialTotalItems - Initial total items
 * @property {Function} onPageChange - Callback when page changes
 * @property {Function} onPageSizeChange - Callback when page size changes
 * @property {boolean} autoReset - Auto reset when total items change
 * @property {number} siblingCount - Number of siblings to show in pagination
 * @property {boolean} showFirstLast - Show first/last page buttons
 * @property {string} pageSizeStorageKey - localStorage key for page size
 */

/**
 * Custom hook for pagination management
 * @param {UsePaginationOptions} options - Pagination options
 * @returns {UsePaginationReturn}
 */
export const usePagination = (options = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 10,
    initialTotalItems = 0,
    onPageChange = null,
    onPageSizeChange = null,
    autoReset = true,
    siblingCount = 1,
    showFirstLast = true,
    pageSizeStorageKey = null
  } = options;

  // Load page size from localStorage if key is provided
  const getStoredPageSize = useCallback(() => {
    if (pageSizeStorageKey && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(pageSizeStorageKey);
        return stored ? parseInt(stored, 10) : initialPageSize;
      } catch (error) {
        logger.warn('Failed to load page size from localStorage:', error);
      }
    }
    return initialPageSize;
  }, [pageSizeStorageKey, initialPageSize]);

  // State management
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(getStoredPageSize());
  const [totalItems, setTotalItems] = useState(initialTotalItems);

  // Computed values
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize) || 1;
  }, [totalItems, pageSize]);

  const hasNextPage = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  const hasPreviousPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize - 1, totalItems - 1);
  }, [startIndex, pageSize, totalItems]);

  // Pagination range for UI
  const pageRange = useMemo(() => {
    const range = [];
    const totalPageNumbers = siblingCount * 2 + 3; // siblings + current + first + last
    const totalPageNodesWithFirstLast = totalPageNumbers + 2; // ... separators

    if (totalPages <= totalPageNodesWithFirstLast) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
      const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

      if (!shouldShowLeftDots && shouldShowRightDots) {
        // Show: 1 2 3 4 5 ... 20
        const leftItemCount = 3 + 2 * siblingCount;
        for (let i = 1; i <= leftItemCount; i++) {
          range.push(i);
        }
        range.push('...');
        if (showFirstLast) range.push(totalPages);
      } else if (shouldShowLeftDots && !shouldShowRightDots) {
        // Show: 1 ... 16 17 18 19 20
        if (showFirstLast) range.push(1);
        range.push('...');
        const rightItemCount = 3 + 2 * siblingCount;
        for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++) {
          range.push(i);
        }
      } else if (shouldShowLeftDots && shouldShowRightDots) {
        // Show: 1 ... 8 9 10 ... 20
        if (showFirstLast) range.push(1);
        range.push('...');
        for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
          range.push(i);
        }
        range.push('...');
        if (showFirstLast) range.push(totalPages);
      }
    }

    return range;
  }, [currentPage, totalPages, siblingCount, showFirstLast]);

  /**
   * Validate and normalize page number
   * @param {number} page
   * @returns {number}
   */
  const validatePage = useCallback((page) => {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) return 1;
    if (pageNum > totalPages) return totalPages;
    return pageNum;
  }, [totalPages]);

  /**
   * Go to specific page
   * @param {number} page
   */
  const goToPage = useCallback((page) => {
    const validPage = validatePage(page);

    if (validPage !== currentPage) {
      setCurrentPage(validPage);

      if (onPageChange) {
        onPageChange({
          page: validPage,
          pageSize,
          totalItems,
          totalPages,
          startIndex: (validPage - 1) * pageSize,
          endIndex: Math.min((validPage - 1) * pageSize + pageSize - 1, totalItems - 1)
        });
      }

      logger.debug('Page changed', { from: currentPage, to: validPage });
    }
  }, [currentPage, pageSize, totalItems, totalPages, validatePage, onPageChange]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, hasNextPage, goToPage]);

  /**
   * Go to previous page
   */
  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, hasPreviousPage, goToPage]);

  /**
   * Go to first page
   */
  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  /**
   * Go to last page
   */
  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  /**
   * Set page size
   * @param {number} newPageSize
   */
  const setPageSize = useCallback((newPageSize) => {
    const validPageSize = Math.max(1, parseInt(newPageSize, 10));

    if (validPageSize !== pageSize) {
      setPageSizeState(validPageSize);

      // Save to localStorage if key is provided
      if (pageSizeStorageKey && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(pageSizeStorageKey, validPageSize.toString());
        } catch (error) {
          logger.warn('Failed to save page size to localStorage:', error);
        }
      }

      // Calculate new page based on current start index
      const newPage = Math.floor(startIndex / validPageSize) + 1;
      const validNewPage = Math.min(newPage, Math.ceil(totalItems / validPageSize) || 1);

      setCurrentPage(validNewPage);

      if (onPageSizeChange) {
        onPageSizeChange({
          pageSize: validPageSize,
          page: validNewPage,
          totalItems,
          totalPages: Math.ceil(totalItems / validPageSize) || 1
        });
      }

      logger.debug('Page size changed', { from: pageSize, to: validPageSize, newPage: validNewPage });
    }
  }, [pageSize, startIndex, totalItems, pageSizeStorageKey, onPageSizeChange]);

  /**
   * Set total items and auto-adjust current page if needed
   * @param {number} newTotalItems
   */
  const setTotalItemsWithAdjustment = useCallback((newTotalItems) => {
    const validTotalItems = Math.max(0, parseInt(newTotalItems, 10));
    setTotalItems(validTotalItems);

    if (autoReset && validTotalItems !== totalItems) {
      const newTotalPages = Math.ceil(validTotalItems / pageSize) || 1;

      // Adjust current page if it's beyond the new total pages
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);

        if (onPageChange) {
          onPageChange({
            page: newTotalPages,
            pageSize,
            totalItems: validTotalItems,
            totalPages: newTotalPages,
            startIndex: (newTotalPages - 1) * pageSize,
            endIndex: Math.min((newTotalPages - 1) * pageSize + pageSize - 1, validTotalItems - 1)
          });
        }
      }

      logger.debug('Total items changed', { from: totalItems, to: validTotalItems });
    }
  }, [totalItems, pageSize, currentPage, autoReset, onPageChange]);

  /**
   * Reset pagination to initial state
   */
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSizeState(getStoredPageSize());
    setTotalItems(initialTotalItems);

    logger.debug('Pagination reset');
  }, [initialPage, initialTotalItems, getStoredPageSize]);

  /**
   * Get page info for display
   */
  const getPageInfo = useCallback(() => {
    if (totalItems === 0) {
      return 'No items';
    }

    const start = startIndex + 1;
    const end = endIndex + 1;

    return `${start}-${end} of ${totalItems}`;
  }, [startIndex, endIndex, totalItems]);

  /**
   * Get items for current page from an array
   * @param {Array} items - Array of items to paginate
   * @returns {Array}
   */
  const getCurrentPageItems = useCallback((items) => {
    if (!Array.isArray(items)) return [];

    const start = startIndex;
    const end = start + pageSize;

    return items.slice(start, end);
  }, [startIndex, pageSize]);

  // Auto-adjust page when total pages change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      goToPage(totalPages);
    }
  }, [currentPage, totalPages, goToPage]);

  return {
    // State
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    pageRange,

    // Actions
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
    setTotalItems: setTotalItemsWithAdjustment,
    reset,

    // Utilities
    getPageInfo,
    getCurrentPageItems
  };
};

/**
 * Hook for infinite scroll pagination
 * @param {Object} options - Options
 * @returns {Object}
 */
export const useInfiniteScroll = (options = {}) => {
  const {
    initialItems = [],
    pageSize = 10,
    loadMore,
    hasMore: hasMoreProp = true,
    threshold = 0.8,
    onLoadStart = null,
    onLoadEnd = null,
    onError = null
  } = options;

  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(hasMoreProp);
  const [page, setPage] = useState(1);

  /**
   * Load next page of items
   */
  const loadNextPage = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      if (onLoadStart) {
        onLoadStart(page);
      }

      const result = await loadMore(page, pageSize);

      if (result && result.items) {
        setItems(prev => [...prev, ...result.items]);
        setHasMore(result.hasMore ?? result.items.length === pageSize);
        setPage(prev => prev + 1);
      } else if (Array.isArray(result)) {
        setItems(prev => [...prev, ...result]);
        setHasMore(result.length === pageSize);
        setPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }

      if (onLoadEnd) {
        onLoadEnd(result);
      }

    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      logger.error('Error loading more items:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, pageSize, loadMore, onLoadStart, onLoadEnd, onError]);

  /**
   * Reset infinite scroll
   */
  const reset = useCallback(() => {
    setItems(initialItems);
    setPage(1);
    setHasMore(hasMoreProp);
    setError(null);
    setLoading(false);
  }, [initialItems, hasMoreProp]);

  /**
   * Scroll event handler
   */
  const handleScroll = useCallback((element) => {
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    if (scrollPercentage >= threshold && !loading && hasMore) {
      loadNextPage();
    }
  }, [threshold, loading, hasMore, loadNextPage]);

  /**
   * Intersection observer callback
   */
  const handleIntersection = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && !loading && hasMore) {
      loadNextPage();
    }
  }, [loading, hasMore, loadNextPage]);

  return {
    items,
    loading,
    error,
    hasMore,
    page,
    loadNextPage,
    reset,
    handleScroll,
    handleIntersection
  };
};

/**
 * Hook for cursor-based pagination
 * @param {Object} options - Options
 * @returns {Object}
 */
export const useCursorPagination = (options = {}) => {
  const {
    pageSize = 10,
    loadPage,
    onPageChange = null,
    onError = null
  } = options;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cursors, setCursors] = useState({ before: null, after: null });
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  /**
   * Load page with cursor
   * @param {string|null} cursor
   * @param {'next'|'previous'} direction
   */
  const loadWithCursor = useCallback(async (cursor, direction = 'next') => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const result = await loadPage({
        cursor,
        direction,
        pageSize
      });

      if (result) {
        setItems(result.items || []);
        setCursors({
          before: result.cursors?.before || null,
          after: result.cursors?.after || null
        });
        setHasNext(result.hasNext ?? false);
        setHasPrevious(result.hasPrevious ?? false);

        if (onPageChange) {
          onPageChange(result);
        }
      }

    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      logger.error('Error loading cursor page:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, pageSize, loadPage, onPageChange, onError]);

  /**
   * Load next page
   */
  const nextPage = useCallback(() => {
    if (hasNext && cursors.after) {
      loadWithCursor(cursors.after, 'next');
    }
  }, [hasNext, cursors.after, loadWithCursor]);

  /**
   * Load previous page
   */
  const previousPage = useCallback(() => {
    if (hasPrevious && cursors.before) {
      loadWithCursor(cursors.before, 'previous');
    }
  }, [hasPrevious, cursors.before, loadWithCursor]);

  /**
   * Load first page
   */
  const firstPage = useCallback(() => {
    loadWithCursor(null, 'next');
  }, [loadWithCursor]);

  /**
   * Reset pagination
   */
  const reset = useCallback(() => {
    setItems([]);
    setCursors({ before: null, after: null });
    setHasNext(false);
    setHasPrevious(false);
    setError(null);
    setLoading(false);
  }, []);

  return {
    items,
    loading,
    error,
    cursors,
    hasNext,
    hasPrevious,
    nextPage,
    previousPage,
    firstPage,
    reset,
    loadWithCursor
  };
};

export default usePagination;