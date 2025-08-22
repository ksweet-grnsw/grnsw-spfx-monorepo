/**
 * Shared package exports - Phase 1 Refactoring
 * Central location for all shared services, utilities, and configurations
 */

// ============================================
// NEW UNIFIED SERVICES (Phase 1 - Use These!)
// ============================================

// Environment Configuration
export {
  IDataverseEnvironment,
  IDataverseEnvironments,
  IDataverseTable,
  DATAVERSE_ENVIRONMENTS,
  getEnvironment,
  getTableEndpoint,
  buildODataUrl,
  getEnvironmentNames,
  isValidEnvironment
} from './config/environments';

// Authentication Services
export { UnifiedAuthService } from './services/UnifiedAuthService';

// Base Services
export {
  UnifiedBaseDataverseService,
  IODataQuery,
  IDataverseResponse,
  IBaseServiceConfig
} from './services/UnifiedBaseDataverseService';

// Cache Service
export {
  CacheService,
  ICacheEntry,
  ICacheConfig,
  ICacheStats
} from './services/CacheService';

// Throttle Service
export {
  ThrottleService,
  ThrottleFactory,
  IThrottleConfig,
  IThrottleStats
} from './services/ThrottleService';

// Error Handling
export {
  UnifiedErrorHandler,
  ErrorType,
  ErrorSeverity,
  IStructuredError
} from './utils/UnifiedErrorHandler';

// Logging
export {
  UnifiedLogger,
  LogLevel as UnifiedLogLevel,
  ILogEntry,
  ILoggerConfig
} from './utils/UnifiedLogger';

// ============================================
// LEGACY EXPORTS (For Backward Compatibility)
// These will be deprecated - migrate to unified services above
// ============================================

// Legacy Services
export { AuthService } from './services/AuthService';
export { BaseDataverseService } from './services/BaseDataverseService';
export type { IDataverseConfig, IDataverseQueryOptions } from './services/BaseDataverseService';

// Legacy Config
export { dataverseConfig, dataverseTables } from './config/dataverseConfig';

// Legacy Utils
export { Logger, LogLevel } from './utils/Logger';
export { ErrorHandler } from './utils/ErrorHandler';
export type { IError } from './utils/ErrorHandler';

// Common interfaces
export interface IBaseEntity {
  createdon: string;
  modifiedon: string;
  statecode: number;
  statuscode: number;
}

// ============================================
// PHASE 3: SHARED COMPONENTS & HOOKS
// ============================================

// Shared Components - Data Display
export { DataGrid } from './components/DataDisplay/DataGrid/DataGrid';
export type { 
  IDataGridProps, 
  IDataGridColumn,
  SelectionMode 
} from './components/DataDisplay/DataGrid/DataGrid.types';

// Shared Components - Error Handling
export { ErrorBoundary } from './components/ErrorHandling/ErrorBoundary/ErrorBoundary';
export type { 
  IErrorBoundaryProps, 
  IErrorBoundaryState,
  IErrorInfo 
} from './components/ErrorHandling/ErrorBoundary/ErrorBoundary.types';

// Shared Hooks
export { 
  useDataverse,
  useOptimisticUpdate 
} from './hooks';

export type {
  UseDataverseOptions,
  UseDataverseResult,
  UseOptimisticUpdateOptions,
  UseOptimisticUpdateResult
} from './hooks';

// ============================================
// PHASE 4: STATE MANAGEMENT
// ============================================

// Context Providers
export { 
  DataverseProvider, 
  useDataverseContext,
  AppStateProvider,
  useAppState,
  NotificationProvider,
  useNotifications,
  ThemeProvider,
  useTheme,
  UserProvider,
  useUser,
  CombinedProvider,
  withProviders,
  useRequireProviders
} from './contexts';

// Store Pattern
export { 
  Store,
  createStore,
  MeetingStore,
  getMeetingStore,
  useStore,
  useStoreSelector,
  useStoreActions,
  useStoreWithActions,
  useAsyncStore,
  useStorePersistence,
  useStoreComputed
} from './stores';

export type {
  IStoreChangeEvent,
  IStoreSubscription,
  IStoreOptions,
  IMeetingState
} from './stores';

// ============================================
// VERSION & MIGRATION INFO
// ============================================

export const SHARED_PACKAGE_VERSION = '4.0.0'; // Updated for Phase 4

// Migration helpers to guide developers
export const MigrationGuide = {
  // Phase 1 migrations
  AuthService: 'Migrate to UnifiedAuthService - provides environment-aware authentication',
  BaseDataverseService: 'Migrate to UnifiedBaseDataverseService - includes caching and throttling',
  ErrorHandler: 'Migrate to UnifiedErrorHandler - provides structured error handling',
  Logger: 'Migrate to UnifiedLogger - includes log levels and storage',
  dataverseConfig: 'Migrate to DATAVERSE_ENVIRONMENTS - centralized environment configuration',
  
  // Phase 3 migrations
  DataTable: 'Use shared DataGrid component from @grnsw/shared',
  ErrorBoundary: 'Use shared ErrorBoundary component from @grnsw/shared',
  'Custom Hooks': 'Use useDataverse and useOptimisticUpdate from @grnsw/shared/hooks'
};