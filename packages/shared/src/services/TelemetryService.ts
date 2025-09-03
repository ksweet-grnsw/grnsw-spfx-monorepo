import { WebPartContext } from '@microsoft/sp-webpart-base';

/**
 * Telemetry event severity levels
 */
export enum TelemetrySeverity {
  Verbose = 0,
  Information = 1,
  Warning = 2,
  Error = 3,
  Critical = 4
}

/**
 * Base telemetry event interface
 */
export interface ITelemetryEvent {
  /** Event name/identifier */
  name: string;
  /** Custom properties for the event */
  properties?: Record<string, string>;
  /** Numeric measurements for the event */
  measurements?: Record<string, number>;
  /** Event timestamp */
  timestamp?: Date;
  /** Event severity level */
  severity?: TelemetrySeverity;
}

/**
 * Performance tracking event
 */
export interface IPerformanceEvent extends ITelemetryEvent {
  /** Operation name */
  operationName: string;
  /** Duration in milliseconds */
  duration: number;
  /** Whether operation was successful */
  success: boolean;
  /** Additional performance metrics */
  metrics?: {
    /** API response time */
    apiResponseTime?: number;
    /** Render time */
    renderTime?: number;
    /** Cache hit/miss */
    cacheHit?: boolean;
    /** Data size in bytes */
    dataSize?: number;
  };
}

/**
 * Error tracking event
 */
export interface IErrorEvent extends ITelemetryEvent {
  /** Error message */
  message: string;
  /** Error stack trace */
  stack?: string;
  /** Error source/component */
  source?: string;
  /** User action that triggered error */
  userAction?: string;
  /** Additional error context */
  context?: {
    /** Current page/route */
    page?: string;
    /** User ID (if available) */
    userId?: string;
    /** Session ID */
    sessionId?: string;
    /** Browser info */
    browser?: string;
  };
}

/**
 * User action tracking event
 */
export interface IUserEvent extends ITelemetryEvent {
  /** Action type (click, view, search, etc.) */
  action: string;
  /** Target element or feature */
  target: string;
  /** Additional action data */
  data?: Record<string, any>;
}

/**
 * Business metric event
 */
export interface IBusinessEvent extends ITelemetryEvent {
  /** Metric category (dashboard, data, user, etc.) */
  category: string;
  /** Metric value */
  value: number;
  /** Metric unit */
  unit?: string;
}

/**
 * Configuration for telemetry service
 */
export interface ITelemetryConfig {
  /** Application Insights instrumentation key */
  instrumentationKey?: string;
  /** Whether telemetry is enabled */
  enabled: boolean;
  /** Whether to log events to console in development */
  logToConsole: boolean;
  /** Custom endpoint for telemetry data */
  endpoint?: string;
  /** Maximum events to buffer before sending */
  bufferSize: number;
  /** Send interval in milliseconds */
  sendInterval: number;
  /** Whether to track page views automatically */
  autoTrackPageViews: boolean;
  /** Whether to track user sessions */
  trackSessions: boolean;
}

/**
 * Comprehensive telemetry service for monitoring, analytics, and error tracking
 * Provides centralized logging for performance, errors, user actions, and business metrics
 * 
 * @example
 * ```typescript
 * const telemetry = new TelemetryService(context, {
 *   enabled: true,
 *   instrumentationKey: 'your-app-insights-key'
 * });
 * 
 * // Track user actions
 * telemetry.trackUserAction('dashboard_view', 'safety_dashboard', { trackName: 'Wentworth Park' });
 * 
 * // Track performance
 * const timer = telemetry.startTimer('load_injury_data');
 * const data = await injuryService.getInjuries();
 * timer.stop({ success: true, recordCount: data.length });
 * 
 * // Track errors
 * telemetry.trackError(error, 'injury_service', 'loading_dashboard_data');
 * ```
 */
export class TelemetryService {
  private context: WebPartContext;
  private config: ITelemetryConfig;
  private eventBuffer: ITelemetryEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private sendTimer?: number;
  private pageLoadTime: number;

  private readonly DEFAULT_CONFIG: ITelemetryConfig = {
    enabled: true,
    logToConsole: process.env.NODE_ENV === 'development',
    bufferSize: 50,
    sendInterval: 10000, // 10 seconds
    autoTrackPageViews: true,
    trackSessions: true
  };

