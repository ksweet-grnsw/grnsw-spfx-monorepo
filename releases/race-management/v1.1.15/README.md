# Race Management SPFx v1.1.15 Release

**Release Date:** August 13, 2025  
**Package:** race-management-spfx.sppkg  
**Version:** 1.1.15

## Bug Fixes

### Fixed Race Data Explorer Search Functionality
- **Issue:** Search box was not returning any results for greyhound names, trainers, owners, or tracks
- **Root Cause:** Incorrect Dataverse table and field name mappings
- **Resolution:**
  - Fixed table name from `cr616_raceses` to `cr616_races` in all API calls
  - Corrected field name from `cr4cc_trackname` to `cr4cc_trackheld` (actual Dataverse field)
  - Removed non-existent `cr4cc_racename` field references for meetings
  - Added field mapping logic to maintain UI compatibility

## Technical Details

### API Corrections
- **Races Table:** Now correctly uses `cr616_races` endpoint (was incorrectly using `cr616_raceses`)
- **Field Mapping:** Added automatic mapping of `cr4cc_trackheld` to `cr4cc_trackname` for backward compatibility with UI components
- **Search Queries:** Updated all search filters to use correct field names

### Build Information
- Built with `--ship` flag for production deployment
- Node version: 22.17.1
- SPFx version: 1.21.1
- Build warnings: CSS naming conventions (non-breaking)

## Installation Instructions

1. Upload the `race-management-spfx.sppkg` file to your SharePoint App Catalog
2. When prompted, select "Deploy to all sites" if you want organization-wide deployment
3. The package will replace any existing version
4. Clear browser cache (Ctrl+F5) after deployment to ensure latest version loads

## Affected Web Parts

This package contains:
- **Race Data Explorer Web Part** - Search functionality now working correctly
- **Race Meetings Web Part** - No changes in this release

## Configuration Notes

No configuration changes required. The web parts will automatically use the corrected field mappings.

## Known Issues Resolved

- Search returning no results - **FIXED**
- Incorrect table name causing API failures - **FIXED**
- Field name mismatches preventing data display - **FIXED**

## Testing Recommendations

After deployment, test the following:
1. Search for greyhound names in the Race Data Explorer
2. Search for trainer names
3. Search for owner names
4. Search for track names (e.g., "Wentworth Park")
5. Verify that meeting, race, and contestant data displays correctly

## Support

For any issues with this release, please contact the GRNSW Development Team.