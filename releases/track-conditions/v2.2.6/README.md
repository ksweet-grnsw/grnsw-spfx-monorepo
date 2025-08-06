# Track Conditions SPFx v2.2.6 Release

**Release Date:** December 12, 2024

## CRITICAL FIX - VERSION 2.2.5
**Folder v2.2.6 contains version 2.2.5.0 package**

## Bug Fixes
- **Historical Pattern Analyzer - Data Loading Fixed**
  - Removed use of `cr4cc_is_current_reading` field (may not exist or always false)
  - Now fetches latest record for each selected track individually
  - Uses simple query: `$orderby=createdon desc&$top=1` for each track

- **Historical Pattern Analyzer - Track Selection Persistence**
  - Track selection now saves to web part properties
  - Selection persists on page refresh
  - Uses `onUpdateProperty` callback to save defaultTracks

## Technical Details
- **Build Version:** 2.2.5
- **SharePoint Version:** Will display as 2.2.5.0
- **Solution ID:** a1b2c3d4-e5f6-7890-abcd-ef1234567890

## Installation Instructions
1. **DELETE the old app from App Catalog**
2. Upload `track-conditions-spfx-v2.2.6-PROD.sppkg`
3. Version should show as **2.2.5.0**
4. Deploy and redistribute

## What Was Fixed
- Changed from using `cr4cc_is_current_reading eq true` to just getting latest record
- Fetch data for each track separately to ensure we get current data
- Added property persistence for track selection

## File Information
- **Package:** track-conditions-spfx-v2.2.6-PROD.sppkg
- **Embedded Version:** 2.2.5.0