# Race Management SPFx Package - Version 1.1.12

**Release Date:** December 13, 2024

## Bug Fixes
- **Fixed Contestants Table Name**: Changed to `cr616_contestantses` (with extra "es") to match Dataverse entity naming convention
  - Fixed error: "Resource not found for the segment 'cr616_contestants'" when loading contestants
  - Updated all API calls to use `cr616_contestantses` for the contestants table
  - This follows the same unusual pluralization pattern as `cr616_raceses`

## Technical Details
- Dataverse entity names with non-standard pluralization:
  - Meetings: `cr4cc_racemeetings` (standard plural)
  - Races: `cr616_raceses` (plural with extra "es")
  - Contestants: `cr616_contestantses` (plural with extra "es")
- Updated in RaceDataService.ts for all contestant-related API calls including:
  - getContestantsForRace()
  - getContestants()
  - getContestantById()
  - searchAll() contestant search
- Build completed with --ship flag for production deployment

## Build Information
- Build completed with --ship flag for production
- Package correctly versioned as 1.1.12
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
- v1.1.12 - Fixed contestants table name to cr616_contestantses (with extra "es")
- v1.1.11 - Attempted fix with cr616_contestant (singular) - incorrect
- v1.1.10 - Fixed races table name to cr616_raceses (with extra "es")
- v1.1.9 - Attempted fix with cr616_race (singular) - incorrect
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
- **Tables Used (Final Correct Names)**: 
  - Meetings: `cr4cc_racemeetings` (standard plural)
  - Races: `cr616_raceses` (non-standard plural with extra "es")
  - Contestants: `cr616_contestantses` (non-standard plural with extra "es")
- **Track Field**: `cr4cc_trackname` (no underscore)

## Known Dataverse Quirks
- Races and Contestants tables use non-standard pluralization with extra "es": 
  - `cr616_raceses` instead of expected `cr616_races`
  - `cr616_contestantses` instead of expected `cr616_contestants`
- Track field has no underscore: `cr4cc_trackname` not `cr4cc_track_name`
- These naming inconsistencies are inherent to the Dataverse configuration
- This appears to be a pattern where entities starting with `cr616_` get an extra "es" appended for pluralization