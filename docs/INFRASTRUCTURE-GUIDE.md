# Infrastructure Components Guide

## Overview

This guide covers the mandatory infrastructure components that all GRNSW SPFx web parts must use. These components provide enterprise-grade error handling, monitoring, performance optimization, and user experience improvements.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Error Boundaries](#error-boundaries)
3. [Telemetry & Monitoring](#telemetry--monitoring)
4. [Loading States](#loading-states)
5. [Code Splitting & Lazy Loading](#code-splitting--lazy-loading)
6. [Caching Strategy](#caching-strategy)
7. [Progressive Loading](#progressive-loading)
8. [Bundle Optimization](#bundle-optimization)

## Quick Start

### Installation

All infrastructure components are available in the `@grnsw/shared` package:

```typescript
import {
  // Error Handling
  ErrorBoundary,
  DataverseErrorBoundary,
  useErrorHandler,
  
  // Loading States
  LoadingSpinner,
  DashboardSkeleton,
  SkeletonLoader,
  useLoadingState,
  
  // Telemetry
  TelemetryService,
  useTelemetry,
  
  // Performance
  LazyComponent,
  useAsyncOperation,
  useProgressiveLoading,
  
  // Caching
  CacheService,
  CacheStatsDisplay
} from '@grnsw/shared';
```

### Basic Component Setup

Every component should follow this pattern:

```typescript
import React from 'react';
import { ErrorBoundary, useTelemetry, useLoadingState } from '@grnsw/shared';

const MyComponent: React.FC<IMyComponentProps> = (props) => {
  // Initialize telemetry
  const { trackAction, trackError } = useTelemetry(props.context, {
    componentName: 'MyComponent',
    enabled: true
  });
  
  // Initialize loading state
  const { loadingState, data, execute } = useAsyncOperation();
  
  // Load data with error handling
  const loadData = async () => {
    try {
      const result = await execute(
        () => dataService.getData(),
        'Loading data...'
      );
      trackAction('data_loaded', 'success');
      return result;
    } catch (error) {
      trackError(error, 'MyComponent', 'loadData');
      throw error;
    }
  };
  
  return (
    <div>
      {loadingState.isLoading && <LoadingSpinner />}
      {loadingState.error && <div>Error: {loadingState.error}</div>}
      {data && <div>Your content here</div>}
    </div>
  );
};

// Wrap with error boundary
export default (props: IMyComponentProps) => (
  <ErrorBoundary>
    <MyComponent {...props} />
  </ErrorBoundary>
);
```

## Error Boundaries

### Basic Error Boundary

Wrap all components with error boundaries to prevent crashes:

```typescript
import { ErrorBoundary } from '@grnsw/shared';

<ErrorBoundary
  fallback={({ error, retry }) => (
    <div>
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  )}
  onError={(error, errorInfo) => {
    console.error('Component error:', error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### Dataverse-Specific Error Boundary

For components that interact with Dataverse:

```typescript
import { DataverseErrorBoundary } from '@grnsw/shared';

<DataverseErrorBoundary
  onRetry={async () => {
    await refreshData();
  }}
  maxRetries={3}
  retryDelay={1000}
>
  <DataverseComponent />
</DataverseErrorBoundary>
```

### Error Handler Hook

For programmatic error handling:

```typescript
import { useErrorHandler } from '@grnsw/shared';

const MyComponent = () => {
  const { error, handleError, clearError, retry } = useErrorHandler({
    componentName: 'MyComponent',
    onError: (error) => {
      // Custom error handling
      console.error('Component error:', error);
    }
  });
  
  const fetchData = async () => {
    try {
      const data = await api.getData();
    } catch (err) {
      handleError(err, 'FETCH_ERROR');
    }
  };
  
  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={retry}>Retry</button>
        <button onClick={clearError}>Dismiss</button>
      </div>
    );
  }
  
  return <div>Your content</div>;
};
```

## Telemetry & Monitoring

### Basic Setup

Initialize telemetry in your component:

```typescript
import { useTelemetry } from '@grnsw/shared';

const MyComponent = (props) => {
  const {
    trackAction,
    trackPerformance,
    trackError,
    trackMetric,
    trackApiCall
  } = useTelemetry(props.context, {
    componentName: 'MyComponent',
    enabled: true,
    autoTrackLifecycle: true, // Automatically tracks mount/unmount
    bufferEvents: true,       // Batch events for performance
    bufferSize: 10,          // Send events in batches of 10
    bufferInterval: 5000     // Or every 5 seconds
  });
  
  // Track user actions
  const handleClick = () => {
    trackAction('click', 'button_name', {
      section: 'header',
      value: 'search'
    });
  };
  
  // Track performance
  const loadData = async () => {
    const result = await trackPerformance('load_data', async () => {
      return await dataService.getData();
    });
    
    // Track business metrics
    trackMetric('data_usage', 'records_loaded', result.length, 'count');
  };
  
  // Track API calls
  const callApi = async () => {
    const start = Date.now();
    try {
      const result = await api.getData();
      trackApiCall('dataverse', 'GET', Date.now() - start, true);
      return result;
    } catch (error) {
      trackApiCall('dataverse', 'GET', Date.now() - start, false);
      trackError(error, 'api', 'getData');
      throw error;
    }
  };
};
```

### Performance Tracking

Track operation performance automatically:

```typescript
// Method 1: Using trackPerformance wrapper
const result = await trackPerformance('operation_name', async () => {
  return await expensiveOperation();
});

// Method 2: Using timer
const timer = telemetry.startTimer('operation_name');
const result = await expensiveOperation();
timer.end({ success: true, recordCount: result.length });
```

### Error Tracking

Track errors with context:

```typescript
try {
  await riskyOperation();
} catch (error) {
  trackError(error, 'component_name', 'operation_name', {
    userId: currentUser.id,
    context: 'data_load',
    severity: 'high'
  });
}
```

## Loading States

### Loading Spinner

Basic loading indicator:

```typescript
import { LoadingSpinner } from '@grnsw/shared';

<LoadingSpinner
  size="large"
  label="Loading data..."
  delay={200}  // Show after 200ms to prevent flash
  overlay     // Full screen overlay
/>
```

### Dashboard Skeleton

Professional skeleton loader for dashboards:

```typescript
import { DashboardSkeleton } from '@grnsw/shared';

{isLoading ? (
  <DashboardSkeleton
    type="weather"        // weather | safety | race | adoption
    showHeader={true}
    showStats={true}
    statsCount={4}
    showCharts={true}
    chartsCount={2}
    showTable={true}
    tableRows={5}
    animated={true}
  />
) : (
  <DashboardContent />
)}
```

### Custom Skeleton

Create custom skeleton layouts:

```typescript
import { SkeletonLoader } from '@grnsw/shared';

<SkeletonLoader
  width="100%"
  height={200}
  variant="rectangular"  // text | circular | rectangular | wave
  animation="pulse"       // pulse | wave | none
  baseColor="#f0f0f0"
  highlightColor="#e0e0e0"
/>
```

### Loading State Hook

Manage loading states with built-in features:

```typescript
import { useLoadingState } from '@grnsw/shared';

const MyComponent = () => {
  const {
    isLoading,
    error,
    message,
    progress,
    startLoading,
    stopLoading,
    setProgress,
    setError
  } = useLoadingState({
    initialLoading: false,
    minLoadingTime: 500  // Prevent loading flash
  });
  
  const loadData = async () => {
    startLoading('Fetching data...');
    try {
      setProgress(25, 'Connecting to Dataverse...');
      const data = await api.getData();
      
      setProgress(75, 'Processing results...');
      await processData(data);
      
      stopLoading();
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <div>
      {isLoading && (
        <LoadingSpinner 
          label={message}
          progress={progress}
        />
      )}
      {error && <div>Error: {error}</div>}
    </div>
  );
};
```

## Code Splitting & Lazy Loading

### Lazy Component Loading

Load components on demand:

```typescript
import { LazyComponent } from '@grnsw/shared';

// Basic lazy loading
<LazyComponent
  importFunction={() => import('./HeavyComponent')}
  loadingText="Loading component..."
/>

// With props and error handling
<LazyComponent
  importFunction={() => import(
    /* webpackChunkName: "charts" */
    './ChartComponent'
  )}
  componentProps={{
    data: chartData,
    options: chartOptions
  }}
  fallback={<LoadingSpinner />}
  retryAttempts={3}
  retryDelay={1000}
  preload={false}  // Set true to preload on hover/focus
  onError={(error) => console.error('Failed to load:', error)}
/>

// Preload on hover
<div
  onMouseEnter={() => LazyComponent.preload('./HeavyComponent')}
>
  <LazyComponent importFunction={() => import('./HeavyComponent')} />
</div>
```

### Route-Based Code Splitting

Split code by routes/views:

```typescript
const views = {
  dashboard: () => import(/* webpackChunkName: "dashboard" */ './DashboardView'),
  analytics: () => import(/* webpackChunkName: "analytics" */ './AnalyticsView'),
  settings: () => import(/* webpackChunkName: "settings" */ './SettingsView')
};

const AppRouter = () => {
  const [view, setView] = useState('dashboard');
  
  return (
    <LazyComponent
      key={view}
      importFunction={views[view]}
      fallback={<DashboardSkeleton />}
    />
  );
};
```

## Caching Strategy

### Basic Caching

Cache API responses:

```typescript
import { CacheService } from '@grnsw/shared';

const fetchData = async (trackId: string) => {
  const cacheKey = `track_data_${trackId}`;
  
  // Check cache first
  const cached = CacheService.get(cacheKey);
  if (cached && !CacheService.isExpired(cacheKey)) {
    console.log('Using cached data');
    return cached;
  }
  
  // Fetch fresh data
  const data = await api.getTrackData(trackId);
  
  // Cache for 5 minutes
  CacheService.set(cacheKey, data, 5 * 60 * 1000);
  
  return data;
};
```

### Cache Management

```typescript
// Clear specific cache
CacheService.clear('track_data_*');

// Clear all cache
CacheService.clearAll();

// Get cache statistics
const stats = CacheService.getStats();
console.log(`Cache hits: ${stats.hits}, misses: ${stats.misses}`);

// Display cache stats in UI
import { CacheStatsDisplay } from '@grnsw/shared';

<CacheStatsDisplay
  detailed={true}
  showClearButton={true}
  onClear={() => CacheService.clearAll()}
/>
```

### Advanced Caching Patterns

```typescript
// Stale-while-revalidate pattern
const fetchWithSWR = async (key: string) => {
  const cached = CacheService.get(key);
  
  // Return stale data immediately
  if (cached) {
    // Revalidate in background
    api.getData().then(fresh => {
      CacheService.set(key, fresh, TTL);
    });
    return cached;
  }
  
  // No cache, fetch fresh
  const fresh = await api.getData();
  CacheService.set(key, fresh, TTL);
  return fresh;
};

// Cache with tags for invalidation
CacheService.set('user_123', userData, TTL, ['users', 'profile']);
CacheService.set('user_posts_123', posts, TTL, ['users', 'posts']);

// Invalidate by tag
CacheService.invalidateTag('users'); // Clears both caches
```

## Progressive Loading

### Multi-Step Loading

Load complex dashboards progressively:

```typescript
import { useProgressiveLoading } from '@grnsw/shared';

const Dashboard = () => {
  const { 
    loadingState, 
    results, 
    currentStep,
    executeSteps 
  } = useProgressiveLoading({
    stepDelay: 300,      // Delay between steps
    continueOnError: true // Continue even if a step fails
  });
  
  useEffect(() => {
    executeSteps([
      {
        name: 'stats',
        message: 'Loading statistics...',
        execute: async () => {
          return await api.getStats();
        }
      },
      {
        name: 'recentData',
        message: 'Loading recent data...',
        execute: async () => {
          return await api.getRecentData();
        }
      },
      {
        name: 'charts',
        message: 'Preparing charts...',
        execute: async () => {
          return await api.getChartData();
        }
      }
    ]);
  }, []);
  
  return (
    <div>
      {loadingState.isLoading && (
        <div>
          <LoadingSpinner label={loadingState.message} />
          <ProgressBar 
            current={currentStep} 
            total={3}
          />
        </div>
      )}
      
      {results.stats && <StatsSection data={results.stats} />}
      {results.recentData && <RecentSection data={results.recentData} />}
      {results.charts && <ChartsSection data={results.charts} />}
    </div>
  );
};
```

### Async Operations Hook

Simplified async operations with built-in state management:

```typescript
import { useAsyncOperation } from '@grnsw/shared';

const MyComponent = () => {
  const { 
    loadingState, 
    data, 
    execute 
  } = useAsyncOperation<IDataType>({
    minLoadingTime: 500,
    showProgress: true,
    clearErrorOnStart: true
  });
  
  const handleLoad = () => {
    execute(
      async () => {
        const result = await api.getData();
        return result;
      },
      'Loading data...'
    );
  };
  
  return (
    <div>
      <button onClick={handleLoad} disabled={loadingState.isLoading}>
        Load Data
      </button>
      
      {loadingState.isLoading && (
        <LoadingSpinner 
          label={loadingState.message}
          progress={loadingState.progress}
        />
      )}
      
      {loadingState.error && (
        <ErrorMessage message={loadingState.error} />
      )}
      
      {data && <DataDisplay data={data} />}
    </div>
  );
};
```

## Bundle Optimization

### Webpack Configuration

Configure webpack for optimal bundles:

```javascript
// gulpfile.js
const webpack = require('webpack');

build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
    // Enable production optimizations
    generatedConfiguration.mode = 'production';
    
    // Configure code splitting
    generatedConfiguration.optimization = {
      ...generatedConfiguration.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      }
    };
    
    // Add bundle analyzer
    if (process.env.ANALYZE) {
      const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
      generatedConfiguration.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false
        })
      );
    }
    
    return generatedConfiguration;
  }
});
```

### Analyze Bundle Size

```bash
# Generate bundle analysis
npm run build:analyze

