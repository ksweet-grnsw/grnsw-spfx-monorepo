# Race Management SPFx v1.4.9

**Release Date:** August 18, 2025

## 🎯 What's New

### Enhanced Icon Visibility
- **Thicker lines in SVG icons** for improved visibility
  - Health/injury icon now has bolder strokes for better readability at small sizes
  - Details icon lines thickened for clearer visual presentation
  - All icons maintain consistent stroke-width for uniformity

## 📋 Includes All Previous Features

### Icon and UI Improvements (from v1.4.7-1.4.8)
- **SVG-based action icons** for better quality and consistency
  - Down arrow icon for drill-down actions
  - Document icon for viewing details  
  - Health icon (in red) for injury indicators
- **Injury indicators** throughout the application
  - Shows health icon next to track names, race names, and greyhound names when injuries are present
  - Consistent red health icon using centralized InjuryIndicator component
- **Date range filter buttons** (Today, Week, 30 Days)
  - Implemented as reusable DateRangeFilter component
  - Follows DRY principle and separation of concerns

## 🔧 Technical Details

### Icon Updates
- Added `stroke-width="2"` attribute to all SVG paths
- Added `fill="currentColor"` for dynamic color support
- Improved icon visibility at 14-16px display sizes
- Better contrast and readability across different backgrounds

### Components
- `InjuryIndicator` - Reusable component for displaying injury status with health SVG icon
- `DateRangeFilter` - Reusable date range selector with preset options

### Architecture Improvements
- Implemented DRY (Don't Repeat Yourself) principle for injury indicators
- Proper separation of concerns with dedicated UI components
- SVG icons for scalability and consistent rendering

### Build Information
- Built with `--ship` flag for production deployment
- Version 1.4.9 synchronized across package.json and package-solution.json
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

## 📝 Version History
- v1.4.9 - Thicker lines in SVG icons for better visibility
- v1.4.8 - Cleaner SVG icon designs
- v1.4.7 - Initial SVG icon implementation and injury indicators
- v1.4.6 - Date range filters restored

---
*Generated for GRNSW SharePoint Environment*