/**
 * React hooks for Store integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Store, IStoreChangeEvent } from './Store';

/**
 * Hook to use a store with automatic re-rendering
 */
export function useStore<T extends object>(store: Store<T>): T {
  const [state, setState] = useState<T>(store.getState());
  
  useEffect(() => {
    // Subscribe to store changes
    const subscription = store.subscribe((event: IStoreChangeEvent<T>) => {
      setState({ ...event.state });
    });
    
    // Set initial state
    setState(store.getState());
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [store]);
  
  return state;
}

/**
 * Hook to use specific store properties with automatic re-rendering
 * Only re-renders when selected properties change
 */
export function useStoreSelector<T extends object, R>(
  store: Store<T>,
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
): R {
  const [selectedState, setSelectedState] = useState<R>(() => selector(store.getState()));
  const selectorRef = useRef(selector);
  const selectedStateRef = useRef(selectedState);
  
  // Default equality function
  const isEqual = equalityFn || ((a, b) => a === b);
  
  // Update refs
  selectorRef.current = selector;
  selectedStateRef.current = selectedState;
  
  useEffect(() => {
    const checkForUpdates = (event: IStoreChangeEvent<T>) => {
      const newSelectedState = selectorRef.current(event.state);
      
      if (!isEqual(newSelectedState, selectedStateRef.current)) {
        setSelectedState(newSelectedState);
      }
    };
    
    // Subscribe to store changes
    const subscription = store.subscribe(checkForUpdates);
    
    // Check initial state
    const currentSelected = selector(store.getState());
    if (!isEqual(currentSelected, selectedState)) {
      setSelectedState(currentSelected);
    }
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [store, isEqual, selectedState, selector]);
  
  return selectedState;
}

/**
 * Hook to create store actions
 * Returns memoized action functions
 */
export function useStoreActions<T extends object, A extends Record<string, (...args: any[]) => void>>(
  store: Store<T>,
  actionsCreator: (store: Store<T>) => A
): A {
  const actionsRef = useRef<A>();
  
  if (!actionsRef.current) {
    actionsRef.current = actionsCreator(store);
  }
  
  return actionsRef.current;
}

/**
 * Hook to use store with actions
 * Combines state and actions in one hook
 */
export function useStoreWithActions<
  T extends object,
  A extends Record<string, (...args: any[]) => void>
>(
  store: Store<T>,
  actionsCreator: (store: Store<T>) => A
): [T, A] {
  const state = useStore(store);
  const actions = useStoreActions(store, actionsCreator);
  
  return [state, actions];
}

/**
 * Hook for async store operations
 * Handles loading, error, and data states
 */
export function useAsyncStore<T extends object, R>(
  store: Store<T>,
  asyncOperation: () => Promise<R>,
  dependencies: any[] = []
): {
  data: R | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncOperation();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, dependencies);
  
  useEffect(() => {
    execute().catch(console.error);
  }, [execute]);
  
  return {
    data,
    loading,
    error,
    refetch: execute
  };
}

/**
 * Hook for store persistence
 * Syncs store state with localStorage
 */
export function useStorePersistence<T extends object>(
  store: Store<T>,
  key: string,
  options?: {
    debounce?: number;
    serialize?: (state: T) => string;
    deserialize?: (data: string) => T;
  }
): void {
  const {
    debounce = 500,
    serialize = JSON.stringify,
    deserialize = JSON.parse
  } = options || {};
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Load initial state from storage
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const state = deserialize(stored);
        // Note: Would need a way to set initial state in store
      }
    } catch (error) {
      console.error('Failed to load persisted state', error);
    }
    
    // Subscribe to changes and persist
    const subscription = store.subscribe((event: IStoreChangeEvent<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(key, serialize(event.state));
        } catch (error) {
          console.error('Failed to persist state', error);
        }
      }, debounce);
    });
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [store, key, debounce, serialize, deserialize]);
}

/**
 * Hook for computed values from store
 * Memoizes computed values and only recalculates when dependencies change
 */
export function useStoreComputed<T extends object, R>(
  store: Store<T>,
  computeFn: (state: T) => R,
  dependencies: ((state: T) => any)[] = []
): R {
  const getDependencyValues = useCallback((state: T) => {
    return dependencies.map(dep => dep(state));
  }, [dependencies]);
  
  const [computed, setComputed] = useState<R>(() => computeFn(store.getState()));
  const [depValues, setDepValues] = useState(() => getDependencyValues(store.getState()));
  
  useEffect(() => {
    const subscription = store.subscribe((event: IStoreChangeEvent<T>) => {
      const newDepValues = getDependencyValues(event.state);
      
      // Check if dependencies changed
      const changed = newDepValues.some((val, i) => val !== depValues[i]);
      
      if (changed) {
        setDepValues(newDepValues);
        setComputed(computeFn(event.state));
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [store, computeFn, getDependencyValues, depValues]);
  
  return computed;
}