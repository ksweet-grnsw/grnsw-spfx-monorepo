# Race Management SPFx v1.1.17 Release

**Release Date:** August 13, 2025  
**Package:** race-management-spfx.sppkg  
**Version:** 1.1.17

## 🔧 API Diagnostic Features

### New Debugging Capabilities
This release adds an API test button to help diagnose Dataverse connectivity issues and identify correct table/field names.

## New Features

### API Test Button (v1.1.17)
- **Test API Connection**: New "🔧 Test API" button in the search bar
- **Entity Discovery**: Tests different table name patterns to find correct API endpoints
- **Field Mapping**: Displays available fields when entities are found
- **Clear Search Button**: Added "✕" button to quickly clear search input
- **Improved Error Messages**: More detailed console logging for troubleshooting

## Bug Fixes

### Table and Field Names Documentation
- **Updated CLAUDE.md**: Documented correct Dataverse table and field names
- **Field Mapping Notes**: Added clarification that `cr4cc_trackname` doesn't exist (uses `cr4cc_trackheld`)
- **API Endpoint Verification**: All endpoints now use correct plural table names from documentation

### Previously Fixed (v1.1.16)
- Case-insensitive search implementation
- Better error handling with individual try-catch blocks
- Search resilience improvements

### Previously Fixed (v1.1.15)
- Fixed incorrect table names (`cr616_raceses` → `cr616_races`)
- Corrected field mappings (`cr4cc_trackname` → `cr4cc_trackheld`)

## Technical Details

### API Test Function
The new `testApiConnection()` method tests multiple endpoints:
```javascript
// Tests these endpoint patterns:
- cr4cc_racemeetings (plural - correct)
- cr616_races (plural - correct)
- cr616_contestants (plural - correct)
```

### Clear Search Implementation
```javascript
const clearSearch = () => {
  setSearchTerm('');
  setSearchResults(null);
  setViewState({ type: 'meetings' });
};
```

### Build Information
- **Version Sync:** ✅ Manually synchronized package.json and package-solution.json
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

## Using the API Test Feature

### To diagnose API issues:
1. Click the "🔧 Test API" button in the search bar
2. Open browser console (F12) to see detailed results
3. Check which endpoints succeed/fail
4. Note the field names returned for successful endpoints

### What the test checks:
- Dataverse API connectivity
- Authentication status
- Table name patterns (singular vs plural)
- Available fields in each table
- Entity discovery through metadata endpoint

## Debugging Guide

### Check Browser Console
After clicking the Test API button, look for:
- **"Testing API connections"** - Start of test
- **✅ Success messages** - Working endpoints
- **❌ Failure messages** - Failed endpoints with error details
- **"Fields found"** - List of available fields in successful tables

### Common Issues and Solutions

1. **All endpoints fail?**
   - Check Dataverse API permissions
   - Verify AAD authentication is configured
   - Ensure CORS is enabled for SharePoint domain

2. **Some endpoints work, others don't?**
   - The working endpoints show the correct table names
   - Update your code to use the working endpoint patterns

3. **Authentication errors?**
   - Verify the app registration in Azure AD
   - Check that the SharePoint app has proper permissions

## Testing Checklist

After deployment:
- [ ] Click "🔧 Test API" button and check console
- [ ] Try searching for "casino" (should work now)
- [ ] Test clear search button (✕)
- [ ] Search for a greyhound name
- [ ] Search for a trainer name
- [ ] Search for an owner name
- [ ] Verify all search results are clickable

## Important Notes

### Critical: Version Synchronization
SharePoint caches based on version numbers. ALWAYS ensure:
1. Update version in `package.json`
2. Update version in `config/package-solution.json` (both solution and feature)
3. Clean build artifacts with `gulp clean`
4. Build with `--ship` flag for production
5. Delete old versions from App Catalog before uploading

## Version History
- **v1.1.14** - Initial release with search functionality
- **v1.1.15** - Fixed table and field name mappings
- **v1.1.16** - Enhanced search with case-insensitive matching
- **v1.1.17** - Added API test button and clear search functionality

## Support

For any issues, please provide:
1. Screenshot of the issue
2. Browser console output after clicking "Test API"
3. Specific search terms that aren't working
4. SharePoint environment details

Contact: GRNSW Development Team