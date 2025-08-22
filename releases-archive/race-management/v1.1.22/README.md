# Race Management SPFx Package - Release v1.1.22

**Release Date:** August 14, 2025  
**Package:** race-management-spfx.sppkg  
**Version:** 1.1.22

## Release Summary

This release addresses critical API endpoint issues discovered in production, where the Dataverse API uses double-plural naming for certain tables.

## Bug Fixes

### API Endpoint Corrections
- **Fixed:** Confirmed correct usage of double-plural table names in Dataverse API:
  - Races table: `cr616_raceses` (not `cr616_races`)
  - Contestants table: `cr616_contestantses` (not `cr616_contestants`)
  - Meetings table: `cr4cc_racemeetings` (working correctly)
- **Impact:** Resolves "Resource not found" errors when accessing race and contestant data

### Search Functionality
- **Issue:** Search functionality may still have issues despite correct table names
- **Status:** API endpoints are correct, but further investigation may be needed for search query construction
- **Workaround:** Individual table queries (meetings, races, contestants) should work correctly

## Technical Details

### Build Information
- SPFx Version: 1.21.1
- Node Version: 22.17.1
- Build Tools: 3.19.0
- TypeScript: 5.3.3

### API Discovery Results
The comprehensive API discovery test confirms:
- ✅ `cr4cc_racemeetings` - Working (Meetings table)
- ✅ `cr616_raceses` - Working (Races table with double plural)
- ✅ `cr616_contestantses` - Working (Contestants table with double plural)
- ❌ All other variations tested returned 404 errors

## Installation Instructions

1. **Upload to App Catalog:**
   - Navigate to your SharePoint App Catalog
   - Upload `race-management-spfx.sppkg`
   - Check "Make this solution available to all sites"
   - Deploy

2. **Add to Site:**
   - Go to your target SharePoint site
   - Site Contents → New → App
   - Select "GRNSW Race Management"
   - Wait for installation to complete

3. **Add Web Parts to Pages:**
   - Edit your SharePoint page
   - Add web part → GRNSW Tools section
   - Select either:
     - Race Data Explorer
     - Race Meetings Calendar

## Configuration

### Race Data Explorer Web Part
- No additional configuration required
- Uses authenticated connection to Dataverse
- Automatically connects to: `https://racingdata.crm6.dynamics.com/`

### Race Meetings Calendar Web Part
- Configure view mode: Day/Week/Month
- Optional: Set default track filter
- Optional: Set default authority filter

## Known Issues

1. **Search Functionality:** While API endpoints are correct, search may still have issues with query construction or data filtering
2. **Build Warnings:** Multiple ESLint warnings present but do not affect functionality
3. **Performance:** Initial load may be slow when fetching large datasets

## Testing Recommendations

1. **Verify API Connectivity:**
   - Use the "Test API" button in Race Data Explorer
   - Should show 3/14 successful tests (the working endpoints)

2. **Test Basic Operations:**
   - View meetings list
   - View races for a meeting
   - View contestants for a race

3. **Monitor Console:**
   - Check browser console for any API errors
   - Look for successful data fetches from correct endpoints

## Rollback Instructions

If issues persist:
1. Return to App Catalog
2. Upload previous version (v1.1.21)
3. Select "Overwrite existing file"
4. Deploy to update all sites

## Support

For issues or questions:
- Check browser console for detailed error messages
- Verify network connectivity to Dataverse
- Ensure proper permissions are configured

## Change Log

### v1.1.22 (Current)
- Confirmed correct double-plural API endpoints
- Version bump for deployment tracking

### v1.1.21 (Previous)
- Initial API discovery implementation
- Added comprehensive endpoint testing

### v1.1.20
- Updated Enterprise UI components
- Improved error handling