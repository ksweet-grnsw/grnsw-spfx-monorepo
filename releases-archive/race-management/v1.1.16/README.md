# Race Management SPFx v1.1.16 Release

**Release Date:** August 13, 2025  
**Package:** race-management-spfx.sppkg  
**Version:** 1.1.16

## 🔍 Search Functionality Improvements

### Enhanced Search Implementation
Building on v1.1.15, this release includes additional improvements to the search functionality in the Race Data Explorer web part.

## Bug Fixes

### Search Enhancements (v1.1.16)
- **Case-insensitive search**: Implemented `tolower()` functions in OData queries for case-insensitive matching
- **Better error handling**: Individual try-catch blocks for each search type (meetings, races, contestants)
- **Improved resilience**: Search continues even if one category fails
- **Enhanced logging**: Added detailed console logging for debugging:
  - Search URLs being called
  - Result counts for each category
  - Specific error messages for failed searches

### Previously Fixed (v1.1.15)
- Fixed incorrect table names (`cr616_raceses` → `cr616_races`)
- Corrected field mappings (`cr4cc_trackname` → `cr4cc_trackheld`)
- Removed non-existent field references

## Technical Details

### Search Query Improvements
- **Before:** `contains(cr4cc_trackheld,'Casino')`
- **After:** `contains(tolower(cr4cc_trackheld),tolower('Casino'))`

### Error Handling
```javascript
// Each search type now handled independently
try { meetingsResponse = await ... } catch { /* log error */ }
try { racesResponse = await ... } catch { /* log error */ }
try { contestantsResponse = await ... } catch { /* log error */ }
```

### Build Information
- **Version Sync:** ✅ Verified before build
- **Clean Build:** ✅ Artifacts cleaned before build
- **Production Build:** ✅ Built with `--ship` flag
- **Node version:** 22.17.1
- **SPFx version:** 1.21.1

## Installation Instructions

1. **Delete the previous version** from your App Catalog (important for cache refresh)
2. Upload `race-management-spfx.sppkg` to your SharePoint App Catalog
3. Select "Deploy to all sites" if prompted
4. **Clear browser cache** (Ctrl+F5 or Cmd+Shift+R)
5. Wait 15-30 minutes for SharePoint CDN propagation
6. Refresh pages containing the web parts

## Debugging Guide

### Check Browser Console
After deployment, open the browser console (F12) and look for:
- **"Search URLs"** - Shows the actual API calls being made
- **"Search results"** - Shows count of results found for each category
- **Error messages** - Any authentication or API failures

### Common Issues and Solutions

1. **Still no results?**
   - Check console for authentication errors
   - Verify the Dataverse API permissions are configured
   - Ensure CORS is enabled for your SharePoint domain

2. **Partial results?**
   - Some search categories may succeed while others fail
   - Check console for specific category failures

3. **Case sensitivity issues?**
   - This version implements case-insensitive search
   - Try searching with different case variations

## Testing Checklist

After deployment:
- [ ] Search for "casino" (lowercase)
- [ ] Search for "Casino" (title case)
- [ ] Search for "CASINO" (uppercase)
- [ ] Search for a greyhound name
- [ ] Search for a trainer name
- [ ] Search for an owner name
- [ ] Check browser console for any errors

## Version History
- **v1.1.14** - Initial release
- **v1.1.15** - Fixed table and field name mappings
- **v1.1.16** - Enhanced search with case-insensitive matching and better error handling

## Support

For any issues, please provide:
1. Screenshot of the search not working
2. Browser console errors (F12 → Console tab)
3. Search term that was used
4. SharePoint environment details

Contact: GRNSW Development Team