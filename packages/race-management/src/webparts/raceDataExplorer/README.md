# Race Data Explorer Web Part

## Overview
The Race Data Explorer is a comprehensive SharePoint Framework web part that provides drill-down navigation through racing data hierarchy: Meetings → Races → Contestants. It features advanced filtering, global search, and leverages the Enterprise UI component library for consistent user experience.

## Features

### Core Functionality
- **Three-level drill-down navigation**: Meetings → Races → Contestants
- **Global search** across all data types
- **Advanced filtering** for each data level
- **Responsive design** for mobile and desktop
- **Theme support** with domain-specific visual styling
- **Real-time data** from Microsoft Dataverse

### Data Views

#### Meetings View
- Display all race meetings with date, track, authority, and status
- Filter by date range, track, authority, and status
- Quick date filters (today, this week, this month)
- Statistics bar showing totals and summaries
- Click to drill down to races

#### Races View
- Display all races for a selected meeting
- Show race number, name, distance, grade, and prize pool
- Filter by grade and distance range
- Statistics showing total prizes and contestants
- Click to drill down to contestants

#### Contestants View
- Display all contestants for a selected race
- Show greyhound details, owner, trainer, placement, and status
- Winners podium display for top 3 places
- Filter by status and search by name
- Statistics showing runners, scratched, and average weight

#### Search View
- Global search across meetings, races, and contestants
- Grouped results by data type
- Direct navigation to any result
- Search by greyhound name, owner, trainer, or track

## Installation

### Prerequisites
- SharePoint Online environment
- Site collection app catalog or tenant app catalog access
- Appropriate permissions to deploy SPFx solutions

### Deployment Steps

1. **Build the package:**
```bash
cd packages/race-management
gulp bundle --ship
gulp package-solution --ship
```

2. **Deploy to SharePoint:**
- Upload the `.sppkg` file to your app catalog
- Deploy the solution
- Add the app to your SharePoint site
- Add the "Race Data Explorer" web part to a page

## Configuration

### Web Part Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `dataverseUrl` | string | Your Dataverse environment URL | - |
| `defaultView` | string | Initial view to display | "meetings" |
| `pageSize` | number | Items per page in data grids | 25 |
| `showFilters` | boolean | Show filter panel | true |
| `showSearch` | boolean | Show global search bar | true |
| `theme` | string | Visual theme | "neutral" |

### Dataverse Connection
The web part requires connection to Microsoft Dataverse with the following tables:
- `cr4cc_racemeetings` - Race meeting data
- `cr616_races` - Individual race data
- `cr616_contestants` - Contestant/greyhound data

### Authentication
The web part uses Azure AD authentication. Ensure your Azure app registration has appropriate permissions to access Dataverse.

## Usage Guide

### Basic Navigation

1. **View Meetings**: The default view shows all race meetings
2. **Filter Meetings**: Use the filter panel to narrow results by date, track, or authority
3. **Drill to Races**: Click any meeting row to view its races
4. **Drill to Contestants**: Click any race row to view its contestants
5. **Navigate Back**: Use the breadcrumb or back buttons to return to previous views

### Using Search

1. Enter search terms in the global search bar
2. Search supports:
   - Greyhound names
   - Owner names
   - Trainer names
   - Track names
   - Race names
3. Results are grouped by type (Meetings, Races, Contestants)
4. Click any result to navigate directly to that item

### Filtering Data

#### Meeting Filters
- **Date Range**: Select start and end dates
- **Track**: Choose specific track
- **Authority**: Filter by racing authority (NSW, VIC, etc.)
- **Status**: Filter by meeting status
- **Quick Filters**: Today, This Week, This Month

#### Race Filters
- **Grade**: Filter by race grading
- **Distance Range**: Set minimum and maximum distance

#### Contestant Filters
- **Search**: Search by name
- **Status**: Filter by contestant status
- **Winners Only**: Show only placed contestants

