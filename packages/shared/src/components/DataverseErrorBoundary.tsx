import * as React from 'react';
import { ErrorBoundary, IErrorFallbackProps } from './ErrorBoundary';

/**
 * Specialized error fallback component for Dataverse-related errors
 * Provides context-aware error messages and recovery suggestions
 */
export const DataverseErrorFallback: React.FC<IErrorFallbackProps> = ({ error, resetError }) => {
  // Analyze error type to provide specific guidance
  const getErrorInfo = (error: Error) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('401') || message.includes('unauthorized')) {
      return {
        title: '🔐 Authentication Required',
        description: 'Your session has expired or you don\'t have permission to access this data.',
        suggestion: 'Please refresh the page to re-authenticate.',
        color: '#ff9800'
      };
    }
    
    if (message.includes('403') || message.includes('forbidden')) {
      return {
        title: '🚫 Access Denied',
        description: 'You don\'t have permission to access this Dataverse data.',
        suggestion: 'Contact your administrator to request access.',
        color: '#f44336'
      };
    }
    
    if (message.includes('404') || message.includes('not found')) {
      return {
        title: '📊 Data Not Found',
        description: 'The requested data could not be found in Dataverse.',
        suggestion: 'The data may have been moved or deleted.',
        color: '#ff9800'
      };
    }
    
    if (message.includes('timeout') || message.includes('network')) {
      return {
        title: '🌐 Connection Issue',
        description: 'Unable to connect to Dataverse services.',
        suggestion: 'Check your internet connection and try again.',
        color: '#ff5722'
      };
    }
    
    if (message.includes('500') || message.includes('internal server')) {
      return {
        title: '⚙️ Server Error',
        description: 'Dataverse is experiencing technical difficulties.',
        suggestion: 'Please try again in a few moments.',
        color: '#9c27b0'
      };
    }
    
    // Default for unknown errors
    return {
      title: '⚠️ Data Loading Error',
      description: 'An unexpected error occurred while loading data.',
      suggestion: 'Try refreshing the component or contact support if the issue persists.',
      color: '#d32f2f'
    };
  };

  const errorInfo = getErrorInfo(error);

  return (
    <div style={{
      padding: '24px',
      border: `2px solid ${errorInfo.color}`,
      borderRadius: '8px',
      backgroundColor: '#fafafa',
      color: '#333',
      margin: '16px 0',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          color: errorInfo.color,
          fontSize: '18px',
          fontWeight: '600'
        }}>
          {errorInfo.title}
        </h3>
        <p style={{ 
          margin: '0 0 8px 0', 
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          {errorInfo.description}
        </p>
        <p style={{ 
          margin: '0', 
          fontSize: '13px', 
          fontStyle: 'italic',
          color: '#666'
        }}>
          💡 {errorInfo.suggestion}
        </p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={resetError}
          style={{
            backgroundColor: errorInfo.color,
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginRight: '8px'
          }}
        >
          🔄 Retry
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: 'transparent',
            color: errorInfo.color,
            border: `1px solid ${errorInfo.color}`,
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🔃 Refresh Page
        </button>
      </div>

      <details style={{ fontSize: '12px' }}>
        <summary style={{ 
          cursor: 'pointer', 
          marginBottom: '8px',
          color: '#666'
        }}>
          🔍 Technical Details (for IT support)
        </summary>
        <pre style={{
          fontSize: '11px',
          backgroundColor: '#fff',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          overflow: 'auto',
          maxHeight: '120px',
          color: '#333'
        }}>
          {error.name}: {error.message}
          {error.stack && '\n\n' + error.stack}
        </pre>
      </details>
    </div>
  );
};

/**
 * Specialized Error Boundary for Dataverse operations
 * Provides context-aware error messages and recovery options for common Dataverse issues
 * 
 * @example
 * ```typescript
 * <DataverseErrorBoundary>
 *   <InjuryDataGrid />
 * </DataverseErrorBoundary>
 * ```
 */
export const DataverseErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary 
      fallback={DataverseErrorFallback}
      onError={(error, errorInfo) => {
        // Log Dataverse-specific errors with additional context
        console.error('Dataverse Error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        });
        
        // Could integrate with Application Insights for production monitoring
        // Example: trackException(error, { 
        //   properties: { 
        //     errorType: 'dataverse',
        //     componentStack: errorInfo.componentStack
        //   }
        // });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};