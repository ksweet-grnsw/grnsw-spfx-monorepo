# Performance Optimization Guide

## Overview

This guide covers performance optimization techniques for GRNSW SPFx applications, including bundle optimization, lazy loading, caching strategies, and runtime performance improvements.

## Table of Contents

1. [Bundle Optimization](#bundle-optimization)
2. [Code Splitting](#code-splitting)
3. [Lazy Loading](#lazy-loading)
4. [Caching Strategies](#caching-strategies)
5. [Runtime Performance](#runtime-performance)
6. [Memory Management](#memory-management)
7. [Network Optimization](#network-optimization)
8. [Monitoring & Analysis](#monitoring--analysis)

## Bundle Optimization

### Webpack Configuration

```javascript
// gulpfile.js
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
    // Production optimizations
    if (build.getConfig().production) {
      generatedConfiguration.mode = 'production';
      
      // Optimize JavaScript
      generatedConfiguration.optimization = {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true,      // Remove console logs
                drop_debugger: true,     // Remove debugger statements
                pure_funcs: ['console.log', 'console.info']
              },
              mangle: {
                safari10: true
              },
              output: {
                comments: false
              }
            },
            extractComments: false
          })
        ],
        
        // Code splitting
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            // Vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )[1];
                return `vendor.${packageName.replace('@', '')}`;
              },
              priority: 10
            },
            
            // React specific
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react-vendor',
              priority: 20
            },
            
            // Fluent UI
            fluentui: {
              test: /[\\/]node_modules[\\/]@fluentui[\\/]/,
              name: 'fluentui-vendor',
              priority: 15
            },
            
            // Shared code
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
              name: 'common'
            }
          }
        },
        
        // Module concatenation
        concatenateModules: true,
        
        // Tree shaking
        usedExports: true,
        sideEffects: false
      };
      
      // Compression
      generatedConfiguration.plugins.push(
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8
        })
      );
    }
    
    // Bundle analysis
    if (process.env.ANALYZE_BUNDLE) {
      generatedConfiguration.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: 'bundle-report.html',
          openAnalyzer: false,
          generateStatsFile: true,
          statsFilename: 'bundle-stats.json'
        })
      );
    }
    
    return generatedConfiguration;
  }
});
```

### Import Optimization

```typescript
// ❌ Bad - imports entire library
import * as _ from 'lodash';
import { Icon, Button, TextField } from '@fluentui/react';

// ✅ Good - selective imports
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { Icon } from '@fluentui/react/lib/Icon';
import { Button } from '@fluentui/react/lib/Button';
import { TextField } from '@fluentui/react/lib/TextField';

// ❌ Bad - imports all icons
import * as icons from '@fluentui/react-icons';

// ✅ Good - specific icon imports
import { AddRegular, DeleteRegular } from '@fluentui/react-icons';
```

### Dynamic Imports

```typescript
// Static import (always loaded)
import HeavyComponent from './HeavyComponent';

// Dynamic import (loaded on demand)
const HeavyComponent = React.lazy(() => 
  import(/* webpackChunkName: "heavy-component" */ './HeavyComponent')
);

// Conditional dynamic import
const loadAnalytics = async () => {
  if (userHasAnalyticsPermission) {
    const { AnalyticsDashboard } = await import(
      /* webpackChunkName: "analytics" */
      './AnalyticsDashboard'
    );
    return AnalyticsDashboard;
  }
  return null;
};
```

## Code Splitting

### Route-Based Splitting

```typescript
// routes.tsx
const routes = {
  dashboard: React.lazy(() => 
    import(/* webpackChunkName: "dashboard" */ './views/Dashboard')
  ),
  analytics: React.lazy(() => 
    import(/* webpackChunkName: "analytics" */ './views/Analytics')
  ),
  settings: React.lazy(() => 
    import(/* webpackChunkName: "settings" */ './views/Settings')
  ),
  reports: React.lazy(() => 
    import(/* webpackChunkName: "reports" */ './views/Reports')
  )
};

const AppRouter: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const ViewComponent = routes[currentView];
  
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ViewComponent />
    </Suspense>
  );
};
```

### Feature-Based Splitting

```typescript
// Feature flags for code splitting
const features = {
  charts: () => import(/* webpackChunkName: "charts" */ './features/Charts'),
  export: () => import(/* webpackChunkName: "export" */ './features/Export'),
  ai: () => import(/* webpackChunkName: "ai" */ './features/AIInsights')
};

const FeatureLoader: React.FC<{ feature: string }> = ({ feature }) => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  
  useEffect(() => {
    if (features[feature]) {
      features[feature]().then(module => {
        setComponent(() => module.default);
      });
    }
  }, [feature]);
  
  if (!Component) return <LoadingSpinner />;
  
  return <Component />;
};
```

### Vendor Splitting

```typescript
// webpack.config.js optimization
optimization: {
  splitChunks: {
    cacheGroups: {
      // Split large libraries
      chartjs: {
        test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
        name: 'chartjs',
        priority: 30
      },
      
      xlsx: {
        test: /[\\/]node_modules[\\/]xlsx[\\/]/,
        name: 'xlsx',
        priority: 25
      },
      
      // Group small utilities
      utils: {
        test: /[\\/]node_modules[\\/](lodash|moment|date-fns)[\\/]/,
        name: 'utils',
        priority: 20
      }
    }
  }
}
```

## Lazy Loading

### Component Lazy Loading

```typescript
import { LazyComponent } from '@grnsw/shared';

const Dashboard: React.FC = () => {
  const [showCharts, setShowCharts] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowCharts(true)}>
        Show Charts
      </button>
      
      {showCharts && (
        <LazyComponent
          importFunction={() => import('./ChartsSection')}
          fallback={<ChartSkeleton />}
          preload={true} // Preload on hover
          retryAttempts={3}
        />
      )}
    </div>
  );
};
```

### Progressive Image Loading

```typescript
const ProgressiveImage: React.FC<{
  src: string;
  placeholder: string;
  alt: string;
}> = ({ src, placeholder, alt }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState<HTMLImageElement>();
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setImageRef(img);
    };
  }, [src]);
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      style={{
        filter: imageSrc === placeholder ? 'blur(5px)' : 'none',
        transition: 'filter 0.3s'
      }}
    />
  );
};
```

### Intersection Observer Loading

```typescript
const LazyLoadOnScroll: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px' // Start loading 100px before visible
      }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref}>
      {isVisible ? children : <LoadingPlaceholder />}
    </div>
  );
};
```

## Caching Strategies

### API Response Caching

```typescript
class CachedDataService {
  private cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
  }>();
  
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`Cache hit: ${key}`);
      return cached.data as T;
    }
    
    // Fetch fresh data
    console.log(`Cache miss: ${key}`);
    const data = await fetcher();
    
    // Update cache
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    return data;
  }
  
  // Stale-while-revalidate pattern
  async fetchSWR<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    // Return stale data immediately
    if (cached) {
      // Revalidate in background
      fetcher().then(fresh => {
        this.cache.set(key, {
          data: fresh,
          timestamp: Date.now(),
          ttl
        });
      }).catch(console.error);
      
      return cached.data as T;
    }
    
    // No cache, fetch fresh
    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    return data;
  }
  
  invalidate(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}
```

### Memoization

```typescript
import { useMemo, useCallback, memo } from 'react';

// Component memoization
const ExpensiveComponent = memo(({ data }: Props) => {
  // Component only re-renders if props change
  return <ComplexVisualization data={data} />;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});

// Value memoization
const Dashboard: React.FC = () => {
  const expensiveCalculation = useMemo(() => {
    return processLargeDataset(data);
  }, [data]); // Only recalculate when data changes
  
  // Callback memoization
  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []); // Never recreates function
  
  return (
    <ExpensiveComponent 
      data={expensiveCalculation}
      onClick={handleClick}
    />
  );
};
```

### Service Worker Caching

```javascript
// service-worker.js
const CACHE_NAME = 'grnsw-v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/bundle.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit
        if (response) {
          return response;
        }
        
        // Network request
        return fetch(event.request).then(response => {
          // Cache successful responses
          if (!response || response.status !== 200) {
            return response;
          }
          
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});
```

## Runtime Performance

### Virtual Scrolling

```typescript
import { FixedSizeList } from 'react-window';

const VirtualizedList: React.FC<{ items: any[] }> = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### Debouncing & Throttling

```typescript
import { useMemo, useCallback } from 'react';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

const SearchComponent: React.FC = () => {
  // Debounce search (wait for user to stop typing)
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      performSearch(query);
    }, 300),
    []
  );
  
  // Throttle scroll handler (limit frequency)
  const throttledScroll = useMemo(
    () => throttle(() => {
      updateScrollPosition();
    }, 100),
    []
  );
  
  return (
    <div onScroll={throttledScroll}>
      <input
        onChange={(e) => debouncedSearch(e.target.value)}
        placeholder="Search..."
      />
    </div>
  );
};
```

### Request Animation Frame

```typescript
const AnimatedComponent: React.FC = () => {
  const [position, setPosition] = useState(0);
  const animationRef = useRef<number>();
  
  const animate = useCallback(() => {
    // Smooth animation using RAF
    const updatePosition = () => {
      setPosition(prev => {
        const next = prev + 1;
        if (next < 100) {
          animationRef.current = requestAnimationFrame(updatePosition);
        }
        return next;
      });
    };
    
    animationRef.current = requestAnimationFrame(updatePosition);
  }, []);
  
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return (
    <div style={{ transform: `translateX(${position}px)` }}>
      Animated Content
    </div>
  );
};
```

### Web Workers

```typescript
// worker.ts
self.addEventListener('message', (event) => {
  const { data } = event;
  
  // Perform heavy computation
  const result = processLargeDataset(data);
  
  // Send result back
  self.postMessage(result);
});

// Component using worker
const DataProcessor: React.FC = () => {
  const workerRef = useRef<Worker>();
  const [result, setResult] = useState();
  
  useEffect(() => {
    workerRef.current = new Worker('/worker.js');
    
    workerRef.current.onmessage = (event) => {
      setResult(event.data);
    };
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  
  const processData = (data: any) => {
    workerRef.current?.postMessage(data);
  };
  
  return (
    <div>
      <button onClick={() => processData(largeDataset)}>
        Process in Background
      </button>
      {result && <div>Result: {result}</div>}
    </div>
  );
};
```

## Memory Management

### Cleanup Patterns

```typescript
const ResourceComponent: React.FC = () => {
  useEffect(() => {
    // Setup
    const timer = setInterval(() => {}, 1000);
    const handler = () => {};
    window.addEventListener('resize', handler);
    
    // Cleanup
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', handler);
    };
  }, []);
  
  // Cleanup refs
  const observerRef = useRef<IntersectionObserver>();
  
  useEffect(() => {
    observerRef.current = new IntersectionObserver(() => {});
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);
};
```

### Memory Leak Prevention

```typescript
class MemoryAwareComponent extends React.Component {
  private mounted = false;
  private subscriptions: Array<() => void> = [];
  
  componentDidMount() {
    this.mounted = true;
    
    // Safe async operations
    this.loadData();
  }
  
  componentWillUnmount() {
    this.mounted = false;
    
    // Cleanup all subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
  
  async loadData() {
    const data = await fetchData();
    
    // Check if still mounted
    if (this.mounted) {
      this.setState({ data });
    }
  }
  
  subscribe(callback: () => void) {
    const unsubscribe = eventEmitter.on('event', callback);
    this.subscriptions.push(unsubscribe);
  }
}
```

### Object Pooling

```typescript
class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  
  constructor(factory: () => T, reset: (obj: T) => void) {
    this.factory = factory;
    this.reset = reset;
  }
  
  acquire(): T {
    return this.pool.pop() || this.factory();
  }
  
  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }
  
  clear(): void {
    this.pool = [];
  }
}

// Usage
const particlePool = new ObjectPool(
  () => ({ x: 0, y: 0, velocity: 0 }),
  (particle) => {
    particle.x = 0;
    particle.y = 0;
    particle.velocity = 0;
  }
);
```

## Network Optimization

### Request Batching

```typescript
class BatchedApiService {
  private batchQueue: Array<{
    query: string;
    resolve: (data: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  private batchTimer: NodeJS.Timeout | null = null;
  private batchDelay = 50; // ms
  private maxBatchSize = 10;
  
  async query(query: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ query, resolve, reject });
      
      if (this.batchQueue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }
  
  private async flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    const batch = this.batchQueue.splice(0, this.maxBatchSize);
    if (batch.length === 0) return;
    
    try {
      const results = await this.executeBatch(
        batch.map(item => item.query)
      );
      
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
  
  private async executeBatch(queries: string[]): Promise<any[]> {
    const response = await fetch('/api/batch', {
      method: 'POST',
      body: JSON.stringify({ queries })
    });
    
    return response.json();
  }
}
```

### Prefetching

```typescript
const PrefetchManager = {
  prefetchedData: new Map<string, Promise<any>>(),
  
  prefetch(key: string, fetcher: () => Promise<any>): void {
    if (!this.prefetchedData.has(key)) {
      this.prefetchedData.set(key, fetcher());
    }
  },
  
  async get(key: string): Promise<any> {
    const prefetched = this.prefetchedData.get(key);
    if (prefetched) {
      this.prefetchedData.delete(key);
      return prefetched;
    }
    return null;
  }
};

// Prefetch on hover
const LinkWithPrefetch: React.FC<{ href: string }> = ({ href, children }) => {
  const handleMouseEnter = () => {
    PrefetchManager.prefetch(href, () => fetchPageData(href));
  };
  
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const data = await PrefetchManager.get(href) || await fetchPageData(href);
    navigateTo(href, data);
  };
  
  return (
    <a 
      href={href}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};
```

## Monitoring & Analysis

### Performance Metrics

```typescript
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  measure(name: string, fn: () => void): void {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(duration);
    
    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow operation: ${name} took ${duration}ms`);
    }
  }
  
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric(name, duration);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }
  
  getStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
}
```

### Bundle Analysis

```bash
# Generate bundle analysis
npm run build:analyze

# View the report
open ./dist/bundle-report.html
```

```typescript
// Analyze bundle programmatically
import { BundleAnalyzer } from '@grnsw/shared/utils';

const analyzeBuild = async () => {
  const analysis = await BundleAnalyzer.analyzeStats(
    './dist/bundle-stats.json',
    './package.json'
  );
  
  console.log('Bundle Analysis:');
  console.log(`Total Size: ${analysis.totalSize}`);
  console.log(`Largest Modules:`);
  
  analysis.modules
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .forEach(module => {
      console.log(`  ${module.name}: ${module.size}`);
    });
  
  // Check for duplicates
  if (analysis.duplicates.length > 0) {
    console.warn('Duplicate modules found:');
    analysis.duplicates.forEach(dup => {
      console.warn(`  ${dup.name} (${dup.versions.join(', ')})`);
    });
  }
};
```

## Best Practices

### 1. Measure First
- Profile before optimizing
- Use Performance DevTools
- Track real user metrics

### 2. Optimize Critical Path
- Prioritize above-the-fold content
- Defer non-critical resources
- Inline critical CSS

### 3. Reduce Bundle Size
- Tree shake unused code
- Lazy load features
- Compress assets

### 4. Cache Aggressively
- Cache API responses
- Use service workers
- Implement stale-while-revalidate

### 5. Optimize Rendering
- Use React.memo wisely
- Virtualize long lists
- Batch DOM updates

### 6. Monitor Production
- Track performance metrics
- Set performance budgets
- Alert on degradation

### 7. Progressive Enhancement
- Start with basic functionality
- Enhance with JavaScript
- Provide fallbacks