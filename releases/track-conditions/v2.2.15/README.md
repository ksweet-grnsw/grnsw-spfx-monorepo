# Track Conditions SPFx v2.2.15 Release

**Release Date:** December 8, 2024  
**Package:** track-conditions-spfx-v2.2.15-PROD.sppkg

## New Features

### Enhanced Property Pane Controls
- **Temperature Web Part** now includes property pane dropdowns for:
  - Default View (Statistics/Chart)
  - Default Period (Today/Week/Month)
  - Default Chart Type (Line/Bar)
  - Display Mode (Full/Compact)

### Display Mode Options
All three weather web parts (Temperature, Wind, and Rainfall) now support:
- **Full Mode**: 350px height for comprehensive data display
- **Compact Mode**: 200px height for space-efficient layouts
- Configurable via property pane dropdown

### Consistent Heights
- Standardized web part heights across all views (stats and charts)
- Heights remain constant regardless of view mode selection
- Clean, uniform appearance when web parts are placed side by side

## Bug Fixes
- Fixed inconsistent web part heights between different view modes
- Resolved property persistence issues in Temperature web part
- Improved responsive layout for compact display mode

## Technical Details
- Built with SharePoint Framework 1.21.1
- React 17.0.1
- TypeScript 5.3.3
- Chart.js 4.5.0
- All lint warnings are pre-existing and do not affect functionality

## Installation Instructions
1. Upload the .sppkg file to your SharePoint App Catalog
2. Deploy the solution to make it available to sites
3. Add the web parts to your SharePoint pages
4. Configure display preferences via the property pane

## Configuration
After adding any weather web part to a page:
1. Edit the web part properties
2. Select your preferred Display Mode (Full or Compact)
3. Configure default view options
4. Save your changes

## Web Parts Included
- Temperature Web Part (with enhanced property controls)
- Wind Analysis Web Part (with display mode)
- Rainfall Web Part (with display mode)
- Track Conditions Analysis
- Weather Dashboard
- Historical Pattern Analyzer

## Compatibility
- SharePoint Online
- Microsoft Teams
- Requires modern SharePoint pages