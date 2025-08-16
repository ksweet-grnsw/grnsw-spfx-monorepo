# Race Management SPFx Package - v1.1.43

## Release Date
December 16, 2024

## Row Click Navigation & Icon Consistency

This release adds row click functionality for drill-down navigation and fixes icon size consistency across all tables.

### ✨ New Features

1. **Row Click Navigation**
   - Click anywhere on a table row (except buttons) to drill down
   - Meetings table: Click row to view races
   - Races table: Click row to view contestants
   - Contestants table: Click row to view contestant details
   - Dual navigation options: Click the row OR click the drill-down icon

2. **Consistent Icon Sizing**
   - Fixed details icon size in contestant table
   - All details icons now use consistent 28px size
   - Better visual balance across all tables

### 🎨 UI Improvements from v1.1.42

- Simple bold plus signs (+) for injury indicators
- Orange "Show Injuries" button (#ff9800)
- Clean, modern design without complex CSS shapes

### 📦 Package Contents

- **File**: race-management-spfx.sppkg
- **Size**: ~1.2 MB
- **Version**: 1.1.43
- **Web Part**: Race Data Explorer

### Technical Details

- **Version**: 1.1.43
- **Framework**: SharePoint Framework 1.21.1
- **React**: 17.0.1
- **TypeScript**: 5.3.3
- **Node**: 22.17.1
- **Build Status**: Success with warnings (Enterprise UI utility warnings - safe to ignore)

### What's Changed from v1.1.42

- Added `onRowClick` handlers to all DataGrid components
- Fixed details icon size consistency with `detailsIcon` class
- No breaking changes - purely UX enhancements

### Breaking Changes
None - All changes are backwards compatible

### Known Issues
- Build includes warnings from Enterprise UI utilities (safe to ignore)
- Some CSS class warnings for non-camelCase classes (intentional for utility classes)

## Installation
1. Upload the .sppkg file to your SharePoint App Catalog
2. Deploy the solution (may need to update existing installation)
3. Refresh pages with Race Data Explorer web part
4. Clear browser cache if needed (Ctrl+F5)

## What's New for Users
- **Enhanced Navigation**: Click anywhere on a table row to drill down to the next level
- **Dual Options**: Use either row click or action buttons for navigation
- **Better Visual Consistency**: All icons now properly sized across tables
- **Improved User Experience**: More intuitive navigation with larger click targets

## Feature Summary (Cumulative)
- **Race Data Explorer**: Comprehensive drill-down navigation through meetings → races → contestants
- **Row Click Navigation**: Click table rows to drill down (new in v1.1.43)
- **Injury Tracking**: Filter by injury categories (Cat A-E) with visual indicators
- **Health Check Details**: View vet comments and steward comments in modal dialogs
- **Smart Search**: Global search across all racing data
- **Breadcrumb Navigation**: Easy navigation between data levels
- **Responsive Design**: Works on desktop and tablet devices

## Usage Tips
- **Navigation Options**:
  - Click anywhere on a row to drill down
  - Click the racing flag icon to view races
  - Click the greyhound icon to view contestants
  - Click the details icon to view full details
- **Injury Indicators**:
  - Red plus sign (+) = Serious injury (Cat A, B, C)
  - Orange plus sign (+) = Minor injury (Cat D, E)
- **Search**: Use global search to find any meeting, race, contestant, or greyhound

## Dependencies
- Requires access to Racing Data and Injury Data environments
- Azure AD authentication for both environments
- Steward comments are fetched from race data when available

## Version History
- v1.1.43 - Added row click navigation and fixed icon consistency
- v1.1.42 - Simplified injury icons and orange button styling
- v1.1.41 - Enhanced health check details with vet/steward comments
- v1.1.40 - Fixed injury icon click functionality
- v1.1.39 - Improved injury filter layout and removed debug buttons
- v1.1.38 - Initial injury tracking implementation

---
Generated with SharePoint Framework Build Tools v3.19.0