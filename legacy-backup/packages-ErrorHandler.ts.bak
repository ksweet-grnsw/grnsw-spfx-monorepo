export enum ErrorType {
  AuthenticationError = 'AUTHENTICATION_ERROR',
  NetworkError = 'NETWORK_ERROR',
  ValidationError = 'VALIDATION_ERROR',
  UnknownError = 'UNKNOWN_ERROR'
}

export interface IError {
  type: ErrorType;
  message: string;
  details?: unknown;
  timestamp: Date;
}

export class ErrorHandler {
  private static logErrors: boolean = true;

  public static handleError(error: unknown, context?: string): IError {
    const errorObj: IError = {
      type: ErrorType.UnknownError,
      message: 'An unknown error occurred',
      details: error,
      timestamp: new Date()
    };

    // Type guard for error objects
    if (error instanceof Error) {
      errorObj.message = error.message;
    } else if (typeof error === 'object' && error !== null) {
      const err = error as { message?: string; status?: number; name?: string };
      
      if (err.message) {
        errorObj.message = err.message;
      }

      if (err.status === 401 || err.message?.includes('401')) {
        errorObj.type = ErrorType.AuthenticationError;
        errorObj.message = 'Authentication failed. Please check your credentials.';
      } else if (err.status === 403 || err.message?.includes('403')) {
        errorObj.type = ErrorType.AuthenticationError;
        errorObj.message = 'Access forbidden. You may not have permission to access the weather data. Please contact your administrator.';
      } else if (err.name === 'NetworkError' || err.message?.includes('network')) {
        errorObj.type = ErrorType.NetworkError;
        errorObj.message = 'Network error. Please check your connection.';
      } else if (err.status === 400) {
        errorObj.type = ErrorType.ValidationError;
        errorObj.message = 'Invalid request. Please check your input.';
      }
    } else if (typeof error === 'string') {
      errorObj.message = error;
    }

    if (this.logErrors) {
      console.error(`[${context || 'ErrorHandler'}]`, errorObj);
    }

    return errorObj;
  }

  public static setLogging(enabled: boolean): void {
    this.logErrors = enabled;
  }

  public static formatErrorMessage(error: IError): string {
    return `${error.type}: ${error.message}`;
  }
}