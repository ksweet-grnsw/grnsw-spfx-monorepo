import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Loading state interface
 */
export interface ILoadingState {
  /** Whether currently loading */
  isLoading: boolean;
  /** Current loading message */
  message: string;
  /** Loading progress (0-100) */
  progress: number;
  /** Error state */
  error: string | null;
}

/**
 * Return type for useLoadingState hook
 */
export interface IUseLoadingStateReturn {
  /** Current loading state */
  loadingState: ILoadingState;
  /** Start loading with optional message */
  startLoading: (message?: string) => void;
  /** Stop loading */
  stopLoading: () => void;
  /** Update loading message */
  updateMessage: (message: string) => void;
  /** Update loading progress */
  updateProgress: (progress: number) => void;
  /** Set error state */
  setError: (error: string | null) => void;
  /** Clear error state */
  clearError: () => void;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Custom hook for managing loading states in components
 * Provides consistent loading state management with progress tracking
 * 
 * @param initialMessage - Initial loading message
 * @returns Loading state and control functions
 * 
 * @example
 * ```typescript
 * const { loadingState, startLoading, stopLoading, updateProgress } = useLoadingState();
 * 
 * const loadData = async () => {
 *   startLoading('Loading injury data...');
 *   try {
 *     updateProgress(25);
 *     const injuries = await injuryService.getInjuries();
 *     updateProgress(50);
 *     const stats = await injuryService.getStats();
 *     updateProgress(100);
 *     stopLoading();
 *   } catch (error) {
 *     setError(error.message);
 *   }
 * };
 * ```
 */
export const useLoadingState = (initialMessage = 'Loading...'): IUseLoadingStateReturn => {
  const [loadingState, setLoadingState] = useState<ILoadingState>({
    isLoading: false,
    message: initialMessage,
    progress: 0,
    error: null
  });

  const startLoading = useCallback((message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      message: message || prev.message,
      progress: 0,
      error: null
    }));
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100
    }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress))
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setLoadingState(prev => ({
      ...prev,
      error,
      isLoading: false
    }));
  }, []);

  const clearError = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  const reset = useCallback(() => {
    setLoadingState({
      isLoading: false,
      message: initialMessage,
      progress: 0,
      error: null
    });
  }, [initialMessage]);

  return {
    loadingState,
    startLoading,
    stopLoading,
    updateMessage,
    updateProgress,
    setError,
    clearError,
    reset
  };
};

/**
 * Options for useAsyncOperation hook
 */
export interface IAsyncOperationOptions {
  /** Minimum loading time in milliseconds (prevents flashing) */
  minLoadingTime?: number;
  /** Whether to show progress updates */
  showProgress?: boolean;
  /** Whether to clear previous errors when starting new operation */
  clearErrorOnStart?: boolean;
}

/**
 * Return type for useAsyncOperation hook
 */
export interface IUseAsyncOperationReturn<T> {
  /** Current loading state */
  loadingState: ILoadingState;
  /** Result of the async operation */
  data: T | null;
  /** Execute the async operation */
  execute: (operation: () => Promise<T>, message?: string) => Promise<T | null>;
  /** Reset state and clear data */
  reset: () => void;
}

/**
 * Custom hook for handling async operations with loading states
 * Provides automatic loading state management for async functions
 * 
 * @param options - Configuration options
 * @returns Loading state, data, and execute function
 * 
 * @example
 * ```typescript
 * const { loadingState, data, execute } = useAsyncOperation<InjuryData[]>();
 * 
 * const loadInjuries = () => execute(
 *   () => injuryService.getInjuries(),
 *   'Loading injury data...'
 * );
 * 
 * // In component
 * {loadingState.isLoading ? <LoadingSpinner /> : <DataGrid data={data} />}
 * ```
 */
export const useAsyncOperation = <T>(
  options: IAsyncOperationOptions = {}
): IUseAsyncOperationReturn<T> => {
  const {
    minLoadingTime = 300,
    showProgress = false,
    clearErrorOnStart = true
  } = options;

  const {
    loadingState,
    startLoading,
    stopLoading,
    updateProgress,
    setError,
    reset: resetLoading
  } = useLoadingState();

  const [data, setData] = useState<T | null>(null);
  const operationIdRef = useRef(0);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    message?: string
  ): Promise<T | null> => {
    const currentOperationId = ++operationIdRef.current;
    const startTime = Date.now();

    if (clearErrorOnStart) {
      resetLoading();
    }

    startLoading(message);

    try {
      if (showProgress) {
        updateProgress(10);
      }

      const result = await operation();

      // Check if this operation is still current (prevents race conditions)
      if (currentOperationId !== operationIdRef.current) {
        return null;
      }

      if (showProgress) {
        updateProgress(90);
      }

      // Ensure minimum loading time to prevent flashing
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadingTime - elapsed);

      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      if (showProgress) {
        updateProgress(100);
      }

      setData(result);
      stopLoading();
      return result;

    } catch (error: any) {
      // Check if this operation is still current
      if (currentOperationId !== operationIdRef.current) {
        return null;
      }

      setError(error.message || 'An error occurred');
      setData(null);
      return null;
    }
  }, [
    startLoading,
    stopLoading,
    updateProgress,
    setError,
    resetLoading,
    minLoadingTime,
    showProgress,
    clearErrorOnStart
  ]);

  const reset = useCallback(() => {
    operationIdRef.current = 0;
    setData(null);
    resetLoading();
  }, [resetLoading]);

  return {
    loadingState,
    data,
    execute,
    reset
  };
};

