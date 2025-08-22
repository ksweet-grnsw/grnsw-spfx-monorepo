# Race Management SPFx v1.4.7

**Release Date:** August 18, 2025
**Rebuild:** Updated with cleaner SVG icons for details and health indicators

## 🎯 What's New

### Icon and UI Improvements
- **Replaced action icons with SVG files** for better quality and consistency
  - Down arrow icon for drill-down actions
  - Document icon for viewing details  
  - Health icon (in red) for injury indicators
- **Added injury indicators** throughout the application
  - Shows health icon next to track names, race names, and greyhound names when injuries are present
  - Consistent red health icon using centralized InjuryIndicator component
- **Restored date range filter buttons** (Today, Week, 30 Days)
  - Implemented as reusable DateRangeFilter component
  - Follows DRY principle and separation of concerns

## 🐛 Bug Fixes
- Fixed SCSS compilation errors with undefined variables
- Corrected font-weight token references in DateRangeFilter styles

## 🔧 Technical Details

### New Components
- `InjuryIndicator` - Reusable component for displaying injury status with health SVG icon
- `DateRangeFilter` - Reusable date range selector with preset options

### Architecture Improvements
- Implemented DRY (Don't Repeat Yourself) principle for injury indicators
- Proper separation of concerns with dedicated UI components
- Replaced hardcoded Unicode characters with scalable SVG icons

### Build Information
- Built with `--ship` flag for production deployment
- Version synchronized across package.json and package-solution.json
- All build warnings are non-critical (CSS naming conventions)

## 📦 Installation

1. Upload `race-management-spfx.sppkg` to your SharePoint App Catalog
2. Deploy the solution when prompted
3. Add the web parts to your SharePoint pages:
   - Race Data Explorer
   - Race Meetings Calendar

## ⚠️ Important Notes

- This version requires SharePoint Framework 1.21.1
- Ensure your SharePoint Online tenant has the appropriate permissions configured
- The solution connects to Microsoft Dataverse for race data

## 🔄 Upgrade Instructions

If upgrading from a previous version:
1. Remove the old app from affected sites
2. Upload the new package to the App Catalog
3. Re-add the app to your sites
4. Reconfigure web part properties if needed

---
*Generated for GRNSW SharePoint Environment*