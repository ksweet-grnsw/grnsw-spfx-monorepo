# Race Management SPFx Package - Release v1.1.23

**Release Date:** August 14, 2025  
**Package:** race-management-spfx.sppkg  
**Version:** 1.1.23

## Release Summary

This release fixes critical search functionality issues by addressing Dataverse API compatibility problems and adds a clear search button for improved user experience.

## Bug Fixes

### Search Functionality Fixes
- **Fixed:** Replaced unsupported `contains(tolower())` function with `startswith()` for better API compatibility
  - The Dataverse API was returning "501 Not Implemented" errors for `contains(tolower())`
  - Changed to use `startswith()` function which is fully supported
- **Fixed:** Removed problematic `$expand` clauses from search queries
  - Navigation property names were incorrect (e.g., `cr616_Meeting` should be relationship field)
  - Simplified search queries to avoid expansion errors
- **Improved:** Search now works with partial matches from the beginning of fields

### User Interface Improvements
- **Added:** Clear search button (X) in the search bar for easy clearing
  - Button appears when search text is present
  - Clicking clears search term and results
  - Returns to meetings view after clearing

## Technical Details

### API Changes
The search functionality now uses simpler, more compatible queries:
- **Meetings:** `startswith(cr4cc_trackname, 'searchterm')`
- **Races:** `startswith(cr616_racename, 'searchterm') or startswith(cr616_racetitle, 'searchterm')`
- **Contestants:** `startswith(cr616_greyhoundname, 'searchterm') or startswith(cr616_ownername, 'searchterm') or startswith(cr616_trainername, 'searchterm')`

### Build Information
- SPFx Version: 1.21.1
- Node Version: 22.17.1
- Build Tools: 3.19.0
- TypeScript: 5.3.3

### Known Limitations
- Search uses `startswith` instead of `contains`, so searches must match from the beginning of fields
- Case-insensitive search is not available due to API limitations
- Relationship data (like meeting info for races) is not included in search results

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

## Testing Recommendations

1. **Test Search Functionality:**
   - Try searching for partial track names (e.g., "Went" for "Wentworth Park")
   - Test greyhound names, owner names, trainer names
   - Verify clear button functionality

2. **Verify API Connectivity:**
   - Use the "Test API" button in Race Data Explorer
   - Should show successful connections to working endpoints

3. **Monitor Performance:**
   - Search should return results quickly
   - Check browser console for any API errors

## Rollback Instructions

If issues persist:
1. Return to App Catalog
2. Upload previous version (v1.1.22)
3. Select "Overwrite existing file"
4. Deploy to update all sites

## Support

For issues or questions:
- Check browser console for detailed error messages
- Verify network connectivity to Dataverse
- Ensure proper permissions are configured

## Change Log

### v1.1.23 (Current)
- Fixed search functionality with API-compatible queries
- Added clear search button functionality
- Removed problematic navigation property expansions

### v1.1.22 (Previous)
- Confirmed correct double-plural API endpoints
- Version bump for deployment tracking

### v1.1.21
- Initial API discovery implementation
- Added comprehensive endpoint testing