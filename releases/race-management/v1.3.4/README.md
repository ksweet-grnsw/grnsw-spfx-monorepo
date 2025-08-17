# Race Management SPFx v1.3.4 Release

**Release Date:** August 16, 2025  
**Package:** race-management-spfx.sppkg  
**Version:** 1.3.4

## 🐛 Bug Fixes

### Skeleton Loader White Background Fix
- **Added inline styles** to force white backgrounds on all skeleton loader components
- **Applied backgroundColor: 'white'** directly to container divs to override any CSS issues
- **Fixed filter section** background to use #f9f9f9
- **Fixed header section** background to use #f5f5f5
- Skeleton loaders will now always display with white backgrounds regardless of CSS cascade issues

### Analytics Data Loading Fix
- **Changed injury filter** from `cra5e_injured eq true` to `cra5e_injuryclassification ne null`
  - The `cra5e_injured` flag appears to not be set correctly in the data
  - Now filtering by presence of injury classification instead
- **Added table name detection** to try both `cra5e_heathchecks` and `cra5e_healthchecks`
- **Added fallback logic** to fetch unfiltered data and filter in memory if API filtering fails
- **Enhanced debugging** to help identify data issues

## 📋 Technical Details

### Files Modified
- `TableSkeleton.tsx` - Added inline styles for white backgrounds
- `RaceDataService.ts` - Fixed injury data filtering logic

### Build Information
- Built with SPFx 1.21.1
- Node.js v22.17.1
- TypeScript 5.3.3
- React 17.0.1
- Production build with --ship flag

## 🚀 Installation Instructions

1. Upload the `race-management-spfx.sppkg` file to your SharePoint App Catalog
2. Deploy the solution when prompted
3. Add the app to your SharePoint site(s)
4. The web parts will appear in the "GRNSW Tools" section

## ⚠️ Important Notes

- Skeleton loaders now use inline styles to guarantee white backgrounds
- Analytics data should now load if injury classification data exists
- Check browser console for detailed debugging information if data still doesn't load

## 🔍 Debugging Tips

If analytics data still doesn't load:
1. Open browser console (F12)
2. Look for messages starting with "RaceDataService.getInjuryData"
3. Check if the API is returning data
4. Look for "Records with injuries after filtering in memory" message
5. The fallback will try to fetch unfiltered data and filter client-side

## 📝 Console Output to Watch For

- `✅ Table cra5e_heathchecks exists!` - Confirms table name
- `Response received, record count: X` - Shows how many records returned
- `Records with injuries after filtering in memory: X` - Shows fallback filtering results