/**
 * Options for useProgressiveLoading hook
 */
export interface IProgressiveLoadingOptions {
  /** Delay between loading steps in milliseconds */
  stepDelay?: number;
  /** Whether to continue loading remaining steps on error */
  continueOnError?: boolean;
}

/**
 * Step definition for progressive loading
 */
export interface IProgressiveStep<T = any> {
  /** Unique identifier for the step */
  id: string;
  /** Display name for the step */
  name: string;
  /** Function to execute for this step */
  execute: () => Promise<T>;
  /** Whether this step is optional (continues on error) */
  optional?: boolean;
}

/**
 * Result of a progressive loading step
 */
export interface IProgressiveStepResult<T = any> {
  /** Step identifier */
  id: string;
  /** Step name */
  name: string;
  /** Whether step completed successfully */
  success: boolean;
  /** Result data if successful */
  data?: T;
  /** Error message if failed */
  error?: string;
}

/**
 * Return type for useProgressiveLoading hook
 */
export interface IUseProgressiveLoadingReturn<T = any> {
  /** Current loading state */
  loadingState: ILoadingState;
  /** Results from completed steps */
  results: IProgressiveStepResult<T>[];
  /** Current step being executed */
  currentStep: string | null;
  /** Execute all steps progressively */
  executeSteps: (steps: IProgressiveStep<T>[]) => Promise<IProgressiveStepResult<T>[]>;
  /** Reset state */
  reset: () => void;
}

/**
 * Custom hook for progressive loading of multiple async operations
 * Executes steps sequentially with progress updates and partial results
 * 
 * @param options - Configuration options
 * @returns Progressive loading state and control functions
 * 
 * @example
 * ```typescript
 * const { loadingState, results, executeSteps } = useProgressiveLoading();
 * 
 * const loadDashboard = () => executeSteps([
 *   { id: 'injuries', name: 'Loading injuries...', execute: () => injuryService.getInjuries() },
 *   { id: 'stats', name: 'Calculating statistics...', execute: () => injuryService.getStats() },
 *   { id: 'charts', name: 'Preparing charts...', execute: () => chartService.generateCharts() }
 * ]);
 * ```
 */
export const useProgressiveLoading = <T = any>(
  options: IProgressiveLoadingOptions = {}
): IUseProgressiveLoadingReturn<T> => {
  const { stepDelay = 100, continueOnError = false } = options;

  const {
    loadingState,
    startLoading,
    stopLoading,
    updateMessage,
    updateProgress,
    setError
  } = useLoadingState();

  const [results, setResults] = useState<IProgressiveStepResult<T>[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const executeSteps = useCallback(async (
    steps: IProgressiveStep<T>[]
  ): Promise<IProgressiveStepResult<T>[]> => {
    if (steps.length === 0) return [];

    setResults([]);
    setCurrentStep(null);
    startLoading('Starting...');

    const stepResults: IProgressiveStepResult<T>[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const progress = (i / steps.length) * 100;

      setCurrentStep(step.id);
      updateMessage(step.name);
      updateProgress(progress);

      try {
        const data = await step.execute();
        const result: IProgressiveStepResult<T> = {
          id: step.id,
          name: step.name,
          success: true,
          data
        };

        stepResults.push(result);
        setResults([...stepResults]);

        // Small delay between steps for better UX
        if (stepDelay > 0 && i < steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, stepDelay));
        }

      } catch (error: any) {
        const result: IProgressiveStepResult<T> = {
          id: step.id,
          name: step.name,
          success: false,
          error: error.message || 'Step failed'
        };

        stepResults.push(result);
        setResults([...stepResults]);

        if (!step.optional && !continueOnError) {
          setError(`Failed at step: ${step.name}`);
          setCurrentStep(null);
          return stepResults;
        }
      }
    }

    updateProgress(100);
    stopLoading();
    setCurrentStep(null);
    return stepResults;

  }, [startLoading, stopLoading, updateMessage, updateProgress, setError, stepDelay, continueOnError]);

  const reset = useCallback(() => {
    setResults([]);
    setCurrentStep(null);
  }, []);

  return {
    loadingState,
    results,
    currentStep,
    executeSteps,
    reset
  };
};