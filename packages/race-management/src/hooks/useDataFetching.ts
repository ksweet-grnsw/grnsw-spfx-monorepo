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

  // Check if cache is stale
  const checkCacheStaleness = useCallback(() => {
    if (cacheTime && cacheTimestampRef.current) {
      const isStale = Date.now() - cacheTimestampRef.current > cacheTime;
      setState(prev => ({ ...prev, isStale }));
      return isStale;
    }
    return true;
  }, [cacheTime]);

  // Fetch data with retry logic
  const fetchData = useCallback(async (force: boolean = false) => {
    // Skip if already loading (but always allow forced fetches and dependency changes)
    if (state.loading && !force) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    retryCountRef.current = 0;

    const attemptFetch = async (): Promise<T> => {
      try {
        const result = await fetchFunction();
        
        if (isMountedRef.current) {
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
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        
        if (retryCountRef.current < retryCount) {
          retryCountRef.current++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return attemptFetch();
        }
        
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: errorMessage
          }));
          
          if (onError) {
            onError(error instanceof Error ? error : new Error(errorMessage));
          }
        }
        
        throw error;
      }
    };

    return attemptFetch();
  }, [fetchFunction, checkCacheStaleness, state.loading, state.data, retryCount, retryDelay, onSuccess, onError]);

  // Refresh data (force fetch)
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Clear data and errors
  const reset = useCallback(() => {
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
      fetchData(true); // Force fetch on dependency changes
    }
  }, [fetchData, autoFetch, ...dependencies]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
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