# Check bundle stats
node analyze-bundle.js
```

### Import Optimization

```typescript
// Bad - imports entire library
import * as _ from 'lodash';

// Good - imports only what's needed
import debounce from 'lodash/debounce';

// Bad - imports entire icon library
import { Icon } from '@fluentui/react';

// Good - specific import
import { Icon } from '@fluentui/react/lib/Icon';
```

## Performance Best Practices

### 1. Always Use Error Boundaries
- Wrap all components
- Provide meaningful fallbacks
- Log errors to telemetry

### 2. Implement Loading States
- Use skeletons for structure
- Show progress for long operations
- Prevent loading flash with delays

### 3. Track Everything in Production
- User interactions
- API performance
- Error rates
- Business metrics

### 4. Optimize Bundle Size
- Lazy load heavy components
- Code split by route
- Tree shake imports
- Analyze regularly

### 5. Cache Strategically
- Cache API responses
- Use appropriate TTLs
- Implement cache invalidation
- Monitor cache performance

### 6. Progressive Enhancement
- Load critical content first
- Defer non-essential features
- Provide fallbacks
- Test on slow connections

## Migration Guide

See [MIGRATION-TO-INFRASTRUCTURE.md](./MIGRATION-TO-INFRASTRUCTURE.md) for migrating existing components.

## Examples

See [INFRASTRUCTURE-EXAMPLES.md](./INFRASTRUCTURE-EXAMPLES.md) for complete working examples.