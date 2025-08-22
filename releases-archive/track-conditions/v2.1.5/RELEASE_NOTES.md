# Track Conditions SPFx v2.1.5 Release Notes

## Overview
This release fixes the Unix timestamp conversion issue in the Track Conditions Analysis web part and adds diagnostic information for troubleshooting data freshness.

## What's Fixed

### Unix Timestamp Conversion
**Problem**: The "Last updated" time in Track Conditions Analysis was showing incorrect time because `cr4cc_last_packet_received_timestamp` is stored as a Unix timestamp (seconds since 1970), but JavaScript Date expects milliseconds.

**Solution**: 
- Multiply the Unix timestamp by 1000 to convert seconds to milliseconds
- Display "N/A" if the timestamp field is empty
- Added "Record created" timestamp for diagnostic purposes

## Technical Changes

### File Modified
- **TrackConditions.tsx**: 
  ```typescript
  // Before:
  new Date(weatherData.cr4cc_last_packet_received_timestamp || Date.now()).toLocaleTimeString()
  
  // After:
  weatherData.cr4cc_last_packet_received_timestamp 
    ? new Date(weatherData.cr4cc_last_packet_received_timestamp * 1000).toLocaleTimeString()
    : 'N/A'
  ```

### Diagnostic Information Added
- Shows both "Last updated" (when weather station sent data) and "Record created" (when saved to Dataverse)
- Helps identify delays in data pipeline

## Important Notes

- This is a PRODUCTION build with all dependencies bundled
- All previous fixes from v2.1.0 through v2.1.4 are included
- Only affects the Track Conditions Analysis web part

## Deployment Instructions

1. Upload `track-conditions-spfx-v2.1.5-PROD.sppkg` to SharePoint App Catalog
2. Update the app (check "Make this solution available to all sites")
3. Update the app on sites where it's installed

## Testing Checklist
- [ ] Verify "Last updated" shows correct time (not future date)
- [ ] Confirm timestamp matches when weather station last sent data
- [ ] Check that "Record created" shows when data was saved to Dataverse
- [ ] Verify all other functionality remains intact

## Example Display
```
Last updated: 6:44:58 PM
Record created: 5/8/2025, 6:50:43 PM
```

This shows the weather station sent data at 6:44:58 PM and it was recorded in Dataverse at 6:50:43 PM.

## Version Summary
- v2.1.0: Initial fixes (filter persistence, circular gauges, wind direction)
- v2.1.1: Restored track selection functionality
- v2.1.2: Added About section, fixed data loading issues
- v2.1.3: Fixed API filtering and added enhanced logging
- v2.1.4: Fixed upside-down text in circular gauges
- v2.1.5: Fixed Unix timestamp conversion for "Last updated" display