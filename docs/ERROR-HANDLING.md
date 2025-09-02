# Error Handling Best Practices

## Overview

Comprehensive error handling ensures application resilience, improves user experience, and provides valuable debugging information. This guide covers error handling patterns, recovery strategies, and monitoring practices for GRNSW SPFx applications.

## Table of Contents

1. [Error Types & Categories](#error-types--categories)
2. [Error Boundaries](#error-boundaries)
3. [Try-Catch Patterns](#try-catch-patterns)
4. [Async Error Handling](#async-error-handling)
5. [Dataverse Error Handling](#dataverse-error-handling)
6. [User Experience](#user-experience)
7. [Error Recovery](#error-recovery)
8. [Logging & Monitoring](#logging--monitoring)

## Error Types & Categories

### Error Classification

```typescript
enum ErrorSeverity {
  LOW = 'low',        // Cosmetic issues, can be ignored
  MEDIUM = 'medium',  // Degraded functionality
  HIGH = 'high',      // Feature unavailable
  CRITICAL = 'critical' // Application unusable
}

enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  DATA = 'data',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

interface IErrorContext {
  severity: ErrorSeverity;
  category: ErrorCategory;
  component: string;
  operation: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  retryable: boolean;
  userMessage: string;
  technicalDetails: any;
}
```

### Custom Error Classes

```typescript
// Base error class
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: ErrorSeverity,
    public category: ErrorCategory,
    public retryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Specific error types
export class NetworkError extends AppError {
  constructor(message: string, statusCode?: number, details?: any) {
    super(
      message,
      `NETWORK_${statusCode || 'UNKNOWN'}`,
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      true,
      details
    );
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, details?: any) {
    super(
      message,
      'AUTH_FAILED',
      ErrorSeverity.CRITICAL,
      ErrorCategory.AUTHENTICATION,
      true,
      details
    );
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: string[], details?: any) {
    super(
      message,
      'VALIDATION_FAILED',
      ErrorSeverity.LOW,
      ErrorCategory.VALIDATION,
      false,
      { fields, ...details }
    );
    this.name = 'ValidationError';
  }
}

export class DataverseError extends AppError {
  constructor(message: string, operation: string, details?: any) {
    super(
      message,
      `DATAVERSE_${operation.toUpperCase()}`,
      ErrorSeverity.HIGH,
      ErrorCategory.DATA,
      true,
      details
    );
    this.name = 'DataverseError';
  }
}
```

## Error Boundaries

### Basic Error Boundary

```typescript
import { ErrorBoundary } from '@grnsw/shared';

interface IErrorFallbackProps {
  error: Error;
  retry: () => void;
  errorInfo?: ErrorInfo;
}

const ErrorFallback: React.FC<IErrorFallbackProps> = ({ 
  error, 
  retry,
  errorInfo 
}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return (
    <div className="error-boundary-fallback">
      <div className="error-icon">⚠️</div>
      <h2>Something went wrong</h2>
      <p className="error-message">
        {isProduction 
          ? 'An unexpected error occurred. Please try again.'
          : error.message}
      </p>
      
      {!isProduction && (
        <details className="error-details">
          <summary>Technical Details</summary>
          <pre>{error.stack}</pre>
          {errorInfo && <pre>{errorInfo.componentStack}</pre>}
        </details>
      )}
      
      <div className="error-actions">
        <button onClick={retry} className="btn-primary">
          Try Again
        </button>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          Refresh Page
        </button>
      </div>
    </div>
  );
};

// Usage
<ErrorBoundary
  fallback={ErrorFallback}
  onError={(error, errorInfo) => {
    // Log to telemetry
    telemetry.trackError(error, 'error_boundary', 'component', errorInfo);
  }}
  isolate={true} // Isolate error to this boundary
>
  <YourComponent />
</ErrorBoundary>
```

### Cascading Error Boundaries

```typescript
// App-level boundary
<ErrorBoundary fallback={AppErrorFallback} level="app">
  {/* Feature-level boundary */}
  <ErrorBoundary fallback={FeatureErrorFallback} level="feature">
    {/* Component-level boundary */}
    <ErrorBoundary fallback={ComponentErrorFallback} level="component">
      <RiskyComponent />
    </ErrorBoundary>
  </ErrorBoundary>
</ErrorBoundary>
```

### Specialized Error Boundaries

```typescript
// Dataverse-specific error boundary
export const DataverseErrorBoundary: React.FC<Props> = ({ children }) => {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  const handleError = (error: Error) => {
    if (error instanceof DataverseError && error.retryable) {
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          // Force re-render to retry
          forceUpdate();
        }, Math.pow(2, retryCount) * 1000); // Exponential backoff
      }
    }
  };
  
  return (
    <ErrorBoundary
      onError={handleError}
      fallback={({ error, retry }) => (
        <DataverseErrorFallback
          error={error}
          retry={retry}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
```

## Try-Catch Patterns

### Standard Pattern

```typescript
async function riskyOperation(): Promise<void> {
  try {
    // Risky code
    const result = await api.getData();
    processData(result);
  } catch (error) {
    // Type guard for specific errors
    if (error instanceof NetworkError) {
      // Handle network error
      await handleNetworkError(error);
    } else if (error instanceof ValidationError) {
      // Handle validation error
      showValidationErrors(error.details.fields);
    } else {
      // Handle unknown error
      const appError = new AppError(
        'An unexpected error occurred',
        'UNKNOWN',
        ErrorSeverity.HIGH,
        ErrorCategory.UNKNOWN,
        false,
        { originalError: error }
      );
      throw appError;
    }
  } finally {
    // Cleanup code (always runs)
    hideLoadingSpinner();
  }
}
```

### Error Wrapping

```typescript
function wrapError(error: unknown, context: string): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(
      error.message,
      'WRAPPED_ERROR',
      ErrorSeverity.MEDIUM,
      ErrorCategory.UNKNOWN,
      false,
      { originalError: error, context }
    );
  }
  
  return new AppError(
    String(error),
    'UNKNOWN_ERROR',
    ErrorSeverity.HIGH,
    ErrorCategory.UNKNOWN,
    false,
    { originalError: error, context }
  );
}

// Usage
try {
  await riskyOperation();
} catch (error) {
  throw wrapError(error, 'riskyOperation');
}
```

### Result Pattern

```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function safeOperation<T>(): Promise<Result<T>> {
  try {
    const data = await riskyOperation();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: wrapError(error, 'safeOperation') };
  }
}

// Usage
const result = await safeOperation();
if (result.success) {
  console.log('Data:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## Async Error Handling

### Promise Error Handling

```typescript
// Promise chain
fetchData()
  .then(processData)
  .then(saveData)
  .catch(error => {
    // Handle any error in the chain
    handleError(error);
  })
  .finally(() => {
    // Cleanup
    hideLoader();
  });

// Async/await with proper error handling
async function complexOperation(): Promise<void> {
  let connection;
  
  try {
    connection = await establishConnection();
    const data = await fetchData(connection);
    const processed = await processData(data);
    await saveData(processed);
  } catch (error) {
    // Rollback or compensate
    if (connection) {
      await rollbackTransaction(connection);
    }
    throw wrapError(error, 'complexOperation');
  } finally {
    // Always cleanup
    if (connection) {
      await closeConnection(connection);
    }
  }
}
```

### Parallel Error Handling

```typescript
async function parallelOperations(): Promise<void> {
  const operations = [
    fetchUserData(),
    fetchSettings(),
    fetchPermissions()
  ];
  
  // Wait for all, catching individual errors
  const results = await Promise.allSettled(operations);
  
  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason);
  
  if (errors.length > 0) {
    // Handle multiple errors
    const aggregateError = new AggregateError(
      errors,
      `${errors.length} operations failed`
    );
    throw aggregateError;
  }
  
  // Process successful results
  const data = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<any>).value);
}
```

### Retry Logic

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: boolean;
    retryIf?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    retryIf = (error) => error instanceof NetworkError
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries || !retryIf(lastError)) {
        throw lastError;
      }
      
      const waitTime = backoff 
        ? delay * Math.pow(2, attempt) 
        : delay;
      
      console.log(`Retry attempt ${attempt + 1} after ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}

// Usage
const data = await retryOperation(
  () => api.getData(),
  {
    maxRetries: 5,
    delay: 500,
    backoff: true,
    retryIf: (error) => {
      return error instanceof NetworkError && 
             error.details?.statusCode >= 500;
    }
  }
);
```

## Dataverse Error Handling

### Common Dataverse Errors

```typescript
class DataverseErrorHandler {
  static handle(error: any, operation: string): never {
    const response = error.response;
    
    if (!response) {
      throw new NetworkError('No response from Dataverse');
    }
    
    switch (response.status) {
      case 401:
        throw new AuthenticationError('Dataverse authentication failed');
      
      case 403:
        throw new AppError(
          'Permission denied',
          'DATAVERSE_FORBIDDEN',
          ErrorSeverity.HIGH,
          ErrorCategory.PERMISSION
        );
      
      case 404:
        throw new AppError(
          'Resource not found',
          'DATAVERSE_NOT_FOUND',
          ErrorSeverity.MEDIUM,
          ErrorCategory.DATA
        );
      
      case 429:
        throw new AppError(
          'Rate limit exceeded',
          'DATAVERSE_THROTTLED',
          ErrorSeverity.MEDIUM,
          ErrorCategory.NETWORK,
          true, // Retryable
          { retryAfter: response.headers['retry-after'] }
        );
      
      case 503:
        throw new AppError(
          'Dataverse service unavailable',
          'DATAVERSE_UNAVAILABLE',
          ErrorSeverity.HIGH,
          ErrorCategory.SYSTEM,
          true
        );
      
      default:
        throw new DataverseError(
          response.data?.error?.message || 'Dataverse operation failed',
          operation,
          {
            status: response.status,
            data: response.data
          }
        );
    }
  }
}
```

### Batch Operation Error Handling

```typescript
async function batchDataverseOperation<T>(
  items: T[],
  operation: (item: T) => Promise<any>,
  options: {
    batchSize?: number;
    continueOnError?: boolean;
    onError?: (error: Error, item: T) => void;
  } = {}
): Promise<{ successful: T[]; failed: Array<{ item: T; error: Error }> }> {
  const {
    batchSize = 10,
    continueOnError = false,
    onError
  } = options;
  
  const successful: T[] = [];
  const failed: Array<{ item: T; error: Error }> = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const promises = batch.map(async (item) => {
      try {
        await operation(item);
        successful.push(item);
      } catch (error) {
        const err = error as Error;
        failed.push({ item, error: err });
        
        if (onError) {
          onError(err, item);
        }
        
        if (!continueOnError) {
          throw err;
        }
      }
    });
    
    await Promise.allSettled(promises);
  }
  
  return { successful, failed };
}
```

## User Experience

### Error Messages

```typescript
class ErrorMessageFormatter {
  static getUserMessage(error: Error): string {
    if (error instanceof ValidationError) {
      return this.formatValidationMessage(error);
    }
    
    if (error instanceof NetworkError) {
      return 'Connection error. Please check your network and try again.';
    }
    
    if (error instanceof AuthenticationError) {
      return 'Your session has expired. Please sign in again.';
    }
    
    if (error instanceof AppError) {
      return error.message;
    }
    
    // Generic message for unknown errors
    return 'An unexpected error occurred. Please try again or contact support.';
  }
  
  private static formatValidationMessage(error: ValidationError): string {
    const fields = error.details?.fields;
    if (fields && fields.length > 0) {
      return `Please check the following fields: ${fields.join(', ')}`;
    }
    return 'Please check your input and try again.';
  }
}
```

### Error UI Components

```typescript
interface IErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

const ErrorDisplay: React.FC<IErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  compact = false
}) => {
  const userMessage = ErrorMessageFormatter.getUserMessage(error);
  const isRetryable = error instanceof AppError && error.retryable;
  
  if (compact) {
    return (
      <div className="error-inline">
        <Icon name="Error" />
        <span>{userMessage}</span>
        {isRetryable && onRetry && (
          <button onClick={onRetry}>Retry</button>
        )}
      </div>
    );
  }
  
  return (
    <MessageBar
      messageBarType={MessageBarType.error}
      isMultiline={true}
      onDismiss={onDismiss}
      actions={
        isRetryable && onRetry ? (
          <button onClick={onRetry}>Try Again</button>
        ) : undefined
      }
    >
      {userMessage}
    </MessageBar>
  );
};
```

### Progressive Error Disclosure

```typescript
const DetailedErrorDisplay: React.FC<{ error: Error }> = ({ error }) => {
  const [showDetails, setShowDetails] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';
  
  return (
    <div className="error-display">
      <div className="error-summary">
        <Icon name="ErrorBadge" className="error-icon" />
        <div className="error-content">
          <h3>Something went wrong</h3>
          <p>{ErrorMessageFormatter.getUserMessage(error)}</p>
        </div>
      </div>
      
      {(isDev || error instanceof AppError) && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="error-details-toggle"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      )}
      
      {showDetails && (
        <div className="error-details">
          <h4>Technical Details</h4>
          <dl>
            <dt>Error Type:</dt>
            <dd>{error.name}</dd>
            
            {error instanceof AppError && (
              <>
                <dt>Error Code:</dt>
                <dd>{error.code}</dd>
                
                <dt>Category:</dt>
                <dd>{error.category}</dd>
                
                <dt>Severity:</dt>
                <dd>{error.severity}</dd>
              </>
            )}
            
            <dt>Stack Trace:</dt>
            <dd>
              <pre>{error.stack}</pre>
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
};
```

## Error Recovery

### Automatic Recovery

```typescript
class ErrorRecoveryService {
  private recoveryStrategies = new Map<string, () => Promise<void>>();
  
  constructor() {
    this.registerStrategies();
  }
  
  private registerStrategies(): void {
    // Authentication recovery
    this.recoveryStrategies.set('AUTH_FAILED', async () => {
      await this.refreshAuthentication();
    });
    
    // Connection recovery
    this.recoveryStrategies.set('NETWORK_ERROR', async () => {
      await this.waitForConnection();
    });
    
    // Cache recovery
    this.recoveryStrategies.set('CACHE_ERROR', async () => {
      CacheService.clearAll();
    });
  }
  
  async attemptRecovery(error: Error): Promise<boolean> {
    if (!(error instanceof AppError)) {
      return false;
    }
    
    const strategy = this.recoveryStrategies.get(error.code);
    if (!strategy) {
      return false;
    }
    
    try {
      await strategy();
      return true;
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      return false;
    }
  }
  
  private async refreshAuthentication(): Promise<void> {
    // Attempt to refresh token
    const authService = new AuthService();
    await authService.refreshToken();
  }
  
  private async waitForConnection(): Promise<void> {
    // Wait for network connection
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (navigator.onLine) {
          resolve();
        } else {
          setTimeout(checkConnection, 1000);
        }
      };
      checkConnection();
    });
  }
}
```

### State Recovery

```typescript
class StateRecoveryService {
  private readonly STORAGE_KEY = 'app_state_backup';
  
