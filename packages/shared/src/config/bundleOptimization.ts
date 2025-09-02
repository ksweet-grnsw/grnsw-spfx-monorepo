/**
 * Bundle optimization configurations for SPFx solutions
 * Provides webpack optimization settings and bundle analysis
 */

/**
 * Shared chunk configuration for common dependencies
 * Extracts frequently used modules into separate chunks
 */
export const sharedChunkConfig = {
  // Common React chunks
  'react-vendor': [
    'react',
    'react-dom',
    'react/jsx-runtime'
  ],
  
  // Microsoft SPFx chunks
  'spfx-vendor': [
    '@microsoft/sp-webpart-base',
    '@microsoft/sp-core-library',
    '@microsoft/sp-component-base',
    '@microsoft/sp-property-pane',
    '@microsoft/sp-lodash-subset'
  ],
  
  // Fluent UI chunks (when used)
  'fluentui-vendor': [
    '@fluentui/react',
    '@fluentui/react/lib/Button',
    '@fluentui/react/lib/Panel',
    '@fluentui/react/lib/TextField',
    '@fluentui/react/lib/Dropdown'
  ],
  
  // Charting libraries
  'chart-vendor': [
    'chart.js',
    'react-chartjs-2'
  ],
  
  // Shared business logic
  'grnsw-shared': [
    '@grnsw/shared'
  ]
};

/**
 * Webpack optimization configuration for SPFx
 * Implements code splitting and chunk optimization
 */
export const webpackOptimizationConfig = {
  // Split chunks configuration
  splitChunks: {
    cacheGroups: {
      // Vendor chunks for external dependencies
      reactVendor: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: 'react-vendor',
        chunks: 'all',
        priority: 20,
        reuseExistingChunk: true
      },
      
      spfxVendor: {
        test: /[\\/]node_modules[\\/]@microsoft[\\/]sp-/,
        name: 'spfx-vendor', 
        chunks: 'all',
        priority: 15,
        reuseExistingChunk: true
      },
      
      fluentuiVendor: {
        test: /[\\/]node_modules[\\/]@fluentui[\\/]/,
        name: 'fluentui-vendor',
        chunks: 'all',
        priority: 10,
        reuseExistingChunk: true
      },
      
      chartVendor: {
        test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
        name: 'chart-vendor',
        chunks: 'all',
        priority: 10,
        reuseExistingChunk: true
      },
      
      // Common utilities chunk
      common: {
        name: 'common',
        chunks: 'all',
        minChunks: 2,
        priority: 5,
        reuseExistingChunk: true,
        enforce: true
      }
    }
  },
  
  // Runtime chunk configuration
  runtimeChunk: {
    name: 'runtime'
  },
  
  // Minimize configuration
  minimize: true,
  minimizer: [
    // Terser for JS minification
    {
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.logs in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        },
        mangle: {
          safari10: true
        },
        output: {
          comments: false
        }
      }
    }
  ],
  
  // Module concatenation (webpack 4+)
  concatenateModules: true,
  
  // Side effects optimization
  sideEffects: false,
  
  // Tree shaking configuration
  usedExports: true,
  providedExports: true
};

/**
 * Bundle size limits and warnings
 * Helps identify when bundles become too large
 */
export const bundleSizeLimits = {
  // Individual web part bundles (in KB)
  webpart: {
    warning: 250,
    error: 500
  },
  
  // Vendor chunks
  vendor: {
    warning: 500,
    error: 1000
  },
  
  // Total solution size
  total: {
    warning: 2000, // 2MB
    error: 4000 // 4MB
  }
};

/**
 * Performance budget configuration
 * Webpack performance hints
 */
export const performanceBudget = {
  hints: 'warning',
  maxAssetSize: 500000, // 500KB per asset
  maxEntrypointSize: 1000000, // 1MB per entrypoint
  assetFilter: (assetFilename: string) => {
    // Only check JS bundles, not CSS or images
    return /\.(js|jsx|ts|tsx)$/.test(assetFilename);
  }
};

/**
 * Dynamic import patterns for code splitting
 * Templates for implementing lazy loading in components
 */
export const dynamicImportPatterns = {
  // Lazy load chart components
  lazyChart: `
    const ChartComponent = React.lazy(() => import('./components/charts/ChartComponent'));
    
    // Usage in component
    <React.Suspense fallback={<LoadingSpinner />}>
      <ChartComponent data={data} />
    </React.Suspense>
  `,
  
  // Lazy load heavy analysis components
  lazyAnalysis: `
    const AnalysisComponent = React.lazy(() => 
      import('./components/analysis/AnalysisComponent')
    );
  `,
  
  // Conditional feature loading
  conditionalFeature: `
    const loadAdvancedFeatures = async () => {
      if (userHasAdvancedFeatures) {
        const { AdvancedFeatures } = await import('./features/AdvancedFeatures');
        return AdvancedFeatures;
      }
      return null;
    };
  `,
  
  // Service lazy loading
  lazyService: `
    const getAnalyticsService = async () => {
      const { AnalyticsService } = await import('./services/AnalyticsService');
      return new AnalyticsService();
    };
  `
};

