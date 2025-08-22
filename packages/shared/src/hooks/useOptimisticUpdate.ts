import { useState, useCallback, useRef } from 'react';

/**
 * Optimistic update options
 */
export interface UseOptimisticUpdateOptions {
  /** Rollback on error */
  rollbackOnError?: boolean;
  
  /** Retry attempts */
  retryAttempts?: number;
  
  /** Retry delay in milliseconds */
  retryDelay?: number;
  
  /** On success callback */
  onSuccess?: () => void;
  
  /** On error callback */
  onError?: (error: Error) => void;
  
  /** On rollback callback */
  onRollback?: () => void;
}

/**
 * Optimistic update result
 */
export interface UseOptimisticUpdateResult<T> {
  /** Current data */
  data: T;
  
  /** Optimistic data (includes pending changes) */
  optimisticData: T;
  
  /** Is updating */
  isUpdating: boolean;
  
  /** Has pending changes */
  hasPendingChanges: boolean;
  
  /** Error */
  error: Error | null;
  
  /** Update function */
  update: (
    updater: (data: T) => T,
    mutate: () => Promise<void>
  ) => Promise<void>;
  
  /** Reset to original data */
  reset: () => void;
  
  /** Commit optimistic changes */
  commit: () => void;
  
  /** Rollback optimistic changes */
  rollback: () => void;
}

/**
 * Custom hook for optimistic updates
 * Provides optimistic UI updates with automatic rollback on error
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  options: UseOptimisticUpdateOptions = {}
): UseOptimisticUpdateResult<T> {
  const {
    rollbackOnError = true,
    retryAttempts = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    onRollback
  } = options;

  // State
  const [data, setData] = useState<T>(initialData);
  const [optimisticData, setOptimisticData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const pendingUpdatesRef = useRef<Array<{ updater: (data: T) => T; mutate: () => Promise<void> }>>([]);
  const rollbackDataRef = useRef<T>(initialData);

  // Check if has pending changes
  const hasPendingChanges = JSON.stringify(data) !== JSON.stringify(optimisticData);

  /**
   * Perform optimistic update
   */
  const update = useCallback(async (
    updater: (data: T) => T,
    mutate: () => Promise<void>
  ): Promise<void> => {
    setIsUpdating(true);
    setError(null);

    // Store current data for rollback
    rollbackDataRef.current = optimisticData;

    // Apply optimistic update immediately
    const newData = updater(optimisticData);
    setOptimisticData(newData);

    // Add to pending updates
    pendingUpdatesRef.current.push({ updater, mutate });

    // Attempt mutation with retries
    let attempts = 0;
    let success = false;

    while (attempts <= retryAttempts && !success) {
      try {
        await mutate();
        
        // Success - commit the changes
        setData(newData);
        pendingUpdatesRef.current = pendingUpdatesRef.current.filter(
          update => update.mutate !== mutate
        );
        
        success = true;

        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        attempts++;

        if (attempts > retryAttempts) {
          // Failed after all retries
          const error = err instanceof Error ? err : new Error('Update failed');
          setError(error);

          if (rollbackOnError) {
            // Rollback optimistic changes
            setOptimisticData(rollbackDataRef.current);
            pendingUpdatesRef.current = pendingUpdatesRef.current.filter(
              update => update.mutate !== mutate
            );

            if (onRollback) {
              onRollback();
            }
          }

          if (onError) {
            onError(error);
          }

          throw error;
        } else if (retryDelay > 0) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    setIsUpdating(false);
  }, [optimisticData, rollbackOnError, retryAttempts, retryDelay, onSuccess, onError, onRollback]);

  /**
   * Reset to original data
   */
  const reset = useCallback(() => {
    setData(initialData);
    setOptimisticData(initialData);
    setError(null);
    pendingUpdatesRef.current = [];
  }, [initialData]);

  /**
   * Commit all optimistic changes
   */
  const commit = useCallback(() => {
    setData(optimisticData);
    pendingUpdatesRef.current = [];
  }, [optimisticData]);

  /**
   * Rollback all optimistic changes
   */
  const rollback = useCallback(() => {
    setOptimisticData(data);
    pendingUpdatesRef.current = [];
    
    if (onRollback) {
      onRollback();
    }
  }, [data, onRollback]);

  return {
    data,
    optimisticData,
    isUpdating,
    hasPendingChanges,
    error,
    update,
    reset,
    commit,
    rollback
  };
}