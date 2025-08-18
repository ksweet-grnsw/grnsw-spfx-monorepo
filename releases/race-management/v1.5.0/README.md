# Race Management v1.5.0 Release

**Release Date:** August 18, 2025  
**Package:** race-management-spfx.sppkg  
**SharePoint Framework Version:** 1.21.1

## 🎯 Major Changes

### Icon System Overhaul
- **Enhanced SVG Icons**: All action icons updated with improved visibility
  - Health icon: Increased stroke width to 3px and scaled up 20% for better visibility
  - Details icon: Thicker lines (stroke-width: 2px) for improved clarity
  - Down arrow icon: Consistent styling with other icons
- **Dynamic Color System**: Icons now use CSS filters for hover states (gray to blue transition)

### Table Field Corrections
- **Race Title Display**: Fixed races table to use the correct `cr616_racetitle` field instead of the combined race number/name field
- **Clean UI**: Removed redundant injury indicators from name columns since dedicated injury columns now exist

## ✨ New Features

### 1. Dedicated Injury Columns
- All tables (meetings, races, contestants) now have dedicated injury indicator columns
- Visual health/cross icons clearly show injury status
- Tooltips provide context-specific information

### 2. Improved Icon Visibility
- Health indicator icon enhanced with:
  - 3px stroke width for all paths
  - 20% scale increase via transform
  - Maintained aspect ratio and centering
- Details icon improved with thicker, more visible lines
- Consistent icon styling across all tables

## 🐛 Bug Fixes

### Field Mapping Issues
- **Fixed**: Races table was displaying combined "Race X - Name" format
- **Solution**: Now correctly uses `cr616_racetitle` field for clean title display
- **Impact**: Cleaner, more professional race title presentation

### UI Redundancy
- **Fixed**: Duplicate injury indicators appearing in both name and dedicated columns
- **Solution**: Removed injury indicators from track names, race names, and greyhound names
- **Impact**: Cleaner interface with no duplicate information

## 🔧 Technical Details

### Build Information
- Built with production flags (`--ship`)
- Version synchronized across package.json and package-solution.json
- Clean build process with all artifacts removed before compilation

### Component Updates
- **useTableColumns.ts**: Updated to use correct field mappings
- **InjuryIndicator**: Enhanced integration with all table types
- **SVG Assets**: Optimized for SharePoint rendering

### File Changes
- `src/hooks/useTableColumns.ts`: Field mapping corrections
- `src/assets/icons/health.svg`: Enhanced visibility
- `src/assets/icons/details.svg`: Improved line thickness
- `config/package-solution.json`: Version 1.5.0.0
- `package.json`: Version 1.5.0

## 📦 Installation Instructions

1. **Upload to App Catalog**
   - Navigate to your SharePoint App Catalog
   - Upload `race-management-spfx.sppkg`
   - Check "Make this solution available to all sites"
   - Deploy

2. **Update Existing Installations**
   - Sites with previous versions will see an update available
   - Click "Update" in Site Contents
   - Allow 15-30 minutes for full propagation

3. **Clear Browser Cache**
   - Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
   - This ensures you see the latest icon updates

## ⚠️ Known Issues

- SharePoint may cache old icons for up to 30 minutes
- If old icons persist, remove and re-add the web part

## 🔄 Migration Notes

### From v1.4.x
- No configuration changes required
- Injury indicators automatically appear in dedicated columns
- Field mappings updated automatically

## 📊 Version History

- v1.5.0 - Icon visibility improvements and field corrections
- v1.4.9 - Enhanced health icon with thicker lines
- v1.4.8 - Initial SVG icon implementation
- v1.4.7 - InjuryIndicator component integration

## 🚀 Next Steps

Consider these enhancements for future releases:
- Additional icon customization options
- Configurable icon sizes via web part properties
- Export functionality for injury reports

---

**Built with SharePoint Framework 1.21.1**  
**Compatible with SharePoint Online**  
🤖 Generated with Claude Code