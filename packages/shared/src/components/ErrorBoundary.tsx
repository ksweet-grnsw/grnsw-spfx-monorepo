import * as React from 'react';

/**
 * Props for ErrorBoundary component
 */
export interface IErrorBoundaryProps {
  /** Custom fallback component to render on error */
  fallback?: React.ComponentType<IErrorFallbackProps>;
  /** Callback function when an error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Children components to wrap with error boundary */
  children: React.ReactNode;
}

/**
 * Props passed to error fallback components
 */
export interface IErrorFallbackProps {
  /** The error that occurred */
  error: Error;
  /** Function to retry/reset the error boundary */
  resetError: () => void;
}

/**
 * State for ErrorBoundary component
 */
export interface IErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred */
  error?: Error;
}

/**
 * Default fallback component for displaying errors
 */
export const DefaultErrorFallback: React.FC<IErrorFallbackProps> = ({ error, resetError }) => (
  <div style={{
    padding: '20px',
    border: '1px solid #d32f2f',
    borderRadius: '4px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    margin: '10px 0'
  }}>
    <h3 style={{ margin: '0 0 10px 0', color: '#c62828' }}>
      ⚠️ Something went wrong
    </h3>
    <details style={{ marginBottom: '10px' }}>
      <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>
        Error details
      </summary>
      <pre style={{
        fontSize: '12px',
        backgroundColor: '#fff',
        padding: '10px',
        borderRadius: '2px',
        overflow: 'auto',
        maxHeight: '150px'
      }}>
        {error.message}
        {error.stack && '\n\n' + error.stack}
      </pre>
    </details>
    <button
      onClick={resetError}
      style={{
        backgroundColor: '#d32f2f',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Try Again
    </button>
  </div>
);

/**
 * React Error Boundary component for catching JavaScript errors in SPFx web parts
 * Provides graceful error handling for Dataverse API failures, network issues, and component crashes
 * 
 * @example
 * ```typescript
 * // Basic usage
 * <ErrorBoundary>
 *   <MyDataComponent />
 * </ErrorBoundary>
 * 
 * // With custom fallback
 * <ErrorBoundary 
 *   fallback={CustomErrorComponent}
 *   onError={(error, errorInfo) => console.error('App error:', error)}
 * >
 *   <DataverseDataGrid />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Static method called when an error occurs during rendering
   * @param error - The error that was thrown
   * @returns New state or null to not update state
   */
  public static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Called when an error occurs during rendering, in lifecycle methods, or constructors
   * @param error - The error that was thrown
   * @param errorInfo - Component stack information
   */
  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Could integrate with Application Insights here
    // Example: trackException(error, { extra: errorInfo });
  }

  /**
   * Resets the error boundary state to retry rendering
   */
  private resetError = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent 
          error={this.state.error!} 
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}