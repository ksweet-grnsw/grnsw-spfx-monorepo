# Telemetry & Monitoring Guide

## Overview

This guide provides detailed instructions for implementing comprehensive telemetry and monitoring in GRNSW SPFx applications using Application Insights and custom telemetry services.

## Table of Contents

1. [Configuration](#configuration)
2. [Event Types](#event-types)
3. [Implementation Patterns](#implementation-patterns)
4. [Dashboard Setup](#dashboard-setup)
5. [Alert Configuration](#alert-configuration)
6. [Performance Monitoring](#performance-monitoring)
7. [Error Tracking](#error-tracking)
8. [Custom Metrics](#custom-metrics)

## Configuration

### Application Insights Setup

1. **Create Application Insights Resource** (Azure Portal)
   ```
   Resource Group: grnsw-prod-rg
   Name: grnsw-spfx-insights
   Region: Australia East
   ```

2. **Get Instrumentation Key**
   - Navigate to resource → Overview
   - Copy Instrumentation Key

3. **Configure in SPFx**
   ```typescript
   // config/appInsights.ts
   export const APP_INSIGHTS_CONFIG = {
     instrumentationKey: process.env.REACT_APP_INSIGHTS_KEY || 'your-key',
     environment: process.env.NODE_ENV || 'development',
     enableAutoRouteTracking: true,
     enableRequestHeaderTracking: true,
     enableResponseHeaderTracking: true
   };
   ```

### Environment-Specific Configuration

```typescript
// services/TelemetryService.ts
const getConfig = (context: WebPartContext): ITelemetryConfig => {
  const env = context.pageContext.site.absoluteUrl.includes('grnsw21') 
    ? 'production' 
    : 'development';
  
  return {
    instrumentationKey: env === 'production' 
      ? 'prod-key' 
      : 'dev-key',
    enabled: env === 'production',
    bufferEvents: true,
    bufferSize: env === 'production' ? 50 : 10,
    bufferInterval: env === 'production' ? 10000 : 5000,
    sampleRate: env === 'production' ? 0.5 : 1.0 // Sample 50% in prod
  };
};
```

## Event Types

### User Actions

Track all user interactions:

```typescript
// Click events
trackAction('click', 'button_refresh', {
  component: 'WeatherDashboard',
  section: 'header',
  timestamp: Date.now()
});

// Form submissions
trackAction('submit', 'filter_form', {
  filters: {
    track: selectedTrack,
    dateRange: dateRange
  }
});

// Navigation
trackAction('navigate', 'view_change', {
  from: 'dashboard',
  to: 'analytics'
});

// Search
trackAction('search', 'global_search', {
  query: searchTerm,
  resultsCount: results.length
});
```

### Performance Events

Monitor operation performance:

```typescript
// API calls
const timer = telemetry.startTimer('api_call');
try {
  const data = await api.getData();
  timer.end({
    success: true,
    endpoint: '/api/weather',
    recordCount: data.length
  });
} catch (error) {
  timer.end({
    success: false,
    error: error.message
  });
}

// Component lifecycle
trackPerformance('component_mount', async () => {
  await loadInitialData();
}, {
  component: 'WeatherDashboard',
  dataSize: data.length
});

// Long operations
await trackPerformance('generate_report', async () => {
  return await generateComplexReport();
});
```

### Business Metrics

Track business-specific KPIs:

```typescript
// Data usage
trackMetric('data_usage', 'weather_records_loaded', recordCount, 'count');

// User engagement
trackMetric('engagement', 'dashboard_views', 1, 'count', {
  userId: currentUser.id,
  track: selectedTrack
});

// Performance metrics
trackMetric('performance', 'api_response_time', responseTime, 'milliseconds');

// Business outcomes
trackMetric('business', 'injuries_reported', injuryCount, 'count', {
  severity: 'high',
  track: trackName
});
```

## Implementation Patterns

### Component-Level Telemetry

```typescript
import { useTelemetry } from '@grnsw/shared';

const WeatherDashboard: React.FC = (props) => {
  const telemetry = useTelemetry(props.context, {
    componentName: 'WeatherDashboard',
    enabled: true,
    autoTrackLifecycle: true
  });
  
  useEffect(() => {
    // Track component mount
    telemetry.trackAction('mount', 'component', {
      component: 'WeatherDashboard'
    });
    
    return () => {
      // Track component unmount
      telemetry.trackAction('unmount', 'component', {
        component: 'WeatherDashboard',
        sessionDuration: Date.now() - mountTime
      });
    };
  }, []);
  
  // Track all errors
  useEffect(() => {
    window.addEventListener('error', (event) => {
      telemetry.trackError(event.error, 'window', 'global');
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      telemetry.trackError(event.reason, 'promise', 'unhandled');
    });
  }, []);
};
```

### Service-Level Telemetry

```typescript
export class DataverseService {
  private telemetry: TelemetryService;
  
  constructor(context: WebPartContext) {
    this.telemetry = new TelemetryService(context);
  }
  
  async fetchData(query: string): Promise<any> {
    const timer = this.telemetry.startTimer('dataverse_query');
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      timer.end({
        success: true,
        statusCode: response.status,
        recordCount: data.value?.length || 0
      });
      
      // Track data quality
      this.telemetry.trackMetric('data_quality', 'null_fields', 
        this.countNullFields(data), 'count');
      
      return data;
    } catch (error) {
      timer.end({
        success: false,
        error: error.message
      });
      
      this.telemetry.trackError(error, 'DataverseService', 'fetchData');
      throw error;
    }
  }
}
```

### Batch Event Processing

```typescript
// Configure batching
const telemetry = useTelemetry(context, {
  bufferEvents: true,
  bufferSize: 25,      // Send when 25 events accumulate
  bufferInterval: 5000, // Or every 5 seconds
  compress: true        // Compress payload
});

// Events are automatically batched
for (const item of items) {
  telemetry.trackAction('process', 'item', {
    itemId: item.id
  }); // Automatically batched
}

// Force flush if needed
telemetry.flush();
```

## Dashboard Setup

### KPI Dashboard Configuration

```typescript
interface IDashboardKPIs {
  // Performance KPIs
  averageLoadTime: number;
  p95LoadTime: number;
  errorRate: number;
  
  // Usage KPIs
  dailyActiveUsers: number;
  averageSessionDuration: number;
  topFeatures: string[];
  
  // Business KPIs
  dataProcessed: number;
  reportsGenerated: number;
  apiCallsPerHour: number;
}

const KPIDashboard: React.FC = () => {
  const { trackMetric } = useTelemetry(context);
  
  useEffect(() => {
    // Track dashboard view
    trackMetric('dashboard', 'kpi_dashboard_view', 1, 'count');
  }, []);
  
  return (
    <div>
      <MetricCard 
        title="Avg Load Time"
        value={kpis.averageLoadTime}
        unit="ms"
        threshold={1000}
        onThresholdExceeded={(value) => {
          trackMetric('alert', 'high_load_time', value, 'milliseconds');
        }}
      />
    </div>
  );
};
```

### Real-Time Monitoring

```typescript
const RealTimeMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<IMetrics>();
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Poll Application Insights API
      fetchRealTimeMetrics().then(setMetrics);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <LiveChart data={metrics?.performance} />
      <ErrorRate current={metrics?.errorRate} />
      <ActiveUsers count={metrics?.activeUsers} />
    </div>
  );
};
```

## Alert Configuration

### Threshold Alerts

```typescript
class AlertService {
  private thresholds = {
    errorRate: 0.05,        // 5% error rate
    responseTime: 2000,     // 2 seconds
    memoryUsage: 0.8,       // 80% memory
    apiFailures: 10         // 10 consecutive failures
  };
  
  checkThresholds(metrics: IMetrics): void {
    if (metrics.errorRate > this.thresholds.errorRate) {
      this.sendAlert('HIGH_ERROR_RATE', {
        current: metrics.errorRate,
        threshold: this.thresholds.errorRate
      });
    }
    
    if (metrics.responseTime > this.thresholds.responseTime) {
      this.sendAlert('SLOW_RESPONSE', {
        current: metrics.responseTime,
        threshold: this.thresholds.responseTime
      });
    }
  }
  
  private sendAlert(type: string, data: any): void {
    // Send to Application Insights
    telemetry.trackEvent({
      name: 'alert_triggered',
      properties: {
        type,
        ...data,
        timestamp: new Date().toISOString()
      }
    });
    
    // Send to Teams/Email
    this.notifyTeams(type, data);
  }
}
```

### Anomaly Detection

```typescript
class AnomalyDetector {
  private baseline: Map<string, IBaseline> = new Map();
  
  detectAnomaly(metric: string, value: number): boolean {
    const baseline = this.baseline.get(metric);
    if (!baseline) return false;
    
    const deviation = Math.abs(value - baseline.mean) / baseline.stdDev;
    
    if (deviation > 3) { // 3 standard deviations
      telemetry.trackEvent({
        name: 'anomaly_detected',
        properties: {
          metric,
          value,
          baseline: baseline.mean,
          deviation
        }
      });
      return true;
    }
    
    return false;
  }
}
```

## Performance Monitoring

### Web Vitals Tracking

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const trackWebVitals = (telemetry: TelemetryService): void => {
  // Cumulative Layout Shift
  getCLS((metric) => {
    telemetry.trackMetric('web_vitals', 'cls', metric.value, 'score');
  });
  
  // First Input Delay
  getFID((metric) => {
    telemetry.trackMetric('web_vitals', 'fid', metric.value, 'milliseconds');
  });
  
  // First Contentful Paint
  getFCP((metric) => {
    telemetry.trackMetric('web_vitals', 'fcp', metric.value, 'milliseconds');
  });
  
  // Largest Contentful Paint
  getLCP((metric) => {
    telemetry.trackMetric('web_vitals', 'lcp', metric.value, 'milliseconds');
  });
  
  // Time to First Byte
  getTTFB((metric) => {
    telemetry.trackMetric('web_vitals', 'ttfb', metric.value, 'milliseconds');
  });
};
```

### Resource Timing

```typescript
const trackResourceTiming = (): void => {
  const resources = performance.getEntriesByType('resource');
  
  resources.forEach(resource => {
    if (resource.name.includes('api')) {
      telemetry.trackMetric('resource', 'api_load_time', 
        resource.duration, 'milliseconds', {
          url: resource.name,
          size: resource.transferSize
        });
    }
  });
};
```

### Memory Monitoring

```typescript
const monitorMemory = (): void => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    
    telemetry.trackMetric('performance', 'heap_used', 
      memory.usedJSHeapSize / 1048576, 'MB');
    
    telemetry.trackMetric('performance', 'heap_limit', 
      memory.jsHeapSizeLimit / 1048576, 'MB');
    
    const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    if (usage > 0.9) {
      telemetry.trackEvent({
        name: 'high_memory_usage',
        properties: { usage }
      });
    }
  }
};
```

## Error Tracking

### Global Error Handler

```typescript
export class GlobalErrorHandler {
  constructor(private telemetry: TelemetryService) {
    this.setupHandlers();
  }
  
  private setupHandlers(): void {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'window_error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno
      });
    });
    
    // Catch promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'unhandled_promise', {
        promise: event.promise
      });
    });
    
    // Catch console errors
    const originalError = console.error;
    console.error = (...args) => {
      this.handleError(args[0], 'console_error', {
        args: args.slice(1)
      });
      originalError.apply(console, args);
    };
  }
  
  private handleError(error: any, source: string, context: any): void {
    // Extract error details
    const errorInfo = {
      message: error?.message || String(error),
      stack: error?.stack,
      source,
      ...context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    // Track in telemetry
    this.telemetry.trackError(error, source, 'global', errorInfo);
    
    // Log to console in dev
    if (process.env.NODE_ENV === 'development') {
      console.group('🔴 Error Tracked');
      console.error('Error:', error);
      console.table(errorInfo);
      console.groupEnd();
    }
  }
}
```

### Error Boundaries with Telemetry

```typescript
class TelemetryErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { telemetry } = this.props;
    
    telemetry.trackError(error, 'error_boundary', 'react', {
      componentStack: errorInfo.componentStack,
      component: this.props.componentName,
      props: JSON.stringify(this.props)
    });
    
    // Track recovery attempts
    telemetry.trackMetric('errors', 'boundary_catches', 1, 'count');
  }
  
  handleReset = (): void => {
    const { telemetry } = this.props;
    
    telemetry.trackAction('click', 'error_recovery', {
      component: this.props.componentName
    });
    
    this.setState({ hasError: false });
  };
}
```

## Custom Metrics

### Business Metrics Definition

```typescript
interface IBusinessMetrics {
  // Operational metrics
  races: {
    total: number;
    completed: number;
    cancelled: number;
    averageDuration: number;
  };
  
