/**
 * Shared UI Components Library
 * Reusable components for all SPFx packages
 */

// Core Components
export { ErrorBoundary } from './ErrorBoundary';
export { DataverseErrorBoundary } from './DataverseErrorBoundary';
export { LoadingSpinner } from './LoadingSpinner';
export { SkeletonLoader } from './SkeletonLoader';
export { DashboardSkeleton } from './DashboardSkeleton';
export { LazyComponent } from './LazyComponent';

// Data Display
export { DataGrid } from './DataDisplay/DataGrid/DataGrid';
export type { IDataGridProps, IDataGridColumn } from './DataDisplay/DataGrid/DataGrid.types';

// UI Components
export { StatusBadge } from './StatusBadge/StatusBadge';
export type { IStatusBadgeProps } from './StatusBadge/StatusBadge';
export { FilterPanel } from './FilterPanel/FilterPanel';
export type { IFilterPanelProps } from './FilterPanel/FilterPanel';

// Error Handling (from subdirectory)
export { ErrorBoundary as ErrorBoundaryComponent } from './ErrorHandling/ErrorBoundary/ErrorBoundary';
export type { IErrorBoundaryProps, IErrorBoundaryState } from './ErrorHandling/ErrorBoundary/ErrorBoundary.types';