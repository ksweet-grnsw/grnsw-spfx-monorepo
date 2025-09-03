import { useState, useEffect, useCallback, useRef } from 'react';
import { UnifiedBaseDataverseService, IODataQuery, IDataverseResponse } from '../services/UnifiedBaseDataverseService';
import { UnifiedErrorHandler } from '../utils/UnifiedErrorHandler';

/**
 * Options for useDataverse hook
 */
export interface UseDataverseOptions<T> {
  /** Initial query parameters */
  query?: IODataQuery;
  
  /** Auto-fetch on mount */
  autoFetch?: boolean;
  
  /** Polling interval in milliseconds */
  pollingInterval?: number;
  
  /** Dependencies that trigger refetch */
  dependencies?: any[];
  
  /** Transform data before setting state */
  transform?: (data: T[]) => T[];
  
  /** On success callback */
  onSuccess?: (data: T[]) => void;
  
  /** On error callback */
  onError?: (error: Error) => void;
  
  /** Enable optimistic updates */
  enableOptimistic?: boolean;
  
  /** Debounce delay for refetch */
  debounceDelay?: number;
}

/**
 * Result from useDataverse hook
 */
export interface UseDataverseResult<T> {
  /** Data array */
  data: T[];
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Total count (for pagination) */
  totalCount?: number;
  
  /** Has more data */
  hasMore: boolean;
  
  /** Refetch function */
  refetch: (query?: IODataQuery) => Promise<void>;
  
  /** Load more function (for pagination) */
  loadMore: () => Promise<void>;
  
  /** Create item */
  create: (item: Partial<T>) => Promise<T | null>;
  
  /** Update item */
  update: (id: string, data: Partial<T>) => Promise<T | null>;
  
  /** Delete item */
  remove: (id: string) => Promise<boolean>;
  
  /** Clear data */
  clear: () => void;
  
  /** Set query */
  setQuery: (query: IODataQuery) => void;
  
  /** Is fetching */
  isFetching: boolean;
  
  /** Is mutating */
  isMutating: boolean;
}

/**
 * Custom hook for Dataverse operations
 * Provides data fetching, caching, and CRUD operations
 */
