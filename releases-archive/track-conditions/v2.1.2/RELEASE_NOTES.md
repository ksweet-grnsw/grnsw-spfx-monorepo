# Track Conditions SPFx v2.1.2 Release Notes

## Overview
This release fixes multiple issues reported in v2.1.1, including restoring the About section with version information, fixing data loading issues, and ensuring proper display of web part information.

## What's Fixed

### 1. About Section Restored
**Problem**: The About section showing version information was missing from the property pane.

**Solution**: 
- Added `packageSolution` import to all web parts
- Restored About group in property pane configuration
- Version number now displays correctly

### 2. Data Loading Fixed
**Problem**: Web parts showed "No data for this period" even when a track was selected.

**Solution**: 
- Changed filtering from `cr4cc_station_id` to `cr4cc_track_name`
- Uses case-insensitive contains filter to match track names
- Converts track IDs (e.g., 'wentworth-park') to display names (e.g., 'Wentworth Park')

### 3. Web Part Titles
**Note**: Web part titles showing as lowercase machine names is a SharePoint display issue that occurs in the property pane. The actual web part titles on the page display correctly as defined in the manifest files.

## Technical Changes

### Files Modified
1. **All Web Part TypeScript files**:
   - TemperatureWebPart.ts
   - RainfallWebPart.ts
   - WindAnalysisWebPart.ts
   - TrackConditionsWebPart.ts
   - Added `const packageSolution = require('../../../config/package-solution.json');`
   - Added About group to property pane configuration

2. **All Component TypeScript files**:
   - Temperature.tsx
   - Rainfall.tsx
   - WindAnalysis.tsx
   - TrackConditions.tsx
   - Changed filtering from `cr4cc_station_id eq '${trackId}'` to `contains(tolower(cr4cc_track_name), '${trackDisplayName.toLowerCase()}')`
   - Added `getTrackDisplayName()` method to convert track IDs to display names

3. **Version Updated**:
   - package-solution.json: Updated to 2.1.2.0

## Important Notes

- This is a PRODUCTION build with all dependencies bundled
- All previous fixes from v2.1.0 and v2.1.1 are included:
  - Circular gauge visualization (green for completed percentage)
  - Wind direction as cardinal + degrees (e.g., "NE (45°)")
  - Filter persistence in race meetings web part
  - Track selection functionality
- Data filtering now uses track names instead of station IDs for better compatibility

## Deployment Instructions

1. Upload `track-conditions-spfx-v2.1.2-PROD.sppkg` to SharePoint App Catalog
2. Update the app (check "Make this solution available to all sites")
3. Update the app on sites where it's installed
4. Edit each web part and verify:
   - Track selection dropdown appears
   - About section shows version 2.1.2.0
   - Data loads when a track is selected

## Testing Checklist
- [ ] Verify About section appears in property pane with version 2.1.2.0
- [ ] Confirm data loads when a track is selected
- [ ] Check that selected track persists after page refresh
- [ ] Verify circular gauges show correct fill percentage (green for completion)
- [ ] Confirm wind direction shows as cardinal + degrees
- [ ] Test that race meetings filters persist across page reloads
- [ ] Verify all web parts function correctly with the new track name filtering

## Known Issues
- Web part titles may appear as lowercase machine names in the property pane preview (SharePoint limitation)
- Actual data availability depends on track names in Dataverse matching the expected format