  saveState(state: any): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          state,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }
  
  recoverState<T>(): T | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return null;
      
      const { state, timestamp } = JSON.parse(saved);
      
      // Check if state is too old (1 hour)
      if (Date.now() - timestamp > 3600000) {
        this.clearState();
        return null;
      }
      
      return state as T;
    } catch (error) {
      console.error('Failed to recover state:', error);
      return null;
    }
  }
  
  clearState(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Usage in component
const MyComponent: React.FC = () => {
  const stateRecovery = new StateRecoveryService();
  const [state, setState] = useState(() => {
    return stateRecovery.recoverState() || initialState;
  });
  
  // Save state on changes
  useEffect(() => {
    stateRecovery.saveState(state);
  }, [state]);
  
  // Clear on successful operations
  const handleSuccess = () => {
    stateRecovery.clearState();
  };
};
```

## Logging & Monitoring

### Structured Error Logging

```typescript
class ErrorLogger {
  private telemetry: TelemetryService;
  
  logError(error: Error, context: IErrorContext): void {
    const errorData = this.serializeError(error);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 ${context.severity.toUpperCase()} Error`);
      console.error('Error:', error);
      console.table(context);
      console.groupEnd();
    }
    
    // Send to telemetry
    this.telemetry.trackError(error, context.component, context.operation, {
      ...errorData,
      ...context
    });
    
    // Send to external service if critical
    if (context.severity === ErrorSeverity.CRITICAL) {
      this.sendAlert(error, context);
    }
  }
  
  private serializeError(error: Error): any {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof AppError ? {
        code: error.code,
        severity: error.severity,
        category: error.category,
        retryable: error.retryable,
        details: error.details
      } : {})
    };
  }
  
  private sendAlert(error: Error, context: IErrorContext): void {
    // Send to Teams/Slack/Email
    fetch('/api/alerts', {
      method: 'POST',
      body: JSON.stringify({
        error: this.serializeError(error),
        context,
        url: window.location.href,
        timestamp: new Date().toISOString()
      })
    }).catch(err => {
      console.error('Failed to send alert:', err);
    });
  }
}
```

### Error Metrics

```typescript
class ErrorMetrics {
  private errors: Map<string, number> = new Map();
  
  track(error: Error): void {
    const key = this.getErrorKey(error);
    this.errors.set(key, (this.errors.get(key) || 0) + 1);
  }
  
  getMetrics(): IErrorMetrics {
    const total = Array.from(this.errors.values()).reduce((a, b) => a + b, 0);
    const byType = Object.fromEntries(this.errors);
    
    return {
      total,
      byType,
      errorRate: this.calculateErrorRate(),
      topErrors: this.getTopErrors(5)
    };
  }
  
  private getErrorKey(error: Error): string {
    if (error instanceof AppError) {
      return `${error.category}:${error.code}`;
    }
    return error.name;
  }
  
  private calculateErrorRate(): number {
    // Calculate based on time window
    return 0; // Implementation depends on requirements
  }
  
  private getTopErrors(count: number): Array<[string, number]> {
    return Array.from(this.errors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count);
  }
}
```

## Best Practices

### 1. Always Use Error Boundaries
- Wrap every feature in an error boundary
- Provide meaningful fallback UI
- Log errors for monitoring

### 2. Classify Errors
- Use custom error classes
- Include severity and category
- Make errors actionable

### 3. Provide Context
- Include operation details
- Add user and session info
- Track error frequency

### 4. Design for Recovery
- Implement retry logic
- Save and restore state
- Provide manual recovery options

### 5. User-Friendly Messages
- Hide technical details in production
- Provide clear next steps
- Offer support contact info

### 6. Monitor and Alert
- Track error rates
- Set up alerts for critical errors
- Review error trends regularly

### 7. Test Error Scenarios
- Unit test error handling
- Integration test recovery flows
- Chaos engineering for resilience