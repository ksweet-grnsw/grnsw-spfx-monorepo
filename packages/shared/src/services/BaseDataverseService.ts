import { WebPartContext } from '@microsoft/sp-webpart-base';
import { AuthService } from './AuthService';
import { CacheService } from './CacheService';

/**
 * Configuration interface for Dataverse environment settings
 */
export interface IDataverseConfig {
  /** Dataverse environment URL (e.g., https://org12345.crm6.dynamics.com) */
  environment: string;
  /** OData API version (e.g., v9.1) */
  apiVersion: string;
  /** Enable caching for this service (default: true) */
  enableCache?: boolean;
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTTL?: number;
}

/**
 * Query options interface for OData requests to Dataverse
 */
export interface IDataverseQueryOptions {
  /** Fields to select ($select) */
  select?: string[];
  /** OData filter expression ($filter) */
  filter?: string;
  /** Order by expression ($orderby) */
  orderBy?: string;
  /** Maximum number of records ($top) */
  top?: number;
  /** Related entities to expand ($expand) */
  expand?: string[];
  /** Skip cache for this request */
  skipCache?: boolean;
  /** Cache TTL override for this request */
  cacheTTL?: number;
  /** Tags for cache invalidation */
  cacheTags?: string[];
}

/**
 * Abstract base class for Dataverse service implementations
 * Provides common functionality for authentication, query building, and HTTP operations
 * 
 * @template T - The type of entity this service handles
 * 
 * @example
 * ```typescript
 * class InjuryDataService extends BaseDataverseService<IInjuryRecord> {
 *   protected tableName = 'cra5e_injurydatas';
 *   
 *   async getRecentInjuries(): Promise<IInjuryRecord[]> {
 *     return this.getAll({ filter: 'cra5e_racedate ge 2024-01-01' });
 *   }
 * }
 * ```
 */
export abstract class BaseDataverseService<T> {
  protected authService: AuthService;
  protected config: IDataverseConfig;
  protected cacheService: CacheService;
  /** The logical name of the Dataverse table (must be implemented by subclasses) */
  protected abstract tableName: string;

  /**
   * Creates a new BaseDataverseService instance
   * @param context - SharePoint WebPart context for authentication
   * @param config - Dataverse environment configuration
   */
  constructor(context: WebPartContext, config: IDataverseConfig) {
    this.authService = new AuthService(context);
    this.config = {
      enableCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes default
      ...config
    };
    
    // Create cache service with table-specific namespace
    this.cacheService = new CacheService(`dataverse_${this.getTableNameSafe()}`, {
      defaultTTL: this.config.cacheTTL,
      enableLocalStorage: true
    });
  }

  /**
   * Gets a safe version of table name for cache namespace
   * @private
   */
  private getTableNameSafe(): string {
    // Use constructor name as fallback since tableName is abstract
    return this.tableName || this.constructor.name.toLowerCase();
  }

  /**
   * Builds OData query string from query options
   * @param options - Query options including select, filter, orderBy, top, expand
   * @returns Formatted query string with ? prefix, or empty string if no options
   * @protected
   * 
   * @example
   * ```typescript
   * const queryString = this.buildQueryString({
   *   select: ['cra5e_greyhoundname', 'cra5e_racedate'],
   *   filter: "cra5e_trackname eq 'Wentworth Park'",
   *   top: 10
   * });
   * // Returns: "?$select=cra5e_greyhoundname,cra5e_racedate&$filter=cra5e_trackname eq 'Wentworth Park'&$top=10"
   * ```
   */
  protected buildQueryString(options: IDataverseQueryOptions): string {
    const params: string[] = [];

    if (options.select && options.select.length > 0) {
      params.push(`$select=${options.select.join(',')}`);
    }

    if (options.filter) {
      params.push(`$filter=${options.filter}`);
    }

    if (options.orderBy) {
      params.push(`$orderby=${options.orderBy}`);
    }

    if (options.top) {
      params.push(`$top=${options.top}`);
    }

    if (options.expand && options.expand.length > 0) {
      params.push(`$expand=${options.expand.join(',')}`);
    }

    return params.length > 0 ? `?${params.join('&')}` : '';
  }

