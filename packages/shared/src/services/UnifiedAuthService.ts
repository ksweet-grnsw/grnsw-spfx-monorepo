import { AadTokenProvider } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IDataverseEnvironment } from '../config/environments';

/**
 * Unified Authentication Service for all Dataverse environments
 * This replaces all package-specific AuthService implementations
 */
export class UnifiedAuthService {
  private static instances: Map<string, UnifiedAuthService> = new Map();
  private tokenProvider: AadTokenProvider | null = null;
  private tokenCache: Map<string, { token: string; expiry: number }> = new Map();
  private readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry

  private constructor(
    private context: WebPartContext,
    private environment: IDataverseEnvironment
  ) {}

  /**
   * Get singleton instance for specific environment
   * Ensures one auth service per environment per context
   */
  public static getInstance(
    context: WebPartContext,
    environment: IDataverseEnvironment
  ): UnifiedAuthService {
    const key = `${context.pageContext.site.id}_${environment.name}`;
    
    if (!this.instances.has(key)) {
      this.instances.set(key, new UnifiedAuthService(context, environment));
    }
    
    return this.instances.get(key)!;
  }

  /**
   * Get access token for the configured Dataverse environment
   * Implements token caching and automatic refresh
   */
  public async getAccessToken(): Promise<string> {
    const cacheKey = this.environment.resourceUrl;
    const cached = this.tokenCache.get(cacheKey);
    
    // Check if we have a valid cached token
    if (cached && cached.expiry > Date.now() + this.TOKEN_REFRESH_BUFFER) {
      return cached.token;
    }
    
    try {
      // Get or create token provider
      if (!this.tokenProvider) {
        this.tokenProvider = await this.context.aadTokenProviderFactory.getTokenProvider();
      }
      
      // Request new token
      const token = await this.tokenProvider.getToken(this.environment.resourceUrl);
      
      // Cache token with expiry (tokens typically valid for 1 hour)
      this.tokenCache.set(cacheKey, {
        token,
        expiry: Date.now() + (60 * 60 * 1000) // 1 hour
      });
      
      return token;
    } catch (error) {
      console.error(`Failed to get token for ${this.environment.name}:`, error);
      throw new Error(`Authentication failed for ${this.environment.displayName}: ${error.message}`);
    }
  }

  /**
   * Get headers for Dataverse API requests
   * Automatically includes the access token
   */
  public async getHeaders(): Promise<HeadersInit> {
    const token = await this.getAccessToken();
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Prefer': 'odata.include-annotations="*"'
    };
  }

  /**
   * Make authenticated request to Dataverse
   * Handles token refresh and retry logic
   */
  public async makeAuthenticatedRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const maxRetries = this.environment.retryAttempts || 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const headers = await this.getHeaders();
        
        const response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            ...(options.headers || {})
          }
        });
        
        if (response.status === 401) {
          // Token expired, clear cache and retry
          this.tokenCache.delete(this.environment.resourceUrl);
          if (attempt < maxRetries) {
            await this.delay(this.environment.retryDelay || 1000);
            continue;
          }
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch {
            // Use default error message if can't parse
          }
          
          throw new Error(errorMessage);
        }
        
        // Handle empty responses
        const responseText = await response.text();
        if (!responseText) {
          return {} as T;
        }
        
        return JSON.parse(responseText);
        
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          await this.delay(this.environment.retryDelay || 1000);
          continue;
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Clear cached tokens for this environment
   */
  public clearTokenCache(): void {
    this.tokenCache.delete(this.environment.resourceUrl);
  }

  /**
   * Clear all cached instances (useful for testing)
   */
  public static clearAllInstances(): void {
    this.instances.clear();
  }

  /**
   * Get the current environment configuration
   */
  public getEnvironment(): IDataverseEnvironment {
    return this.environment;
  }

  /**
   * Check if we have a valid token cached
   */
  public hasValidToken(): boolean {
    const cached = this.tokenCache.get(this.environment.resourceUrl);
    return !!(cached && cached.expiry > Date.now() + this.TOKEN_REFRESH_BUFFER);
  }

  /**
   * Helper method for delay between retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}