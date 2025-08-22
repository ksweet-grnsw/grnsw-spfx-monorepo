# Race Management SPFx v1.1.18 Release

**Release Date:** August 13, 2025  
**Package:** race-management-spfx.sppkg  
**Version:** 1.1.18

## 🎯 Critical Fix: Field Name Corrections

### Fixed Field Name Issue
Based on the API test results, we discovered that the actual field name in Dataverse is `cr4cc_trackname`, not `cr4cc_trackheld` as previously documented.

## Bug Fixes

### Field Name Corrections (v1.1.18)
- **Fixed track field name**: All references to `cr4cc_trackheld` have been changed to `cr4cc_trackname`
- **Removed unnecessary mappings**: No field mapping needed since `cr4cc_trackname` is the actual field
- **Updated all API calls**: Search, filter, and expand operations now use the correct field name
- **Updated interfaces**: Removed dual field definitions in IMeeting interface

### Changes Made
- ✅ Search meetings now uses `cr4cc_trackname`
- ✅ Track filters now use `cr4cc_trackname`
- ✅ Expand operations for races/contestants now request `cr4cc_trackname`
- ✅ Removed all field mapping logic (was: `cr4cc_trackname || cr4cc_trackheld`)

## API Test Results Summary

From the test, we confirmed:
- ✅ **Meetings table (`cr4cc_racemeetings`)**: WORKING
  - Field confirmed: `cr4cc_trackname` (not `cr4cc_trackheld`)
  - Other fields: `cr4cc_meetingdate`, `cr4cc_authority`, `cr4cc_timeslot`, etc.
- ❌ **Races table (`cr616_races`)**: NOT FOUND - needs investigation
- ❌ **Contestants table (`cr616_contestants`)**: NOT FOUND - needs investigation

## Technical Details

### Before (v1.1.17)
```javascript
// Incorrect field name
filter: contains(tolower(cr4cc_trackheld),tolower('Casino'))
// Unnecessary mapping
cr4cc_trackname: meeting.cr4cc_trackname || meeting.cr4cc_trackheld
```

### After (v1.1.18)
```javascript
// Correct field name
filter: contains(tolower(cr4cc_trackname),tolower('Casino'))
// No mapping needed
return meetings; // Direct use of API response
```

### Build Information
- **Version Sync:** ✅ Both package.json and package-solution.json at 1.1.18
- **Clean Build:** ✅ Artifacts cleaned before build
- **Production Build:** ✅ Built with `--ship` flag
- **Node version:** 22.17.1
- **SPFx version:** 1.21.1

## Installation Instructions

1. **Delete ALL previous versions** from your App Catalog
2. Upload `race-management-spfx.sppkg` to your SharePoint App Catalog
3. Select "Deploy to all sites" if prompted
4. **Clear browser cache** (Ctrl+F5 or Cmd+Shift+R)
5. Wait 15-30 minutes for SharePoint CDN propagation
6. Refresh pages containing the web parts

## Testing After Deployment

### Immediate Tests
1. Search for "Casino" - should now return results
2. Check browser console - no more field errors for `cr4cc_trackheld`
3. Meeting filters should work with track selection

### Use API Test Button
Click "🔧 Test API" to verify:
- Meetings endpoint is working
- Field names are correct
- Authentication is successful

## Known Issues - Still Under Investigation

### Races and Contestants Tables
The API test revealed that `cr616_races` and `cr616_contestants` return 404 errors. This suggests:
- These tables might have different names in your Dataverse environment
- They might not be deployed or accessible
- They might require different permissions

### Next Steps
To fix races and contestants:
1. Check Dataverse admin to see actual table names
2. Look for tables with similar names (maybe without `cr616_` prefix)
3. Verify permissions for these tables

## Version History
- **v1.1.14** - Initial release with search functionality
- **v1.1.15** - First attempt at fixing table/field names
- **v1.1.16** - Added case-insensitive search
- **v1.1.17** - Added API test button for diagnostics
- **v1.1.18** - Fixed field name: cr4cc_trackheld → cr4cc_trackname

## Critical Notes

### SharePoint Caching
- Version numbers MUST be synchronized between package.json and package-solution.json
- Always increment version before building
- Delete old versions from App Catalog before uploading new ones

### Field Name Documentation Update
The CLAUDE.md file should be updated to reflect:
- `cr4cc_trackname` is the actual field (not `cr4cc_trackheld`)
- Races and contestants table names need verification

## Support

For any issues, please provide:
1. Screenshot of the search working/not working
2. Browser console output after clicking "Test API"
3. Confirmation that meetings search now works
4. Any errors related to races/contestants

Contact: GRNSW Development Team