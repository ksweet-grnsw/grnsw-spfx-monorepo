# Race Management SPFx Package - Version 1.1.9

**Release Date:** December 13, 2024

## Bug Fixes
- **Fixed Races Table Name**: Changed from `cr616_races` to `cr616_race` (singular) to match Dataverse entity name
  - Fixed error: "Resource not found for the segment 'cr616_races'" when selecting a race
  - Updated all API calls to use singular form for races table
  - Contestants table remains as `cr616_contestants`

## Technical Details
- Dataverse uses singular entity names internally: `cr616_race` not `cr616_races`
- Updated in RaceDataService.ts for all race-related API calls
- This follows the same pattern as `cr4cc_racemeeting` (singular internally)
- Build completed with --ship flag for production deployment

## Build Information
- Build completed with --ship flag for production
- Package correctly versioned as 1.1.9
- Node version: 22.17.1
- SPFx version: 1.21.1

## Installation Instructions
1. Navigate to your SharePoint App Catalog
2. Upload the `race-management-spfx.sppkg` file from this folder
3. When prompted, check "Make this solution available to all sites in the organization"
4. Click "Deploy"
5. If updating from a previous version, you may need to:
   - Delete the old version first before uploading the new one
   - Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
   - Wait 15-30 minutes for SharePoint CDN to fully propagate

## Version History
- v1.1.9 - Fixed races table name to cr616_race (singular)
- v1.1.8 - Fixed track field name to cr4cc_trackname
- v1.1.7 - Attempted fix with cr4cc_track_name (incorrect)
- v1.1.6 - Attempted fix with cr4cc_track (incorrect)
- v1.1.5 - Attempted fix with cr4cc_track (incorrect)
- v1.1.4 - Fixed query parameter construction issues
- v1.1.3 - Fixed table name pluralization
- v1.1.2 - Fixed duplicate API path in URL construction
- v1.1.1 - Fixed API URL format
- v1.1.0 - Added Race Data Explorer web part

## Configured Dataverse Environment
- **Racing Data**: https://racingdata.crm6.dynamics.com/
- **Tables Used**: 
  - Meetings: `cr4cc_racemeetings` (plural in API)
  - Races: `cr616_race` (singular in API)
  - Contestants: `cr616_contestants` (plural in API)
- **Track Field**: `cr4cc_trackname` (no underscore)