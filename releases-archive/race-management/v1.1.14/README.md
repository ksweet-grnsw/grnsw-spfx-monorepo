# Race Management SPFx Package - Version 1.1.14

**Release Date:** December 13, 2024

## Bug Fixes
- **Fixed Contestants Table Name**: Reverted to `cr616_contestants` (standard plural, not "contestantses")
  - The error message confirmed Dataverse is looking for `cr616_contestants`
  - Fixed error: "Could not find a property named 'undefined' on type 'Microsoft.Dynamics.CRM.cr616_contestants'"
- **Added ID Validation**: Added checks to prevent undefined IDs from being passed to API calls
  - Prevents "property named 'undefined'" errors when IDs are missing
  - Returns empty arrays when IDs are undefined instead of making invalid API calls

## Technical Details
- Contestants table is actually `cr616_contestants` (not `cr616_contestantses`)
- Added validation in RaceDataService.ts:
  - `getContestantsForRace()` - returns empty array if raceId is undefined
  - `getRacesForMeeting()` - returns empty array if meetingId is undefined
- This prevents malformed OData queries like `_cr616_race_value eq undefined`
- Build completed with --ship flag for production deployment

## Build Information
- Build completed with --ship flag for production
- Package correctly versioned as 1.1.14
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
- v1.1.14 - Fixed contestants table back to cr616_contestants, added ID validation
- v1.1.13 - Fixed GUID comparison in OData filters (removed quotes)
- v1.1.12 - Attempted fix with cr616_contestantses (incorrect)
- v1.1.11 - Attempted fix with cr616_contestant (singular) - incorrect
- v1.1.10 - Fixed races table name to cr616_raceses (with extra "es")
- v1.1.9 - Attempted fix with cr616_race (singular) - incorrect
- v1.1.8 - Fixed track field name to cr4cc_trackname

## Configured Dataverse Environment
- **Racing Data**: https://racingdata.crm6.dynamics.com/
- **Tables Used (Final Correct Names)**: 
  - Meetings: `cr4cc_racemeetings` (standard plural)
  - Races: `cr616_raceses` (non-standard plural with extra "es")
  - Contestants: `cr616_contestants` (standard plural)
- **Track Field**: `cr4cc_trackname` (no underscore)
- **GUID Fields**: `_cr616_race_value`, `_cr616_meeting_value` (no quotes in filters)

## Known Dataverse Quirks Summary
- Only the Races table uses non-standard pluralization: `cr616_raceses`
- Contestants table uses standard plural: `cr616_contestants`
- Track field has no underscore: `cr4cc_trackname`
- GUID fields in OData filters must not have quotes
- Always validate IDs before using them in filters to avoid "undefined" errors