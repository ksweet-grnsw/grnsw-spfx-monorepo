/**
 * Base Store class for complex state management
 * Implements Observable pattern with TypeScript
 */

import { EventEmitter } from 'events';

/**
 * Store state change event
 */
export interface IStoreChangeEvent<T> {
  state: T;
  previousState: T;
  changedKeys: string[];
  timestamp: number;
}

/**
 * Store subscription
 */
export interface IStoreSubscription {
  unsubscribe: () => void;
}

/**
 * Store options
 */
export interface IStoreOptions<T> {
  /** Initial state */
  initialState: T;
  
  /** Enable dev tools integration */
  devTools?: boolean;
  
  /** Store name for debugging */
  name?: string;
  
  /** Persist state to localStorage */
  persist?: boolean;
  
  /** Storage key for persistence */
  storageKey?: string;
  
  /** State validator */
  validator?: (state: T) => boolean;
  
  /** Middleware functions */
  middleware?: Array<(state: T, action: any) => T>;
}

/**
 * Abstract base Store class
 * Provides state management with subscriptions
 */
export abstract class Store<T extends object> extends EventEmitter {
  protected state: T;
  protected previousState: T;
  private readonly options: IStoreOptions<T>;
  private readonly subscribers: Set<(event: IStoreChangeEvent<T>) => void>;
  private readonly storageKey: string;
  private isUpdating: boolean = false;

  constructor(options: IStoreOptions<T>) {
    super();
    this.options = options;
    this.storageKey = options.storageKey || `store_${options.name || 'default'}`;
    this.subscribers = new Set();
    
    // Load persisted state if enabled
    if (options.persist) {
      const persisted = this.loadPersistedState();
      this.state = persisted || options.initialState;
    } else {
      this.state = options.initialState;
    }
    
    this.previousState = { ...this.state };
    
    // Setup dev tools
    if (options.devTools && typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      this.setupDevTools();
    }
  }

  /**
   * Get current state
   */
  public getState(): Readonly<T> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Get specific state property
   */
  public get<K extends keyof T>(key: K): T[K] {
    return this.state[key];
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(callback: (event: IStoreChangeEvent<T>) => void): IStoreSubscription {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return {
      unsubscribe: () => {
        this.subscribers.delete(callback);
      }
    };
  }

  /**
   * Update state
   */
  protected setState(updater: Partial<T> | ((state: T) => Partial<T>)): void {
    if (this.isUpdating) {
      console.warn('Nested setState detected. This may cause unexpected behavior.');
      return;
    }

    this.isUpdating = true;
    this.previousState = { ...this.state };
    
    try {
      // Calculate new state
      const updates = typeof updater === 'function' ? updater(this.state) : updater;
      const newState = { ...this.state, ...updates };
      
      // Validate if validator provided
      if (this.options.validator && !this.options.validator(newState)) {
        console.error('State validation failed', newState);
        return;
      }
      
      // Apply middleware
      let processedState = newState;
      if (this.options.middleware) {
        for (const middleware of this.options.middleware) {
          processedState = middleware(processedState, updates);
        }
      }
      
      // Update state
      this.state = processedState;
      
      // Persist if enabled
      if (this.options.persist) {
        this.persistState();
      }
      
      // Notify subscribers
      const changedKeys = Object.keys(updates);
      const event: IStoreChangeEvent<T> = {
        state: this.state,
        previousState: this.previousState,
        changedKeys,
        timestamp: Date.now()
      };
      
      this.notifySubscribers(event);
      
      // Emit event
      this.emit('change', event);
      
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Reset state to initial
   */
  public reset(): void {
    this.setState(this.options.initialState);
    if (this.options.persist) {
      this.clearPersistedState();
    }
  }

  /**
   * Load state from localStorage
   */
  private loadPersistedState(): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load persisted state', error);
    }
    
    return null;
  }

  /**
   * Save state to localStorage
   */
  private persistState(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to persist state', error);
    }
  }

  /**
   * Clear persisted state
   */
  private clearPersistedState(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear persisted state', error);
    }
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(event: IStoreChangeEvent<T>): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Subscriber callback error', error);
      }
    });
  }

  /**
   * Setup Redux DevTools integration
   */
  private setupDevTools(): void {
    const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    if (devTools) {
      const devToolsInstance = devTools.connect({
        name: this.options.name || 'Store'
      });
      
      // Send initial state
      devToolsInstance.init(this.state);
      
      // Subscribe to state changes
      this.on('change', (event: IStoreChangeEvent<T>) => {
        devToolsInstance.send('STATE_CHANGE', event.state);
      });
    }
  }

  /**
   * Destroy store and cleanup
   */
  public destroy(): void {
    this.subscribers.clear();
    this.removeAllListeners();
    if (this.options.persist) {
      this.persistState();
    }
  }
}

/**
 * Create a simple store without extending
 */
export function createStore<T extends object>(
  initialState: T,
  options?: Partial<IStoreOptions<T>>
): Store<T> & {
  update: (updater: Partial<T> | ((state: T) => Partial<T>)) => void;
} {
  class SimpleStore extends Store<T> {
    public update(updater: Partial<T> | ((state: T) => Partial<T>)): void {
      this.setState(updater);
    }
  }
  
  return new SimpleStore({
    initialState,
    ...options
  });
}