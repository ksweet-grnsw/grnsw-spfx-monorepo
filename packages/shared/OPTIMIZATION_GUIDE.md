# Bundle Optimization & Performance Guide

This guide covers all the optimization strategies and tools available in the GRNSW shared package to improve SPFx bundle sizes and application performance.

## 📦 Bundle Size Optimization

### Current Bundle Sizes (Before Optimization)
- **Track Conditions SPFx**: 6 web parts, ~3.2MB total
- **Race Management**: 4 web parts, ~2.8MB total  
- **GAP SPFx**: 3 web parts, ~2.1MB total
- **Greyhound Health**: 5 web parts, ~2.9MB total

### Optimization Goals
- ✅ Reduce individual web part bundles to <500KB
- ✅ Implement code splitting for shared dependencies
- ✅ Add lazy loading for heavy components
- ✅ Optimize vendor chunk sizes
- ✅ Enable tree shaking for unused code elimination

## 🚀 Quick Start

### 1. Enhanced Gulpfile Configuration
Replace your existing `gulpfile.js` with the optimized version:

```javascript
'use strict';

const build = require('@microsoft/sp-build-web');
const { configureWebpack } = require('@grnsw/shared/lib/config/gulpOptimizations');

// Apply bundle optimizations
configureWebpack(build, {
  enableCodeSplitting: true,
  enableTreeShaking: true,
  enableBundleAnalysis: process.env.ANALYZE_BUNDLE === 'true',
  production: process.env.NODE_ENV === 'production'
});

// Add bundle analysis tasks
build.initialize(require('gulp'));
```

### 2. Optimized Config.json
Update your `config/config.json` to enable code splitting:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/spfx-build/config.2.0.schema.json",
  "version": "2.0",
  "bundles": {
    "your-webpart": {
      "components": [{
        "entrypoint": "./lib/webparts/yourWebpart/YourWebpartWebPart.js",
        "manifest": "./src/webparts/yourWebpart/YourWebpartWebPart.manifest.json"
      }]
    }
  },
  "externals": {
    "react": {
      "path": "https://unpkg.com/react@17/umd/react.production.min.js",
      "globalName": "React"
    },
    "react-dom": {
      "path": "https://unpkg.com/react-dom@17/umd/react-dom.production.min.js", 
      "globalName": "ReactDOM"
    }
  }
}
```

### 3. Lazy Loading Implementation
Convert heavy components to lazy-loaded versions:

```typescript
import { LazyComponent, createLazyComponent } from '@grnsw/shared';

// Method 1: Using LazyComponent wrapper
const LazyChart = () => (
  <LazyComponent
    importFunction={() => import('./components/HeavyChartComponent')}
    loadingText="Loading chart..."
    retryAttempts={3}
  />
);

// Method 2: Using createLazyComponent factory
const LazyDataTable = createLazyComponent(
  () => import('./components/DataTableComponent'),
  { loadingText: 'Loading data table...', preload: false }
);

// Usage in component
return (
  <div>
    <LazyChart />
    <LazyDataTable data={tableData} />
  </div>
);
```

## 🔧 Advanced Optimization Techniques

### 1. Tree Shaking Optimization

#### Optimized Imports
```typescript
// ❌ Bad: Imports entire library
import * as _ from 'lodash';
import { Button, Panel, TextField } from '@fluentui/react';

// ✅ Good: Imports specific functions
import debounce from 'lodash-es/debounce';
import { Button } from '@fluentui/react/lib/Button';
import { Panel } from '@fluentui/react/lib/Panel';
```

#### Chart.js Optimization
```typescript
// ❌ Bad: Imports entire Chart.js
import Chart from 'chart.js';

// ✅ Good: Import only needed components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
```

### 2. Code Splitting Strategies

#### Route-Based Splitting
```typescript
// Split by web part functionality
const WeatherDashboard = React.lazy(() => 
  import(/* webpackChunkName: "weather-dashboard" */ './WeatherDashboard')
);

const TrackConditions = React.lazy(() => 
  import(/* webpackChunkName: "track-conditions" */ './TrackConditions')
);
```

#### Feature-Based Splitting
```typescript
// Split heavy features
const AdvancedAnalytics = React.lazy(() => 
  import(/* webpackChunkName: "analytics" */ './AdvancedAnalytics')
);

