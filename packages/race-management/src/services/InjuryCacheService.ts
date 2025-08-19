/**
 * Specialized cache service for injury data
 * Caches injury summaries and greyhound lookups to reduce API calls
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class InjuryCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL = 10 * 60 * 1000; // 10 minutes
  private readonly maxCacheSize = 500; // Maximum number of entries

  /**
   * Get cached data or return null if not found/expired
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set cache entry with optional TTL
   */
  public set<T>(key: string, data: T, ttl?: number): void {
    // Implement LRU eviction if cache is too large
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl || this.defaultTTL)
    });
  }

  /**
   * Get or fetch data with caching
   */
  public async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    try {
      const data = await fetchFn();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Failed to fetch data for cache key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Clear specific cache entries by pattern
   */
  public clearPattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Find oldest cache entry for LRU eviction
   */
  private findOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    });
    
    return oldestKey;
  }

  /**
   * Create cache key for injury summary
   */
  public createInjurySummaryKey(trackName: string, meetingDate: string | Date): string {
    const date = new Date(meetingDate);
    const dateStr = date.toISOString().split('T')[0];
    return `injury_summary_${trackName}_${dateStr}`;
  }

  /**
   * Create cache key for greyhound lookup
   */
  public createGreyhoundKey(greyhoundName: string, earBrand?: string): string {
    return `greyhound_${greyhoundName}_${earBrand || 'no_brand'}`;
  }

  /**
   * Create cache key for health check
   */
  public createHealthCheckKey(greyhoundId: string): string {
    return `health_check_${greyhoundId}`;
  }
}

// Export singleton instance
export const injuryCacheService = new InjuryCacheService();

export default InjuryCacheService;