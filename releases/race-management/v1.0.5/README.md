# Race Management SPFx v1.0.5 Release

**Release Date:** December 12, 2024

## CRITICAL FIX
**This release fixes the version mismatch issue where package.json had version 1.0.0 while package-solution.json had 1.0.4.0**

## What's Fixed
- **Version Synchronization**: Both package.json and package-solution.json now correctly show version 1.0.4
- **Package Version**: The .sppkg file now correctly embeds version 1.0.4.0 (will display properly in SharePoint)
- **Multi-select Functionality**: Authority and Track dropdowns support multiple selections
- **Custom Group**: Configured for "GRNSW Tools" section

## Technical Details
- **Build Version:** 1.0.4 (synchronized across all config files)
- **SharePoint Version:** Will display as 1.0.4.0 in App Catalog
- **Build Warnings:** 29 ESLint warnings (expected)
- **Node Version:** 22.17.1
- **TypeScript Version:** 5.3.3

## Installation Instructions
1. **DELETE the old app from App Catalog first** (critical step!)
2. Upload `race-management-spfx-v1.0.5-PROD.sppkg` to your SharePoint App Catalog
3. The version should now correctly show as **1.0.4.0**
4. Deploy the solution (check "Make this solution available to all sites")
5. Remove and re-add the app on your sites

## Features
- **Race Meetings Calendar Web Part**:
  - Multiple calendar views (day, week, month)
  - Multi-select Authority filtering with color coding
  - Multi-select Track filtering
  - Meeting detail panels
  - Time-grid view for detailed scheduling

## What Was Wrong Before
- package.json had version "1.0.0" while package-solution.json had "1.0.4.0"
- SPFx build process uses package.json version, causing the mismatch
- This is why SharePoint showed version 1.0.3.0 even with updated package-solution.json

## File Information
- **Package:** race-management-spfx-v1.0.5-PROD.sppkg
- **Embedded Version:** 1.0.4.0
- **Size:** Approximately 475 KB
- **Solution ID:** b2c3d4e5-f6a7-8901-bcde-f12345678901