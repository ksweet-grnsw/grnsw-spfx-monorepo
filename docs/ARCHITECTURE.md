# GRNSW SPFx Monorepo Architecture

## Overview
This document describes the architecture of the GRNSW SharePoint Framework monorepo, which follows enterprise software engineering principles including SOLID, DRY, and Separation of Concerns.

## Architecture Principles

### 1. SOLID Principles

#### Single Responsibility Principle (SRP)
- Each service class has one responsibility (e.g., `AuthService` handles authentication only)
- Components are focused on presentation logic
- Business logic is separated into services
- Data access is isolated in Dataverse services

#### Open/Closed Principle (OCP)
- Base classes (`BaseDataverseService`, `UnifiedBaseDataverseService`) are extended, not modified
- New functionality added through inheritance and composition
- Configuration-driven behavior through dependency injection

#### Liskov Substitution Principle (LSP)
- `UnifiedAuthService` can replace `AuthService` without breaking functionality
- All Dataverse services extend the same base class interface
- Consistent API contracts across service implementations

#### Interface Segregation Principle (ISP)
- Specific interfaces for each domain (`IWeatherData`, `IRaceData`, `IHealthData`)
- Components only depend on interfaces they use
- No "fat" interfaces requiring unnecessary implementations

#### Dependency Inversion Principle (DIP)
- Components depend on abstractions (services), not concrete implementations
- Services injected through context or props
- Configuration externalized to environment files

### 2. DRY (Don't Repeat Yourself)
- Shared package contains all common code
- Enterprise UI components used across all packages
- Base services eliminate duplicate CRUD operations
- Utility functions centralized in shared/utils

### 3. Separation of Concerns
Clear separation between:
- **Presentation Layer**: React components and UI logic
- **Business Logic Layer**: Services and hooks
- **Data Access Layer**: Dataverse services
- **Cross-cutting Concerns**: Authentication, logging, error handling

## Project Structure

```
grnsw-spfx-monorepo/
├── packages/
│   ├── shared/                    # Shared utilities and services
│   │   ├── src/
│   │   │   ├── services/          # Base services (auth, dataverse, cache, throttle)
│   │   │   ├── utils/             # Utilities (logger, error handler)
│   │   │   ├── components/        # Shared React components
│   │   │   ├── hooks/             # Shared React hooks
│   │   │   ├── contexts/          # React contexts and providers
│   │   │   ├── stores/            # State management stores
│   │   │   └── config/            # Configuration files
│   │   └── enterprise-ui/         # Enterprise UI component library
│   │       ├── components/        # Reusable UI components
│   │       └── styles/            # Design tokens and themes
│   │
│   ├── track-conditions-spfx/     # Weather and track monitoring
│   ├── race-management/           # Race operations
│   ├── greyhound-health/          # Health tracking
│   └── gap-spfx/                  # Adoption program
│
├── releases/                      # Production .sppkg files
├── docs/                          # Documentation
└── scripts/                       # Build and utility scripts
```

## Component Architecture

### Enterprise UI Components
Located in `packages/shared/enterprise-ui/`, provides:

#### Core Components
- **DataGrid**: Full-featured data table with sorting, pagination, and theming
- **StatusBadge**: Consistent status indicators
- **FilterPanel**: Collapsible filter controls
- **Breadcrumb**: Navigation breadcrumbs

#### Design System
- **Design Tokens**: Centralized colors, spacing, typography
- **Themes**: Light theme and domain-specific themes (meeting, race, health, weather)
- **Mixins**: Reusable SCSS mixins for layouts
- **Utilities**: CSS utility classes

### Component Usage Pattern
```typescript
// Import from shared package
import { DataGrid, StatusBadge, FilterPanel } from '@grnsw/shared';

// Use with consistent props interface
<DataGrid<IDataType>
  data={data}
  columns={columns}
  theme="meeting"  // Domain-specific theming
  pagination
  sortable
/>
```

## Service Architecture

### Service Hierarchy
```
UnifiedBaseDataverseService (Abstract)
    ├── WeatherDataService
    ├── RaceMeetingService
    ├── InjuryDataService
    └── AdoptionService
```

### Core Services

#### 1. Authentication Service
- `UnifiedAuthService`: Environment-aware authentication
- Handles AAD token acquisition
- Provides headers for API calls
- Token caching and refresh

#### 2. Base Dataverse Service
- `UnifiedBaseDataverseService`: Enhanced base class with:
  - Built-in caching (CacheService)
  - API throttling (ThrottleService)
  - Retry logic
  - Error handling
  - OData query building

#### 3. Support Services
- `CacheService`: Client-side data caching
- `ThrottleService`: API rate limiting
- `UnifiedLogger`: Structured logging
- `UnifiedErrorHandler`: Consistent error handling

