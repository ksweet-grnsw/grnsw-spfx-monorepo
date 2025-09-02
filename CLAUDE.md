# GRNSW SPFx Monorepo Instructions

## 🚨 CRITICAL: Version Before Build
**ALWAYS update version BEFORE building. SharePoint will show wrong version if you don't!**

### Build Checklist (MANDATORY)
1. Update version in BOTH `package.json` AND `config/package-solution.json`
2. Run `gulp clean`
3. Run `gulp bundle --ship`
4. Run `gulp package-solution --ship`
5. Copy .sppkg to releases folder

## Project Structure
```
grnsw-spfx-monorepo/
├── packages/
│   ├── track-conditions-spfx/    # Weather tracking (6 web parts)
│   ├── race-management/          # Race calendar
│   ├── gap-spfx/                # Adoption program
│   └── greyhound-health/        # Health tracking
├── releases/                    # Production .sppkg files
└── docs/dataverse/             # Field documentation
```

## Tech Stack
- SPFx 1.21.1, React 17.0.1, TypeScript 5.3.3
- Node 22.14.0+ (< 23.0.0)
- Chart.js 4.5.0

## Dataverse Environments

### Racing Data
- **URL:** https://racingdata.crm6.dynamics.com/api/data/v9.1
- **Tables:** cr4cc_racemeetings, cr616_races, cr616_contestants

### Weather Data  
- **URL:** https://org98489e5d.crm6.dynamics.com/api/data/v9.1
- **Table:** cr4cc_weatherdatas (180+ fields)

### Injury Data
- **URL:** https://orgfc8a11f1.crm6.dynamics.com/api/data/v9.1
- **Tables:** cra5e_injurydatas, cra5e_greyhounds, cra5e_heathchecks

### GAP (Adoption)
- **URL:** https://orgda56a300.crm6.dynamics.com/api/data/v9.1
- **Table:** cr0d3_hounds

## Field Documentation
Run `npm run discover:fields` to update field documentation in `docs/dataverse/`

## Build Commands
```bash
# Track Conditions
cd packages/track-conditions-spfx
npm run sync-version 2.2.8  # Has version sync scripts
gulp clean && gulp bundle --ship && gulp package-solution --ship

# Race Management (manual version update)
cd packages/race-management
# UPDATE package.json and config/package-solution.json MANUALLY
gulp clean && gulp bundle --ship && gulp package-solution --ship
```

## Code Standards

### Architecture
- SOLID principles - strictly enforced
- DRY - no code duplication 
- Separation of Concerns - clear layer separation
- Functional components with hooks
- TypeScript strict mode
- Error boundaries - MANDATORY for all components

### Project Structure
```
src/
├── components/      # UI components
├── hooks/          # Custom React hooks
├── services/       # API and business logic
├── utils/          # Utility functions
├── models/         # TypeScript interfaces
└── webparts/       # SPFx web parts
```

## 🚀 Infrastructure Components (MANDATORY)

### Error Handling & Recovery
```typescript
// ALWAYS wrap components with error boundaries
import { ErrorBoundary, DataverseErrorBoundary } from '@grnsw/shared';

<ErrorBoundary fallback={ErrorFallback}>
  <DataverseErrorBoundary>
    <YourComponent />
  </DataverseErrorBoundary>
</ErrorBoundary>
```

### Loading States & Skeletons
```typescript
// ALWAYS use professional loading states
import { LoadingSpinner, DashboardSkeleton, useLoadingState } from '@grnsw/shared';

const { loadingState, startLoading, stopLoading } = useLoadingState();

// Show skeleton while loading
{loadingState.isLoading && <DashboardSkeleton type="safety" />}
```

### Telemetry & Monitoring
```typescript
// ALWAYS track performance and errors in production
import { useTelemetry } from '@grnsw/shared';

const { trackAction, trackPerformance, trackError } = useTelemetry(context, {
  componentName: 'YourComponent',
  enabled: true
});

// Track all user actions and API calls
await trackPerformance('operation_name', () => yourOperation());
```

### Code Splitting & Lazy Loading
```typescript
// ALWAYS lazy load heavy components (charts, tables, analytics)
import { LazyComponent } from '@grnsw/shared';

<LazyComponent
  importFunction={() => import(/* webpackChunkName: "charts" */ './ChartComponent')}
  loadingText="Loading chart..."
  retryAttempts={3}
/>
```

### Caching Strategy
```typescript
// ALWAYS cache Dataverse responses
import { CacheService } from '@grnsw/shared';

const cached = CacheService.get(cacheKey);
if (cached && !CacheService.isExpired(cacheKey)) {
  return cached;
}
const data = await fetchData();
CacheService.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes
```

### Progressive Loading for Dashboards
```typescript
// ALWAYS use progressive loading for complex dashboards
import { useProgressiveLoading } from '@grnsw/shared';

const { loadingState, results, executeSteps } = useProgressiveLoading();

await executeSteps([
  { id: 'data', name: 'Loading data...', execute: () => loadData() },
  { id: 'stats', name: 'Calculating stats...', execute: () => calculateStats() },
  { id: 'charts', name: 'Generating charts...', execute: () => generateCharts() }
]);
```

### Available Infrastructure Components
```typescript
// Core Components (from @grnsw/shared)
import {
  // Error Handling
  ErrorBoundary,
  DataverseErrorBoundary,
  useErrorHandler,
  useDataverseErrorHandler,
  
  // Loading States
  LoadingSpinner,
  LoadingOverlay,
  ProgressBar,
  DashboardSkeleton,
  SkeletonLoader,
  
  // Lazy Loading
  LazyComponent,
  useLazyComponent,
  createLazyComponent,
  PreloadUtils,
  
  // Telemetry
  TelemetryService,
  useTelemetry,
  useServiceTelemetry,
  useDashboardTelemetry,
  
  // Loading Hooks
  useLoadingState,
  useAsyncOperation,
  useProgressiveLoading,
  
  // Services
  CacheService,
  ThrottleService,
  
  // Bundle Optimization
  BundleAnalyzer
} from '@grnsw/shared';
```

### Performance Requirements
- Bundle size per web part: < 500KB
- Initial load time: < 3 seconds
- Time to interactive: < 5 seconds
- Lighthouse score: > 80
- Error rate: < 1%

### Monitoring Requirements
- Application Insights MUST be configured for production
- Track all errors with context
- Monitor API performance
- Track user interactions
- Report business metrics

## SharePoint
- **Tenant:** grnsw21.sharepoint.com
- **App Catalog:** https://grnsw21.sharepoint.com/sites/appcatalog
- **Workbench:** https://grnsw21.sharepoint.com/_layouts/workbench.aspx

## Track Names (18 official)
Broken Hill, Bulli, Casino, Dapto, Dubbo, Gosford, Goulburn, Grafton, Gunnedah, Lithgow, Maitland, Nowra, Richmond, Taree, Temora, The Gardens, Wagga Wagga, Wentworth Park

## Dataverse Quirks
- Tables may double-pluralize: cr616_races → cr616_raceses
- Always test both forms
- Unix timestamps need *1000 for JS dates
- Many fields return null - preserve them

## Current Versions
- **Track Conditions:** 2.2.4
- **Race Management:** 1.5.17  
- **GAP:** 1.0.0

## Important Rules
- NEVER create files unless necessary
- ALWAYS prefer editing over creating
- NEVER commit unless explicitly asked
- Include version in property pane
- Use --ship flag for production builds