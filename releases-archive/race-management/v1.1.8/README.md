# Race Management SPFx Package - Version 1.1.8

**Release Date:** December 13, 2024

## Bug Fixes
- **Fixed Track Field Name**: Changed to `cr4cc_trackname` (no underscore) - the correct Dataverse field name
  - Updated RaceDataService to use correct field name in all API calls
  - Updated IMeeting interface to use cr4cc_trackname
  - Updated all React components to use the correct field name
  - Fixed error: "Could not find a property named 'cr4cc_track_name' on type 'Microsoft.Dynamics.CRM.cr4cc_racemeeting'"

## Technical Details
- The Dataverse API uses `cr4cc_trackname` (NOT `cr4cc_track`, `cr4cc_track_name`, or `cr4cc_trackheld`)
- Field name is one word with no underscores between "track" and "name"
- Updated all occurrences in:
  - RaceDataService.ts (9 locations)
  - IRaceData.ts interface
  - All RaceDataExplorer view components
- Build completed with --ship flag for production deployment

## Build Information
- Build completed with --ship flag for production
- Package size: Standard SPFx package
- Node version: 22.17.1
- SPFx version: 1.21.1

## Installation Instructions
1. Navigate to your SharePoint App Catalog
2. Upload the `race-management-spfx.sppkg` file from this folder
3. When prompted, check "Make this solution available to all sites in the organization"
4. Click "Deploy"
5. If updating from a previous version, you may need to:
   - Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
   - Delete the old version first before uploading the new one
   - Wait 15-30 minutes for SharePoint CDN to fully propagate

## Known Issues
- Standard ESLint warnings for enterprise UI utility classes (non-critical)
- These warnings do not affect functionality

## Version History
- v1.1.8 - Fixed track field name to cr4cc_trackname (CORRECT field name)
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
- **Tables Used**: cr4cc_racemeetings, cr616_races, cr616_contestants
- **Track Field**: Uses `cr4cc_trackname` (confirmed correct field name)