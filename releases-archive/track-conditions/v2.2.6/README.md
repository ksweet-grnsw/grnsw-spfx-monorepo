# Track Conditions SPFx v2.2.6 Release Notes

**Release Date:** December 13, 2024  
**Package:** track-conditions-spfx.sppkg  
**Version:** 2.2.6

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

### Component Integration
- Fixed shared track options to use centralized configuration
- Resolved import issues with Historical Pattern Analyzer
- Ensured consistent track naming across all web parts

### Build System
- Fixed missing dependencies (@microsoft/rush-stack-compiler-4.7)
- Removed broken @grnsw/shared package reference
- Updated WeatherDataService to use DataverseService directly

## 🔧 Technical Details

### Version Synchronization
- **CRITICAL FIX**: Ensured package.json and package-solution.json versions are synchronized
- Both files now correctly show version 2.2.6
- SharePoint will display the correct version number

### Code Quality
- Resolved TypeScript compilation errors
- Fixed null vs undefined inconsistencies (59 warnings remain but don't block functionality)
- Improved error handling in weather data services

### Build Configuration
- Successfully builds with Node.js 22.17.1
- SPFx version: 1.21.1
- TypeScript version: 5.3.3

## 📦 Installation Instructions

1. **Upload to App Catalog**:
   - Navigate to your SharePoint App Catalog
   - Upload `track-conditions-spfx.sppkg`
   - Check "Make this solution available to all sites"
   - Deploy

2. **Add to Site**:
   - Go to Site Contents
   - Click "New" > "App"
   - Find "GRNSW Track Conditions" and add it

3. **Clear Cache** (if seeing old version):
   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
   - Wait 15-30 minutes for CDN propagation

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