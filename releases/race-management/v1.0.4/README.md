# Race Management SPFx v1.0.4 Release

**Release Date:** December 12, 2024

## What's New
- **Fresh Build with Latest Code**: Complete rebuild ensuring all recent changes are included
- **Multi-select Functionality**: Authority and Track dropdowns support multiple selections with checkboxes
- **GRNSW Tools Section**: Web part configured to appear in custom "GRNSW Tools" section

## Bug Fixes
- All multi-select dropdown functionality has been preserved
- State management properly handles arrays of selected values
- Fixed any lingering issues with filter persistence

## Technical Details
- **Build Warnings:** 29 ESLint warnings (expected for event handling and API integration)
- **SharePoint Compatibility:** SPFx 1.21.1
- **Node Version:** 22.17.1
- **TypeScript Version:** 5.3.3
- **Solution Version:** 1.0.4.0

## Installation Instructions
1. Upload `race-management-spfx-v1.0.4-PROD.sppkg` to your SharePoint App Catalog
2. **Important**: If updating from a previous version:
   - Go to the App Catalog
   - Delete the old version first
   - Upload this new version
   - Deploy the solution (check "Make this solution available to all sites")
3. On your SharePoint sites:
   - Go to Site Contents > Add an app
   - Find and add "GRNSW Race Management"
   - Add the Race Meetings Calendar web part to your pages

## Features
- **Race Meetings Calendar Web Part**:
  - Multiple calendar views (day, week, month)
  - Multi-select Authority filtering with color coding
  - Multi-select Track filtering
  - Meeting detail panels with comprehensive information
  - Time-grid view for detailed scheduling
  - Navigation controls (previous, next, today)
  - Past and future meeting visibility controls

## What's Changed from v1.0.3
- Complete rebuild to ensure all code changes are included
- Version increment for proper update deployment

## Known Issues
- Custom web part groups may still show as "Advanced" in some SharePoint Online environments
- ESLint warnings are expected and do not affect functionality

## File Information
- **Package:** race-management-spfx-v1.0.4-PROD.sppkg
- **Size:** Approximately 1.2 MB
- **Solution ID:** b2c3d4e5-f6a7-8901-bcde-f12345678901

## Troubleshooting
If you're still seeing an old version:
1. Clear your browser cache (Ctrl+F5)
2. Check the App Catalog to ensure the new version is deployed
3. Remove and re-add the app on your site
4. In some cases, you may need to wait 15-30 minutes for SharePoint CDN to update