/**
 * Cache entry with metadata
 */
export interface ICacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
  key: string;
  /** Tags for bulk invalidation */
  tags?: string[];
}

/**
 * Cache configuration options
 */
export interface ICacheConfig {
  defaultTTL: number; // Default time-to-live in milliseconds
  maxSize: number; // Maximum number of cache entries
  enableLocalStorage: boolean; // Persist cache to localStorage
  storagePrefix: string; // Prefix for localStorage keys
  cleanupInterval: number; // Interval for cleanup in milliseconds
}

/**
 * Cache statistics
 */
export interface ICacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

/**
 * Advanced Cache Service for Dataverse API responses with multiple storage strategies
 * Provides in-memory and localStorage caching with TTL, LRU eviction, request deduplication,
 * and tag-based invalidation to optimize performance and reduce API calls
 * 
 * @example
 * ```typescript
 * const cacheService = new CacheService('injuries');
 * 
 * // Cache with tags for bulk invalidation
 * cacheService.set('recent-injuries', data, 10*60*1000, ['injuries', 'dashboard']);
 * 
 * // Get or fetch with request deduplication  
 * const data = await cacheService.getOrSet(
 *   'injury-stats',
 *   () => injuryService.getStats(),
 *   15*60*1000
 * );
 * 
 * // Invalidate all injury-related cache
 * cacheService.invalidateByTag('injuries');
 * ```
 */
export class CacheService {
  private cache: Map<string, ICacheEntry<any>> = new Map();
  private stats: ICacheStats = { hits: 0, misses: 0, size: 0, evictions: 0 };
  private cleanupTimer: number | null = null;
  /** Track pending requests to prevent duplicate API calls */
  private pendingRequests = new Map<string, Promise<any>>();
  
  private readonly DEFAULT_CONFIG: ICacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    enableLocalStorage: true,
    storagePrefix: 'grnsw_cache_',
    cleanupInterval: 60 * 1000 // 1 minute
  };
  
  private config: ICacheConfig;

  constructor(namespace: string = 'default', config?: Partial<ICacheConfig>) {
    this.config = { 
      ...this.DEFAULT_CONFIG, 
      ...config,
      storagePrefix: `${config?.storagePrefix || this.DEFAULT_CONFIG.storagePrefix}${namespace}_`
    };
    
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  /**
   * Get item from cache
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update hit count and stats
    entry.hits++;
    this.stats.hits++;
    
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data as T;
  }

  /**
   * Set item in cache with optional tags for bulk invalidation
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds
   * @param tags - Tags for bulk invalidation
   */
  public set<T>(key: string, data: T, ttl?: number, tags?: string[]): void {
    const expiresAt = Date.now() + (ttl || this.config.defaultTTL);
    
    const entry: ICacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt,
      hits: 0,
      key,
      tags
    };
    
    // Check if we need to evict
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
    
    // Save to localStorage if enabled
    if (this.config.enableLocalStorage) {
      this.saveToStorage(key, entry);
    }
  }

  /**
   * Delete item from cache
   */
  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.stats.size = this.cache.size;
      
      if (this.config.enableLocalStorage) {
        this.removeFromStorage(key);
      }
    }
    
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    
    if (this.config.enableLocalStorage) {
      this.clearStorage();
    }
  }

  /**
   * Check if key exists in cache
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get or set with factory function - includes request deduplication
   * @param key - Cache key
   * @param factory - Function to execute on cache miss
   * @param ttl - Time to live in milliseconds
   * @param tags - Tags for bulk invalidation
   * @returns Promise resolving to cached or fresh data
   */
  public async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
    tags?: string[]
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    // Check if request is already in progress (deduplication)
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Execute function and cache result
    const promise = factory().then(data => {
      this.set(key, data, ttl, tags);
      this.pendingRequests.delete(key);
      return data;
    }).catch(error => {
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Get cache statistics
   */
  public getStats(): ICacheStats {
    return { ...this.stats };
  }

  /**
   * Get all cache keys
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    const firstKey = this.cache.keys().next().value;
    
    if (firstKey) {
      this.cache.delete(firstKey);
      this.stats.evictions++;
      
      if (this.config.enableLocalStorage) {
        this.removeFromStorage(firstKey);
      }
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  public dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Save entry to localStorage
   */
  private saveToStorage(key: string, entry: ICacheEntry<any>): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      const storageKey = this.config.storagePrefix + key;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      // Silently fail if storage is full
      console.warn('Failed to save cache entry to storage:', error);
    }
  }

  /**
   * Remove entry from localStorage
   */
  private removeFromStorage(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      const storageKey = this.config.storagePrefix + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove cache entry from storage:', error);
    }
  }

  /**
   * Clear all storage entries for this namespace
   */
  private clearStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.storagePrefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache storage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (!this.config.enableLocalStorage) {
      return;
    }
    
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      const now = Date.now();
      
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        
        if (storageKey && storageKey.startsWith(this.config.storagePrefix)) {
          const key = storageKey.replace(this.config.storagePrefix, '');
          const stored = localStorage.getItem(storageKey);
          
          if (stored) {
            const entry: ICacheEntry<any> = JSON.parse(stored);
            
            // Only load if not expired
            if (entry.expiresAt > now) {
              this.cache.set(key, entry);
            } else {
              localStorage.removeItem(storageKey);
            }
          }
        }
      }
      
      this.stats.size = this.cache.size;
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Create a cache key from multiple parts
   */
  public static createKey(...parts: any[]): string {
    return parts.map(p => String(p)).join(':');
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  public invalidatePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
    
    return keysToDelete.length;
  }

  /**
   * Invalidate all cache entries with the specified tag
   * @param tag - Tag to invalidate
   * @returns Number of entries invalidated
   * 
   * @example
   * ```typescript
   * // Invalidate all injury-related cache entries
   * const invalidated = cache.invalidateByTag('injuries');
   * console.log(`Invalidated ${invalidated} entries`);
   * ```
   */
  public invalidateByTag(tag: string): number {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.tags && entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
    
    return keysToDelete.length;
  }

  /**
   * Get all entries with a specific tag
   * @param tag - Tag to search for
   * @returns Array of cache entries with the tag
   */
  public getByTag<T>(tag: string): Array<{key: string, data: T}> {
    const results: Array<{key: string, data: T}> = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.tags && entry.tags.includes(tag) && !this.isExpired(entry)) {
        results.push({ key, data: entry.data });
      }
    });
    
    return results;
  }

  /**
   * Check if entry is expired
   * @private
   */
  private isExpired(entry: ICacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }
}