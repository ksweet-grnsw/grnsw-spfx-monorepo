import * as React from 'react';
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { 
  IDataverseEnvironment, 
  DATAVERSE_ENVIRONMENTS,
  UnifiedAuthService,
  CacheService,
  ThrottleService,
  ThrottleFactory
} from '../index';

/**
 * Dataverse context value
 */
export interface IDataverseContext {
  /** Current environment */
  environment: IDataverseEnvironment;
  
  /** Auth service instance */
  authService: UnifiedAuthService;
  
  /** Cache service instance */
  cacheService: CacheService;
  
  /** Throttle service instance */
  throttleService: ThrottleService;
  
  /** WebPart context */
  context: WebPartContext;
  
  /** Switch environment */
  switchEnvironment: (environmentName: string) => void;
  
  /** Clear all caches */
  clearCaches: () => void;
  
  /** Get access token */
  getAccessToken: () => Promise<string>;
  
  /** Check if authenticated */
  isAuthenticated: () => boolean;
}

/**
 * Dataverse provider props
 */
export interface IDataverseProviderProps {
  /** Child components */
  children: ReactNode;
  
  /** WebPart context */
  context: WebPartContext;
  
  /** Initial environment name */
  environmentName: keyof typeof DATAVERSE_ENVIRONMENTS;
  
  /** Cache configuration */
  cacheConfig?: {
    defaultTTL?: number;
    maxSize?: number;
    enableLocalStorage?: boolean;
  };
  
  /** Throttle configuration */
  throttleConfig?: {
    requestsPerSecond?: number;
    maxQueueSize?: number;
  };
}

// Create context
const DataverseContext = createContext<IDataverseContext | undefined>(undefined);

/**
 * Dataverse Provider Component
 * Provides centralized Dataverse access to all child components
 */
export const DataverseProvider: React.FC<IDataverseProviderProps> = ({
  children,
  context,
  environmentName,
  cacheConfig = {},
  throttleConfig = {}
}) => {
  const [currentEnvironment, setCurrentEnvironment] = React.useState(environmentName);

  // Get environment configuration
  const environment = React.useMemo(
    () => DATAVERSE_ENVIRONMENTS[currentEnvironment],
    [currentEnvironment]
  );

  // Create auth service
  const authService = React.useMemo(
    () => UnifiedAuthService.getInstance(context, environment),
    [context, environment]
  );

  // Create cache service
  const cacheService = React.useMemo(
    () => new CacheService(`dataverse_${environment.name}`, {
      defaultTTL: cacheConfig.defaultTTL || environment.cacheTimeout || 300000,
      maxSize: cacheConfig.maxSize || 100,
      enableLocalStorage: cacheConfig.enableLocalStorage !== false
    }),
    [environment, cacheConfig]
  );

  // Create throttle service
  const throttleService = React.useMemo(
    () => ThrottleFactory.createDataverseThrottle(
      throttleConfig.requestsPerSecond || environment.rateLimit || 100
    ),
    [environment, throttleConfig]
  );

  // Switch environment
  const switchEnvironment = React.useCallback((environmentName: string) => {
    if (environmentName in DATAVERSE_ENVIRONMENTS) {
      setCurrentEnvironment(environmentName as keyof typeof DATAVERSE_ENVIRONMENTS);
      // Clear caches when switching environments
      cacheService.clear();
    } else {
      throw new Error(`Unknown environment: ${environmentName}`);
    }
  }, [cacheService]);

  // Clear all caches
  const clearCaches = React.useCallback(() => {
    cacheService.clear();
    authService.clearTokenCache();
  }, [cacheService, authService]);

  // Get access token
  const getAccessToken = React.useCallback(async () => {
    return authService.getAccessToken();
  }, [authService]);

  // Check if authenticated
  const isAuthenticated = React.useCallback(() => {
    return authService.hasValidToken();
  }, [authService]);

  // Create context value
  const contextValue = useMemo<IDataverseContext>(
    () => ({
      environment,
      authService,
      cacheService,
      throttleService,
      context,
      switchEnvironment,
      clearCaches,
      getAccessToken,
      isAuthenticated
    }),
    [
      environment,
      authService,
      cacheService,
      throttleService,
      context,
      switchEnvironment,
      clearCaches,
      getAccessToken,
      isAuthenticated
    ]
  );

  return (
    <DataverseContext.Provider value={contextValue}>
      {children}
    </DataverseContext.Provider>
  );
};

/**
 * Hook to use Dataverse context
 */
export const useDataverseContext = (): IDataverseContext => {
  const context = useContext(DataverseContext);
  
  if (!context) {
    throw new Error('useDataverseContext must be used within a DataverseProvider');
  }
  
  return context;
};