  // Safety metrics
  injuries: {
    total: number;
    severity: Record<string, number>;
    byTrack: Record<string, number>;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  
  // Weather metrics
  weather: {
    stationsReporting: number;
    dataPoints: number;
    updateFrequency: number;
    dataQuality: number; // 0-100
  };
}

const trackBusinessMetrics = (metrics: IBusinessMetrics): void => {
  // Track operational efficiency
  telemetry.trackMetric('business', 'race_completion_rate', 
    metrics.races.completed / metrics.races.total, 'percentage');
  
  // Track safety performance
  telemetry.trackMetric('business', 'injury_rate', 
    metrics.injuries.total, 'count', {
      trend: metrics.injuries.trend
    });
  
  // Track data quality
  telemetry.trackMetric('business', 'weather_data_quality', 
    metrics.weather.dataQuality, 'percentage');
};
```

### Custom Dashboards in Application Insights

```kusto
// Query for component load times
customMetrics
| where name == "component_mount"
| summarize 
    avg_load_time = avg(value),
    p95_load_time = percentile(value, 95),
    max_load_time = max(value)
  by tostring(customDimensions.component)
| order by avg_load_time desc

// Query for API performance
customMetrics
| where name == "api_response_time"
| summarize 
    calls = count(),
    avg_time = avg(value),
    failures = countif(tostring(customDimensions.success) == "false")
  by bin(timestamp, 5m)
| render timechart

// Query for error patterns
customEvents
| where name == "error_tracked"
| summarize count() by 
    error = tostring(customDimensions.message),
    source = tostring(customDimensions.source)
| order by count_ desc
| take 10
```

## Best Practices

### 1. Sampling Strategy
- Sample 100% in development
- Sample 50% in production for high-volume events
- Always track 100% of errors and critical events

### 2. PII Protection
- Never log user emails or passwords
- Hash user IDs before tracking
- Sanitize URLs to remove query parameters

### 3. Performance Impact
- Use batching for high-frequency events
- Implement sampling for verbose logging
- Monitor telemetry overhead

### 4. Cost Management
- Set daily caps in Application Insights
- Use sampling to reduce data ingestion
- Archive old data to blob storage

### 5. Debugging
- Use correlation IDs to trace requests
- Include context in all events
- Maintain separate dev/prod instances

## Troubleshooting

### Common Issues

1. **Events not appearing**
   - Check instrumentation key
   - Verify network connectivity
   - Check browser console for errors
   - Ensure telemetry is enabled

2. **High latency**
   - Enable batching
   - Reduce event frequency
   - Check network throttling

3. **Missing correlation**
   - Ensure operation IDs are set
   - Use same telemetry instance
   - Check async operation tracking

4. **Cost overruns**
   - Implement sampling
   - Reduce metric cardinality
   - Set daily caps
   - Review retention policies