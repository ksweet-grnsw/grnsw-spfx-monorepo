import * as React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Props for LazyComponent wrapper
 */
export interface ILazyComponentProps {
  /** Function that returns a dynamic import promise */
  importFunction: () => Promise<{ default: React.ComponentType<any> }>;
  /** Props to pass to the lazy-loaded component */
  componentProps?: any;
  /** Loading component to show while loading */
  fallback?: React.ComponentType | React.ReactElement;
  /** Error component to show on load failure */
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  /** Retry attempts on failure */
  retryAttempts?: number;
  /** Delay before retry (ms) */
  retryDelay?: number;
  /** Whether to preload the component on mount */
  preload?: boolean;
  /** Custom loading text */
  loadingText?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Generic lazy loading component wrapper
 * Provides error handling, retry logic, and loading states
 * 
 * @example
 * ```typescript
 * const LazyChart = () => (
 *   <LazyComponent
 *     importFunction={() => import('./ChartComponent')}
 *     componentProps={{ data: chartData }}
 *     loadingText="Loading chart..."
 *     retryAttempts={3}
 *   />
 * );
 * ```
 */
export const LazyComponent: React.FC<ILazyComponentProps> = ({
  importFunction,
  componentProps = {},
  fallback,
  errorFallback,
  retryAttempts = 3,
  retryDelay = 1000,
  preload = false,
  loadingText = 'Loading component...',
  className = ''
}) => {
  const [LazyLoadedComponent, setLazyLoadedComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const loadComponent = async (attempt = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const module = await importFunction();
      setLazyLoadedComponent(() => module.default);
      setIsLoading(false);
      setAttempts(0);
    } catch (err) {
      console.error('Failed to load component:', err);
      setError(err as Error);
      setIsLoading(false);

      if (attempt < retryAttempts) {
        setTimeout(() => {
          setAttempts(attempt + 1);
          loadComponent(attempt + 1);
        }, retryDelay);
      }
    }
  };

  useEffect(() => {
    if (preload) {
      loadComponent();
    }
  }, [preload]);

  const handleRetry = () => {
    setAttempts(0);
    loadComponent();
  };

  const renderLoading = () => {
    if (fallback) {
      return React.isValidElement(fallback) ? fallback : React.createElement(fallback);
    }
    
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '20px',
        flexDirection: 'column'
      }}>
        <LoadingSpinner showText={true} text={loadingText} />
        {attempts > 0 && (
          <div style={{ 
            marginTop: '10px', 
            fontSize: '12px', 
            color: '#666' 
          }}>
            Retry attempt {attempts}/{retryAttempts}
          </div>
        )}
      </div>
    );
  };

  const renderError = () => {
    if (errorFallback) {
      return React.createElement(errorFallback, { error: error!, retry: handleRetry });
    }

    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        border: '1px solid #ff6b6b',
        borderRadius: '4px',
        backgroundColor: '#ffe0e0',
        color: '#c92a2a'
      }}>
        <h3>Failed to load component</h3>
        <p>{error?.message || 'Unknown error occurred'}</p>
        {attempts < retryAttempts && (
          <button 
            onClick={handleRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry ({retryAttempts - attempts} attempts remaining)
          </button>
        )}
      </div>
    );
  };

  if (error && attempts >= retryAttempts) {
    return <div className={className}>{renderError()}</div>;
  }

  if (isLoading || !LazyLoadedComponent) {
    return <div className={className}>{renderLoading()}</div>;
  }

  return (
    <div className={className}>
      <ErrorBoundary
        fallback={({ error, retry }) => (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Component crashed: {error.message}</p>
            <button onClick={retry}>Reload Component</button>
          </div>
        )}
      >
        <LazyLoadedComponent {...componentProps} />
      </ErrorBoundary>
    </div>
  );
};

/**
 * Hook for creating lazy-loaded components with caching
 */
