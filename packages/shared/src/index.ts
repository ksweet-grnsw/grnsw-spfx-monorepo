/**
 * Shared package exports
 * Central location for all shared services, utilities, and configurations
 */

// ============================================
// SERVICES
// ============================================

// Authentication Services
export { AuthService } from './services/AuthService';
export { UnifiedAuthService } from './services/UnifiedAuthService';

// Base Services
export { BaseDataverseService } from './services/BaseDataverseService';
export { 
  UnifiedBaseDataverseService,
  IODataQuery as IUnifiedODataQuery,
  IDataverseResponse as IUnifiedDataverseResponse
} from './services/UnifiedBaseDataverseService';

// Service Types
export type {
  IDataverseOptions,
  IDataverseResponse,
  IDataverseError,
  IODataQuery
} from './services/BaseDataverseService.types';

// Cache Service
export { CacheService } from './services/CacheService';

// Throttle Service
export { ThrottleService, ThrottleFactory } from './services/ThrottleService';

// Telemetry Service
export { 
  TelemetryService,
  TelemetrySeverity
} from './services/TelemetryService';

// ============================================
// UTILITIES
// ============================================

// Error Handling
export { ErrorHandler, ErrorType } from './utils/ErrorHandler';
export { UnifiedErrorHandler } from './utils/UnifiedErrorHandler';
export type { IError } from './utils/ErrorHandler';

// Logging
export { Logger, LogLevel } from './utils/Logger';
export { UnifiedLogger } from './utils/UnifiedLogger';

// ============================================
// REACT COMPONENTS
// ============================================

// Error Boundary Components
export { ErrorBoundary } from './components/ErrorBoundary';
export { DataverseErrorBoundary } from './components/DataverseErrorBoundary';
export type { IErrorBoundaryProps, IErrorFallbackProps, IErrorBoundaryState } from './components/ErrorBoundary';

// Loading Components
export { LoadingSpinner } from './components/LoadingSpinner';
export { SkeletonLoader } from './components/SkeletonLoader';
export { DashboardSkeleton } from './components/DashboardSkeleton';
export { LazyComponent } from './components/LazyComponent';

// Data Display
export { DataGrid } from './components/DataDisplay/DataGrid/DataGrid';
export type { IDataGridProps, IDataGridColumn } from './components/DataDisplay/DataGrid/DataGrid.types';

// UI Components
export { StatusBadge } from './components/StatusBadge/StatusBadge';
export type { IStatusBadgeProps } from './components/StatusBadge/StatusBadge';
export { FilterPanel } from './components/FilterPanel/FilterPanel';
export type { IFilterPanelProps } from './components/FilterPanel/FilterPanel';

// ============================================
// HOOKS
// ============================================

// Data fetching
export { useDataverse } from './hooks/useDataverse';

// State management
export { useOptimisticUpdate } from './hooks/useOptimisticUpdate';

// Loading state
export { 
  useLoadingState,
  useAsyncOperation,
  useProgressiveLoading
} from './hooks/useLoadingState';

// Error handling
export { useErrorHandler } from './hooks/useErrorHandler';

// Telemetry
export { useTelemetry } from './hooks/useTelemetry';

// ============================================
// CONFIGURATION
// ============================================

export { dataverseConfig, dataverseTables } from './config/dataverseConfig';
export { 
  DATAVERSE_ENVIRONMENTS,
  getEnvironment,
  getTableEndpoint,
  buildODataUrl,
  getEnvironmentNames,
  isValidEnvironment
} from './config/environments';
export type { 
  IDataverseEnvironment, 
  IDataverseEnvironments, 
  IDataverseTable 
} from './config/environments';

// ============================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================

// Components
export * from './components';

// Hooks
export * from './hooks';