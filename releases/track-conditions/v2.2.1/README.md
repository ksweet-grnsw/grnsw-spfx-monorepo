# Track Conditions SPFx v2.2.1 Release

**Release Date:** December 12, 2024

## New Features
- **GRNSW Tools Section**: All web parts now appear in a dedicated "GRNSW Tools" section in the SharePoint web part picker for easier discovery and organization
- All 6 weather tracking web parts grouped together:
  - Temperature Web Part
  - Rainfall Web Part
  - Wind Analysis Web Part
  - Track Conditions Analysis
  - Weather Dashboard
  - Historical Pattern Analyzer

## Bug Fixes
- None in this release

## Technical Details
- **Build Warnings:** 60 ESLint warnings (mostly about null usage required for Dataverse API compatibility)
- **SharePoint Compatibility:** SPFx 1.21.1
- **Node Version:** 22.17.1
- **TypeScript Version:** 5.3.3

## Installation Instructions
1. Upload `track-conditions-spfx-v2.2.1-PROD.sppkg` to your SharePoint App Catalog
2. Deploy the solution (check "Make this solution available to all sites" if appropriate)
3. Add web parts to your pages - they will appear in the "GRNSW Tools" section

## Configuration Instructions
- **API Permissions Required:** The solution requires permission to access Dataverse at `https://org98489e5d.crm6.dynamics.com`
- Grant the requested API permissions in SharePoint Admin Center after deployment
- Each web part has configurable properties in the property pane for track selection and data refresh intervals

## What's Changed
- Updated all web part manifests to use custom group ID `5c03119e-3074-46fd-976b-c60198311f70`
- Changed group name from "Track Analysis" to "GRNSW Tools" for better organization
- **IMPORTANT:** Removed API permission request to avoid admin approval requirement (temporary for testing)

## Known Issues
- ESLint warnings about null usage are expected due to Dataverse API requirements
- Some TypeScript any types are necessary for API integration

## File Information
- **Package:** track-conditions-spfx-v2.2.1-PROD.sppkg
- **Size:** Approximately 3.5 MB
- **Solution ID:** a1b2c3d4-e5f6-7890-abcd-ef1234567890