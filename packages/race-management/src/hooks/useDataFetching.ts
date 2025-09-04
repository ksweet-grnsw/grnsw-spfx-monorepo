import { useState, useCallback, useEffect, useRef } from 'react';

export interface DataFetchingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
}

export interface DataFetchingOptions {
  autoFetch?: boolean;
  cacheTime?: number; // in milliseconds
  retryCount?: number;
  retryDelay?: number; // in milliseconds
  useExponentialBackoff?: boolean; // Use exponential backoff for retries
  maxRetryDelay?: number; // Maximum delay between retries (default 30000ms)
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Generic data fetching hook with loading, error, and caching support
 * Eliminates duplicate loading/error state management across components
 */
export function useDataFetching<T = any>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: DataFetchingOptions = {}
) {
  const {
    autoFetch = false,
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    retryCount = 0,
    retryDelay = 1000,
    useExponentialBackoff = true,
    maxRetryDelay = 30000, // 30 seconds max
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<DataFetchingState<T>>({
    data: null,
    loading: false,
    error: null,
    isStale: false
  });

  const cacheTimestampRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if cache is stale
  const checkCacheStaleness = useCallback(() => {
    if (cacheTime && cacheTimestampRef.current) {
      const isStale = Date.now() - cacheTimestampRef.current > cacheTime;
      setState(prev => ({ ...prev, isStale }));
      return isStale;
    }
    return true;
  }, [cacheTime]);

  // Fetch data with retry logic and request throttling
  const fetchData = useCallback(async (force: boolean = false) => {
    // Skip if already loading and not forced (let the current request finish)
    if (state.loading && !force) {
      console.debug('Skipping fetch - already loading and not forced');
      return;
    }

    // Only cancel existing request if we're doing a forced fetch or dependency change
    if (abortControllerRef.current && force) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Check circuit breaker before making request
    const circuitBreakerKey = 'spfx_circuit_breaker';
    const circuitBreakerTimeout = (window as any)[circuitBreakerKey];
    if (circuitBreakerTimeout && Date.now() < circuitBreakerTimeout) {
      const remainingTime = Math.ceil((circuitBreakerTimeout - Date.now()) / 1000);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Service temporarily unavailable. Please wait ${remainingTime} more seconds.`
      }));
      return Promise.reject(new Error('Circuit breaker is open'));
    }

    // Add global request throttling - prevent too many concurrent requests
    const globalRequestCount = (window as any).__spfxRequestCount || 0;
    if (globalRequestCount > 4) { // Further reduced to 4 to be more conservative
      console.warn('Too many concurrent requests, delaying this one...');
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
    }
    
    (window as any).__spfxRequestCount = globalRequestCount + 1;

    setState(prev => ({ ...prev, loading: true, error: null }));
    retryCountRef.current = 0;

    const attemptFetch = async (): Promise<T> => {
      try {
        // Check if request was aborted before starting
        if (signal.aborted) {
          throw new Error('Request was aborted');
        }
        
        const result = await fetchFunction();
        
        // Check if component is still mounted and request wasn't aborted
        if (isMountedRef.current && !signal.aborted) {
          setState({
            data: result,
            loading: false,
            error: null,
            isStale: false
          });
          cacheTimestampRef.current = Date.now();
          
          if (onSuccess) {
            onSuccess(result);
          }
        }
        
        // Decrement global request count
        (window as any).__spfxRequestCount = Math.max(0, ((window as any).__spfxRequestCount || 0) - 1);
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        
        // Handle aborted requests - don't show errors for cancelled requests
        if (signal.aborted || errorMessage.includes('aborted') || errorMessage.includes('cancelled')) {
          // Silently handle cancelled requests - these are expected during component lifecycle
          console.debug('Request cancelled (expected behavior)');
          return Promise.reject(new Error('Request was cancelled'));
        }
        
        // Don't retry on ERR_INSUFFICIENT_RESOURCES - it means we're already overloading
        if (errorMessage.includes('ERR_INSUFFICIENT_RESOURCES') || errorMessage.includes('Failed to fetch')) {
          // Activate circuit breaker - pause all new requests for a period
          const circuitBreakerKey = 'spfx_circuit_breaker';
          const circuitBreakerTimeout = Date.now() + 30000; // 30 seconds
          (window as any)[circuitBreakerKey] = circuitBreakerTimeout;
          
          if (isMountedRef.current && !signal.aborted) {
            setState(prev => ({
              ...prev,
              loading: false,
              error: 'Service temporarily overloaded. Please wait 30 seconds and try again.'
            }));
            
            if (onError) {
              onError(new Error('ERR_INSUFFICIENT_RESOURCES: Circuit breaker activated'));
            }
          }
          throw error;
        }
        
        if (retryCountRef.current < retryCount && !signal.aborted) {
          retryCountRef.current++;
          
          // Calculate delay with exponential backoff if enabled
          let delay = retryDelay;
          if (useExponentialBackoff) {
            delay = Math.min(retryDelay * Math.pow(2, retryCountRef.current - 1), maxRetryDelay);
          }
          
          console.log(`Retrying request (attempt ${retryCountRef.current}/${retryCount}) after ${delay}ms`);
          
          // Use AbortController for timeout as well
          await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(resolve, delay);
            signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              reject(new Error('Request was cancelled during retry delay'));
            });
          });
          
          return attemptFetch();
        }
        
        if (isMountedRef.current && !signal.aborted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: errorMessage
          }));
          
          if (onError) {
            onError(error instanceof Error ? error : new Error(errorMessage));
          }
        }
        
        // Decrement global request count on error
        (window as any).__spfxRequestCount = Math.max(0, ((window as any).__spfxRequestCount || 0) - 1);
        
        throw error;
      }
    };

    return attemptFetch();
  }, [fetchFunction, checkCacheStaleness, state.loading, state.data, retryCount, retryDelay, useExponentialBackoff, maxRetryDelay, onSuccess, onError]);

  // Refresh data (force fetch)
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Clear data and errors
  const reset = useCallback(() => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setState({
      data: null,
      loading: false,
      error: null,
      isStale: false
    });
    cacheTimestampRef.current = 0;
  }, []);

  // Update data manually (for optimistic updates)
  const setData = useCallback((data: T | ((prev: T | null) => T)) => {
    setState(prev => ({
      ...prev,
      data: typeof data === 'function' ? (data as any)(prev.data) : data,
      error: null,
      isStale: false
    }));
    cacheTimestampRef.current = Date.now();
  }, []);

  // Auto-fetch on mount if enabled, and re-fetch when dependencies change
  useEffect(() => {
    if (autoFetch) {
      // Use a small delay to debounce rapid dependency changes
      const timeoutId = setTimeout(() => {
        fetchData(true); // Force fetch on dependency changes
      }, 300); // 300ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [fetchData, autoFetch, ...dependencies]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cancel any pending requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    fetch: fetchData,
    refresh,
    reset,
    setData
  };
}

/**
 * Hook for managing paginated data fetching
 */
export function usePaginatedDataFetching<T = any>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  pageSize: number = 25
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const fetchPaginatedData = useCallback(async () => {
    const result = await fetchFunction(currentPage, pageSize);
    setTotalItems(result.total);
    return result.data;
  }, [fetchFunction, currentPage, pageSize]);

  const {
    data,
    loading,
    error,
    fetch,
    refresh
  } = useDataFetching<T[]>(fetchPaginatedData, [currentPage, pageSize]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    const maxPage = Math.ceil(totalItems / pageSize);
    if (currentPage < maxPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalItems, pageSize]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  return {
    data,
    loading,
    error,
    currentPage,
    totalItems,
    pageSize,
    totalPages: Math.ceil(totalItems / pageSize),
    fetch,
    refresh,
    goToPage,
    nextPage,
    previousPage
  };
}