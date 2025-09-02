/**
 * Shared package exports
 * Central location for all shared services, utilities, and configurations
 */

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

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

// ============================================
// SERVICES
// ============================================

// Authentication Services
export { AuthService } from './services/AuthService';
export { UnifiedAuthService } from './services/UnifiedAuthService';

// Base Services
export { BaseDataverseService } from './services/BaseDataverseService';
export { UnifiedBaseDataverseService } from './services/UnifiedBaseDataverseService';

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

// Telemetry Types
export type {
  ITelemetryEvent,
  IPerformanceEvent,
  IErrorEvent,
  IUserEvent,
  IBusinessEvent,
  ITelemetryConfig
} from './services/TelemetryService';

// ============================================
// UTILITIES
// ============================================

// Error Handling
export { ErrorHandler } from './utils/ErrorHandler';
export { UnifiedErrorHandler } from './utils/UnifiedErrorHandler';

// Logging
export { Logger, LogLevel } from './utils/Logger';
export { UnifiedLogger } from './utils/UnifiedLogger';

// Bundle Analysis
export { BundleAnalyzer } from './utils/bundleAnalyzer';

// ============================================
// REACT COMPONENTS & HOOKS
// ============================================

// Error Boundary Components
export { ErrorBoundary, DefaultErrorFallback } from './components/ErrorBoundary';
export { DataverseErrorBoundary, DataverseErrorFallback } from './components/DataverseErrorBoundary';

// Error Handler Hooks
export { useErrorHandler, useDataverseErrorHandler } from './hooks/useErrorHandler';

// Telemetry Hooks
export { 
  useTelemetry, 
  useServiceTelemetry, 
  useDashboardTelemetry 
} from './hooks/useTelemetry';

// Component & Hook Types
export type { 
  IErrorBoundaryProps, 
  IErrorFallbackProps, 
  IErrorBoundaryState 
} from './components/ErrorBoundary';

export type { 
  IErrorState, 
  IUseErrorHandlerReturn 
} from './hooks/useErrorHandler';

// ============================================
// LOADING COMPONENTS & HOOKS
// ============================================

// Loading Components
export { LoadingSpinner, LoadingOverlay, ProgressBar } from './components/LoadingSpinner';
export { 
  SkeletonLoader, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonChart 
} from './components/SkeletonLoader';
export { DashboardSkeleton, SimpleLoadingState } from './components/DashboardSkeleton';

// Lazy Loading Components
export {
  LazyComponent,
  useLazyComponent,
  createLazyComponent,
  PreloadUtils,
  LazyPatterns
} from './components/LazyComponent';

// Loading Hooks
export { 
  useLoadingState, 
  useAsyncOperation, 
  useProgressiveLoading 
} from './hooks/useLoadingState';

// Loading Component Types
export type {
  ILoadingSpinnerProps,
  ILoadingOverlayProps,
  IProgressBarProps
} from './components/LoadingSpinner';

export type {
  ISkeletonLoaderProps,
  ISkeletonCardProps,
  ISkeletonTableProps,
  ISkeletonChartProps
} from './components/SkeletonLoader';

export type {
  IDashboardSkeletonProps,
  ISimpleLoadingStateProps
} from './components/DashboardSkeleton';

export type {
  ILazyComponentProps
} from './components/LazyComponent';

// Loading Hook Types
export type {
  ILoadingState,
  IUseLoadingStateReturn,
  IAsyncOperationOptions,
  IUseAsyncOperationReturn,
  IProgressiveLoadingOptions,
  IProgressiveStep,
  IProgressiveStepResult,
  IUseProgressiveLoadingReturn
} from './hooks/useLoadingState';

// Telemetry Hook Types
export type {
  IUseTelemetryOptions,
  IUseTelemetryReturn
} from './hooks/useTelemetry';

// Bundle Analysis Types
export type {
  IBundleAnalysisResult,
  IChunkAnalysis,
  IModuleAnalysis,
  IDependencyAnalysis
} from './utils/bundleAnalyzer';

// ============================================
// CONFIGURATION
// ============================================

// Legacy Config (these files exist)
export { dataverseConfig, dataverseTables } from './config/dataverseConfig';

// Bundle Optimization
export {
  sharedChunkConfig,
  webpackOptimizationConfig,
  bundleSizeLimits,
  performanceBudget,
  dynamicImportPatterns,
  bundleAnalysisUtils,
  treeShakingHelpers,
  loadingStrategies,
  environmentOptimizations
} from './config/bundleOptimization';

// Common interfaces
export interface IBaseEntity {
  createdon: string;
  modifiedon: string;
  statecode: number;
  statuscode: number;
}

// ============================================
// VERSION INFO
// ============================================

export const SHARED_PACKAGE_VERSION = '1.0.0';