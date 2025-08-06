# Race Management SPFx v1.0.3 Release

**Release Date:** December 12, 2024

## New Features
- **GRNSW Tools Section**: Race Meetings Calendar web part now appears in a dedicated "GRNSW Tools" section in the SharePoint web part picker for easier discovery and organization alongside other GRNSW web parts

## Bug Fixes
- **Restored multi-select functionality** - Authority and Track dropdowns now support selecting multiple items with checkboxes
- Fixed state management to properly handle arrays of selected values

## Technical Details
- **Build Warnings:** 29 ESLint warnings (mostly void operators and any types for API integration)
- **SharePoint Compatibility:** SPFx 1.21.1
- **Node Version:** 22.17.1
- **TypeScript Version:** 5.3.3

## Installation Instructions
1. Upload `race-management-spfx-v1.0.3-PROD.sppkg` to your SharePoint App Catalog
2. Deploy the solution (check "Make this solution available to all sites" if appropriate)
3. Add the Race Meetings Calendar web part to your pages - it will appear in the "GRNSW Tools" section

## Configuration Instructions
- The web part includes property pane settings for:
  - Authority filtering (different racing authorities)
  - Track selection
  - View options (Day/Week/Month)
  - Past/Future meeting visibility controls

## What's Changed
- Updated web part manifest to use custom group ID `5c03119e-3074-46fd-976b-c60198311f70`
- Changed group name from "Advanced" to "GRNSW Tools" for consistency with other GRNSW web parts
- Version bumped from 1.0.2 to 1.0.3

## Features
- **Race Meetings Calendar Web Part**:
  - Multiple calendar views (day, week, month)
  - Authority-based filtering with color coding
  - Track-specific filtering
  - Meeting detail panels
  - Time-grid view for detailed scheduling
  - Navigation controls (previous, next, today)

## Known Issues
- ESLint warnings about void operators and any types are expected for event handling
- Loop condition warnings in calendar generation logic

## File Information
- **Package:** race-management-spfx-v1.0.3-PROD.sppkg
- **Size:** Approximately 1.2 MB
- **Solution ID:** b2c3d4e5-f6a7-8901-bcde-f12345678901