import * as React from 'react';
import styles from './ErrorBoundary.module.scss';

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: boolean;
  errorBoundaryFound?: boolean;
  [key: string]: any;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    errorInfo: ErrorInfo;
    resetError: () => void;
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
  showDetails?: boolean;
}

/**
 * Comprehensive error boundary component following React best practices
 * Provides graceful error handling with recovery options
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Call error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Log to telemetry service (if available)
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset on prop changes if enabled
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError();
    }

    // Reset on resetKeys change
    if (hasError && resetKeys && this.previousResetKeys.join(',') !== resetKeys.join(',')) {
      this.resetError();
      this.previousResetKeys = [...resetKeys];
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo): void => {
    // Integration point for error logging service
    // This could be Application Insights, Sentry, etc.
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // If Application Insights is available
      if ((window as any).appInsights) {
        (window as any).appInsights.trackException({
          error,
          severityLevel: 3,
          properties: errorData
        });
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReset = (): void => {
    // Clear any pending reset
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    // Reset after a small delay to allow UI to update
    this.resetTimeoutId = setTimeout(() => {
      this.resetError();
    }, 100);
  };

  render(): React.ReactNode {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback: Fallback, level = 'component', showDetails = false, isolate } = this.props;

    if (hasError && error && errorInfo) {
      // Use custom fallback if provided
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorInfo={errorInfo}
            resetError={this.handleReset}
          />
        );
      }

      // Default error UI based on level
      return (
        <div className={`${styles.errorBoundary} ${(styles as any)[`level-${level}`] || ''}`}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>
              {level === 'page' ? '🚨' : level === 'section' ? '⚠️' : '❌'}
            </div>
            
            <h2 className={styles.errorTitle}>
              {level === 'page' 
                ? 'Something went wrong' 
                : level === 'section'
                ? 'This section encountered an error'
                : 'Component error'}
            </h2>
            
            <p className={styles.errorMessage}>
              {error.message || 'An unexpected error occurred'}
            </p>

            {errorCount > 2 && (
              <p className={styles.errorWarning}>
                This error has occurred {errorCount} times. 
                Please refresh the page if the problem persists.
              </p>
            )}

            {showDetails && process.env.NODE_ENV === 'development' && (
              <details className={styles.errorDetails}>
                <summary>Technical Details</summary>
                <pre className={styles.errorStack}>
                  {error.stack}
                </pre>
                <pre className={styles.componentStack}>
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className={styles.errorActions}>
              <button
                onClick={this.handleReset}
                className={styles.resetButton}
              >
                Try Again
              </button>
              
              {level === 'page' && (
                <button
                  onClick={() => window.location.reload()}
                  className={styles.reloadButton}
                >
                  Reload Page
                </button>
              )}
            </div>

            {isolate && (
              <p className={styles.isolateMessage}>
                This error has been isolated and won't affect other parts of the application.
              </p>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook to trigger error boundary from child components
 */
export function useErrorHandler(): (error: Error) => void {
  return React.useCallback((error: Error) => {
    throw error;
  }, []);
}