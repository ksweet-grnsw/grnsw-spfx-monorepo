import { useEffect, useRef, useCallback } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { TelemetryService, ITelemetryConfig, TelemetrySeverity } from '../services/TelemetryService';

/**
 * Options for useTelemetry hook
 */
export interface IUseTelemetryOptions extends Partial<ITelemetryConfig> {
  /** Component name for tracking context */
  componentName?: string;
  /** Whether to auto-track component mount/unmount */
  autoTrackLifecycle?: boolean;
  /** Whether to auto-track page views */
  autoTrackPageViews?: boolean;
}

/**
 * Return type for useTelemetry hook
 */
export interface IUseTelemetryReturn {
  /** Telemetry service instance */
  telemetry: TelemetryService | null;
  /** Track user action */
  trackAction: (action: string, target: string, data?: Record<string, any>) => void;
  /** Track performance with timer */
  trackPerformance: <T>(
    operationName: string, 
    operation: () => Promise<T>
  ) => Promise<T>;
  /** Track error with context */
  trackError: (error: Error | string, source?: string, userAction?: string) => void;
  /** Track business metric */
  trackMetric: (category: string, name: string, value: number, unit?: string) => void;
  /** Track custom event */
  trackEvent: (name: string, properties?: Record<string, string>, measurements?: Record<string, number>) => void;
  /** Flush telemetry data immediately */
  flush: () => void;
}

/**
 * Custom hook for telemetry integration
 * Provides easy-to-use telemetry functions for React components
 * 
 * @param context - SharePoint WebPart context
 * @param options - Telemetry configuration options
 * @returns Telemetry service and helper functions
 * 
 * @example
 * ```typescript
 * const { trackAction, trackPerformance, trackError } = useTelemetry(context, {
 *   componentName: 'SafetyDashboard',
 *   enabled: true,
 *   autoTrackLifecycle: true
 * });
 * 
 * const loadData = async () => {
 *   trackAction('click', 'load_data_button');
 *   
 *   try {
 *     const data = await trackPerformance('load_safety_data', 
 *       () => safetyService.getData()
 *     );
 *     setData(data);
 *   } catch (error) {
 *     trackError(error, 'safety_service', 'load_data');
 *   }
 * };
 * ```
 */
export const useTelemetry = (
  context: WebPartContext,
  options: IUseTelemetryOptions = {}
): IUseTelemetryReturn => {
  const {
    componentName = 'UnknownComponent',
    autoTrackLifecycle = true,
    autoTrackPageViews = false,
    ...telemetryConfig
  } = options;

  const telemetryRef = useRef<TelemetryService | null>(null);

  // Initialize telemetry service
  useEffect(() => {
    if (!context) return;

    const defaultConfig: Partial<ITelemetryConfig> = {
      enabled: true,
      logToConsole: process.env.NODE_ENV === 'development',
      autoTrackPageViews: autoTrackPageViews,
      trackSessions: true,
      bufferSize: 50,
      sendInterval: 10000
    };

    const finalConfig = { ...defaultConfig, ...telemetryConfig };
    
    telemetryRef.current = new TelemetryService(context, finalConfig);

    // Auto-track component mount
    if (autoTrackLifecycle) {
      telemetryRef.current.trackUserAction('component_mount', componentName);
    }

    return () => {
      // Auto-track component unmount
      if (autoTrackLifecycle && telemetryRef.current) {
        telemetryRef.current.trackUserAction('component_unmount', componentName);
      }
      
      telemetryRef.current?.dispose();
      telemetryRef.current = null;
    };
  }, [context, componentName, autoTrackLifecycle, autoTrackPageViews]);

  // Track user action
  const trackAction = useCallback((
    action: string, 
    target: string, 
    data?: Record<string, any>
  ) => {
    telemetryRef.current?.trackUserAction(action, target, {
      component: componentName,
      ...data
    });
  }, [componentName]);

  // Track performance with automatic timing
  const trackPerformance = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    if (!telemetryRef.current) {
      return await operation();
    }

    const timer = telemetryRef.current.startTimer(operationName);
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      timer.stop({ 
        success: true, 
        properties: { 
          component: componentName,
          operationName 
        },
        metrics: { duration }
      });

      return result;

    } catch (error: any) {
      timer.stop({ 
        success: false,
        properties: { 
          component: componentName,
          operationName,
          error: error.message 
        }
      });

      throw error;
    }
  }, [componentName]);

  // Track error with component context
  const trackError = useCallback((
    error: Error | string,
    source?: string,
    userAction?: string
  ) => {
    telemetryRef.current?.trackError(error, source || componentName, userAction, {
      component: componentName,
      page: window.location.pathname
    });
  }, [componentName]);

  // Track business metric
  const trackMetric = useCallback((
    category: string,
    name: string,
    value: number,
    unit?: string
  ) => {
    telemetryRef.current?.trackBusinessMetric(category, name, value, unit, {
      component: componentName
    });
  }, [componentName]);

  // Track custom event
  const trackEvent = useCallback((
    name: string,
    properties?: Record<string, string>,
    measurements?: Record<string, number>
  ) => {
    telemetryRef.current?.trackEvent({
      name,
      properties: {
        component: componentName,
        ...properties
      },
      measurements,
      severity: TelemetrySeverity.Information
    });
  }, [componentName]);

  // Flush telemetry data
  const flush = useCallback(() => {
    telemetryRef.current?.flush();
  }, []);

  return {
    telemetry: telemetryRef.current,
    trackAction,
    trackPerformance,
    trackError,
    trackMetric,
    trackEvent,
    flush
  };
};