const ReportGenerator = React.lazy(() => 
  import(/* webpackChunkName: "reporting" */ './ReportGenerator')
);
```

#### Conditional Loading
```typescript
// Load features based on user permissions
const loadAdvancedFeatures = async (hasPermission: boolean) => {
  if (hasPermission) {
    const { AdvancedFeatures } = await import(
      /* webpackChunkName: "advanced-features" */ './AdvancedFeatures'
    );
    return AdvancedFeatures;
  }
  return null;
};
```

### 3. Preloading Strategies

#### Hover-Based Preloading
```typescript
import { PreloadUtils } from '@grnsw/shared';

const NavigationButton = ({ targetComponent }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Preload on hover
  PreloadUtils.usePreloadOnInteraction(
    () => import('./TargetComponent'),
    buttonRef
  );
  
  return <button ref={buttonRef}>Load Component</button>;
};
```

#### Intersection Observer Preloading
```typescript
const LazySection = ({ children }) => {
  const setRef = PreloadUtils.usePreloadOnIntersection(
    () => import('./HeavyComponent'),
    { rootMargin: '100px' } // Preload when 100px away
  );
  
  return <div ref={setRef}>{children}</div>;
};
```

## 📊 Bundle Analysis

### Running Bundle Analysis
```bash
# Analyze current bundle
npm run build -- --env.ANALYZE_BUNDLE=true

# Or run dedicated analysis task
gulp analyze-bundle
gulp analyze-compression
```

### Using Bundle Analyzer Programmatically
```typescript
import { BundleAnalyzer } from '@grnsw/shared';

// Analyze webpack stats
const analysis = await BundleAnalyzer.analyzeStats(
  './temp/stats.json',
  './package.json'
);

// Generate report
const report = BundleAnalyzer.generateReport(analysis);
console.log(report);

// Save analysis
BundleAnalyzer.saveAnalysis(analysis, './bundle-analysis.txt');
```

### Bundle Size Monitoring
Add to your CI/CD pipeline:

```yaml
# In your Azure DevOps or GitHub Actions
- name: Bundle Size Analysis
  run: |
    npm run build:prod
    gulp analyze-bundle
    gulp analyze-compression
```

## 🎯 Performance Optimizations

### 1. Component-Level Optimizations

#### Memoization
```typescript
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(({ data, filters }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return processLargeDataset(data, filters);
  }, [data, filters]);
  
  // Memoize callbacks
  const handleClick = useCallback((item) => {
    onItemClick(item);
  }, [onItemClick]);
  
  return <DataVisualization data={processedData} onClick={handleClick} />;
});
```

#### Virtual Scrolling for Large Lists
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {({ index, data, style }) => (
      <div style={style}>
        <ListItem item={data[index]} />
      </div>
    )}
  </List>
);
```

### 2. Data Loading Optimizations

#### Progressive Data Loading
```typescript
import { useProgressiveLoading } from '@grnsw/shared';

const Dashboard = () => {
  const { loadingState, results, executeSteps } = useProgressiveLoading();
  
  const loadDashboard = () => executeSteps([
    {
      id: 'essential',
      name: 'Loading essential data...',
      execute: () => loadEssentialData()
    },
    {
      id: 'charts',
      name: 'Generating charts...',
      execute: () => generateCharts(),
      optional: true
    },
    {
      id: 'analytics',
      name: 'Computing analytics...',
      execute: () => computeAnalytics(),
      optional: true
    }
  ]);
  
  return (
    <div>
      {loadingState.isLoading && <ProgressIndicator />}
      <EssentialData data={results.find(r => r.id === 'essential')?.data} />
      {/* Lazy load non-essential components */}
    </div>
  );
};
```

#### Smart Caching
```typescript
import { CacheService } from '@grnsw/shared';

const DataService = {
  async getWeatherData(trackName: string) {
    const cacheKey = `weather_${trackName}`;
    
    // Try cache first
    const cached = CacheService.get(cacheKey);
    if (cached && !CacheService.isExpired(cacheKey)) {
      return cached;
    }
    
    // Fetch and cache
    const data = await fetch(`/api/weather/${trackName}`);
    CacheService.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes
    
    return data;
  }
};
```

## 🔍 Monitoring & Analytics

### Bundle Size Monitoring
```typescript
import { bundleSizeLimits } from '@grnsw/shared';

// Set up performance budgets
const performanceBudget = {
  ...bundleSizeLimits,
  custom: {
    weatherDashboard: { max: 400 * 1024 }, // 400KB
    trackConditions: { max: 350 * 1024 }   // 350KB
  }
};
```

