# Track Conditions SPFx v2.1.1 Release Notes

## Overview
Emergency fix to restore track selection functionality that was accidentally removed in v2.1.0.

## What's Fixed

### Track Selection Restored
**Problem**: v2.1.0 removed all track selection dropdowns from the property pane, making web parts unable to filter data by track.

**Solution**: 
- Added track dropdown back to all web parts (Temperature, Rainfall, Wind Analysis, Track Conditions)
- Each web part now has a "Select Track" dropdown in the property pane
- Default track is set to "Wentworth Park"
- All 21 tracks are available for selection

## Technical Changes

### Files Modified
1. All web part TypeScript files to include PropertyPaneDropdown
2. Created `src/webparts/shared/trackOptions.ts` with hardcoded track list
3. Updated all web parts to pass selectedTrack property to components

### Available Tracks
- Albion Park
- Appin
- Bathurst
- Broken Hill
- Bulli
- Casino
- Dapto
- Dubbo
- Gosford
- Goulburn
- Grafton
- Gunnedah
- Lithgow
- Maitland
- Nowra
- Richmond
- Taree
- Temora
- The Gardens
- Wagga Wagga
- Wentworth Park

## Important Notes

- This is a PRODUCTION build with all dependencies bundled
- All v2.1.0 fixes (circular gauges, wind direction) are still included
- Track selection is now working properly
- No data will display without selecting a track

## Deployment Instructions

1. Upload `track-conditions-spfx-v2.1.1-PROD.sppkg` to SharePoint App Catalog
2. Update the app (check "Make this solution available to all sites")
3. Update the app on sites where it's installed
4. Edit each web part and select the appropriate track in the property pane

## Testing Checklist
- [ ] Verify track dropdown appears in property pane for all web parts
- [ ] Confirm data loads when a track is selected
- [ ] Check that selected track persists after page refresh
- [ ] Verify circular gauges still show correct fill percentage
- [ ] Confirm wind direction still shows cardinal + degrees