# Race Management SPFx Package

## Overview

This package contains SharePoint web parts for managing greyhound racing operations, including race meetings, results, and performance analytics.

## Web Parts

### 1. Race Meetings Calendar

Displays race meetings in multiple views (month, week, day) with color-coding by racing authority.

**Recent Update (v1.8.0)**: 
- Changed month view from colored dots to colored rectangles with track names
- Rectangles stack vertically when multiple meetings occur on the same day
- Improved visibility and information density

**Key Features**:
- Multiple view modes (month/week/day)
- Color-coded by racing authority (GRNSW, GBOTA, etc.)
- Click meetings for detailed information
- Filter by track or authority

### 2. Race Results (Planned)

Display and analyze race results with performance metrics.

### 3. Track Management (Planned)

Manage track information and conditions.

### 4. Performance Analytics (Planned)

Analyze greyhound and track performance over time.

## Services

### RaceMeetingService

Extends `BaseDataverseService` to interact with race meeting data:

```typescript
const meetingService = new RaceMeetingService(this.context);
const meetings = await meetingService.getMeetingsByDateRange(startDate, endDate);
```

## Data Model

### IRaceMeeting
```typescript
interface IRaceMeeting {
  cr4cc_racemeetingid: string;
  cr4cc_race_date: string;
  cr4cc_track_name: string;
  cr4cc_authority: string;
  cr4cc_first_race_time?: string;
  cr4cc_number_of_races?: number;
  cr4cc_meeting_status?: string;
}
```

## Configuration

No additional configuration required beyond the shared Dataverse settings.

## Development

```bash
# Serve locally
npm run serve

# Build
npm run build

# Package for deployment
npm run package-solution -- --ship
```

## Styling

The package uses CSS modules for component styling. Key style files:
- `RaceMeetings.module.scss` - Calendar and meeting display styles

## Future Enhancements

1. Integration with weather data for track conditions
2. Real-time race results updates
3. Performance prediction models
4. Mobile-responsive views
5. Export functionality for race data