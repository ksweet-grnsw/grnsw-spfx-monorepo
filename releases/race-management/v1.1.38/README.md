# Race Management SPFx Package - v1.1.38

## Release Date
December 12, 2024

## 🚨 Major New Feature: Injury Filtering and Tracking

### Comprehensive Injury Management System
This release introduces a powerful injury filtering system that allows users to:
- **Filter meetings by injuries**: Show only meetings where injuries occurred
- **Category-based filtering**: Filter by injury severity (Cat A through Cat E)
- **Visual injury indicators**: See injury counts directly in meeting and race lists
- **Smart defaults**: Cat D and Cat E (serious injuries) are selected by default

## New Features

### 1. Injury Filter Button
- **Toggle Filter**: New "Show Injuries" button in the filter bar
- **Active State**: Orange highlight when injury filter is active
- **Quick Access**: Instantly filter to show only meetings with reported injuries

### 2. Injury Category Selection
- **5 Categories**: Cat A, Cat B, Cat C, Cat D, Cat E
- **Default Selection**: Cat D and Cat E (serious injuries) pre-selected
- **Visual Distinction**: Serious categories (D & E) shown in red text
- **Flexible Filtering**: Toggle any combination of categories

### 3. Visual Injury Indicators

#### In Meeting List:
- **Red Warning (⚠️)**: Shows count of serious injuries (Cat D/E)
- **Orange Warning (⚠️)**: Shows count of minor injuries (Cat A/B/C)
- **Inline Display**: Injury counts appear next to track names
- **Hover Details**: Tooltips show injury category breakdown

#### In Race List:
- **Race-level Indicators**: Red warning icon for races with injuries
- **Count Display**: Shows number of injuries per race
- **Smart Positioning**: Icons appear next to race numbers

### 4. Backend Integration
- **Cross-environment Queries**: Fetches injury data from Injury Data environment
- **Efficient Caching**: Injury summaries cached during session
- **Real-time Updates**: Injury indicators update when filters change

## How It Works

### Viewing Meetings with Injuries:
1. Click the "Show Injuries" button in the filter bar
2. Select injury categories to include (default: Cat D & E)
3. Click "Apply" to see only meetings with injuries
4. Injury counts appear next to track names

### Understanding Injury Categories:
- **Cat A**: Minor injuries, quick recovery
- **Cat B**: Moderate injuries, short stand-down
- **Cat C**: Significant injuries, medium recovery
- **Cat D**: Serious injuries, extended recovery
- **Cat E**: Critical injuries, career-impacting

### Drilling Down to Injuries:
1. Click a meeting with injury indicators
2. See which races had injuries (red warning icons)
3. Click the race to view contestants
4. Red cross (✕) indicates injured greyhounds
5. Click injury button to see health check details

## Technical Implementation

### New Service Methods:
- `getMeetingsWithInjuries()`: Fetches meetings filtered by injury categories
- `getInjurySummaryForMeeting()`: Gets injury breakdown by category
- `getInjuriesForRace()`: Lists injuries for specific race

### Performance Optimizations:
- Parallel data fetching for injury summaries
- Efficient cross-environment API calls
- Smart caching of injury data

### TypeScript Compatibility:
- Fixed ES2015 iteration issues with `Array.from()`
- Replaced `includes()` with `indexOf()` for ES5 compatibility

## Improvements from v1.1.37
- Added comprehensive injury filtering system
- Visual indicators for injury severity
- Category-based injury filtering
- Cross-environment injury data integration

## Features from Previous Versions
- Enhanced search (Salesforce ID, microchip)
- Parent greyhound navigation
- Health check tracking
- Three-button contestant layout
- Greyhound profile integration

## Breaking Changes
None - All existing functionality preserved

## Known Issues
- Build includes warnings from Enterprise UI utilities (safe to ignore)
- Large meetings may take a moment to load injury summaries

## Dependencies
- Requires access to Racing Data and Injury Data environments
- Azure AD authentication for both environments
- Health Check table must be populated in Injury Data environment

## Installation
1. Upload the .sppkg file to your SharePoint App Catalog
2. Deploy the solution
3. Add the Race Data Explorer web part to your SharePoint pages
4. Configure web part properties as needed

## Configuration
No additional configuration required. Injury filter is available immediately after deployment.

---
Generated with SharePoint Framework Build Tools v3.19.0