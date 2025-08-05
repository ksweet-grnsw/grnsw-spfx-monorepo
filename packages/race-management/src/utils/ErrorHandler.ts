export enum ErrorType {
  AuthenticationError = 'AUTHENTICATION_ERROR',
  NetworkError = 'NETWORK_ERROR',
  ValidationError = 'VALIDATION_ERROR',
  UnknownError = 'UNKNOWN_ERROR'
}

export interface IError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}

export class ErrorHandler {
  private static logErrors: boolean = true;

  public static handleError(error: any, context?: string): IError {
    const errorObj: IError = {
      type: ErrorType.UnknownError,
      message: 'An unknown error occurred',
      details: error,
      timestamp: new Date()
    };

    if (error.message) {
      errorObj.message = error.message;
    }

    if (error.status === 401 || error.message?.includes('401')) {
      errorObj.type = ErrorType.AuthenticationError;
      errorObj.message = 'Authentication failed. Please check your credentials.';
    } else if (error.name === 'NetworkError' || error.message?.includes('network')) {
      errorObj.type = ErrorType.NetworkError;
      errorObj.message = 'Network error. Please check your connection.';
    } else if (error.status === 400) {
      errorObj.type = ErrorType.ValidationError;
      errorObj.message = 'Invalid request. Please check your input.';
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