  constructor(context: WebPartContext, config: Partial<ITelemetryConfig> = {}) {
    this.context = context;
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.pageLoadTime = Date.now();
    
    // Extract user information if available
    this.userId = context.pageContext.user?.email || context.pageContext.user?.displayName;

    // Start telemetry if enabled
    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Initialize telemetry service
   * @private
   */
  private initialize(): void {
    // Auto-track page view if enabled
    if (this.config.autoTrackPageViews) {
      this.trackPageView();
    }

    // Start session tracking
    if (this.config.trackSessions) {
      this.trackEvent({
        name: 'session_start',
        properties: {
          sessionId: this.sessionId,
          userId: this.userId || 'anonymous',
          pageUrl: window.location.href,
          webPartId: this.context.instanceId
        },
        severity: TelemetrySeverity.Information
      });
    }

    // Set up periodic sending
    this.startPeriodicSend();

    // Track page unload
    window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
  }

  /**
   * Track a generic telemetry event
   * @param event - Event data to track
   */
  public trackEvent(event: ITelemetryEvent): void {
    if (!this.config.enabled) return;

    const enrichedEvent: ITelemetryEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
      properties: {
        sessionId: this.sessionId,
        userId: this.userId || 'anonymous',
        webPartId: this.context.instanceId,
        pageUrl: window.location.href,
        ...event.properties
      }
    };

    this.addToBuffer(enrichedEvent);

    // Telemetry event tracked
  }

  /**
   * Track user action/interaction
   * @param action - Action type (click, view, search, etc.)
   * @param target - Target element or feature
   * @param data - Additional data about the action
   */
  public trackUserAction(action: string, target: string, data?: Record<string, any>): void {
    const userEvent: IUserEvent = {
      name: 'user_action',
      action,
      target,
      data,
      properties: {
        action,
        target,
        ...(data && { actionData: JSON.stringify(data) })
      },
      severity: TelemetrySeverity.Information
    };

    this.trackEvent(userEvent);
  }

  /**
   * Track performance metrics
   * @param event - Performance event data
   */
  public trackPerformance(event: IPerformanceEvent): void {
    const perfEvent: ITelemetryEvent = {
      name: 'performance',
      properties: {
        operationName: event.operationName,
        success: event.success.toString(),
        ...(event.metrics?.cacheHit !== undefined && { cacheHit: event.metrics.cacheHit.toString() }),
        ...event.properties
      },
      measurements: {
        duration: event.duration,
        ...(event.metrics?.apiResponseTime && { apiResponseTime: event.metrics.apiResponseTime }),
        ...(event.metrics?.renderTime && { renderTime: event.metrics.renderTime }),
        ...(event.metrics?.dataSize && { dataSize: event.metrics.dataSize }),
        ...event.measurements
      },
      severity: event.success ? TelemetrySeverity.Information : TelemetrySeverity.Warning
    };

    this.trackEvent(perfEvent);
  }

  /**
   * Track errors with context
   * @param error - Error object or message
   * @param source - Error source/component
   * @param userAction - User action that triggered the error
   * @param context - Additional context
   */
  public trackError(
    error: Error | string, 
    source?: string, 
    userAction?: string,
    context?: IErrorEvent['context']
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'object' ? error.stack : undefined;

    const errorEvent: IErrorEvent = {
      name: 'error',
      message: errorMessage,
      stack: errorStack,
      source,
      userAction,
      context: {
        page: window.location.pathname,
        userId: this.userId,
        sessionId: this.sessionId,
        browser: navigator.userAgent,
        ...context
      },
      properties: {
        errorMessage,
        source: source || 'unknown',
        userAction: userAction || 'unknown',
        page: window.location.pathname,
        ...(errorStack && { stack: errorStack.substring(0, 1000) }) // Limit stack trace length
      },
      severity: TelemetrySeverity.Error
    };

    this.trackEvent(errorEvent);
  }

  /**
   * Track business metrics
   * @param category - Metric category
   * @param name - Metric name
   * @param value - Metric value
   * @param unit - Metric unit
   * @param properties - Additional properties
   */
  public trackBusinessMetric(
    category: string,
    name: string,
    value: number,
    unit?: string,
    properties?: Record<string, string>
  ): void {
    const businessEvent: IBusinessEvent = {
      name: 'business_metric',
      category,
      value,
      unit,
      properties: {
        category,
        metricName: name,
        ...(unit && { unit }),
        ...properties
      },
      measurements: {
        value
      },
      severity: TelemetrySeverity.Information
    };

    this.trackEvent(businessEvent);
  }

  /**
   * Start a performance timer
   * @param operationName - Name of the operation being timed
   * @returns Timer object with stop method
   */
  public startTimer(operationName: string) {
    const startTime = Date.now();

    return {
      stop: (additionalData?: { 
        success?: boolean; 
        metrics?: IPerformanceEvent['metrics'];
        properties?: Record<string, string>;
      }) => {
        const duration = Date.now() - startTime;
        
        this.trackPerformance({
          name: 'performance_timer',
          operationName,
          duration,
          success: additionalData?.success ?? true,
          metrics: additionalData?.metrics,
          properties: additionalData?.properties
        });
      }
    };
  }

