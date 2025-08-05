import { Logger } from './Logger';

export interface IError {
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

export class ErrorHandler {
  public static handleError(error: any, context?: string): Error {
    const errorInfo: IError = {
      message: error?.message || 'An unexpected error occurred',
      code: error?.code,
      details: error,
      timestamp: new Date(),
      context
    };

    // Log the error
    Logger.getInstance().error(`[${context || 'Unknown'}] ${errorInfo.message}`, errorInfo);

    // Return a user-friendly error
    if (error?.status === 401) {
      return new Error('Authentication failed. Please refresh the page and try again.');
    } else if (error?.status === 403) {
      return new Error('You do not have permission to perform this action.');
    } else if (error?.status === 404) {
      return new Error('The requested resource was not found.');
    } else if (error?.status === 429) {
      return new Error('Too many requests. Please wait a moment and try again.');
    } else if (error?.status >= 500) {
      return new Error('A server error occurred. Please try again later.');
    }

    return new Error(errorInfo.message);
  }

  public static createError(message: string, code?: string, details?: any): Error {
    const error = new Error(message) as any;
    error.code = code;
    error.details = details;
    return error;
  }
}