  /**
   * Retrieves all records from the table with optional query options
   * Uses intelligent caching with request deduplication for optimal performance
   * @param options - Query options for filtering, selecting fields, etc.
   * @returns Promise resolving to array of records
   * @throws {Error} When API request fails or authentication issues occur
   * 
   * @example
   * ```typescript
   * const recentRecords = await service.getAll({
   *   filter: 'createdon ge 2024-01-01',
   *   select: ['id', 'name', 'createdon'],
   *   top: 100,
   *   cacheTags: ['dashboard', 'recent-data']
   * });
   * ```
   */
  public async getAll(options: IDataverseQueryOptions = {}): Promise<T[]> {
    const queryString = this.buildQueryString(options);
    const cacheKey = `getAll_${this.tableName}${queryString}`;
    
    // Check if caching is enabled and not skipped for this request
    const enableCache = this.config.enableCache && !options.skipCache;
    
    if (!enableCache) {
      return this.fetchAllFromAPI(options);
    }

    // Use cache with request deduplication
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.fetchAllFromAPI(options),
      options.cacheTTL || this.config.cacheTTL,
      options.cacheTags || [this.tableName, 'dataverse']
    );
  }

  /**
   * Fetches data directly from API without caching
   * @private
   */
  private async fetchAllFromAPI(options: IDataverseQueryOptions): Promise<T[]> {
    try {
      const accessToken = await this.authService.authenticateToDataverse(this.config.environment);
      const headers = this.authService.getHeaders(accessToken);
      
      const queryString = this.buildQueryString(options);
      const url = `${this.config.environment}/api/data/${this.config.apiVersion}/${this.tableName}${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching data from ${this.tableName}: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.value as T[];
    } catch (error) {
      console.error(`Error in getAll for ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a single record by its unique identifier
   * @param id - The GUID of the record to retrieve
   * @param options - Query options for selecting fields, expanding relations, etc.
   * @returns Promise resolving to the requested record
   * @throws {Error} When record not found or API request fails
   * 
   * @example
   * ```typescript
   * const record = await service.getById('12345678-1234-1234-1234-123456789012', {
   *   select: ['id', 'name'],
   *   expand: ['relatedEntity']
   * });
   * ```
   */
  public async getById(id: string, options: IDataverseQueryOptions = {}): Promise<T> {
    try {
      const accessToken = await this.authService.authenticateToDataverse(this.config.environment);
      const headers = this.authService.getHeaders(accessToken);
      
      const queryString = this.buildQueryString(options);
      const url = `${this.config.environment}/api/data/${this.config.apiVersion}/${this.tableName}(${id})${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`Error fetching record ${id} from ${this.tableName}: ${response.statusText}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`Error in getById for ${this.tableName}:`, error);
      throw error;
    }
  }

  public async create(entity: Partial<T>): Promise<string> {
    try {
      const accessToken = await this.authService.authenticateToDataverse(this.config.environment);
      const headers = this.authService.getHeaders(accessToken);
      
      const url = `${this.config.environment}/api/data/${this.config.apiVersion}/${this.tableName}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(entity)
      });

      if (!response.ok) {
        throw new Error(`Error creating record in ${this.tableName}: ${response.statusText}`);
      }

      // Get the ID from the OData-EntityId header
      const entityIdHeader = response.headers.get('OData-EntityId');
      if (entityIdHeader) {
        const matches = entityIdHeader.match(/\(([^)]+)\)/);
        return matches ? matches[1] : '';
      }

      return '';
    } catch (error) {
      console.error(`Error in create for ${this.tableName}:`, error);
      throw error;
    }
  }

  public async update(id: string, entity: Partial<T>): Promise<void> {
    try {
      const accessToken = await this.authService.authenticateToDataverse(this.config.environment);
      const headers = this.authService.getHeaders(accessToken);
      
      const url = `${this.config.environment}/api/data/${this.config.apiVersion}/${this.tableName}(${id})`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(entity)
      });

      if (!response.ok) {
        throw new Error(`Error updating record ${id} in ${this.tableName}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error in update for ${this.tableName}:`, error);
      throw error;
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      const accessToken = await this.authService.authenticateToDataverse(this.config.environment);
      const headers = this.authService.getHeaders(accessToken);
      
      const url = `${this.config.environment}/api/data/${this.config.apiVersion}/${this.tableName}(${id})`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`Error deleting record ${id} from ${this.tableName}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error in delete for ${this.tableName}:`, error);
      throw error;
    }
  }

  public async executeAction(actionName: string, parameters: any = {}): Promise<any> {
    try {
      const accessToken = await this.authService.authenticateToDataverse(this.config.environment);
      const headers = this.authService.getHeaders(accessToken);
      
      const url = `${this.config.environment}/api/data/${this.config.apiVersion}/${actionName}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(parameters)
      });

      if (!response.ok) {
        throw new Error(`Error executing action ${actionName}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error(`Error in executeAction for ${actionName}:`, error);
      throw error;
    }
  }

  // ============================================
  // CACHE MANAGEMENT METHODS
  // ============================================

  /**
   * Invalidates all cache entries for this table
   * @returns Number of entries invalidated
   */
  public invalidateCache(): number {
    return this.cacheService.invalidateByTag(this.tableName);
  }

  /**
   * Invalidates cache entries by tag
   * @param tag - Tag to invalidate
   * @returns Number of entries invalidated
   * 
   * @example
   * ```typescript
   * // Invalidate all dashboard-related cache
   * service.invalidateCacheByTag('dashboard');
   * ```
   */
  public invalidateCacheByTag(tag: string): number {
    return this.cacheService.invalidateByTag(tag);
  }

  /**
   * Clears all cache entries for this service
   */
  public clearCache(): void {
    this.cacheService.clear();
  }

  /**
   * Gets cache statistics for this service
   * @returns Cache statistics
   */
  public getCacheStats() {
    return this.cacheService.getStats();
  }

  /**
   * Forces a cache refresh for a specific query
   * @param options - Query options to refresh
   * @returns Promise resolving to fresh data
   * 
   * @example
   * ```typescript
   * // Force refresh recent injuries data
   * const freshData = await service.refreshCache({ 
   *   filter: 'cra5e_racedate ge 2024-01-01',
   *   cacheTags: ['dashboard']
   * });
   * ```
   */
  public async refreshCache(options: IDataverseQueryOptions = {}): Promise<T[]> {
    const queryString = this.buildQueryString(options);
    const cacheKey = `getAll_${this.tableName}${queryString}`;
    
    // Remove from cache
    this.cacheService.delete(cacheKey);
    
    // Fetch fresh data and cache it
    return this.getAll(options);
  }

  /**
   * Preloads data into cache
   * @param options - Query options to preload
   * @returns Promise resolving when data is cached
   */
  public async preloadCache(options: IDataverseQueryOptions = {}): Promise<void> {
    await this.getAll(options);
  }
}