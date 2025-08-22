import { UnifiedLogger } from './UnifiedLogger';

/**
 * Error types for categorization
 */
export enum ErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Structured error interface
 */
export interface IStructuredError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  statusCode?: number;
  details?: any;
  timestamp: Date;
  context?: string;
  stack?: string;
  correlationId?: string;
}

/**
 * Unified Error Handler for all packages
 * Provides consistent error handling, logging, and user-friendly messages
 */
export class UnifiedErrorHandler {
  private static logger = UnifiedLogger.getInstance();
  private static errorCallbacks: ((error: IStructuredError) => void)[] = [];
  private static isLoggingEnabled = true;

  /**
   * Main error handling method
   * Categorizes errors and returns structured error information
   */
  public static handleError(
    error: unknown,
    context?: string,
    correlationId?: string
  ): IStructuredError {
    const structuredError = this.createStructuredError(error, context, correlationId);
    
    // Log the error if logging is enabled
    if (this.isLoggingEnabled) {
      this.logError(structuredError);
    }
    
    // Notify any registered callbacks
    this.notifyCallbacks(structuredError);
    
    return structuredError;
  }

  /**
   * Create a structured error from any error type
   */
  private static createStructuredError(
    error: unknown,
    context?: string,
    correlationId?: string
  ): IStructuredError {
    // Handle different error types
    if (error instanceof Error) {
      return this.handleErrorObject(error, context, correlationId);
    } else if (typeof error === 'string') {
      return this.handleStringError(error, context, correlationId);
    } else if (this.isHttpError(error)) {
      return this.handleHttpError(error as any, context, correlationId);
    } else {
      return this.handleUnknownError(error, context, correlationId);
    }
  }

  /**
   * Handle standard Error objects
   */
  private static handleErrorObject(
    error: Error,
    context?: string,
    correlationId?: string
  ): IStructuredError {
    const statusCode = (error as any).status || (error as any).statusCode;
    const type = this.determineErrorType(statusCode, error.message);
    const severity = this.determineErrorSeverity(type);
    
    return {
      type,
      severity,
      message: error.message,
      userMessage: this.getUserFriendlyMessage(type, error.message),
      code: (error as any).code,
      statusCode,
      details: (error as any).details,
      timestamp: new Date(),
      context,
      stack: error.stack,
      correlationId: correlationId || this.generateCorrelationId()
    };
  }

  /**
   * Handle string errors
   */
  private static handleStringError(
    error: string,
    context?: string,
    correlationId?: string
  ): IStructuredError {
    return {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: error,
      userMessage: error,
      timestamp: new Date(),
      context,
      correlationId: correlationId || this.generateCorrelationId()
    };
  }

  /**
   * Handle HTTP response errors
   */
  private static handleHttpError(
    error: { status?: number; statusCode?: number; statusText?: string; message?: string },
    context?: string,
    correlationId?: string
  ): IStructuredError {
    const statusCode = error.status || error.statusCode;
    const type = this.determineErrorType(statusCode);
    const severity = this.determineErrorSeverity(type);
    const message = error.message || error.statusText || 'HTTP Error';
    
    return {
      type,
      severity,
      message,
      userMessage: this.getUserFriendlyMessage(type, message),
      statusCode,
      timestamp: new Date(),
      context,
      correlationId: correlationId || this.generateCorrelationId()
    };
  }

  /**
   * Handle unknown error types
   */
  private static handleUnknownError(
    error: unknown,
    context?: string,
    correlationId?: string
  ): IStructuredError {
    return {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'An unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      details: error,
      timestamp: new Date(),
      context,
      correlationId: correlationId || this.generateCorrelationId()
    };
  }