### Runtime Performance Monitoring
```typescript
import { useTelemetry } from '@grnsw/shared';

const WeatherDashboard = ({ context }) => {
  const { trackPerformance, trackMetric } = useTelemetry(context, {
    componentName: 'WeatherDashboard'
  });
  
  const loadData = async () => {
    // Track loading performance
    const data = await trackPerformance('load_weather_data', async () => {
      return await weatherService.getData();
    });
    
    // Track business metrics
    trackMetric('data_usage', 'weather_records_loaded', data.length, 'count');
  };
};
```

## 📋 Optimization Checklist

### Before Optimization
- [ ] Analyze current bundle sizes
- [ ] Identify largest dependencies
- [ ] Map component usage patterns
- [ ] Set performance budgets

### Implementation
- [ ] Apply webpack optimizations to gulpfile.js
- [ ] Convert heavy components to lazy loading
- [ ] Optimize imports for tree shaking
- [ ] Implement code splitting by route/feature
- [ ] Add preloading strategies
- [ ] Configure externals for common libraries

### Verification
- [ ] Run bundle analysis
- [ ] Verify code splitting is working
- [ ] Test lazy loading behavior
- [ ] Check performance in production
- [ ] Monitor bundle sizes in CI/CD

### Monitoring
- [ ] Set up bundle size alerts
- [ ] Track performance metrics
- [ ] Monitor user experience impact
- [ ] Regular optimization reviews

## 🎛️ Configuration Examples

### Development Build
```javascript
// gulpfile.js - Development configuration
configureWebpack(build, {
  enableCodeSplitting: false,  // Faster builds
  enableTreeShaking: false,    // Better debugging
  enableBundleAnalysis: false,
  production: false
});
```

### Production Build
```javascript
// gulpfile.js - Production configuration
configureWebpack(build, {
  enableCodeSplitting: true,   // Optimal loading
  enableTreeShaking: true,     // Smaller bundles
  enableBundleAnalysis: true,  // Monitor sizes
  production: true
});
```

### Staging Build
```javascript
// gulpfile.js - Staging configuration
configureWebpack(build, {
  enableCodeSplitting: true,   // Test code splitting
  enableTreeShaking: true,     // Test optimizations
  enableBundleAnalysis: true,  // Analyze impact
  production: false            // Keep source maps
});
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Code Splitting Not Working
```javascript
// Ensure dynamic imports are used correctly
const LazyComponent = React.lazy(() => import('./Component'));

// Not: const LazyComponent = React.lazy(() => require('./Component'));
```

#### 2. Lazy Loading Errors
```typescript
// Always wrap lazy components in Suspense and Error Boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<LoadingSpinner />}>
    <LazyComponent />
  </Suspense>
</ErrorBoundary>
```

#### 3. Bundle Size Not Reducing
- Check that tree shaking is enabled
- Verify imports are optimized
- Ensure externals are configured correctly
- Check for duplicate dependencies

#### 4. Performance Regression
- Monitor Core Web Vitals
- Check for increased network requests
- Verify preloading strategies are working
- Test on slower networks/devices

## 📈 Expected Results

### Bundle Size Improvements
- **Individual Web Parts**: 40-60% size reduction
- **Vendor Chunks**: 30-50% size reduction
- **Initial Load Time**: 20-40% improvement
- **Time to Interactive**: 15-30% improvement

### Performance Metrics
- **Lighthouse Score**: +10-20 points
- **First Contentful Paint**: -200-500ms
- **Largest Contentful Paint**: -300-800ms
- **Cumulative Layout Shift**: <0.1

### Development Experience
- **Build Time**: Minimal impact in development
- **Hot Reload**: Maintained performance
- **Debugging**: Source maps preserved
- **Bundle Analysis**: Automated insights

## 🚀 Next Steps

1. **Implement Basic Optimizations**
   - Apply webpack configuration
   - Add lazy loading to largest components
   - Optimize imports

2. **Advanced Optimizations**
   - Implement preloading strategies
   - Add performance monitoring
   - Set up automated bundle analysis

3. **Monitoring & Maintenance**
   - Regular bundle size reviews
   - Performance budget enforcement
   - Continuous optimization opportunities

4. **Team Training**
   - Share optimization best practices
   - Document component patterns
   - Regular performance reviews

---

For questions or support with bundle optimization, refer to the [GRNSW Development Guidelines](../../../docs/DEVELOPMENT_GUIDELINES.md) or contact the development team.