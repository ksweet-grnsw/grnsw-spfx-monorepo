# Race Management SPFx Package - Version 1.1.4

**Release Date:** December 13, 2024

## Bug Fixes
- **Fixed Query Parameter Construction**: Resolved issue where empty filters were creating invalid URLs with `?&` which caused "unsupported query parameter" errors in Dataverse API calls
- **Improved URL Building Logic**: Updated getRaces() and getContestants() methods to properly construct query strings when no filters are provided

## Technical Details
- Fixed query parameter construction in RaceDataService.ts for three methods:
  - getMeetings() - Already fixed in previous version
  - getRaces() - Fixed in this version
  - getContestants() - Fixed in this version
- Issue was causing API calls to fail with "The query parameter [REDACTED] is not supported" error
- Solution: Build query parts array and join only valid parts, avoiding empty filter strings

## Build Information
- Build completed with standard ESLint warnings (non-critical)
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
- v1.1.4 - Fixed query parameter construction issues
- v1.1.3 - Fixed table name pluralization
- v1.1.2 - Fixed duplicate API path in URL construction
- v1.1.1 - Fixed API URL format
- v1.1.0 - Added Race Data Explorer web part

## Configured Dataverse Environment
- **Racing Data**: https://racingdata.crm6.dynamics.com/
- **Tables Used**: cr4cc_racemeetings, cr616_races, cr616_contestants