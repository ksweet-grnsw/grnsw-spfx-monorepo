# Enterprise UI Component Library

## Overview
The Enterprise UI Component Library provides a comprehensive set of reusable React components, design tokens, and utilities for building consistent user interfaces across all GRNSW SPFx web parts.

## Table of Contents
- [Getting Started](#getting-started)
- [Design System](#design-system)
- [Components](#components)
- [Hooks](#hooks)
- [Services](#services)
- [Migration Guide](#migration-guide)

## Getting Started

### Installation
The Enterprise UI library is included in the race-management package. To use it in other packages:

```typescript
import { DataGrid, StatusBadge, Breadcrumb } from '@grnsw/race-management/enterprise-ui/components';
import '@grnsw/race-management/enterprise-ui/styles';
```

### Basic Usage
```tsx
import { DataGrid } from '../enterprise-ui/components';

const MyComponent = () => {
  const data = [/* your data */];
  const columns = [/* column definitions */];
  
  return (
    <DataGrid
      data={data}
      columns={columns}
      theme="meeting"
      pagination
      sortable
    />
  );
};
```

## Design System

### Design Tokens
The design system is built on a comprehensive token system:

#### Colors
- **Brand Colors**: Primary, Secondary, Accent
- **Functional Colors**: Success, Warning, Error, Info
- **Domain Colors**: Meeting (blue), Race (green), Contestant (orange), etc.
- **Neutral Palette**: 10 shades from white to dark grey

```scss
@import 'enterprise-ui/styles/tokens';

.myComponent {
  color: $text-primary;
  background: $brand-primary;
}
```

#### Spacing
Based on a 4px base unit with T-shirt sizes:
- `xxs`: 4px
- `xs`: 8px
- `sm`: 12px
- `md`: 16px
- `lg`: 20px
- `xl`: 24px
- `xxl`: 32px

#### Typography
Comprehensive type scale with semantic naming:
- Headers: h1-h6
- Body: body-large, body, body-small
- Special: caption, overline, button, label, code

### Themes
Support for multiple themes:
- Light theme (default)
- Domain-specific themes (meeting, race, contestant, etc.)
- Dark theme (future)

## Components

### Data Display

#### DataGrid
Full-featured data table with sorting, pagination, selection, and themes.

```tsx
<DataGrid<IMeeting>
  data={meetings}
  columns={[
    { key: 'date', label: 'Date', sortable: true },
    { key: 'track', label: 'Track', sortable: true },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> }
  ]}
  theme="meeting"
  pagination
  pageSize={25}
  onRowClick={handleRowClick}
/>
```

**Props:**
- `data`: Array of data items
- `columns`: Column definitions with key, label, render function
- `theme`: Visual theme (neutral, meeting, race, contestant, etc.)
- `pagination`: Enable pagination
- `sortable`: Enable column sorting
- `selectable`: Enable row selection (single/multiple)
- `loading`: Show loading state
- `error`: Show error state

#### StatusBadge
Displays status information with colored badges.

```tsx
<StatusBadge 
  status="Completed" 
  variant="success" 
  size="small" 
  dot 
/>
```

**Props:**
- `status`: Status text to display
- `variant`: Color variant (success, warning, error, info, neutral, primary)
- `size`: Badge size (small, medium, large)
- `dot`: Show status dot indicator
- `outline`: Use outline style
- `icon`: Optional icon to display

### Navigation

#### Breadcrumb
Hierarchical navigation component.

```tsx
<Breadcrumb
  items={[
    { label: 'Meetings', onClick: () => navigateToMeetings() },
    { label: 'Richmond - 08/12/2024', onClick: () => navigateToMeeting() },
    { label: 'Race 1' }
  ]}
  theme="meeting"
/>
```

**Props:**
- `items`: Array of breadcrumb items with label and onClick
- `separator`: Custom separator (default: '/')
- `maxItems`: Maximum items to show before ellipsis
- `theme`: Visual theme

### Forms

#### FilterPanel
Collapsible panel for filter controls.

```tsx
<FilterPanel
  title="Filters"
  theme="meeting"
  showClearAll
  onClearAll={handleClearFilters}
>
  <DatePicker onChange={handleDateChange} />
  <Dropdown options={tracks} onChange={handleTrackChange} />
</FilterPanel>
```

**Props:**
- `title`: Panel title
- `collapsible`: Allow collapse/expand
- `defaultExpanded`: Initial expanded state
- `showClearAll`: Show clear all button
- `onClearAll`: Clear all callback
- `footer`: Optional footer content

## Hooks

### Data Hooks
- `useDataverse`: Dataverse API integration
- `usePagination`: Pagination state management
- `useSorting`: Sorting state management
- `useFiltering`: Filter state management

### UI Hooks
- `useModal`: Modal state management
- `useToast`: Toast notification system
- `useTheme`: Theme switching
- `useResponsive`: Responsive breakpoint detection

### Example Usage
```tsx
const MyComponent = () => {
  const { data, loading, error, refetch } = useDataverse('/api/meetings');
  const { currentPage, pageSize, handlePageChange } = usePagination(data);
  const { sortField, sortDirection, handleSort } = useSorting();
  
  return (
    <DataGrid
      data={data}
      loading={loading}
      error={error}
      currentPage={currentPage}
      onPageChange={handlePageChange}
      onSort={handleSort}
    />
  );
};
```

## Services

### API Services
- `BaseApiService`: Generic API service class
- `DataverseService`: Dataverse-specific operations
- `AuthService`: Authentication management

### Storage Services
- `CacheService`: Client-side caching
- `PreferenceService`: User preference storage

### Utility Services
- `DateUtils`: Date manipulation utilities
- `FormatUtils`: Data formatting helpers
- `ValidationUtils`: Form validation utilities

## Migration Guide

### Migrating Existing Components
To migrate existing web parts to use Enterprise UI components:

1. **Replace custom data tables with DataGrid:**
```tsx
// Before
<table className={styles.customTable}>
  {/* Custom table implementation */}
</table>

// After
<DataGrid
  data={data}
  columns={columns}
  theme="meeting"
/>
```

2. **Replace custom status displays with StatusBadge:**
```tsx
// Before
<span className={styles.status}>{status}</span>

// After
<StatusBadge status={status} variant="success" />
```

3. **Use design tokens instead of hardcoded values:**
```scss
// Before
.component {
  padding: 16px;
  color: #333;
  background: #0078d4;
}

// After
@import 'enterprise-ui/styles/tokens';

.component {
  padding: $spacing-md;
  color: $text-primary;
  background: $brand-primary;
}
```

### Best Practices

1. **Always use design tokens** for colors, spacing, and typography
2. **Apply appropriate themes** to components based on domain context
3. **Leverage built-in features** like pagination and sorting instead of custom implementations
4. **Use composition** to build complex UIs from simple components
5. **Follow accessibility guidelines** built into components

### Performance Considerations

- Components use React.memo for optimization
- Virtual scrolling available for large datasets
- Lazy loading support for heavy components
- Efficient re-render prevention through proper prop management

## Component API Reference

### Complete Props Documentation
For detailed props documentation for each component, refer to the TypeScript definitions in:
- `components/DataDisplay/DataGrid/DataGrid.types.ts`
- `components/DataDisplay/StatusIndicator/StatusBadge.tsx`
- `components/Navigation/Breadcrumb/Breadcrumb.tsx`
- `components/Forms/FilterPanel/FilterPanel.tsx`

## Examples

### Complete Meeting List Implementation
```tsx
import { DataGrid, FilterPanel, StatusBadge } from '../enterprise-ui/components';
import { useDataverse, usePagination, useSorting } from '../enterprise-ui/hooks';

const MeetingList = () => {
  const { data, loading, error, refetch } = useDataverse('/api/meetings');
  const { currentPage, handlePageChange } = usePagination();
  const { handleSort } = useSorting();
  
  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (val) => new Date(val).toLocaleDateString()
    },
    {
      key: 'track',
      label: 'Track',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} variant="success" />
    }
  ];
  
  return (
    <div>
      <FilterPanel title="Meeting Filters" theme="meeting">
        {/* Filter controls */}
      </FilterPanel>
      
      <DataGrid
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        theme="meeting"
        pagination
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onSort={handleSort}
      />
    </div>
  );
};
```

## Support
For questions or issues with the Enterprise UI library, please contact the GRNSW development team or create an issue in the repository.