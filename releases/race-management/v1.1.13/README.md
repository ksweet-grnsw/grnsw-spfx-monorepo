# Race Management SPFx Package - Version 1.1.13

**Release Date:** December 13, 2024

## Bug Fixes
- **Fixed GUID Comparison in OData Filters**: Removed quotes around GUID values in filter expressions
  - Fixed error: "A binary operator with incompatible types was detected. Found operand types 'Edm.Guid' and 'Edm.String' for operator kind 'Equal'"
  - Updated all filters that compare GUID fields (_cr616_race_value, _cr616_meeting_value) to use unquoted values
  - GUIDs in Dataverse OData filters must be passed without quotes for proper type comparison

## Technical Details
- Fixed in RaceDataService.ts:
  - `_cr616_race_value eq ${raceId}` (no quotes around GUID)
  - `_cr616_meeting_value eq ${meetingId}` (no quotes around GUID)
- This affects:
  - getRacesForMeeting() - filtering races by meeting ID
  - getRaces() - filtering with meetingId parameter
  - getContestantsForRace() - filtering contestants by race ID
  - getContestants() - filtering with raceId parameter
- Build completed with --ship flag for production deployment

## Build Information
- Build completed with --ship flag for production
- Package correctly versioned as 1.1.13
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
- v1.1.13 - Fixed GUID comparison in OData filters (removed quotes)
- v1.1.12 - Fixed contestants table name to cr616_contestantses (with extra "es")
- v1.1.11 - Attempted fix with cr616_contestant (singular) - incorrect
- v1.1.10 - Fixed races table name to cr616_raceses (with extra "es")
- v1.1.9 - Attempted fix with cr616_race (singular) - incorrect
- v1.1.8 - Fixed track field name to cr4cc_trackname
- v1.1.7-v1.1.4 - Various attempts at fixing field names and query construction

## Configured Dataverse Environment
- **Racing Data**: https://racingdata.crm6.dynamics.com/
- **Tables Used (Final Correct Names)**: 
  - Meetings: `cr4cc_racemeetings` (standard plural)
  - Races: `cr616_raceses` (non-standard plural with extra "es")
  - Contestants: `cr616_contestantses` (non-standard plural with extra "es")
- **Track Field**: `cr4cc_trackname` (no underscore)
- **GUID Fields**: `_cr616_race_value`, `_cr616_meeting_value` (no quotes in filters)

## Known Dataverse Quirks
- Tables with `cr616_` prefix use non-standard pluralization with extra "es"
- Track field has no underscore: `cr4cc_trackname`
- GUID fields in OData filters must not have quotes (different from string fields)
- These naming and typing inconsistencies are inherent to the Dataverse configuration