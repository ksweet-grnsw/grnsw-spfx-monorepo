/**
 * Offline support and data caching service
 * Implements Progressive Web App patterns for SharePoint
 */

interface CacheConfig {
  name: string;
  version: number;
  maxAge: number; // milliseconds
  maxSize?: number; // bytes
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  etag?: string;
  size: number;
}

export class OfflineService {
  private dbName = 'grnsw-race-management';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;
  private syncQueue: Array<() => Promise<void>> = [];
  private cacheConfigs: Map<string, CacheConfig> = new Map();

  constructor() {
    this.initializeDB();
    this.setupEventListeners();
    this.registerDefaultCaches();
  }

  /**
   * Initialize IndexedDB for offline storage
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          cacheStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Register default cache configurations
   */
  private registerDefaultCaches(): void {
    // Meetings cache - refresh every 5 minutes
    this.registerCache({
      name: 'meetings',
      version: 1,
      maxAge: 5 * 60 * 1000,
      strategy: 'stale-while-revalidate'
    });

    // Races cache - refresh every 10 minutes
    this.registerCache({
      name: 'races',
      version: 1,
      maxAge: 10 * 60 * 1000,
      strategy: 'cache-first'
    });

    // Contestants cache - refresh every 15 minutes
    this.registerCache({
      name: 'contestants',
      version: 1,
      maxAge: 15 * 60 * 1000,
      strategy: 'cache-first'
    });

    // Static data cache - refresh daily
    this.registerCache({
      name: 'static',
      version: 1,
      maxAge: 24 * 60 * 60 * 1000,
      strategy: 'cache-first'
    });
  }

  /**
   * Register a cache configuration
   */
  public registerCache(config: CacheConfig): void {
    this.cacheConfigs.set(config.name, config);
  }

  /**
   * Setup online/offline event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Get data with caching strategy
   */
  public async getData<T>(
    key: string,
    fetcher: () => Promise<T>,
    cacheName: string = 'default'
  ): Promise<T> {
    const config = this.cacheConfigs.get(cacheName) || {
      name: cacheName,
      version: 1,
      maxAge: 5 * 60 * 1000,
      strategy: 'network-first' as const
    };

    switch (config.strategy) {
      case 'cache-first':
        return this.cacheFirst(key, fetcher, config);
      case 'network-first':
        return this.networkFirst(key, fetcher, config);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidate(key, fetcher, config);
      default:
        return this.networkFirst(key, fetcher, config);
    }
  }

  /**
   * Cache-first strategy
   */
  private async cacheFirst<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    // Try cache first
    const cached = await this.getFromCache<T>(key);
    
    if (cached && !this.isExpired(cached, config.maxAge)) {
      return cached.data;
    }

    // If online, fetch fresh data
    if (this.isOnline) {
      try {
        const freshData = await fetcher();
        await this.saveToCache(key, freshData, config.name);
        return freshData;
      } catch (error) {
        // If fetch fails but we have cached data, use it
        if (cached) {
          console.warn('Using stale cache due to fetch error:', error);
          return cached.data;
        }
        throw error;
      }
    }

    // If offline and have cached data (even if expired), use it
    if (cached) {
      console.warn('Using expired cache in offline mode');
      return cached.data;
    }

    throw new Error('No cached data available and offline');
  }

  /**
   * Network-first strategy
   */
  private async networkFirst<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    if (this.isOnline) {
      try {
        const freshData = await fetcher();
        await this.saveToCache(key, freshData, config.name);
        return freshData;
      } catch (error) {
        console.error('Network fetch failed:', error);
        // Fall back to cache
        const cached = await this.getFromCache<T>(key);
        if (cached) {
          console.warn('Using cached data due to network error');
          return cached.data;
        }
        throw error;
      }
    }

    // Offline - use cache
    const cached = await this.getFromCache<T>(key);
    if (cached) {
      return cached.data;
    }

    throw new Error('Offline and no cached data available');
  }

  /**
   * Stale-while-revalidate strategy
   */
  private async staleWhileRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    const cached = await this.getFromCache<T>(key);

    // Return cached data immediately if available
    if (cached && !this.isExpired(cached, config.maxAge)) {
      // Revalidate in background if online
      if (this.isOnline) {
        fetcher()
          .then(freshData => this.saveToCache(key, freshData, config.name))
          .catch(error => console.error('Background revalidation failed:', error));
      }
      return cached.data;
    }

    // No valid cache or expired - fetch fresh
    if (this.isOnline) {
      try {
        const freshData = await fetcher();
        await this.saveToCache(key, freshData, config.name);
        return freshData;
      } catch (error) {
        if (cached) {
          console.warn('Using stale cache due to fetch error:', error);
          return cached.data;
        }
        throw error;
      }
    }

    // Offline with expired cache
    if (cached) {
      console.warn('Using expired cache in offline mode');
      return cached.data;
    }

    throw new Error('No data available');
  }

  /**
   * Get data from cache
   */
  private async getFromCache<T>(key: string): Promise<CachedData<T> | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Save data to cache
   */
  private async saveToCache<T>(
    key: string,
    data: T,
    category: string
  ): Promise<void> {
    if (!this.db) return;

    const size = new Blob([JSON.stringify(data)]).size;
    const cachedData: CachedData<T> & { key: string; category: string } = {
      key,
      data,
      timestamp: Date.now(),
      size,
      category
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(cachedData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if cached data is expired
   */
  private isExpired(cached: CachedData<any>, maxAge: number): boolean {
    return Date.now() - cached.timestamp > maxAge;
  }

  /**
   * Queue operation for sync when online
   */
  public async queueForSync(
    operation: () => Promise<void>,
    metadata?: any
  ): Promise<void> {
    if (this.isOnline) {
      // Execute immediately if online
      return operation();
    }

    // Store in sync queue
    if (!this.db) {
      this.syncQueue.push(operation);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.add({
        operation: operation.toString(),
        metadata,
        timestamp: Date.now()
      });

      request.onsuccess = () => {
        this.syncQueue.push(operation);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Process sync queue when online
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const operations = [...this.syncQueue];
    this.syncQueue = [];

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('Sync operation failed:', error);
        // Re-queue failed operations
        this.syncQueue.push(operation);
      }
    }

    // Clear processed operations from IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      store.clear();
    }
  }

  /**
   * Clear all cached data
   */
  public async clearCache(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(): Promise<{
    totalSize: number;
    itemCount: number;
    oldestItem: number;
    categories: Record<string, number>;
  }> {
    if (!this.db) {
      return {
        totalSize: 0,
        itemCount: 0,
        oldestItem: 0,
        categories: {}
      };
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as Array<CachedData<any> & { category: string }>;
        
        const stats = {
          totalSize: items.reduce((sum, item) => sum + item.size, 0),
          itemCount: items.length,
          oldestItem: items.length > 0 
            ? Math.min(...items.map(item => item.timestamp))
            : 0,
          categories: items.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        };

        resolve(stats);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if online
   */
  public get online(): boolean {
    return this.isOnline;
  }
}

// Singleton instance
export const offlineService = new OfflineService();