export const useLazyComponent = <TProps extends Record<string, any>>(
  importFunction: () => Promise<{ default: React.ComponentType<TProps> }>,
  options: {
    preload?: boolean;
    cacheKey?: string;
    retryAttempts?: number;
  } = {}
) => {
  const { preload = false, cacheKey, retryAttempts = 3 } = options;
  
  const [component, setComponent] = useState<React.ComponentType<TProps> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Simple component cache
  const componentCache = React.useMemo(() => new Map<string, React.ComponentType<any>>(), []);

  const loadComponent = React.useCallback(async () => {
    if (cacheKey && componentCache.has(cacheKey)) {
      setComponent(componentCache.get(cacheKey));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const module = await importFunction();
      const ComponentToLoad = module.default;
      
      setComponent(() => ComponentToLoad);
      
      if (cacheKey) {
        componentCache.set(cacheKey, ComponentToLoad);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [importFunction, cacheKey, componentCache]);

  React.useEffect(() => {
    if (preload) {
      loadComponent();
    }
  }, [preload, loadComponent]);

  return {
    Component: component,
    loading,
    error,
    loadComponent
  };
};

/**
 * Factory function for creating lazy-loaded components
 * Provides a cleaner API for defining lazy components
 * 
 * @example
 * ```typescript
 * const LazyChartComponent = createLazyComponent(
 *   () => import('./charts/ChartComponent'),
 *   {
 *     loadingText: 'Loading chart...',
 *     preload: false,
 *     retryAttempts: 2
 *   }
 * );
 * 
 * // Usage
 * <LazyChartComponent data={chartData} onDataChange={handleDataChange} />
 * ```
 */
export const createLazyComponent = <TProps extends Record<string, any>>(
  importFunction: () => Promise<{ default: React.ComponentType<TProps> }>,
  options: Omit<ILazyComponentProps, 'importFunction' | 'componentProps'> = {}
) => {
  const LazyComponentWrapper: React.FC<TProps> = (props) => (
    <LazyComponent
      importFunction={importFunction}
      componentProps={props}
      {...options}
    />
  );

  LazyComponentWrapper.displayName = `Lazy(${importFunction.name || 'Component'})`;
  
  return LazyComponentWrapper;
};

/**
 * Preloading utilities for better performance
 */
export const PreloadUtils = {
  /**
   * Preload a component without rendering it
   */
  preloadComponent: async (importFunction: () => Promise<any>) => {
    try {
      await importFunction();
    } catch (error) {
      console.warn('Failed to preload component:', error);
    }
  },

  /**
   * Preload multiple components
   */
  preloadComponents: async (importFunctions: Array<() => Promise<any>>) => {
    const preloadPromises = importFunctions.map(fn => 
      PreloadUtils.preloadComponent(fn)
    );
    
    await Promise.allSettled(preloadPromises);
  },

  /**
   * Preload component on user interaction (hover, focus)
   */
  usePreloadOnInteraction: (
    importFunction: () => Promise<any>,
    triggerRef: React.RefObject<HTMLElement>
  ) => {
    React.useEffect(() => {
      const element = triggerRef.current;
      if (!element) return;

      let preloaded = false;
      
      const handleInteraction = () => {
        if (!preloaded) {
          preloaded = true;
          PreloadUtils.preloadComponent(importFunction);
        }
      };

      element.addEventListener('mouseenter', handleInteraction);
      element.addEventListener('focus', handleInteraction);

      return () => {
        element.removeEventListener('mouseenter', handleInteraction);
        element.removeEventListener('focus', handleInteraction);
      };
    }, [importFunction, triggerRef]);
  },

  /**
   * Preload component when it's about to enter viewport
   */
  usePreloadOnIntersection: (
    importFunction: () => Promise<any>,
    options: IntersectionObserverInit = { rootMargin: '50px' }
  ) => {
    const [elementRef, setElementRef] = useState<HTMLElement | null>(null);

    React.useEffect(() => {
      if (!elementRef) return;

      let preloaded = false;
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !preloaded) {
            preloaded = true;
            PreloadUtils.preloadComponent(importFunction);
          }
        },
        options
      );

      observer.observe(elementRef);

      return () => {
        observer.disconnect();
      };
    }, [elementRef, importFunction, options]);

    return setElementRef;
  }
};

/**
 * Common lazy-loaded component patterns
 */
export const LazyPatterns = {
  /**
   * Lazy chart component with chart.js
   */
  LazyChart: createLazyComponent(
    () => import(/* webpackChunkName: "chart-components" */ './charts/ChartComponent'),
    { loadingText: 'Loading chart...', preload: false }
  ),

  /**
   * Lazy data table with large datasets
   */
  LazyDataTable: createLazyComponent(
    () => import(/* webpackChunkName: "table-components" */ './tables/DataTable'),
    { loadingText: 'Loading data table...', preload: false }
  ),

  /**
   * Lazy advanced analytics components
   */
  LazyAnalytics: createLazyComponent(
    () => import(/* webpackChunkName: "analytics-components" */ './analytics/AnalyticsComponent'),
    { loadingText: 'Loading analytics...', preload: false, retryAttempts: 2 }
  ),

  /**
   * Lazy export/reporting components
   */
  LazyReporting: createLazyComponent(
    () => import(/* webpackChunkName: "reporting-components" */ './reporting/ReportingComponent'),
    { loadingText: 'Loading reporting tools...', preload: false }
  )
};