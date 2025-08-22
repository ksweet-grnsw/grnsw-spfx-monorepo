import * as React from 'react';
import { Component, ErrorInfo } from 'react';
import { IErrorBoundaryProps, IErrorBoundaryState, IErrorInfo } from './ErrorBoundary.types';
import { UnifiedErrorHandler, UnifiedLogger } from '../../../index';
import styles from './ErrorBoundary.module.scss';

/**
 * Shared ErrorBoundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 */
export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  private logger: UnifiedLogger;

  constructor(props: IErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };

    this.logger = UnifiedLogger.getInstance();
  }

  static getDerivedStateFromError(error: Error): Partial<IErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, enableLogging = true, componentName = 'Unknown' } = this.props;
    
    // Convert React ErrorInfo to our IErrorInfo
    const info: IErrorInfo = {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      errorBoundaryMessage: `Error caught in ${componentName}`
    };

    // Update state with error info
    this.setState(prevState => ({
      errorInfo: info,
      errorCount: prevState.errorCount + 1
    }));

    // Log error if enabled
    if (enableLogging) {
      const structuredError = UnifiedErrorHandler.handleError(
        error,
        `ErrorBoundary.${componentName}`
      );
      
      this.logger.error('Component error caught', {
        error: structuredError,
        componentStack: info.componentStack,
        componentName
      });
    }

    // Call error callback if provided
    if (onError) {
      onError(error, info);
    }
  }

  handleReset = (): void => {
    const { onReset } = this.props;

    // Reset state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call reset callback if provided
    if (onReset) {
      onReset();
    }
  };

  render(): React.ReactNode {
    const {
      children,
      fallback,
      showDetails = false,
      errorMessage = 'Something went wrong',
      resetButtonText = 'Try Again',
      className
    } = this.props;

    const { hasError, error, errorInfo, errorCount } = this.state;

    if (hasError && error) {
      // Custom fallback UI
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, errorInfo || { componentStack: '' });
        }
        return fallback;
      }

      // Default fallback UI
      return (
        <div className={`${styles.errorBoundary} ${className || ''}`}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            
            <h2 className={styles.errorTitle}>
              {errorMessage}
            </h2>
            
            <p className={styles.errorDescription}>
              An unexpected error occurred. The error has been logged and our team has been notified.
            </p>

            {/* Show error details in development */}
            {showDetails && (
              <details className={styles.errorDetails}>
                <summary className={styles.detailsSummary}>
                  Error Details (Development Only)
                </summary>
                <div className={styles.detailsContent}>
                  <div className={styles.errorSection}>
                    <strong>Error:</strong>
                    <pre className={styles.errorText}>
                      {error.name}: {error.message}
                    </pre>
                  </div>
                  
                  {error.stack && (
                    <div className={styles.errorSection}>
                      <strong>Stack Trace:</strong>
                      <pre className={styles.stackTrace}>
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <div className={styles.errorSection}>
                      <strong>Component Stack:</strong>
                      <pre className={styles.componentStack}>
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  
                  <div className={styles.errorSection}>
                    <strong>Error Count:</strong> {errorCount}
                  </div>
                </div>
              </details>
            )}

            <div className={styles.actions}>
              <button
                className={styles.resetButton}
                onClick={this.handleReset}
                aria-label={resetButtonText}
              >
                {resetButtonText}
              </button>
              
              <button
                className={styles.reloadButton}
                onClick={() => window.location.reload()}
                aria-label="Reload page"
              >
                Reload Page
              </button>
            </div>

            {errorCount > 2 && (
              <p className={styles.persistentError}>
                This error keeps occurring. Please contact support if the problem persists.
              </p>
            )}
          </div>
        </div>
      );
    }

    // No error, render children
    return children;
  }

  /**
   * Reset error boundary programmatically
   */
  public reset(): void {
    this.handleReset();
  }

  /**
   * Check if error boundary has caught an error
   */
  public hasError(): boolean {
    return this.state.hasError;
  }

  /**
   * Get current error
   */
  public getError(): Error | null {
    return this.state.error;
  }
}