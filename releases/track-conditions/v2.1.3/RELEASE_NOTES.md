# Track Conditions SPFx v2.1.3 Release Notes

## Overview
This release addresses API errors and improves debugging capabilities. The main changes focus on fixing the data filtering approach and adding better error logging to help diagnose issues with the Dataverse API integration.

## What's Fixed

### 1. API Filtering Updated
**Problem**: Web parts were showing "Error: UNKNOWN_ERROR: Error fetching weather data" when trying to load data.

**Solution**: 
- Changed from `contains(tolower(cr4cc_track_name), 'track name')` to `cr4cc_track_name eq 'Track Name'`
- Uses exact match instead of contains function which may not be supported
- Simplified the filtering logic for better compatibility

### 2. Track Names in Titles
**Problem**: Web part titles were only showing "Temperature" or "Wind Analysis" without the selected track name.

**Solution**: 
- Track name is now set immediately when a track is selected
- Displays track name even while data is loading
- Falls back to displaying the converted track name (e.g., "Wentworth Park" from "wentworth-park")

### 3. Enhanced Error Logging
**Added comprehensive logging to help diagnose issues**:
- DataverseService now logs the full API URL and query
- Logs API error responses with status codes
- Components log the filter being used
- Console errors include more context

### 4. Property Pane Descriptions
**Fixed**: Temperature web part now has a proper description in the property pane
- Changed from generic "Description" to "Configure the Temperature web part to display temperature data for a specific track."

## Technical Changes

### Files Modified

1. **Component files** (Temperature.tsx, Rainfall.tsx, WindAnalysis.tsx, TrackConditions.tsx):
   - Changed filter from `contains(tolower(cr4cc_track_name), '${trackDisplayName.toLowerCase()}')` to `cr4cc_track_name eq '${trackDisplayName}'`
   - Added immediate track name display in state
   - Enhanced error logging

2. **DataverseService.ts**:
   - Added console logging for API URL and query
   - Added error response text logging
   - Includes HTTP status codes in error messages

3. **Localization file**:
   - temperature/loc/en-us.js: Updated PropertyPaneDescription

4. **Version Updated**:
   - package-solution.json: Updated to 2.1.3.0

## Important Notes

- This is a PRODUCTION build with all dependencies bundled
- All previous fixes from v2.1.0, v2.1.1, and v2.1.2 are included
- The exact match filtering assumes track names in Dataverse match the display format (e.g., "Wentworth Park" not "wentworth-park")
- Enhanced logging will help diagnose any remaining API issues

## Deployment Instructions

1. Upload `track-conditions-spfx-v2.1.3-PROD.sppkg` to SharePoint App Catalog
2. Update the app (check "Make this solution available to all sites")
3. Update the app on sites where it's installed
4. Open browser developer console (F12) to see detailed logging if issues persist

## Testing Checklist
- [ ] Check browser console for API URL and query logs
- [ ] Verify track name appears in web part titles immediately
- [ ] Confirm About section shows version 2.1.3.0
- [ ] Test that data loads when correct track name format is in Dataverse
- [ ] Check that error messages are more descriptive
- [ ] Verify all 4 web parts (Temperature, Rainfall, Wind Analysis, Track Conditions) function

## Debugging Tips

If data still doesn't load:
1. Open browser developer console (F12)
2. Look for logs starting with:
   - "Dataverse API URL:"
   - "Query:"
   - "Filter being used:"
3. Check if the track name in the filter matches exactly what's in your Dataverse
4. Look for API error responses with status codes

## Known Issues
- Track names must match exactly in Dataverse (case-sensitive)
- If track names in Dataverse use different format (e.g., "WENTWORTH PARK" or "Wentworth_Park"), data won't load
- May need to adjust the getTrackDisplayName function to match your Dataverse naming convention