## Technical Details

### Architecture

```
RaceDataExplorer/
├── components/
│   ├── RaceDataExplorer.tsx       # Main component
│   └── views/
│       ├── MeetingsView.tsx       # Meetings display
│       ├── RacesView.tsx          # Races display
│       ├── ContestantsView.tsx    # Contestants display
│       └── SearchView.tsx         # Search results
├── services/
│   └── RaceDataService.ts         # Dataverse API integration
└── models/
    └── IRaceData.ts               # TypeScript interfaces
```

### Data Flow

1. **Authentication**: Azure AD token acquisition
2. **API Calls**: OData queries to Dataverse
3. **Data Processing**: Client-side filtering and sorting
4. **State Management**: React hooks for state
5. **UI Rendering**: Enterprise UI components

### Performance Optimizations

- **Pagination**: Large datasets are paginated
- **Lazy Loading**: Data loaded on demand
- **Caching**: API responses cached for 5 minutes
- **Memoization**: Expensive calculations memoized
- **Virtual Scrolling**: Available for very large datasets

## Customization

### Theming
The web part supports multiple themes:
- `neutral`: Default grey theme
- `meeting`: Blue theme for meetings
- `race`: Green theme for races
- `contestant`: Orange theme for contestants

### Extending Functionality

To add custom columns to data grids:

```typescript
const customColumns: DataGridColumn<IMeeting>[] = [
  ...existingColumns,
  {
    key: 'customField',
    label: 'Custom Field',
    render: (value, item) => <CustomComponent data={item} />
  }
];
```

To add custom filters:

```tsx
<FilterPanel>
  {/* Existing filters */}
  <CustomFilter onChange={handleCustomFilter} />
</FilterPanel>
```

## API Reference

### RaceDataService Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `getMeetings` | Get filtered meetings | `IMeetingFilters` | `Promise<IMeeting[]>` |
| `getRacesForMeeting` | Get races for a meeting | `meetingId: string` | `Promise<IRace[]>` |
| `getContestantsForRace` | Get contestants for a race | `raceId: string` | `Promise<IContestant[]>` |
| `searchAll` | Global search | `searchTerm: string` | `Promise<ISearchResults>` |

### Data Interfaces

```typescript
interface IMeeting {
  cr4cc_racemeetingid: string;
  cr4cc_racename: string;
  cr4cc_meetingdate: Date;
  cr4cc_trackheld: string;
  cr4cc_authority: string;
  cr4cc_timeslot: string;
  cr4cc_meetingtype: string;
  cr4cc_status?: string;
}

interface IRace {
  cr616_raceid: string;
  cr616_racenumber: number;
  cr616_racename: string;
  cr616_distance: number;
  cr616_racegrading: string;
  cr616_starttime: string;
  cr616_noofcontestants: number;
  cr616_prize1?: number;
}

interface IContestant {
  cr616_contestantid: string;
  cr616_rugnumber: number;
  cr616_greyhoundname: string;
  cr616_ownername: string;
  cr616_trainername: string;
  cr616_placement?: number;
  cr616_status: string;
}
```

## Troubleshooting

### Common Issues

1. **No data displayed**
   - Check Dataverse URL configuration
   - Verify authentication token
   - Check network connectivity

2. **Filters not working**
   - Ensure date format is correct
   - Check for special characters in search terms

3. **Performance issues**
   - Reduce page size
   - Enable virtual scrolling
   - Check network latency

### Debug Mode
Enable debug logging in the browser console:
```javascript
localStorage.setItem('DEBUG_RACE_EXPLORER', 'true');
```

## Browser Support
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

## Accessibility
The web part follows WCAG 2.1 Level AA guidelines:
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus indicators
- ARIA labels and descriptions

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-12 | Initial release with core functionality |

## Support
For issues or questions, please contact the GRNSW IT team or create an issue in the repository.

## License
Proprietary - Greyhound Racing NSW