export function useDataverse<T>(
  service: UnifiedBaseDataverseService<T>,
  options: UseDataverseOptions<T> = {}
): UseDataverseResult<T> {
  const {
    query: initialQuery,
    autoFetch = true,
    pollingInterval,
    dependencies = [],
    transform,
    onSuccess,
    onError,
    enableOptimistic = true,
    debounceDelay = 0
  } = options;

  // State
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState<number | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState<IODataQuery | undefined>(initialQuery);
  const [isFetching, setIsFetching] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  // Refs
  const pollingRef = useRef<NodeJS.Timeout>();
  const debounceRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  // Fetch data
  const fetchData = useCallback(async (fetchQuery?: IODataQuery) => {
    if (!mountedRef.current) return;

    setIsFetching(true);
    setError(null);

    try {
      const response = await service.getList(fetchQuery || query);
      
      if (!mountedRef.current) return;

      let items = response.value || [];
      
      // Transform data if transformer provided
      if (transform) {
        items = transform(items);
      }

      setData(items);
      setTotalCount(response['@odata.count']);
      setHasMore(!!response['@odata.nextLink']);

      // Call success callback
      if (onSuccess) {
        onSuccess(items);
      }
    } catch (err) {
      if (!mountedRef.current) return;

      const error = err instanceof Error ? err : new Error('Failed to fetch data');
      setError(error);

      // Call error callback
      if (onError) {
        onError(error);
      }

      // Log error
      UnifiedErrorHandler.handleError(err, 'useDataverse.fetchData');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [service, query, transform, onSuccess, onError]);

  // Debounced fetch
  const debouncedFetch = useCallback((fetchQuery?: IODataQuery) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (debounceDelay > 0) {
      debounceRef.current = setTimeout(() => {
        fetchData(fetchQuery);
      }, debounceDelay);
    } else {
      fetchData(fetchQuery);
    }
  }, [fetchData, debounceDelay]);

  // Refetch function
  const refetch = useCallback(async (newQuery?: IODataQuery) => {
    if (newQuery) {
      setQuery(newQuery);
    }
    await debouncedFetch(newQuery);
  }, [debouncedFetch]);

  // Load more function (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || isFetching) return;

    setIsFetching(true);
    setError(null);

    try {
      const nextQuery: IODataQuery = {
        ...query,
        skip: data.length
      };

      const response = await service.getList(nextQuery);
      
      if (!mountedRef.current) return;

      let items = response.value || [];
      
      // Transform data if transformer provided
      if (transform) {
        items = transform(items);
      }

      setData(prev => [...prev, ...items]);
      setHasMore(!!response['@odata.nextLink']);
    } catch (err) {
      if (!mountedRef.current) return;

      const error = err instanceof Error ? err : new Error('Failed to load more data');
      setError(error);

      if (onError) {
        onError(error);
      }
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
      }
    }
  }, [data, hasMore, isFetching, query, service, transform, onError]);

  // Create item
  const create = useCallback(async (item: Partial<T>): Promise<T | null> => {
    setIsMutating(true);
    setError(null);

    try {
      // Optimistic update
      if (enableOptimistic) {
        const optimisticItem = { ...item, _optimistic: true } as T;
        setData(prev => [optimisticItem, ...prev]);
      }

      const created = await service.create(item);
      
      if (!mountedRef.current) return null;

      // Replace optimistic item with real one
      if (enableOptimistic) {
        setData(prev => prev.map(i => 
          (i as any)._optimistic ? created : i
        ));
      } else {
        setData(prev => [created, ...prev]);
      }

      return created;
    } catch (err) {
      if (!mountedRef.current) return null;

      // Revert optimistic update
      if (enableOptimistic) {
        setData(prev => prev.filter(i => !(i as any)._optimistic));
      }

      const error = err instanceof Error ? err : new Error('Failed to create item');
      setError(error);

      if (onError) {
        onError(error);
      }

      return null;
    } finally {
      if (mountedRef.current) {
        setIsMutating(false);
      }
    }
  }, [service, enableOptimistic, onError]);

  // Update item
  const update = useCallback(async (id: string, updateData: Partial<T>): Promise<T | null> => {
    setIsMutating(true);
    setError(null);

    try {
      // Optimistic update
      if (enableOptimistic) {
        setData(prev => prev.map(item => 
          (item as any).id === id ? { ...item, ...updateData } : item
        ));
      }

      const updated = await service.update(id, updateData);
      
      if (!mountedRef.current) return null;

      // Update with real data
      setData(prev => prev.map(item => 
        (item as any).id === id ? updated : item
      ));

      return updated;
    } catch (err) {
      if (!mountedRef.current) return null;

      // Revert optimistic update
      if (enableOptimistic) {
        await refetch();
      }

      const error = err instanceof Error ? err : new Error('Failed to update item');
      setError(error);

      if (onError) {
        onError(error);
      }

      return null;
    } finally {
      if (mountedRef.current) {
        setIsMutating(false);
      }
    }
  }, [service, enableOptimistic, onError, refetch]);

  // Delete item
  const remove = useCallback(async (id: string): Promise<boolean> => {
    setIsMutating(true);
    setError(null);

    try {
      // Optimistic update
      if (enableOptimistic) {
        setData(prev => prev.filter(item => (item as any).id !== id));
      }

      await service.delete(id);
      
      if (!mountedRef.current) return false;

      // Remove from data if not optimistic
      if (!enableOptimistic) {
        setData(prev => prev.filter(item => (item as any).id !== id));
      }

      return true;
    } catch (err) {
      if (!mountedRef.current) return false;

      // Revert optimistic update
      if (enableOptimistic) {
        await refetch();
      }

      const error = err instanceof Error ? err : new Error('Failed to delete item');
      setError(error);

      if (onError) {
        onError(error);
      }

      return false;
    } finally {
      if (mountedRef.current) {
        setIsMutating(false);
      }
    }
  }, [service, enableOptimistic, onError, refetch]);

  // Clear data
  const clear = useCallback(() => {
    setData([]);
    setTotalCount(undefined);
    setHasMore(false);
    setError(null);
  }, []);

  // Auto-fetch on mount and dependencies change
  useEffect(() => {
    if (autoFetch) {
      debouncedFetch();
    }
  }, [debouncedFetch, autoFetch, ...dependencies]);

  // Set up polling
  useEffect(() => {
    if (pollingInterval && pollingInterval > 0) {
      pollingRef.current = setInterval(() => {
        fetchData();
      }, pollingInterval);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [pollingInterval, fetchData]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    totalCount,
    hasMore,
    refetch,
    loadMore,
    create,
    update,
    remove,
    clear,
    setQuery,
    isFetching,
    isMutating
  };
}