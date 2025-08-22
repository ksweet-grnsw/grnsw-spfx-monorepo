# Race Management SPFx Package - Version 1.1.5

**Release Date:** December 13, 2024

## Bug Fixes
- **Fixed Invalid Field Name**: Changed `cr4cc_trackheld` to `cr4cc_track` throughout the application
  - Updated RaceDataService to use correct field name in all API calls
  - Updated IMeeting interface to match actual Dataverse field
  - Updated all React components to use the correct field name
  - Fixed error: "Could not find a property named 'cr4cc_trackheld' on type 'Microsoft.Dynamics.CRM.cr4cc_racemeeting'"

## Technical Details
- The Dataverse API uses `cr4cc_track` not `cr4cc_trackheld` for the track field on race meetings
- Updated all occurrences in:
  - RaceDataService.ts (9 locations)
  - IRaceData.ts interface
  - All RaceDataExplorer view components
- Build completed with standard ESLint warnings (non-critical)

## Build Information
- Build completed with --ship flag for production
- Package size: Standard SPFx package
- Node version: 22.17.1
- SPFx version: 1.21.1

## Installation Instructions
1. Navigate to your SharePoint App Catalog
2. Upload the `race-management-spfx.sppkg` file
3. When prompted, check "Make this solution available to all sites in the organization"
4. Click "Deploy"
5. If updating from a previous version, you may need to:
   - Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
   - Remove and re-add the web part on affected pages
   - Wait 15-30 minutes for SharePoint CDN to fully propagate

## Known Issues
- Standard ESLint warnings for enterprise UI utility classes (non-critical)
- These warnings do not affect functionality

## Version History
- v1.1.5 - Fixed invalid field name cr4cc_trackheld → cr4cc_track
- v1.1.4 - Fixed query parameter construction issues
- v1.1.3 - Fixed table name pluralization
- v1.1.2 - Fixed duplicate API path in URL construction
- v1.1.1 - Fixed API URL format
- v1.1.0 - Added Race Data Explorer web part

## Configured Dataverse Environment
- **Racing Data**: https://racingdata.crm6.dynamics.com/
- **Tables Used**: cr4cc_racemeetings, cr616_races, cr616_contestants
- **Track Field**: Uses `cr4cc_track` (not `cr4cc_trackheld`)