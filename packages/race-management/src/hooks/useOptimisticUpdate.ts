import { useState, useCallback, useRef } from 'react';

export interface OptimisticState<T> {
  data: T;
  isPending: boolean;
  isRollingBack: boolean;
  error: string | null;
}

export interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error, previousData: T) => void;
  onRollback?: (previousData: T) => void;
  rollbackDelay?: number;
  showNotification?: boolean;
}

export interface OptimisticUpdateResult<T> {
  state: OptimisticState<T>;
  updateOptimistically: (
    optimisticData: T | ((prev: T) => T),
    asyncOperation: () => Promise<T>,
    options?: OptimisticUpdateOptions<T>
  ) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing optimistic UI updates
 * Provides immediate UI feedback while async operations complete
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  defaultOptions?: OptimisticUpdateOptions<T>
): OptimisticUpdateResult<T> {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isPending: false,
    isRollingBack: false,
    error: null
  });

  const previousDataRef = useRef<T>(initialData);
  const updateQueueRef = useRef<Promise<void>>(Promise.resolve());

  const updateOptimistically = useCallback(
    async (
      optimisticData: T | ((prev: T) => T),
      asyncOperation: () => Promise<T>,
      options?: OptimisticUpdateOptions<T>
    ): Promise<void> => {
      const mergedOptions = { ...defaultOptions, ...options };
      
      // Queue the update to prevent race conditions
      updateQueueRef.current = updateQueueRef.current.then(async () => {
        // Store previous data for potential rollback
        previousDataRef.current = state.data;

        // Apply optimistic update immediately
        const newData = typeof optimisticData === 'function' 
          ? (optimisticData as (prev: T) => T)(state.data)
          : optimisticData;

        setState(prev => ({
          ...prev,
          data: newData,
          isPending: true,
          error: null,
          isRollingBack: false
        }));

        try {
          // Perform async operation
          const resultData = await asyncOperation();

          // Update with server response
          setState(prev => ({
            ...prev,
            data: resultData,
            isPending: false,
            error: null
          }));

          // Call success callback
          mergedOptions.onSuccess?.(resultData);

        } catch (error) {
          const errorObj = error as Error;
          
          // Set error state
          setState(prev => ({
            ...prev,
            isPending: false,
            isRollingBack: true,
            error: errorObj.message || 'Operation failed'
          }));

          // Call error callback
          mergedOptions.onError?.(errorObj, previousDataRef.current);

          // Rollback after delay (for visual feedback)
          const rollbackDelay = mergedOptions.rollbackDelay ?? 1500;
          
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              data: previousDataRef.current,
              isRollingBack: false,
              error: null
            }));

            // Call rollback callback
            mergedOptions.onRollback?.(previousDataRef.current);
          }, rollbackDelay);
        }
      });

      return updateQueueRef.current;
    },
    [state.data, defaultOptions]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isPending: false,
      isRollingBack: false,
      error: null
    });
    previousDataRef.current = initialData;
  }, [initialData]);

  return {
    state,
    updateOptimistically,
    reset
  };
}