# Migration Guide: Adopting Infrastructure Components

## Overview

This guide helps you migrate existing GRNSW SPFx components to use the new infrastructure components from `@grnsw/shared`. Follow this step-by-step approach to modernize your components with minimal disruption.

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Migration Strategy](#migration-strategy)
3. [Step-by-Step Migration](#step-by-step-migration)
4. [Component Migration Examples](#component-migration-examples)
5. [Service Migration](#service-migration)
6. [Testing Migration](#testing-migration)
7. [Rollback Plan](#rollback-plan)

## Pre-Migration Checklist

Before starting migration:

- [ ] Backup current code
- [ ] Document current component behavior
- [ ] Identify critical features
- [ ] Set up monitoring for comparison
- [ ] Plan rollback strategy
- [ ] Schedule migration during low-traffic period

## Migration Strategy

### Incremental Approach

1. **Phase 1**: Add error boundaries (low risk)
2. **Phase 2**: Implement telemetry (monitoring only)
3. **Phase 3**: Add loading states (UI improvement)
4. **Phase 4**: Implement caching (performance boost)
5. **Phase 5**: Add lazy loading (optimization)

### Component Priority

Migrate components in this order:

1. Leaf components (lowest risk)
2. Utility components
3. Data display components
4. Form components
5. Page-level components
6. Web parts (highest impact)

## Step-by-Step Migration

### Step 1: Install Dependencies

```bash
cd packages/your-package
npm install @grnsw/shared
```

### Step 2: Update Imports

```typescript
// Before
import { Logger } from '../utils/Logger';
import { ErrorHandler } from '../utils/ErrorHandler';
import { Spinner } from '@fluentui/react';

// After
import { 
  useTelemetry,
  useErrorHandler,
  LoadingSpinner,
  ErrorBoundary 
} from '@grnsw/shared';
```

### Step 3: Wrap with Error Boundary

```typescript
// Before
export default MyComponent;

// After
export default (props: IMyComponentProps) => (
  <ErrorBoundary
    fallback={({ error, retry }) => (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={retry}>Retry</button>
      </div>
    )}
  >
    <MyComponent {...props} />
  </ErrorBoundary>
);
```

### Step 4: Add Telemetry

```typescript
// Before
const MyComponent: React.FC<Props> = (props) => {
  const handleClick = () => {
    console.log('Button clicked');
    // Action logic
  };
  
  return <button onClick={handleClick}>Click</button>;
};

// After
const MyComponent: React.FC<Props> = (props) => {
  const { trackAction } = useTelemetry(props.context, {
    componentName: 'MyComponent'
  });
  
  const handleClick = () => {
    trackAction('click', 'action_button');
    // Action logic
  };
  
  return <button onClick={handleClick}>Click</button>;
};
```

### Step 5: Improve Loading States

```typescript
// Before
const MyComponent: React.FC<Props> = (props) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState();
  
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.getData();
      setData(result);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  return <div>{data}</div>;
};

// After
const MyComponent: React.FC<Props> = (props) => {
  const { loadingState, data, execute } = useAsyncOperation();
  
  const loadData = () => {
    execute(
      () => api.getData(),
      'Loading data...'
    );
  };
  
  if (loadingState.isLoading) {
    return <DashboardSkeleton type="data" />;
  }
  
  if (loadingState.error) {
    return <ErrorDisplay error={loadingState.error} />;
  }
  
  return <div>{data}</div>;
};
```

## Component Migration Examples

### Example 1: Simple Display Component

**Before:**
```typescript
// WeatherCard.tsx (Original)
import React from 'react';
import styles from './WeatherCard.module.scss';

interface IWeatherCardProps {
  data: IWeatherData;
  onRefresh: () => void;
}

const WeatherCard: React.FC<IWeatherCardProps> = ({ data, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
      alert('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.card}>
      <h3>{data.location}</h3>
      <p>Temperature: {data.temperature}°C</p>
      <button onClick={handleRefresh} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
};

export default WeatherCard;
```

**After:**
```typescript
// WeatherCard.tsx (Migrated)
import React from 'react';
import styles from './WeatherCard.module.scss';
import { 
  ErrorBoundary, 
  useErrorHandler,
  useTelemetry,
  LoadingSpinner 
} from '@grnsw/shared';

interface IWeatherCardProps {
  data: IWeatherData;
  onRefresh: () => void;
  context: WebPartContext;
}

const WeatherCardContent: React.FC<IWeatherCardProps> = ({ 
  data, 
  onRefresh,
  context 
}) => {
  const [loading, setLoading] = useState(false);
  const { handleError } = useErrorHandler({
    componentName: 'WeatherCard'
  });
  const { trackAction, trackError } = useTelemetry(context, {
    componentName: 'WeatherCard'
  });
  
  const handleRefresh = async () => {
    trackAction('click', 'refresh_button', {
      location: data.location
    });
    
    setLoading(true);
    try {
      await onRefresh();
      trackAction('success', 'data_refreshed');
    } catch (error) {
      trackError(error, 'WeatherCard', 'refresh');
      handleError(error, 'REFRESH_FAILED');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.card}>
      <h3>{data.location}</h3>
      <p>Temperature: {data.temperature}°C</p>
      <button onClick={handleRefresh} disabled={loading}>
        {loading ? <LoadingSpinner size="small" inline /> : 'Refresh'}
      </button>
    </div>
  );
};

// Export with error boundary
export default (props: IWeatherCardProps) => (
  <ErrorBoundary
    fallback={({ error, retry }) => (
      <div className={styles.errorCard}>
        <p>Weather card unavailable</p>
        <button onClick={retry}>Retry</button>
      </div>
    )}
  >
    <WeatherCardContent {...props} />
  </ErrorBoundary>
);
```

### Example 2: Data Fetching Component

**Before:**
```typescript
// DataTable.tsx (Original)
const DataTable: React.FC<Props> = ({ context }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <table>
      {data.map(item => (
        <tr key={item.id}>
          <td>{item.name}</td>
        </tr>
      ))}
    </table>
  );
};
```

**After:**
```typescript
// DataTable.tsx (Migrated)
import { 
  useAsyncOperation,
  DashboardSkeleton,
  ErrorBoundary,
  DataverseErrorBoundary,
  CacheService,
  useTelemetry
} from '@grnsw/shared';

const DataTable: React.FC<Props> = ({ context }) => {
  const { loadingState, data, execute } = useAsyncOperation<IDataItem[]>();
  const { trackPerformance, trackMetric } = useTelemetry(context, {
    componentName: 'DataTable'
  });
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    await execute(async () => {
      // Check cache first
      const cacheKey = 'data_table_items';
      const cached = CacheService.get(cacheKey);
      
      if (cached && !CacheService.isExpired(cacheKey)) {
        trackMetric('cache', 'hit', 1);
        return cached;
      }
      
      // Fetch with telemetry
      const result = await trackPerformance('fetch_table_data', async () => {
        const response = await fetch('/api/data');
        return response.json();
      });
      
      // Cache the result
      CacheService.set(cacheKey, result, 5 * 60 * 1000);
      trackMetric('data', 'records_loaded', result.length);
      
      return result;
    }, 'Loading table data...');
  };
  
  if (loadingState.isLoading) {
    return <DashboardSkeleton type="table" tableRows={10} />;
  }
  
  if (loadingState.error) {
    return (
      <div>
        <p>Failed to load data: {loadingState.error}</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    );
  }
  
  return (
    <table>
      {data?.map(item => (
        <tr key={item.id}>
          <td>{item.name}</td>
        </tr>
      ))}
    </table>
  );
};

export default (props: Props) => (
  <ErrorBoundary>
    <DataverseErrorBoundary>
      <DataTable {...props} />
    </DataverseErrorBoundary>
  </ErrorBoundary>
);
```

### Example 3: Form Component

**Before:**
```typescript
// SettingsForm.tsx (Original)
const SettingsForm: React.FC = () => {
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.saveSettings(values);
      alert('Settings saved!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};
```

**After:**
```typescript
// SettingsForm.tsx (Migrated)
import {
  useAsyncOperation,
  useErrorHandler,
  useTelemetry,
  LoadingSpinner,
  ErrorBoundary
} from '@grnsw/shared';

const SettingsFormContent: React.FC<Props> = ({ context }) => {
  const [values, setValues] = useState({});
  const { loadingState, execute } = useAsyncOperation();
  const { handleError } = useErrorHandler({
    componentName: 'SettingsForm'
  });
  const { trackAction, trackPerformance } = useTelemetry(context, {
    componentName: 'SettingsForm'
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    trackAction('submit', 'settings_form', {
      fieldsChanged: Object.keys(values).length
    });
    
    const result = await execute(
      () => trackPerformance('save_settings', async () => {
        const response = await api.saveSettings(values);
        
        // Invalidate related caches
        CacheService.invalidate('settings_*');
        
        return response;
      }),
      'Saving settings...'
    );
    
    if (result) {
      trackAction('success', 'settings_saved');
      // Show success message
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      {loadingState.error && (
        <div className="error-message">
          {loadingState.error}
        </div>
      )}
      
      <button type="submit" disabled={loadingState.isLoading}>
        {loadingState.isLoading ? (
          <LoadingSpinner size="small" inline label="Saving..." />
        ) : (
          'Save Settings'
        )}
      </button>
    </form>
  );
};

export default (props: Props) => (
  <ErrorBoundary
    fallback={({ error, retry }) => (
      <div>
        <p>Settings form unavailable</p>
        <button onClick={retry}>Reload Form</button>
      </div>
    )}
  >
    <SettingsFormContent {...props} />
  </ErrorBoundary>
);
```

## Service Migration

### Migrating Data Services

**Before:**
```typescript
// DataverseService.ts (Original)
export class DataverseService {
  async getData(): Promise<any> {
    try {
      const response = await fetch(this.apiUrl);
      return response.json();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      throw error;
    }
  }
}
```

**After:**
```typescript
// DataverseService.ts (Migrated)
import { 
  BaseDataverseService,
  TelemetryService,
  CacheService,
  retryOperation
} from '@grnsw/shared';

export class DataverseService extends BaseDataverseService {
  private telemetry: TelemetryService;
  
  constructor(context: WebPartContext) {
    super(context);
    this.telemetry = new TelemetryService(context);
  }
  
  async getData(): Promise<any> {
    const cacheKey = 'dataverse_data';
    
    // Check cache
    const cached = CacheService.get(cacheKey);
    if (cached) {
      this.telemetry.trackMetric('cache', 'hit', 1);
      return cached;
    }
    
    // Fetch with retry and telemetry
    const timer = this.telemetry.startTimer('dataverse_fetch');
    
    try {
      const data = await retryOperation(
        () => this.fetchWithAuth(this.apiUrl),
        { maxRetries: 3, backoff: true }
      );
      
      timer.end({ success: true, recordCount: data.length });
      
      // Cache result
      CacheService.set(cacheKey, data, 5 * 60 * 1000);
      
      return data;
    } catch (error) {
      timer.end({ success: false, error: error.message });
      this.telemetry.trackError(error, 'DataverseService', 'getData');
      throw error;
    }
  }
}
```

## Testing Migration

### Update Test Files

**Before:**
```typescript
// MyComponent.test.tsx (Original)
describe('MyComponent', () => {
  it('renders without crashing', () => {
    const component = shallow(<MyComponent />);
    expect(component).toBeTruthy();
  });
  
  it('handles errors', () => {
    const component = mount(<MyComponent />);
    // Simulate error
    expect(component.text()).toContain('Error');
  });
});
```

**After:**
```typescript
// MyComponent.test.tsx (Migrated)
import { ErrorBoundary } from '@grnsw/shared';

describe('MyComponent', () => {
  const mockContext = {
    // Mock SPFx context
  };
  
  const mockTelemetry = {
    trackAction: jest.fn(),
    trackError: jest.fn(),
    trackMetric: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders with error boundary', () => {
    const component = mount(
      <ErrorBoundary>
        <MyComponent context={mockContext} />
      </ErrorBoundary>
    );
    expect(component).toBeTruthy();
  });
  
  it('tracks telemetry on actions', () => {
    const component = mount(
      <MyComponent context={mockContext} telemetry={mockTelemetry} />
    );
    
    component.find('button').simulate('click');
    
    expect(mockTelemetry.trackAction).toHaveBeenCalledWith(
      'click',
      expect.any(String),
      expect.any(Object)
    );
  });
  
  it('handles and tracks errors', () => {
    const error = new Error('Test error');
    const component = mount(
      <ErrorBoundary onError={mockTelemetry.trackError}>
        <MyComponent context={mockContext} />
      </ErrorBoundary>
    );
    
    // Simulate error
    component.find(MyComponent).simulateError(error);
    
    expect(mockTelemetry.trackError).toHaveBeenCalledWith(
      error,
      expect.any(String),
      expect.any(String)
    );
  });
});
```

## Rollback Plan

### Quick Rollback Strategy

1. **Feature Flags**
```typescript
const useInfrastructure = process.env.USE_NEW_INFRASTRUCTURE === 'true';

export default useInfrastructure 
  ? ModernComponent 
  : LegacyComponent;
```

2. **Gradual Rollout**
```typescript
const shouldUseNewVersion = (userId: string): boolean => {
  // Roll out to 10% of users
  const hash = hashCode(userId);
  return hash % 100 < 10;
};
```

3. **Monitoring Comparison**
```typescript
// Track both versions
telemetry.trackMetric('version', 'component_render', 1, {
  version: useInfrastructure ? 'modern' : 'legacy'
});
```

### Emergency Rollback

```bash
# Revert to previous version
git revert HEAD
npm run build
npm run deploy

# Or use previous package version
npm install @grnsw/your-package@previous-version
```

## Migration Checklist

### Per Component Checklist

- [ ] Backup original code
- [ ] Add error boundary wrapper
- [ ] Implement telemetry hooks
- [ ] Replace loading states with skeletons
- [ ] Add caching where appropriate
- [ ] Implement lazy loading for heavy features
- [ ] Update error handling
- [ ] Add performance tracking
- [ ] Update tests
- [ ] Document changes
- [ ] Test in development
- [ ] Deploy to staging
- [ ] Monitor metrics
- [ ] Deploy to production
- [ ] Verify production metrics

### Post-Migration Verification

1. **Error Rate**: Should remain same or decrease
2. **Performance**: Load time should improve
3. **User Engagement**: Should remain stable
4. **Bundle Size**: May increase slightly initially
5. **Cache Hit Rate**: Should increase over time

## Common Issues & Solutions

### Issue 1: Context Not Available
```typescript
// Solution: Pass context through props
<MyComponent context={this.props.context} />
```

### Issue 2: Circular Dependencies
```typescript
// Solution: Use dynamic imports
const SharedComponent = React.lazy(() => import('@grnsw/shared'));
```

### Issue 3: Bundle Size Increase
```typescript
// Solution: Import specific components
import { ErrorBoundary } from '@grnsw/shared/components';
// Not: import { ErrorBoundary } from '@grnsw/shared';
```

### Issue 4: TypeScript Errors
```typescript
// Solution: Update type definitions
interface IComponentProps {
  context: WebPartContext; // Add this
  // ... other props
}
```

## Support

For migration support:
- Check existing migrated components for examples
- Review error logs in Application Insights
- Contact the infrastructure team

Remember: Migration is iterative. Start small, test thoroughly, and gradually adopt all features.