/**
 * Hook for API service telemetry integration
 * Automatically wraps service calls with performance tracking
 * 
 * @param context - SharePoint WebPart context  
 * @param serviceName - Name of the service for tracking
 * @returns Enhanced service wrapper with telemetry
 * 
 * @example
 * ```typescript
 * const enhancedService = useServiceTelemetry(context, 'InjuryService', injuryService);
 * 
 * // All calls are automatically tracked
 * const data = await enhancedService.getInjuries();
 * ```
 */
export const useServiceTelemetry = <TService extends Record<string, any>>(
  context: WebPartContext,
  serviceName: string,
  service: TService
): TService => {
  const { trackPerformance, trackError } = useTelemetry(context, {
    componentName: serviceName,
    autoTrackLifecycle: false
  });

  const enhancedService = useRef<TService>();

  useEffect(() => {
    if (!service) return;

    const enhanced = {} as TService;

    // Wrap all methods with telemetry
    Object.keys(service).forEach(methodName => {
      const originalMethod = service[methodName];
      
      if (typeof originalMethod === 'function') {
        enhanced[methodName] = async (...args: any[]) => {
          try {
            return await trackPerformance(
              `${serviceName}.${methodName}`,
              () => originalMethod.apply(service, args)
            );
          } catch (error: any) {
            trackError(error, serviceName, methodName);
            throw error;
          }
        };
      } else {
        enhanced[methodName] = originalMethod;
      }
    });

    enhancedService.current = enhanced;
  }, [service, serviceName, trackPerformance, trackError]);

  return enhancedService.current || service;
};

/**
 * Hook for dashboard-specific telemetry
 * Provides common dashboard tracking patterns
 * 
 * @param context - SharePoint WebPart context
 * @param dashboardType - Type of dashboard (safety, race, weather, etc.)
 * @returns Dashboard-specific telemetry functions
 */
export const useDashboardTelemetry = (
  context: WebPartContext,
  dashboardType: string
) => {
  const { trackAction, trackMetric, trackPerformance, trackError } = useTelemetry(context, {
    componentName: `${dashboardType}_dashboard`,
    autoTrackLifecycle: true,
    autoTrackPageViews: true
  });

  // Track dashboard view
  const trackDashboardView = useCallback((viewType?: string) => {
    trackAction('dashboard_view', dashboardType, { viewType });
  }, [dashboardType, trackAction]);

  // Track data refresh
  const trackDataRefresh = useCallback(() => {
    trackAction('refresh', `${dashboardType}_data`);
  }, [dashboardType, trackAction]);

  // Track filter usage
  const trackFilterChange = useCallback((filterType: string, filterValue: string) => {
    trackAction('filter_change', `${dashboardType}_filter`, {
      filterType,
      filterValue
    });
  }, [dashboardType, trackAction]);

  // Track export actions
  const trackExport = useCallback((exportType: string, recordCount: number) => {
    trackAction('export', `${dashboardType}_data`, {
      exportType,
      recordCount: recordCount.toString()
    });
    
    trackMetric('exports', `${dashboardType}_exports`, 1, 'count');
  }, [dashboardType, trackAction, trackMetric]);

  // Track dashboard load performance
  const trackDashboardLoad = useCallback(async <T>(
    loadOperation: () => Promise<T>
  ): Promise<T> => {
    return await trackPerformance(`load_${dashboardType}_dashboard`, loadOperation);
  }, [dashboardType, trackPerformance]);

  return {
    trackDashboardView,
    trackDataRefresh,
    trackFilterChange,
    trackExport,
    trackDashboardLoad,
    trackAction,
    trackMetric,
    trackPerformance,
    trackError
  };
};