### Service Implementation Example
```typescript
export class WeatherDataService extends UnifiedBaseDataverseService<IWeatherData> {
  protected tableName = 'cr4cc_weatherdatas';
  
  constructor(context: WebPartContext) {
    super(context, 'WEATHER', {
      cacheEnabled: true,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      throttleMs: 100
    });
  }
  
  // Domain-specific methods
  async getLatestWeatherData(limit: number = 10): Promise<IWeatherData[]> {
    return this.getAll({
      top: limit,
      orderBy: 'createdon desc',
      select: ['temperature', 'humidity', 'wind_speed']
    });
  }
}
```

## Data Flow Architecture

### 1. Component → Service → Dataverse
```
React Component
    ↓ (user action)
Domain Service (e.g., RaceMeetingService)
    ↓ (business logic)
UnifiedBaseDataverseService
    ↓ (data access)
CacheService (check cache)
    ↓ (if not cached)
ThrottleService (rate limit)
    ↓ (API call)
Dataverse API
    ↓ (response)
UnifiedErrorHandler (error handling)
    ↓ (processed data)
Component State Update
```

### 2. State Management
- Local component state for UI state
- React Context for cross-component state
- Store pattern for complex domain state
- Optimistic updates for better UX

## Environment Configuration

### Dataverse Environments
Centralized in `packages/shared/src/config/environments.ts`:

```typescript
export const DATAVERSE_ENVIRONMENTS = {
  RACING: {
    url: 'https://racingdata.crm6.dynamics.com',
    tables: {
      meetings: 'cr4cc_racemeetings',
      races: 'cr616_raceses',
      contestants: 'cr616_contestantses'
    }
  },
  WEATHER: {
    url: 'https://org98489e5d.crm6.dynamics.com',
    tables: {
      weatherData: 'cr4cc_weatherdatas'
    }
  },
  // ... other environments
};
```

## Migration Path

### Phase 1: Core Services ✅
- Unified authentication service
- Base Dataverse service with caching
- Error handling and logging

### Phase 2: Enterprise UI ✅
- Centralized UI components
- Design token system
- Domain-specific themes

### Phase 3: Shared Components ✅
- Data display components
- Form components
- Navigation components

### Phase 4: State Management ✅
- Context providers
- Store pattern
- Optimistic updates

## Best Practices

### 1. Component Development
- Use functional components with hooks
- Implement error boundaries
- Apply Enterprise UI components
- Follow naming conventions

### 2. Service Development
- Extend base services
- Implement caching where appropriate
- Handle errors consistently
- Use TypeScript interfaces

### 3. Style Development
- Use design tokens for all values
- Apply domain themes appropriately
- Follow BEM naming for custom styles
- Leverage Enterprise UI utilities

### 4. Testing Strategy
- Unit tests for services
- Component testing with React Testing Library
- Integration tests for data flow
- E2E tests for critical paths

## Performance Optimizations

### 1. Code Splitting
- Lazy load heavy components
- Dynamic imports for large libraries
- Route-based splitting in SPFx

### 2. Caching Strategy
- 5-minute cache for weather data
- 15-minute cache for race data
- Invalidate on mutations
- LocalStorage for persistence

### 3. API Optimization
- Throttling to prevent rate limits
- Batch requests where possible
- Select only required fields
- Implement pagination

### 4. React Optimizations
- React.memo for expensive components
- useMemo for complex calculations
- useCallback for stable references
- Virtual scrolling for large lists

## Security Considerations

### 1. Authentication
- AAD-based authentication
- Token refresh before expiry
- Secure token storage
- Permission-based access

### 2. Data Protection
- No sensitive data in localStorage
- Sanitize user inputs
- Validate API responses
- Implement CSP headers

### 3. Error Handling
- No sensitive data in error messages
- Log errors securely
- Graceful degradation
- User-friendly error messages

## Monitoring and Logging

### 1. Application Insights Integration
```typescript
UnifiedLogger.configure({
  appInsightsKey: 'your-key',
  logLevel: LogLevel.Info,
  enableConsole: isDevelopment
});
```

### 2. Performance Monitoring
- Track API response times
- Monitor cache hit rates
- Log component render times
- Track user interactions

## Future Enhancements

### 1. Technical Debt
- Complete migration from class to functional components
- Standardize all packages on Enterprise UI
- Implement comprehensive testing
- Add API documentation

### 2. New Features
- Real-time data updates via SignalR
- Offline support with service workers
- Advanced analytics dashboard
- Mobile-responsive layouts

### 3. Infrastructure
- CI/CD pipeline automation
- Automated testing in pipeline
- Performance benchmarking
- Security scanning

## Conclusion

This architecture provides a solid foundation for enterprise SharePoint development with:
- **Maintainability** through separation of concerns
- **Scalability** through modular design
- **Reusability** through shared components
- **Consistency** through Enterprise UI
- **Performance** through caching and optimization
- **Reliability** through error handling and logging

The architecture follows industry best practices and is designed to evolve with changing requirements while maintaining code quality and developer productivity.