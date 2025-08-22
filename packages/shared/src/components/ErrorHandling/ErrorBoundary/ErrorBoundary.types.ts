import { ReactNode } from 'react';

/**
 * Error information
 */
export interface IErrorInfo {
  componentStack: string;
  errorBoundary?: boolean;
  errorBoundaryMessage?: string;
}

/**
 * ErrorBoundary component props
 */
export interface IErrorBoundaryProps {
  /** Child components */
  children: ReactNode;
  
  /** Fallback UI to display on error */
  fallback?: ReactNode | ((error: Error, errorInfo: IErrorInfo) => ReactNode);
  
  /** Error callback */
  onError?: (error: Error, errorInfo: IErrorInfo) => void;
  
  /** Reset callback */
  onReset?: () => void;
  
  /** Show error details in development */
  showDetails?: boolean;
  
  /** Custom error message */
  errorMessage?: string;
  
  /** Custom reset button text */
  resetButtonText?: string;
  
  /** Enable error logging */
  enableLogging?: boolean;
  
  /** Component name for logging */
  componentName?: string;
  
  /** Custom className */
  className?: string;
}

/**
 * ErrorBoundary component state
 */
export interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: IErrorInfo | null;
  errorCount: number;
}