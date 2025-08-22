# Race Management SPFx v1.3.3 Release

**Release Date:** August 16, 2025  
**Package:** race-management-spfx.sppkg  
**Version:** 1.3.3

## 🐛 Bug Fixes

### Skeleton Loader Visual Fix
- **Fixed black screen issue** with skeleton loaders appearing as black instead of white
- **Removed dark mode styles** that were incorrectly being applied based on system preferences
- **Applied !important flags** to ensure white backgrounds are always used for better visibility
- **Improved loading state visibility** during data fetching operations

### Analytics Dashboard Improvements
- **Enhanced error logging** in the InjuryAnalyticsDashboard component
- **Added fallback date range** (1 year) when no dates are provided
- **Improved debugging output** to help diagnose data loading issues
- **Added test API calls** to verify connectivity when no data is returned
- **Better error handling** with detailed error messages and stack traces

## 📋 Technical Details

### Files Modified
- `TableSkeleton.module.scss` - Fixed background colors for skeleton loaders
- `InjuryAnalyticsDashboard.tsx` - Enhanced error handling and debugging

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

- The skeleton loaders will now always display with white backgrounds regardless of system theme
- Analytics data loading has improved debugging to help identify any API connectivity issues
- If analytics data still doesn't load, check the browser console for detailed error messages

## 🔍 Known Issues

- Analytics data may not load if the Dataverse API table name is incorrect (monitoring for `cra5e_heathchecks` vs `cra5e_healthchecks`)
- Some lint warnings exist but do not affect functionality

## 📝 Next Steps

If analytics data continues to not load after this update:
1. Check browser console for error messages
2. Verify that the injury data environment is accessible
3. Confirm that health check data exists in the Dataverse tables