/**
 * Shared UI Components Library
 * Reusable components for all SPFx packages
 */

// Data Display
export { DataGrid } from './DataDisplay/DataGrid/DataGrid';
export type { IDataGridProps, IDataGridColumn } from './DataDisplay/DataGrid/DataGrid.types';

export { LoadingSpinner } from './DataDisplay/LoadingSpinner/LoadingSpinner';
export type { ILoadingSpinnerProps } from './DataDisplay/LoadingSpinner/LoadingSpinner.types';

export { EmptyState } from './DataDisplay/EmptyState/EmptyState';
export type { IEmptyStateProps } from './DataDisplay/EmptyState/EmptyState.types';

export { StatusBadge } from './DataDisplay/StatusBadge/StatusBadge';
export type { IStatusBadgeProps } from './DataDisplay/StatusBadge/StatusBadge.types';

// Error Handling
export { ErrorBoundary } from './ErrorHandling/ErrorBoundary/ErrorBoundary';
export type { IErrorBoundaryProps, IErrorBoundaryState } from './ErrorHandling/ErrorBoundary/ErrorBoundary.types';

export { ErrorMessage } from './ErrorHandling/ErrorMessage/ErrorMessage';
export type { IErrorMessageProps } from './ErrorHandling/ErrorMessage/ErrorMessage.types';

// Layout
export { Card } from './Layout/Card/Card';
export type { ICardProps } from './Layout/Card/Card.types';

export { PageHeader } from './Layout/PageHeader/PageHeader';
export type { IPageHeaderProps } from './Layout/PageHeader/PageHeader.types';

// Feedback
export { Toast } from './Feedback/Toast/Toast';
export type { IToastProps } from './Feedback/Toast/Toast.types';

export { ConfirmDialog } from './Feedback/ConfirmDialog/ConfirmDialog';
export type { IConfirmDialogProps } from './Feedback/ConfirmDialog/ConfirmDialog.types';

// Forms
export { SearchBox } from './Forms/SearchBox/SearchBox';
export type { ISearchBoxProps } from './Forms/SearchBox/SearchBox.types';

export { FilterPanel } from './Forms/FilterPanel/FilterPanel';
export type { IFilterPanelProps } from './Forms/FilterPanel/FilterPanel.types';