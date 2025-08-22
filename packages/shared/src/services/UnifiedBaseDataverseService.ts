import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IDataverseEnvironment, buildODataUrl } from '../config/environments';
import { UnifiedAuthService } from './UnifiedAuthService';
import { CacheService } from './CacheService';
import { ThrottleFactory, ThrottleService } from './ThrottleService';
import { UnifiedErrorHandler, ErrorType } from '../utils/UnifiedErrorHandler';
import { UnifiedLogger } from '../utils/UnifiedLogger';

/**
 * OData query options
 */
export interface IODataQuery {
  select?: string[];
  filter?: string;
  orderBy?: string;
  top?: number;
  skip?: number;
  expand?: string[];
  count?: boolean;
}

/**
 * Dataverse response with metadata
 */
export interface IDataverseResponse<T> {
  value: T[];
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  '@odata.context'?: string;
}

/**
 * Base service configuration
 */
export interface IBaseServiceConfig {
  enableCaching?: boolean;
  cacheTTL?: number;
  enableThrottling?: boolean;
  requestsPerSecond?: number;
  enableLogging?: boolean;
}

/**
 * Unified Base Dataverse Service
 * Provides common CRUD operations for all Dataverse entities
 */
export abstract class UnifiedBaseDataverseService<T> {
  protected auth: UnifiedAuthService;
  protected cache: CacheService;
  protected throttle: ThrottleService;
  protected logger: UnifiedLogger;
  protected abstract tableName: string;

  constructor(
    protected context: WebPartContext,
    protected environment: IDataverseEnvironment,
    protected config: IBaseServiceConfig = {}
  ) {
    // Initialize services
    this.auth = UnifiedAuthService.getInstance(context, environment);
    
    // Initialize cache if enabled
    this.cache = new CacheService(
      `${environment.name}_${this.getTableName()}`,
      {
        defaultTTL: config.cacheTTL || environment.cacheTimeout || 5 * 60 * 1000,
        enableLocalStorage: config.enableCaching !== false
      }
    );
    
    // Initialize throttle
    this.throttle = config.enableThrottling !== false
      ? ThrottleFactory.createDataverseThrottle(
          config.requestsPerSecond || environment.rateLimit || 100
        )
      : ThrottleFactory.createStrictThrottle(1000); // No throttling
    
    // Initialize logger
    this.logger = UnifiedLogger.getInstance({
      enableConsole: config.enableLogging !== false
    });
  }

  /**
   * Get table name (must be implemented by derived classes)
   */
  protected abstract getTableName(): string;