/**
 * Bundle analysis utilities
 * Helpers for analyzing bundle composition and size
 */
export const bundleAnalysisUtils = {
  // Analyze bundle content
  analyzeBundleContent: (stats: any) => {
    const analysis = {
      totalSize: 0,
      chunkSizes: new Map<string, number>(),
      moduleCount: 0,
      duplicateModules: [],
      largestModules: []
    };
    
    if (stats.chunks) {
      stats.chunks.forEach((chunk: any) => {
        const chunkSize = chunk.files?.reduce((total: number, file: any) => {
          return total + (file.size || 0);
        }, 0) || 0;
        
        analysis.chunkSizes.set(chunk.names?.[0] || `chunk-${chunk.id}`, chunkSize);
        analysis.totalSize += chunkSize;
      });
    }
    
    return analysis;
  },
  
  // Generate bundle report
  generateBundleReport: (analysis: any) => {
    const report = {
      summary: {
        totalSize: `${(analysis.totalSize / 1024).toFixed(2)} KB`,
        chunkCount: analysis.chunkSizes.size,
        moduleCount: analysis.moduleCount
      },
      chunks: Array.from(analysis.chunkSizes.entries()).map(([name, size]) => ({
        name,
        size: `${(size / 1024).toFixed(2)} KB`,
        percentage: `${((size / analysis.totalSize) * 100).toFixed(1)}%`
      })),
      recommendations: []
    };
    
    // Add recommendations based on analysis
    if (analysis.totalSize > bundleSizeLimits.total.warning * 1024) {
      report.recommendations.push('Total bundle size exceeds warning threshold');
    }
    
    report.chunks.forEach(chunk => {
      const sizeKB = parseFloat(chunk.size.replace(' KB', ''));
      if (sizeKB > bundleSizeLimits.webpart.warning) {
        report.recommendations.push(`Chunk '${chunk.name}' is large (${chunk.size})`);
      }
    });
    
    return report;
  }
};

/**
 * Tree shaking optimization helpers
 * Utilities for optimizing imports and reducing bundle size
 */
export const treeShakingHelpers = {
  // Optimized import patterns
  optimizedImports: {
    // Bad: imports entire library
    bad: `import * as _ from 'lodash';`,
    
    // Good: imports specific functions
    good: `import { debounce, throttle } from 'lodash';`,
    
    // Better: use lodash-es for better tree shaking
    better: `import debounce from 'lodash-es/debounce';`
  },
  
  // Fluent UI optimized imports
  fluentuiImports: {
    bad: `import { Button, Panel, TextField } from '@fluentui/react';`,
    good: `
      import { Button } from '@fluentui/react/lib/Button';
      import { Panel } from '@fluentui/react/lib/Panel';
      import { TextField } from '@fluentui/react/lib/TextField';
    `
  },
  
  // Chart.js optimized imports
  chartjsImports: {
    bad: `import Chart from 'chart.js';`,
    good: `
      import {
        Chart as ChartJS,
        CategoryScale,
        LinearScale,
        BarElement,
        Title,
        Tooltip,
        Legend,
      } from 'chart.js';
      
      ChartJS.register(
        CategoryScale,
        LinearScale,
        BarElement,
        Title,
        Tooltip,
        Legend
      );
    `
  }
};

/**
 * Preload and prefetch strategies
 * Optimize loading of critical resources
 */
export const loadingStrategies = {
  // Critical resources to preload
  preload: [
    'react-vendor',
    'spfx-vendor',
    'grnsw-shared'
  ],
  
  // Resources to prefetch on idle
  prefetch: [
    'chart-vendor',
    'fluentui-vendor'
  ],
  
  // Lazy loading configuration
  lazyLoading: {
    // Components that should be lazy loaded
    components: [
      'HistoricalPatternAnalyzer',
      'AdvancedCharts',
      'DataExporter',
      'ReportGenerator'
    ],
    
    // Services that can be lazy loaded
    services: [
      'AnalyticsService',
      'ReportingService',
      'ExportService'
    ]
  }
};

/**
 * Development vs Production optimizations
 * Different optimization strategies for different environments
 */
export const environmentOptimizations = {
  development: {
    // Faster builds, better debugging
    minimize: false,
    splitChunks: false,
    sourceMap: 'eval-source-map',
    devtool: 'eval-source-map'
  },
  
  production: {
    // Smaller bundles, optimized for performance
    minimize: true,
    splitChunks: true,
    sourceMap: 'source-map',
    devtool: 'source-map',
    treeShaking: true,
    deadCodeElimination: true
  },
  
  staging: {
    // Balance between dev and prod
    minimize: true,
    splitChunks: true,
    sourceMap: 'source-map',
    devtool: 'source-map'
  }
};