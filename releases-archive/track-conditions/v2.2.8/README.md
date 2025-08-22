# Track Conditions SPFx v2.2.8 Release Notes

**Release Date:** December 13, 2024  
**Package:** track-conditions-spfx.sppkg  
**Version:** 2.2.8

## 🔧 CRITICAL FIX: Default Track Property Persistence

This release fixes the issue where the selected default track was not persisting when the page was republished or refreshed.

## 🐛 Bug Fixes

### Historical Pattern Analyzer - Default Track Persistence
- **Fixed**: Default track selection now properly persists across page refreshes
- **Fixed**: Added `defaultTrack` property to manifest.json (was missing)
- **Fixed**: Component now properly initializes with the default track on page load
- **Fixed**: Both single track (defaultTrack) and multi-track (defaultTracks) selections are saved
- **Improved**: Added debug logging to help diagnose any remaining issues

### Technical Changes
1. **Manifest Update**: Added missing `defaultTrack` property to preconfiguredEntries
2. **Component Initialization**: Improved logic to properly use defaultTrack on initial load
3. **Property Persistence**: Now saves both defaultTrack and defaultTracks when user changes selection
4. **Debug Logging**: Added console logs to track property values during initialization

## 📋 How It Works Now

When you set a default track in the property pane:
1. The value is saved to the `defaultTrack` property
2. On page load, the component checks for `defaultTrack` first
3. If a default track is set, it automatically loads that track's data
4. The selection persists even after page republish

## 🔍 Debugging

If you still experience issues, check the browser console for these debug messages:
- `HistoricalPatternAnalyzer - componentDidMount`
- `Default Track: [track name]`
- `Selected Tracks in State: [array of tracks]`

## 📦 Installation Instructions

### IMPORTANT: Clean Installation Required
1. **Delete Old Version from App Catalog**:
   - Remove version 2.2.7 completely
   - Empty the recycle bin

2. **Upload New Version**:
   - Upload `track-conditions-spfx.sppkg` (v2.2.8)
   - Deploy to all sites
   - Verify version shows as 2.2.8.0

3. **Clear Cache and Re-add Web Part**:
   - Clear browser cache (Ctrl+F5)
   - Remove the old web part from your page
   - Add the web part again
   - Set your default track in the property pane
   - Save and publish the page

## ✅ Testing the Fix

1. Add the Historical Pattern Analyzer web part to a page
2. Edit the web part properties
3. Select a default track from the dropdown
4. Apply the changes
5. Publish the page
6. Refresh the browser
7. The selected track should automatically load with data

## 🏁 Track List (18 Active Tracks)

The following tracks have active weather data collection:
- Broken Hill
- Bulli
- Casino
- Dapto
- Dubbo
- Gosford
- Goulburn
- Grafton
- Gunnedah
- Lithgow
- Maitland
- Nowra
- Richmond
- Taree
- Temora
- The Gardens
- Wagga Wagga
- Wentworth Park

## 📞 Support

If the issue persists after installing v2.2.8:
1. Check the browser console for error messages
2. Verify the version shows as 2.2.8.0 in SharePoint
3. Try removing and re-adding the web part
4. Contact GRNSW Development Team with console logs

---
*Built with SharePoint Framework (SPFx) 1.21.1*
*Version 2.2.8 - Default Track Persistence Fix*