  /**
   * Get single entity by ID
   */
  public async getById(id: string, query?: IODataQuery): Promise<T | null> {
    const cacheKey = CacheService.createKey('getById', id, query);
    
    try {
      // Check cache first
      if (this.config.enableCaching !== false) {
        const cached = this.cache.get<T>(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for ${this.tableName}/${id}`, { id, query });
          return cached;
        }
      }
      
      // Build URL
      const baseUrl = buildODataUrl(this.environment, this.tableName);
      const url = this.buildEntityUrl(baseUrl, id, query);
      
      // Execute request with throttling
      const result = await this.throttle.execute(() => 
        this.auth.makeAuthenticatedRequest<T>(url)
      );
      
      // Cache result
      if (this.config.enableCaching !== false && result) {
        this.cache.set(cacheKey, result);
      }
      
      this.logger.info(`Retrieved ${this.tableName} entity`, { id });
      return result;
      
    } catch (error) {
      const structuredError = UnifiedErrorHandler.handleError(
        error,
        `${this.constructor.name}.getById`
      );
      
      if (structuredError.type === ErrorType.NOT_FOUND_ERROR) {
        return null;
      }
      
      throw new Error(structuredError.userMessage);
    }
  }

  /**
   * Get list of entities
   */
  public async getList(query?: IODataQuery): Promise<IDataverseResponse<T>> {
    const cacheKey = CacheService.createKey('getList', query);
    
    try {
      // Check cache first
      if (this.config.enableCaching !== false) {
        const cached = this.cache.get<IDataverseResponse<T>>(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for ${this.tableName} list`, { query });
          return cached;
        }
      }
      
      // Build URL with query
      const baseUrl = buildODataUrl(this.environment, this.tableName);
      const url = this.buildQueryUrl(baseUrl, query);
      
      // Execute request with throttling
      const result = await this.throttle.execute(() => 
        this.auth.makeAuthenticatedRequest<IDataverseResponse<T>>(url)
      );
      
      // Ensure result has value array
      const response = this.ensureResponseFormat(result);
      
      // Cache result
      if (this.config.enableCaching !== false) {
        this.cache.set(cacheKey, response);
      }
      
      this.logger.info(`Retrieved ${this.tableName} list`, { 
        count: response.value.length,
        hasMore: !!response['@odata.nextLink']
      });
      
      return response;
      
    } catch (error) {
      const structuredError = UnifiedErrorHandler.handleError(
        error,
        `${this.constructor.name}.getList`
      );
      throw new Error(structuredError.userMessage);
    }
  }

  /**
   * Get all entities (handles pagination)
   */
  public async getAll(query?: IODataQuery): Promise<T[]> {
    const allResults: T[] = [];
    let nextLink: string | undefined;
    let pageCount = 0;
    const maxPages = 100; // Safety limit
    
    try {
      // Initial request
      const baseUrl = buildODataUrl(this.environment, this.tableName);
      let url = this.buildQueryUrl(baseUrl, query);
      
      do {
        pageCount++;
        
        // Execute request
        const response = await this.throttle.execute(() => 
          this.auth.makeAuthenticatedRequest<IDataverseResponse<T>>(
            nextLink || url
          )
        );
        
        // Add results
        if (response.value && Array.isArray(response.value)) {
          allResults.push(...response.value);
        }
        
        // Check for next page
        nextLink = response['@odata.nextLink'];
        
        // Safety check
        if (pageCount >= maxPages) {
          this.logger.warn(`Reached maximum page limit for ${this.tableName}`, { 
            pageCount, 
            totalResults: allResults.length 
          });
          break;
        }
        
      } while (nextLink);
      
      this.logger.info(`Retrieved all ${this.tableName} entities`, { 
        totalCount: allResults.length,
        pages: pageCount 
      });
      
      return allResults;
      
    } catch (error) {
      const structuredError = UnifiedErrorHandler.handleError(
        error,
        `${this.constructor.name}.getAll`
      );
      throw new Error(structuredError.userMessage);
    }
  }

  /**
   * Create new entity
   */
  public async create(data: Partial<T>): Promise<T> {
    try {
      // Invalidate list cache
      this.cache.invalidatePattern(new RegExp(`^getList:`));
      
      // Build URL
      const url = buildODataUrl(this.environment, this.tableName);
      
      // Execute request with throttling
      const result = await this.throttle.execute(() => 
        this.auth.makeAuthenticatedRequest<T>(url, {
          method: 'POST',
          body: JSON.stringify(data)
        })
      );
      
      this.logger.info(`Created ${this.tableName} entity`, { id: (result as any).id });
      return result;
      
    } catch (error) {
      const structuredError = UnifiedErrorHandler.handleError(
        error,
        `${this.constructor.name}.create`
      );
      throw new Error(structuredError.userMessage);
    }
  }

  /**
   * Update existing entity
   */
  public async update(id: string, data: Partial<T>): Promise<T> {
    try {
      // Invalidate caches
      this.cache.delete(CacheService.createKey('getById', id));
      this.cache.invalidatePattern(new RegExp(`^getList:`));
      
      // Build URL
      const baseUrl = buildODataUrl(this.environment, this.tableName);
      const url = `${baseUrl}(${id})`;
      
      // Execute request with throttling
      const result = await this.throttle.execute(() => 
        this.auth.makeAuthenticatedRequest<T>(url, {
          method: 'PATCH',
          body: JSON.stringify(data)
        })
      );
      
      this.logger.info(`Updated ${this.tableName} entity`, { id });
      return result || data as T;
      
    } catch (error) {
      const structuredError = UnifiedErrorHandler.handleError(
        error,
        `${this.constructor.name}.update`
      );
      throw new Error(structuredError.userMessage);
    }
  }

  /**
   * Delete entity
   */
  public async delete(id: string): Promise<void> {
    try {
      // Invalidate caches
      this.cache.delete(CacheService.createKey('getById', id));
      this.cache.invalidatePattern(new RegExp(`^getList:`));
      
      // Build URL
      const baseUrl = buildODataUrl(this.environment, this.tableName);
      const url = `${baseUrl}(${id})`;
      
      // Execute request with throttling
      await this.throttle.execute(() => 
        this.auth.makeAuthenticatedRequest<void>(url, {
          method: 'DELETE'
        })
      );
      
      this.logger.info(`Deleted ${this.tableName} entity`, { id });
      
    } catch (error) {
      const structuredError = UnifiedErrorHandler.handleError(
        error,
        `${this.constructor.name}.delete`
      );
      throw new Error(structuredError.userMessage);
    }
  }

  /**
   * Execute custom action
   */
  public async executeAction<TResult>(
    actionName: string,
    parameters?: any
  ): Promise<TResult> {
    try {
      const url = `${this.environment.url}/api/data/${this.environment.apiVersion}/${actionName}`;
      
      const result = await this.throttle.execute(() => 
        this.auth.makeAuthenticatedRequest<TResult>(url, {
          method: 'POST',
          body: parameters ? JSON.stringify(parameters) : undefined
        })
      );
      
      this.logger.info(`Executed action ${actionName}`, { parameters });
      return result;
      
    } catch (error) {
      const structuredError = UnifiedErrorHandler.handleError(
        error,
        `${this.constructor.name}.executeAction`
      );
      throw new Error(structuredError.userMessage);
    }
  }

  /**
   * Clear all caches for this service
   */
  public clearCache(): void {
    this.cache.clear();
    this.logger.info(`Cleared cache for ${this.tableName}`);
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get throttle statistics
   */
  public getThrottleStats() {
    return this.throttle.getStats();
  }

  /**
   * Build entity URL with query options
   */
  protected buildEntityUrl(baseUrl: string, id: string, query?: IODataQuery): string {
    let url = `${baseUrl}(${id})`;
    
    if (query) {
      const params: string[] = [];
      
      if (query.select?.length) {
        params.push(`$select=${query.select.join(',')}`);
      }
      
      if (query.expand?.length) {
        params.push(`$expand=${query.expand.join(',')}`);
      }
      
      if (params.length) {
        url += `?${params.join('&')}`;
      }
    }
    
    return url;
  }

  /**
   * Build query URL with OData options
   */
  protected buildQueryUrl(baseUrl: string, query?: IODataQuery): string {
    if (!query) return baseUrl;
    
    const params: string[] = [];
    
    if (query.select?.length) {
      params.push(`$select=${query.select.join(',')}`);
    }
    
    if (query.filter) {
      params.push(`$filter=${encodeURIComponent(query.filter)}`);
    }
    
    if (query.orderBy) {
      params.push(`$orderby=${query.orderBy}`);
    }
    
    if (query.top) {
      params.push(`$top=${query.top}`);
    }
    
    if (query.skip) {
      params.push(`$skip=${query.skip}`);
    }
    
    if (query.expand?.length) {
      params.push(`$expand=${query.expand.join(',')}`);
    }
    
    if (query.count) {
      params.push('$count=true');
    }
    
    return params.length ? `${baseUrl}?${params.join('&')}` : baseUrl;
  }

  /**
   * Ensure response has proper format
   */
  protected ensureResponseFormat(data: any): IDataverseResponse<T> {
    if (data && data.value !== undefined) {
      return data;
    }
    
    // If data is an array, wrap it
    if (Array.isArray(data)) {
      return { value: data };
    }
    
    // Default empty response
    return { value: [] };
  }
}