  /**
   * Track page view
   * @param pageName - Custom page name (optional)
   */
  public trackPageView(pageName?: string): void {
    this.trackEvent({
      name: 'page_view',
      properties: {
        pageName: pageName || document.title,
        url: window.location.href,
        referrer: document.referrer,
        loadTime: (Date.now() - this.pageLoadTime).toString()
      },
      measurements: {
        loadTime: Date.now() - this.pageLoadTime
      },
      severity: TelemetrySeverity.Information
    });
  }

  /**
   * Track cache performance
   * @param operation - Cache operation (hit, miss, set, delete)
   * @param key - Cache key
   * @param duration - Operation duration
   * @param additionalData - Additional cache metrics
   */
  public trackCacheMetrics(
    operation: 'hit' | 'miss' | 'set' | 'delete' | 'invalidate',
    key: string,
    duration?: number,
    additionalData?: Record<string, any>
  ): void {
    this.trackEvent({
      name: 'cache_operation',
      properties: {
        operation,
        cacheKey: key,
        ...additionalData
      },
      measurements: {
        ...(duration && { duration })
      },
      severity: TelemetrySeverity.Verbose
    });
  }

  /**
   * Track API call performance
   * @param apiName - API endpoint name
   * @param method - HTTP method
   * @param duration - Request duration
   * @param success - Whether request succeeded
   * @param statusCode - HTTP status code
   * @param dataSize - Response data size
   */
  public trackApiCall(
    apiName: string,
    method: string,
    duration: number,
    success: boolean,
    statusCode?: number,
    dataSize?: number
  ): void {
    this.trackPerformance({
      name: 'api_call',
      operationName: `${method} ${apiName}`,
      duration,
      success,
      properties: {
        apiName,
        method,
        ...(statusCode && { statusCode: statusCode.toString() })
      },
      measurements: {
        duration,
        ...(dataSize && { dataSize })
      }
    });
  }

  /**
   * Flush all buffered events immediately
   */
  public flush(): void {
    if (this.eventBuffer.length > 0) {
      this.sendEvents();
    }
  }

  /**
   * Dispose of the telemetry service
   */
  public dispose(): void {
    this.flush();
    
    if (this.sendTimer) {
      clearInterval(this.sendTimer);
      this.sendTimer = undefined;
    }

    window.removeEventListener('beforeunload', this.handlePageUnload.bind(this));
  }

  /**
   * Generate unique session ID
   * @private
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add event to buffer
   * @private
   */
  private addToBuffer(event: ITelemetryEvent): void {
    this.eventBuffer.push(event);

    // Send immediately if buffer is full
    if (this.eventBuffer.length >= this.config.bufferSize) {
      this.sendEvents();
    }
  }

  /**
   * Start periodic sending of buffered events
   * @private
   */
  private startPeriodicSend(): void {
    this.sendTimer = window.setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.sendEvents();
      }
    }, this.config.sendInterval);
  }

  /**
   * Send buffered events
   * @private
   */
  private sendEvents(): void {
    if (this.eventBuffer.length === 0) return;

    const eventsToSend = [...this.eventBuffer];
    this.eventBuffer = [];

    if (this.config.instrumentationKey) {
      this.sendToApplicationInsights(eventsToSend);
    } else if (this.config.endpoint) {
      this.sendToCustomEndpoint(eventsToSend);
    }
    // Events batched for sending
  }

  /**
   * Send events to Application Insights
   * @private
   */
  private sendToApplicationInsights(events: ITelemetryEvent[]): void {
    // This would integrate with Application Insights SDK
    // Events would be sent to Application Insights here
    
    // Example implementation:
    // if (window.appInsights) {
    //   events.forEach(event => {
    //     window.appInsights.trackEvent(event.name, event.properties, event.measurements);
    //   });
    // }
  }

  /**
   * Send events to custom endpoint
   * @private
   */
  private sendToCustomEndpoint(events: ITelemetryEvent[]): void {
    if (!this.config.endpoint) return;

    fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        events,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.warn('[Telemetry] Failed to send events:', error);
    });
  }

  /**
   * Handle page unload
   * @private
   */
  private handlePageUnload(): void {
    if (this.config.trackSessions) {
      this.trackEvent({
        name: 'session_end',
        properties: {
          sessionDuration: (Date.now() - this.pageLoadTime).toString()
        },
        measurements: {
          sessionDuration: Date.now() - this.pageLoadTime
        },
        severity: TelemetrySeverity.Information
      });
    }

    // Send any remaining events
    this.flush();
  }
}