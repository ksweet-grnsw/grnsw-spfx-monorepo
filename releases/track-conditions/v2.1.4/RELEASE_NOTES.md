# Track Conditions SPFx v2.1.4 Release Notes

## Overview
Quick fix release to correct upside-down percentage text in Track Conditions Analysis circular gauges.

## What's Fixed

### Track Safety and Visibility Gauges
**Problem**: The percentage values (e.g., "85%") inside the circular gauges were displaying upside down.

**Solution**: 
- Removed the CSS `transform: rotate(180deg)` that was rotating the entire SVG element
- This was causing the text inside the gauge to appear inverted
- The gauge progress visualization remains correct

## Technical Changes

### File Modified
- **TrackConditions.module.scss**: Removed `transform: rotate(180deg);` from the `.gauge svg` selector

## Important Notes

- This is a PRODUCTION build with all dependencies bundled
- All previous fixes from v2.1.0 through v2.1.3 are included
- Only affects the Track Conditions Analysis web part
- The circular progress indicators still show green for the completed portion

## Deployment Instructions

1. Upload `track-conditions-spfx-v2.1.4-PROD.sppkg` to SharePoint App Catalog
2. Update the app (check "Make this solution available to all sites")
3. Update the app on sites where it's installed

## Testing Checklist
- [ ] Verify percentage text displays right-side up in Track Safety gauge
- [ ] Verify percentage text displays right-side up in Visibility gauge
- [ ] Confirm green portion still represents the completed percentage
- [ ] Check that all other functionality remains intact

## Version Summary
This version includes all fixes from previous releases:
- v2.1.0: Initial fixes for filter persistence, circular gauges, and wind direction
- v2.1.1: Restored track selection functionality
- v2.1.2: Added About section, fixed data loading issues
- v2.1.3: Fixed API filtering and added enhanced logging
- v2.1.4: Fixed upside-down text in circular gauges