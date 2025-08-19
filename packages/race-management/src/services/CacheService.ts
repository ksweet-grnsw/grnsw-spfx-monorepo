/**
 * Cache Service for improving performance with intelligent data caching
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  etag?: string;
  hits?: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  storage?: 'memory' | 'session' | 'local';
  maxSize?: number; // Max number of entries
  staleWhileRevalidate?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

export class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    oldestEntry: null,
    newestEntry: null
  };
  
  // Default TTL values for different data types (in milliseconds)
  private readonly DEFAULT_TTL = {
    meetings: 5 * 60 * 1000,        // 5 minutes
    races: 5 * 60 * 1000,           // 5 minutes
    contestants: 5 * 60 * 1000,     // 5 minutes
    search: 10 * 60 * 1000,         // 10 minutes
    greyhound: 30 * 60 * 1000,      // 30 minutes
    healthCheck: 15 * 60 * 1000,    // 15 minutes
    default: 5 * 60 * 1000          // 5 minutes
  };
  
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of entries
  private readonly STORAGE_PREFIX = 'grnsw_cache_';
  private readonly MAX_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB max per storage type
  private readonly MIN_FREE_STORAGE = 500 * 1024; // Keep 500KB free
  
  private constructor() {
    // Try to initialize cache from session storage, but don't fail if it errors
    try {
      this.loadFromStorage();
    } catch (error) {
      console.warn('Could not load from storage, starting with empty cache:', error);
    }
    
    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }
  
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }
  
  /**
   * Get data from cache
   */
  public get<T>(key: string, options?: CacheOptions): T | null {
    const cacheKey = this.generateKey(key);
    const storage = options?.storage || 'memory';
    
    let entry: CacheEntry<T> | null = null;
    
    if (storage === 'memory') {
      entry = this.memoryCache.get(cacheKey) || null;
    } else {
      entry = this.getFromStorage<T>(cacheKey, storage);
    }
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (this.isExpired(entry) && !options?.staleWhileRevalidate) {
      this.remove(key, options);
      this.stats.misses++;
      return null;
    }
    
    // Update hit count
    entry.hits = (entry.hits || 0) + 1;
    this.stats.hits++;
    
    // Update entry in storage with new hit count
    if (storage === 'memory') {
      this.memoryCache.set(cacheKey, entry);
    } else {
      this.setToStorage(cacheKey, entry, storage);
    }
    
    return entry.data;
  }
  
  /**
   * Set data in cache
   */
  public set<T>(
    key: string, 
    data: T, 
    options?: CacheOptions
  ): void {
    const cacheKey = this.generateKey(key);
    const storage = options?.storage || 'memory';
    const ttl = options?.ttl || this.getDefaultTTL(key);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      hits: 0
    };
    
    // Enforce max size for memory cache
    if (storage === 'memory') {
      if (this.memoryCache.size >= (options?.maxSize || this.MAX_CACHE_SIZE)) {
        this.evictOldest();
      }
      this.memoryCache.set(cacheKey, entry);
    } else {
      this.setToStorage(cacheKey, entry, storage);
    }
    
    // Update stats
    this.stats.size = this.memoryCache.size;
    this.stats.newestEntry = entry.timestamp;
    if (!this.stats.oldestEntry || entry.timestamp < this.stats.oldestEntry) {
      this.stats.oldestEntry = entry.timestamp;
    }
  }
  
  /**
   * Remove specific entry from cache
   */
  public remove(key: string, options?: CacheOptions): void {
    const cacheKey = this.generateKey(key);
    const storage = options?.storage || 'memory';
    
    if (storage === 'memory') {
      this.memoryCache.delete(cacheKey);
    } else {
      this.removeFromStorage(cacheKey, storage);
    }
    
    this.stats.size = this.memoryCache.size;
  }
  
  /**
   * Clear all cache entries
   */
  public clear(storage?: 'memory' | 'session' | 'local' | 'all'): void {
    if (!storage || storage === 'all' || storage === 'memory') {
      this.memoryCache.clear();
    }
    
    if (!storage || storage === 'all' || storage === 'session') {
      this.clearStorage('session');
    }
    
    if (!storage || storage === 'all' || storage === 'local') {
      this.clearStorage('local');
    }
    
    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      oldestEntry: null,
      newestEntry: null
    };
  }
  
  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Get cache size
   */
  public getSize(storage?: 'memory' | 'session' | 'local'): number {
    if (!storage || storage === 'memory') {
      return this.memoryCache.size;
    }
    
    const storageObj = storage === 'session' ? sessionStorage : localStorage;
    let count = 0;
    
    for (let i = 0; i < storageObj.length; i++) {
      const key = storageObj.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Invalidate cache entries matching a pattern
   */
  public invalidate(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern.replace(/\*/g, '.*'))
      : pattern;
    
    // Invalidate memory cache
    const keysToDelete: string[] = [];
    this.memoryCache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.memoryCache.delete(key));
    
    // Invalidate storage caches
    this.invalidateStorage(regex, 'session');
    this.invalidateStorage(regex, 'local');
    
    this.stats.size = this.memoryCache.size;
  }
  
  /**
   * Pre-warm cache with data
   */
  public async warm<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    try {
      const data = await fetcher();
      this.set(key, data, options);
      return data;
    } catch (error) {
      console.error(`Failed to warm cache for ${key}:`, error);
      throw error;
    }
  }
  
  /**
   * Get or fetch data with caching
   */
  public async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key, options);
    
    if (cached !== null) {
      // If stale while revalidate, fetch in background
      if (options?.staleWhileRevalidate && this.isStale(key, options)) {
        this.warm(key, fetcher, options).catch(console.error);
      }
      return cached;
    }
    
    // Fetch fresh data
    const data = await fetcher();
    this.set(key, data, options);
    return data;
  }
  
  // Private helper methods
  
  private generateKey(key: string): string {
    return `${this.STORAGE_PREFIX}${key}`;
  }
  
  private getDefaultTTL(key: string): number {
    for (const [pattern, ttl] of Object.entries(this.DEFAULT_TTL)) {
      if (key.toLowerCase().includes(pattern)) {
        return ttl;
      }
    }
    return this.DEFAULT_TTL.default;
  }
  
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }
  
  private isStale(key: string, options?: CacheOptions): boolean {
    const cacheKey = this.generateKey(key);
    const storage = options?.storage || 'memory';
    
    let entry: CacheEntry<any> | null = null;
    
    if (storage === 'memory') {
      entry = this.memoryCache.get(cacheKey) || null;
    } else {
      entry = this.getFromStorage(cacheKey, storage);
    }
    
    if (!entry) return true;
    
    // Consider stale if more than 50% of TTL has passed
    const ttl = options?.ttl || this.getDefaultTTL(key);
    const age = Date.now() - entry.timestamp;
    return age > ttl * 0.5;
  }
  
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    this.memoryCache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }
  
  private cleanup(): void {
    // Clean up expired entries from memory cache
    const keysToDelete: string[] = [];
    this.memoryCache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.memoryCache.delete(key));
    
    // Clean up storage caches
    this.cleanupStorage('session');
    this.cleanupStorage('local');
    
    this.stats.size = this.memoryCache.size;
  }
  
  private getFromStorage<T>(
    key: string, 
    storage: 'session' | 'local'
  ): CacheEntry<T> | null {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      const item = storageObj.getItem(key);
      
      if (!item) return null;
      
      return JSON.parse(item) as CacheEntry<T>;
    } catch (error) {
      console.error(`Failed to get from ${storage} storage:`, error);
      return null;
    }
  }
  
  private setToStorage<T>(
    key: string,
    entry: CacheEntry<T>,
    storage: 'session' | 'local'
  ): void {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      const serialized = JSON.stringify(entry);
      
      // Check size before storing
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        console.warn(`Cache entry too large (${(serialized.length / 1024 / 1024).toFixed(2)}MB), skipping storage for key:`, key);
        return;
      }
      
      // Check available space
      const currentSize = this.getStorageSize(storage);
      if (currentSize + serialized.length > this.MAX_STORAGE_SIZE) {
        this.aggressiveCleanup(storage, serialized.length);
      }
      
      // Try to set, but don't crash if it fails
      try {
        storageObj.setItem(key, serialized);
      } catch (e) {
        // Silently fail - memory cache will still work
      }
    } catch (error) {
      console.error(`Failed to set in ${storage} storage:`, error);
      // If storage is full, clear old entries
      if (error instanceof DOMException && (error.code === 22 || error.name === 'QuotaExceededError')) {
        this.aggressiveCleanup(storage);
        // Try again with reduced data
        try {
          const storageObj = storage === 'session' ? sessionStorage : localStorage;
          // Try to store a minimal version
          const minimalEntry = this.createMinimalEntry(entry);
          if (minimalEntry) {
            storageObj.setItem(key, JSON.stringify(minimalEntry));
          }
        } catch (retryError) {
          console.error('Failed to set even minimal data:', retryError);
          // Just skip caching to storage, memory cache will still work
        }
      }
    }
  }
  
  private removeFromStorage(key: string, storage: 'session' | 'local'): void {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      storageObj.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove from ${storage} storage:`, error);
    }
  }
  
  private clearStorage(storage: 'session' | 'local'): void {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < storageObj.length; i++) {
        const key = storageObj.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => storageObj.removeItem(key));
    } catch (error) {
      console.error(`Failed to clear ${storage} storage:`, error);
    }
  }
  
  private cleanupStorage(storage: 'session' | 'local'): void {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < storageObj.length; i++) {
        const key = storageObj.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const item = storageObj.getItem(key);
          if (item) {
            try {
              const entry = JSON.parse(item) as CacheEntry<any>;
              if (this.isExpired(entry)) {
                keysToRemove.push(key);
              }
            } catch {
              // Invalid entry, remove it
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => storageObj.removeItem(key));
    } catch (error) {
      console.error(`Failed to cleanup ${storage} storage:`, error);
    }
  }
  
  private invalidateStorage(pattern: RegExp, storage: 'session' | 'local'): void {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < storageObj.length; i++) {
        const key = storageObj.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX) && pattern.test(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => storageObj.removeItem(key));
    } catch (error) {
      console.error(`Failed to invalidate ${storage} storage:`, error);
    }
  }
  
  private getStorageSize(storage: 'session' | 'local'): number {
    const storageObj = storage === 'session' ? sessionStorage : localStorage;
    let totalSize = 0;
    
    for (let i = 0; i < storageObj.length; i++) {
      const key = storageObj.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        const item = storageObj.getItem(key);
        if (item) {
          totalSize += key.length + item.length;
        }
      }
    }
    
    return totalSize;
  }
  
  private aggressiveCleanup(storage: 'session' | 'local', requiredSpace: number = 0): void {
    try {
      const storageObj = storage === 'session' ? sessionStorage : localStorage;
      const entries: Array<{ key: string; size: number; timestamp: number }> = [];
      
      // Collect all cache entries with their metadata
      for (let i = 0; i < storageObj.length; i++) {
        const key = storageObj.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const item = storageObj.getItem(key);
          if (item) {
            try {
              const entry = JSON.parse(item) as CacheEntry<any>;
              entries.push({
                key,
                size: key.length + item.length,
                timestamp: entry.timestamp || 0
              });
            } catch {
              // Invalid entry, mark for removal
              storageObj.removeItem(key);
            }
          }
        }
      }
      
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest entries until we have enough space
      let freedSpace = 0;
      const targetSpace = requiredSpace + this.MIN_FREE_STORAGE;
      
      for (const entry of entries) {
        if (freedSpace >= targetSpace) break;
        
        storageObj.removeItem(entry.key);
        freedSpace += entry.size;
      }
    } catch (error) {
      console.error(`Failed to perform aggressive cleanup on ${storage} storage:`, error);
      // As last resort, clear all cache entries
      this.clearStorage(storage);
    }
  }
  
  private createMinimalEntry<T>(entry: CacheEntry<T>): CacheEntry<any> | null {
    try {
      // For large data, try to store only essential metadata
      const data = entry.data;
      
      if (Array.isArray(data) && data.length > 10) {
        // For large arrays, store only first 10 items as preview
        return {
          ...entry,
          data: data.slice(0, 10),
          truncated: true
        } as any;
      }
      
      if (typeof data === 'object' && data !== null) {
        // For large objects, try to minimize
        const stringified = JSON.stringify(data);
        if (stringified.length > 50000) {
          // Too large, skip storage
          return null;
        }
      }
      
      return entry;
    } catch {
      return null;
    }
  }
  
  private loadFromStorage(): void {
    // Skip loading from session storage if we're having quota issues
    // Just use memory cache instead
    try {
      // First check if we can even access sessionStorage
      const testKey = '__test_storage_access__';
      try {
        sessionStorage.setItem(testKey, '1');
        sessionStorage.removeItem(testKey);
      } catch (e) {
        // Can't write to storage, probably quota exceeded
        return;
      }
      
      // Load existing entries from session storage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const item = sessionStorage.getItem(key);
          if (item) {
            try {
              const entry = JSON.parse(item) as CacheEntry<any>;
              if (!this.isExpired(entry)) {
                // Load into memory cache for faster access
                this.memoryCache.set(key, entry);
              }
            } catch {
              // Invalid entry, skip it
            }
          }
        }
      }
      
      this.stats.size = this.memoryCache.size;
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();