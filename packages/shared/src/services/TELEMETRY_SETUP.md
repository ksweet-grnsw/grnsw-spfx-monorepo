# Telemetry Service Setup Guide

## Overview
The TelemetryService provides comprehensive monitoring, analytics, and error tracking for the GRNSW SPFx applications. It supports Application Insights, custom endpoints, and development logging.

## Quick Start

### 1. Basic Usage
```typescript
import { TelemetryService } from '@grnsw/shared';

// In your web part
const telemetry = new TelemetryService(context, {
  enabled: true,
  instrumentationKey: 'your-app-insights-key'
});

// Track user actions
telemetry.trackUserAction('click', 'load_data_button');

// Track performance
const timer = telemetry.startTimer('load_dashboard');
const data = await loadDashboardData();
timer.stop({ success: true, recordCount: data.length });

// Track errors
telemetry.trackError(error, 'data_service', 'load_dashboard');
```

### 2. Using React Hooks
```typescript
import { useTelemetry } from '@grnsw/shared';

const MyComponent = ({ context }) => {
  const { trackAction, trackPerformance, trackError } = useTelemetry(context, {
    componentName: 'SafetyDashboard',
    enabled: true
  });

  const loadData = async () => {
    trackAction('click', 'load_data');
    
    try {
      const data = await trackPerformance('load_data', 
        () => dataService.getData()
      );
      setData(data);
    } catch (error) {
      trackError(error, 'data_service');
    }
  };
};
```

## Application Insights Setup

### 1. Create Application Insights Resource
1. Go to Azure Portal
2. Create new Application Insights resource
3. Copy the Instrumentation Key
4. Note the Connection String (for newer versions)

### 2. Environment Configuration
Add to your environment configuration:

```typescript
// In your environment config
export const telemetryConfig = {
  development: {
    enabled: true,
    logToConsole: true,
    instrumentationKey: undefined, // Use console only in dev
    bufferSize: 10,
    sendInterval: 5000
  },
  staging: {
    enabled: true,
    logToConsole: false,
    instrumentationKey: 'your-staging-key',
    bufferSize: 25,
    sendInterval: 10000
  },
  production: {
    enabled: true,
    logToConsole: false,
    instrumentationKey: 'your-production-key',
    bufferSize: 50,
    sendInterval: 15000
  }
};
```

### 3. Web Part Integration
```typescript
export default class YourWebPart extends BaseClientSideWebPart<IYourWebPartProps> {
  private telemetryService: TelemetryService;

  protected onInit(): Promise<void> {
    const config = telemetryConfig[this.context.pageContext.web.absoluteUrl.includes('staging') ? 'staging' : 'production'];
    
    this.telemetryService = new TelemetryService(this.context, config);
    
    return super.onInit();
  }

  protected onDispose(): void {
    this.telemetryService?.dispose();
    super.onDispose();
  }

  public render(): void {
    const element: React.ReactElement<IYourProps> = React.createElement(
      YourComponent,
      {
        context: this.context,
        telemetryService: this.telemetryService
      }
    );

    ReactDom.render(element, this.domElement);
  }
}
```

## Telemetry Types

### 1. User Actions
Track user interactions and navigation:
```typescript
// Button clicks
telemetry.trackUserAction('click', 'export_button', { 
  format: 'csv', 
  recordCount: 150 
});

// Page views
telemetry.trackUserAction('view', 'safety_dashboard', {
  trackName: 'Wentworth Park',
  dateRange: 'last_30_days'
});

// Navigation
telemetry.trackUserAction('navigate', 'race_calendar', {
  from: 'dashboard',
  to: 'calendar'
});
```

### 2. Performance Monitoring
Track operation performance and timing:
```typescript
// Manual timing
const timer = telemetry.startTimer('load_injury_data');
const data = await injuryService.getInjuries();
timer.stop({ success: true, recordCount: data.length });

// API performance
telemetry.trackApiCall(
  'get_injuries',
  'GET',
  duration,
  success,
  statusCode,
  responseSize
);

// Cache performance
telemetry.trackCacheMetrics('hit', 'weather_data', 15);
```

### 3. Error Tracking
Comprehensive error monitoring:
```typescript
// Basic error tracking
try {
  await riskyOperation();
} catch (error) {
  telemetry.trackError(error, 'data_service', 'load_data');
}

// Error with context
telemetry.trackError(error, 'weather_service', 'fetch_forecast', {
  trackName: 'Dapto',
  userId: context.pageContext.user.email,
  operation: 'weather_forecast'
});
```

### 4. Business Metrics
Track business-specific metrics:
```typescript
// Data usage metrics
telemetry.trackBusinessMetric('data_usage', 'injuries_loaded', 45, 'count');

// Performance metrics
telemetry.trackBusinessMetric('performance', 'dashboard_load_time', 1250, 'ms');

// Feature usage
telemetry.trackBusinessMetric('feature_usage', 'export_requests', 1, 'count');
```

## Configuration Options

### Complete Configuration Interface
```typescript
interface ITelemetryConfig {
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
```

### Environment-Specific Configs
```typescript
// Development - Console logging only
const devConfig: ITelemetryConfig = {
  enabled: true,
  logToConsole: true,
  bufferSize: 5,
  sendInterval: 2000,
  autoTrackPageViews: false,
  trackSessions: false
};

// Production - Application Insights
const prodConfig: ITelemetryConfig = {
  enabled: true,
  logToConsole: false,
  instrumentationKey: 'your-prod-key',
  bufferSize: 100,
  sendInterval: 30000,
  autoTrackPageViews: true,
  trackSessions: true
};
```

## Custom Endpoints

