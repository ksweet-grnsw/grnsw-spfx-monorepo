# Track Conditions SPFx v2.2.7 Release Notes

**Release Date:** December 13, 2024  
**Package:** track-conditions-spfx.sppkg  
**Version:** 2.2.7

## ⚠️ CRITICAL VERSION UPDATE
This release increments the version to 2.2.7 to ensure SharePoint recognizes it as a new version and displays the correct version number.

## 🎯 New Features

### Historical Pattern Analyzer Enhancements
- **Default Track Selection**: Added ability to set a default track in the web part properties pane
  - Default track automatically loads when the web part is added to a page
  - Persists across page refreshes and sessions
  - Improves user experience by pre-selecting commonly used tracks

### Track List Updates
- **Removed Non-Active Tracks**: Cleaned up track list to only include tracks with active weather stations
  - Removed Albion Park (Queensland track, not GRNSW)
  - Removed Appin (not collecting weather data)
  - Removed Lismore (not collecting weather data)  
  - Removed Bathurst (not collecting weather data)
  - Now showing 18 tracks with active weather data collection

## 🐛 Bug Fixes

### Version Synchronization
- **CRITICAL FIX**: Ensured package.json and package-solution.json versions are synchronized at 2.2.7
- SharePoint will now correctly display version 2.2.7.0
- Resolved issue where SharePoint was showing old version numbers

### Component Integration
- Fixed shared track options to use centralized configuration
- Resolved import issues with Historical Pattern Analyzer
- Ensured consistent track naming across all web parts

### Build System
- Fixed missing dependencies (@microsoft/rush-stack-compiler-4.7)
- Removed broken @grnsw/shared package reference
- Updated WeatherDataService to use DataverseService directly

## 🔧 Technical Details

### Build Configuration
- Successfully builds with Node.js 22.17.1
- SPFx version: 1.21.1
- TypeScript version: 5.3.3
- Build shows version 2.2.7 correctly in logs

### Code Quality
- Resolved TypeScript compilation errors
- Fixed null vs undefined inconsistencies (59 warnings remain but don't block functionality)
- Improved error handling in weather data services

## 📦 Installation Instructions

### IMPORTANT: Clean Installation Required
1. **Delete Old Version from App Catalog**:
   - Go to your SharePoint App Catalog
   - Find the existing track-conditions-spfx package
   - Delete it completely
   - Empty the recycle bin

2. **Upload New Version**:
   - Upload `track-conditions-spfx.sppkg` (v2.2.7)
   - Check "Make this solution available to all sites"
   - Deploy
   - Verify version shows as 2.2.7.0

3. **Update Sites**:
   - Go to each site using the app
   - Remove the old app from Site Contents
   - Add the new version
   - Clear browser cache (Ctrl+F5 or Cmd+Shift+R)

## ⚙️ Configuration

### Historical Pattern Analyzer Default Track
1. Edit the web part properties
2. In the property pane, find "Default Track" dropdown
3. Select your preferred default track
4. The selected track will automatically load when the web part is displayed

## 📋 Web Parts Included

All 6 web parts are included in this package:
1. **Temperature Web Part** - Current temperature with feels-like calculations
2. **Rainfall Web Part** - Hourly, daily, monthly rainfall tracking  
3. **Wind Analysis Web Part** - Wind speed, direction, and wind rose visualization
4. **Track Conditions Analysis** - Comprehensive track safety scoring
5. **Weather Dashboard** - Live multi-station weather display
6. **Historical Pattern Analyzer** - Advanced pattern analysis with default track selection

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

## ⚠️ Known Issues

- Some ESLint warnings about null usage remain due to Dataverse API compatibility requirements
- These warnings do not affect functionality

## 📞 Support

For issues or questions, please contact the GRNSW Development Team or create an issue at:
https://github.com/ksweet-grnsw/grnsw-spfx-monorepo

---
*Built with SharePoint Framework (SPFx) 1.21.1*
*Version 2.2.7 - Synchronized and verified*