  /**
   * Determine error type based on status code and message
   */
  private static determineErrorType(statusCode?: number, message?: string): ErrorType {
    if (statusCode) {
      switch (statusCode) {
        case 401:
          return ErrorType.AUTHENTICATION_ERROR;
        case 403:
          return ErrorType.AUTHORIZATION_ERROR;
        case 404:
          return ErrorType.NOT_FOUND_ERROR;
        case 429:
          return ErrorType.RATE_LIMIT_ERROR;
        case 400:
        case 422:
          return ErrorType.VALIDATION_ERROR;
        default:
          if (statusCode >= 500) {
            return ErrorType.SERVER_ERROR;
          } else if (statusCode >= 400) {
            return ErrorType.CLIENT_ERROR;
          }
      }
    }
    
    // Check message for patterns
    if (message) {
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
        return ErrorType.NETWORK_ERROR;
      }
      if (lowerMessage.includes('auth')) {
        return ErrorType.AUTHENTICATION_ERROR;
      }
      if (lowerMessage.includes('permission') || lowerMessage.includes('forbidden')) {
        return ErrorType.AUTHORIZATION_ERROR;
      }
      if (lowerMessage.includes('not found')) {
        return ErrorType.NOT_FOUND_ERROR;
      }
      if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
        return ErrorType.VALIDATION_ERROR;
      }
    }
    
    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * Determine error severity based on type
   */
  private static determineErrorSeverity(type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.AUTHENTICATION_ERROR:
      case ErrorType.AUTHORIZATION_ERROR:
        return ErrorSeverity.HIGH;
      case ErrorType.SERVER_ERROR:
        return ErrorSeverity.CRITICAL;
      case ErrorType.RATE_LIMIT_ERROR:
      case ErrorType.NETWORK_ERROR:
        return ErrorSeverity.MEDIUM;
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.NOT_FOUND_ERROR:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Get user-friendly error message based on error type
   */
  private static getUserFriendlyMessage(type: ErrorType, originalMessage?: string): string {
    switch (type) {
      case ErrorType.AUTHENTICATION_ERROR:
        return 'Your session has expired. Please refresh the page and sign in again.';
      case ErrorType.AUTHORIZATION_ERROR:
        return 'You do not have permission to perform this action.';
      case ErrorType.NETWORK_ERROR:
        return 'Unable to connect to the server. Please check your internet connection.';
      case ErrorType.NOT_FOUND_ERROR:
        return 'The requested resource was not found.';
      case ErrorType.RATE_LIMIT_ERROR:
        return 'Too many requests. Please wait a moment and try again.';
      case ErrorType.SERVER_ERROR:
        return 'A server error occurred. Our team has been notified. Please try again later.';
      case ErrorType.VALIDATION_ERROR:
        return originalMessage || 'Please check your input and try again.';
      case ErrorType.CLIENT_ERROR:
        return 'There was a problem with your request. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Check if error looks like an HTTP error
   */
  private static isHttpError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const e = error as any;
    return !!(e.status || e.statusCode || e.statusText);
  }

  /**
   * Log error with appropriate level
   */
  private static logError(error: IStructuredError): void {
    const logData = {
      type: error.type,
      severity: error.severity,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      correlationId: error.correlationId,
      details: error.details
    };
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        this.logger.error(`[${error.context || 'Unknown'}] ${error.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(`[${error.context || 'Unknown'}] ${error.message}`, logData);
        break;
      case ErrorSeverity.LOW:
        this.logger.info(`[${error.context || 'Unknown'}] ${error.message}`, logData);
        break;
    }
  }

  /**
   * Generate correlation ID for tracking
   */
  private static generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register callback for error notifications
   */
  public static registerErrorCallback(callback: (error: IStructuredError) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks
   */
  private static notifyCallbacks(error: IStructuredError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (e) {
        console.error('Error in error callback:', e);
      }
    });
  }

  /**
   * Enable or disable error logging
   */
  public static setLogging(enabled: boolean): void {
    this.isLoggingEnabled = enabled;
  }

  /**
   * Create a custom error with specific type
   */
  public static createError(
    type: ErrorType,
    message: string,
    details?: any,
    context?: string
  ): Error {
    const error = new Error(message) as any;
    error.type = type;
    error.details = details;
    error.context = context;
    return error;
  }

  /**
   * Format error for display
   */
  public static formatErrorMessage(error: IStructuredError): string {
    return `${error.userMessage}${error.correlationId ? ` (Ref: ${error.correlationId})` : ''}`;
  }
}