If you prefer custom telemetry endpoints instead of Application Insights:

```typescript
const customConfig: ITelemetryConfig = {
  enabled: true,
  logToConsole: false,
  endpoint: 'https://your-telemetry-api.com/events',
  bufferSize: 50,
  sendInterval: 15000
};
```

The service will POST events to your endpoint in this format:
```json
{
  "events": [
    {
      "name": "user_action",
      "properties": {
        "action": "click",
        "target": "load_data",
        "sessionId": "1234567890-abc",
        "userId": "user@grnsw.com.au"
      },
      "measurements": {
        "timestamp": 1640995200000
      },
      "timestamp": "2021-12-31T12:00:00.000Z"
    }
  ],
  "sessionId": "1234567890-abc",
  "timestamp": "2021-12-31T12:00:00.000Z"
}
```

## Best Practices

### 1. Component-Level Telemetry
Use the useTelemetry hook for component-specific tracking:
```typescript
const MyDashboard = ({ context }) => {
  const { trackDashboardView, trackDataRefresh, trackExport } = useDashboardTelemetry(
    context, 
    'safety'
  );

  useEffect(() => {
    trackDashboardView('initial_load');
  }, []);

  const handleRefresh = () => {
    trackDataRefresh();
    loadData();
  };

  const handleExport = (format: string, count: number) => {
    trackExport(format, count);
    exportData(format);
  };
};
```

### 2. Service-Level Telemetry
Wrap services with automatic telemetry:
```typescript
const enhancedService = useServiceTelemetry(context, 'InjuryService', injuryService);

// All method calls are automatically tracked
const injuries = await enhancedService.getInjuries(); // Tracked automatically
```

### 3. Error Boundaries Integration
Combine with error boundaries for comprehensive error tracking:
```typescript
import { ErrorBoundary, useTelemetry } from '@grnsw/shared';

const TelemetryErrorBoundary = ({ children, context }) => {
  const { trackError } = useTelemetry(context);

  return (
    <ErrorBoundary
      fallback={DefaultErrorFallback}
      onError={(error, errorInfo) => {
        trackError(error, 'error_boundary', 'component_error', {
          componentStack: errorInfo.componentStack,
          errorBoundary: 'TelemetryErrorBoundary'
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### 4. Performance Monitoring
Track critical performance metrics:
```typescript
const DashboardWithPerformance = ({ context }) => {
  const { trackPerformance, trackMetric } = useTelemetry(context);

  const loadDashboard = async () => {
    const startTime = performance.now();
    
    const data = await trackPerformance('load_dashboard', async () => {
      const [injuries, stats, weather] = await Promise.all([
        injuryService.getInjuries(),
        statsService.getStats(),
        weatherService.getWeather()
      ]);
      
      return { injuries, stats, weather };
    });

    const totalTime = performance.now() - startTime;
    trackMetric('performance', 'full_dashboard_load', totalTime, 'ms');
  };
};
```

## Monitoring & Alerts

### Application Insights Queries
Useful KQL queries for monitoring:

```kql
// Error rates by component
customEvents
| where name == "error"
| extend component = tostring(customDimensions.source)
| summarize ErrorCount = count() by component, bin(timestamp, 1h)

// Performance trends
customEvents  
| where name == "performance"
| extend duration = todouble(customMeasurements.duration)
| summarize avg(duration), percentile(duration, 95) by bin(timestamp, 1h)

// User actions
customEvents
| where name == "user_action"
| extend action = tostring(customDimensions.action)
| summarize ActionCount = count() by action, bin(timestamp, 1d)
```

### Recommended Alerts
Set up alerts for:
- Error rate > 5% over 5 minutes
- API response time > 5 seconds
- Dashboard load time > 10 seconds
- Failed data loads > 10 in 10 minutes

## Privacy & Compliance

### Data Collection
The telemetry service collects:
- ✅ Performance metrics (timing, counts)
- ✅ Error information (messages, stack traces)
- ✅ User actions (clicks, navigation)
- ✅ Session information (anonymous session IDs)
- ✅ Technical context (browser, URL, component)

### Data NOT Collected
- ❌ Personal identifiable information (unless explicitly added)
- ❌ Business data content (only metadata like record counts)
- ❌ Authentication tokens or credentials
- ❌ Full URL parameters (only pathname)

### User Privacy
- Session IDs are randomly generated
- User identification uses SharePoint context (if available)
- All data is anonymized where possible
- Compliant with organizational data policies

## Troubleshooting

### Common Issues

1. **Events not appearing in Application Insights**
   - Check instrumentation key is correct
   - Verify events are being generated in console (set logToConsole: true)
   - Check network tab for failed requests
   - Application Insights may take 5-10 minutes to show data

2. **Performance impact**
   - Telemetry is buffered and sent in batches
   - Default buffer size is 50 events
   - Sending interval is 10 seconds by default
   - Disable in performance-critical scenarios

3. **Development debugging**
   ```typescript
   const debugConfig = {
     enabled: true,
     logToConsole: true,
     bufferSize: 1, // Send immediately
     sendInterval: 1000 // Send every second
   };
   ```

4. **Memory usage**
   - Call dispose() when components unmount
   - useTelemetry hook handles this automatically
   - Flush() before page unload (handled automatically)

### Debug Mode
Enable detailed logging:
```typescript
const telemetry = new TelemetryService(context, {
  enabled: true,
  logToConsole: true, // See all events in console
  bufferSize: 1, // Send immediately for debugging
  sendInterval: 1000
});

// Manual event inspection
telemetry.trackEvent({
  name: 'debug_test',
  properties: { test: 'value' },
  measurements: { count: 1 }
});
```