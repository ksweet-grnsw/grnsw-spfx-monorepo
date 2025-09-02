import { useState, useCallback } from 'react';

/**
 * Error state interface for the error handler hook
 */
export interface IErrorState {
  /** Whether an error is currently active */
  hasError: boolean;
  /** The current error object */
  error: Error | null;
  /** Timestamp when the error occurred */
  timestamp?: Date;
}

/**
 * Return type for the useErrorHandler hook
 */
export interface IUseErrorHandlerReturn {
  /** Current error state */
  errorState: IErrorState;
  /** Function to handle/set an error */
  handleError: (error: Error) => void;
  /** Function to clear the current error */
  clearError: () => void;
  /** Function to retry the last operation that failed */
  retry: () => void;
}

/**
 * Custom React hook for managing error states in SPFx components
 * Provides a consistent way to handle and display errors from async operations
 * 
 * @param onRetry - Optional callback function to execute when retry is triggered
 * @returns Object with error state and handler functions
 * 
 * @example
 * ```typescript
 * const MyDataComponent: React.FC = () => {
 *   const { errorState, handleError, clearError, retry } = useErrorHandler(
 *     () => loadDataFromDataverse()
 *   );
 * 
 *   const loadData = async () => {
 *     try {
 *       clearError();
 *       const data = await dataverseService.getInjuryData();
 *       setData(data);
 *     } catch (error) {
 *       handleError(error as Error);
 *     }
 *   };
 * 
 *   if (errorState.hasError) {
 *     return <ErrorDisplay error={errorState.error} onRetry={retry} />;
 *   }
 * 
 *   return <DataGrid data={data} />;
 * };
 * ```
 */
export const useErrorHandler = (onRetry?: () => void | Promise<void>): IUseErrorHandlerReturn => {
  const [errorState, setErrorState] = useState<IErrorState>({
    hasError: false,
    error: null
  });

  /**
   * Handles an error by setting it in the error state
   * @param error - The error to handle
   */
  const handleError = useCallback((error: Error): void => {
    console.error('Error handled by useErrorHandler:', error);
    
    setErrorState({
      hasError: true,
      error,
      timestamp: new Date()
    });

    // Could integrate with telemetry here
    // Example: trackException(error);
  }, []);

  /**
   * Clears the current error state
   */
  const clearError = useCallback((): void => {
    setErrorState({
      hasError: false,
      error: null
    });
  }, []);

  /**
   * Retries the operation by clearing the error and calling the onRetry callback
   */
  const retry = useCallback(async (): Promise<void> => {
    if (onRetry) {
      clearError();
      try {
        await onRetry();
      } catch (error) {
        handleError(error as Error);
      }
    }
  }, [onRetry, clearError, handleError]);

  return {
    errorState,
    handleError,
    clearError,
    retry
  };
};

/**
 * Specialized error handler hook for Dataverse operations
 * Includes additional context and error categorization for Dataverse-specific errors
 * 
 * @param onRetry - Optional callback function to execute when retry is triggered
 * @returns Object with error state and handler functions, plus Dataverse-specific utilities
 * 
 * @example
 * ```typescript
 * const { errorState, handleError, clearError, retry, isAuthError } = useDataverseErrorHandler(
 *   () => injuryService.getInjuryData()
 * );
 * 
 * useEffect(() => {
 *   loadData().catch(handleError);
 * }, []);
 * 
 * if (errorState.hasError && isAuthError(errorState.error)) {
 *   return <AuthenticationPrompt onRetry={retry} />;
 * }
 * ```
 */
export const useDataverseErrorHandler = (onRetry?: () => void | Promise<void>) => {
  const baseHandler = useErrorHandler(onRetry);

  /**
   * Determines if an error is related to authentication
   */
  const isAuthError = useCallback((error: Error | null): boolean => {
    if (!error) return false;
    const message = error.message.toLowerCase();
    return message.includes('401') || 
           message.includes('unauthorized') || 
           message.includes('authentication');
  }, []);

  /**
   * Determines if an error is related to permissions
   */
  const isPermissionError = useCallback((error: Error | null): boolean => {
    if (!error) return false;
    const message = error.message.toLowerCase();
    return message.includes('403') || 
           message.includes('forbidden') || 
           message.includes('access denied');
  }, []);

  /**
   * Determines if an error is related to network connectivity
   */
  const isNetworkError = useCallback((error: Error | null): boolean => {
    if (!error) return false;
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('fetch');
  }, []);

  /**
   * Gets a user-friendly error message based on the error type
   */
  const getFriendlyMessage = useCallback((error: Error | null): string => {
    if (!error) return '';
    
    if (isAuthError(error)) {
      return 'Please sign in again to access this data.';
    }
    
    if (isPermissionError(error)) {
      return 'You don\'t have permission to access this data.';
    }
    
    if (isNetworkError(error)) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    return 'An unexpected error occurred while loading data.';
  }, [isAuthError, isPermissionError, isNetworkError]);

  return {
    ...baseHandler,
    isAuthError,
    isPermissionError,
    isNetworkError,
    getFriendlyMessage
  };
};