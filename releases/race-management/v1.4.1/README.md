# Race Management SPFx Package v1.4.1

**Release Date:** December 17, 2024  
**Package:** race-management-spfx.sppkg  
**SharePoint Version:** SPFx 1.21.1

## 🐛 Bug Fixes

### Critical Fixes
- **Fixed JSON parsing error** that prevented data from loading ("Unexpected end of JSON input")
- **Fixed missing WebPartContext** in RaceDataService causing authentication failures
- **Resolved UI layout issues** where filters were stacking vertically instead of displaying horizontally
- **Fixed missing search buttons** - Added Search and Clear buttons to the search bar
- **Added all 18 NSW greyhound tracks** to the track filter dropdown (previously only showed 4)
- **Normalized track names** - "Wentworth" now correctly maps to "Wentworth Park"

### Technical Improvements
- Enhanced error handling in RaceDataService with proper empty response handling
- Added text parsing before JSON parsing to handle edge cases
- Improved context passing from RaceDataExplorer to service layer
- Added proper CSS classes for filter layout (filterBar, filterContent, filterSelect)
- Excluded test files from production builds to reduce TypeScript errors

## 📦 Installation Instructions

1. **Upload to SharePoint App Catalog:**
   ```
   - Navigate to your SharePoint App Catalog
   - Upload race-management-spfx.sppkg
   - Check "Make this solution available to all sites"
   - Click Deploy
   ```

2. **Add to Site:**
   ```
   - Go to your SharePoint site
   - Settings → Add an app
   - Select "GRNSW Race Management"
   ```

3. **Add Web Parts to Pages:**
   - Edit a page
   - Click the + button
   - Search for "Race" to find:
     - Race Data Explorer
     - Race Meetings Calendar

## 🎯 Web Parts Included

### Race Data Explorer
- **ID:** a8f7b2c1-4d5e-6a3b-9c8d-7e1f5b2a3c4d
- Comprehensive race data browsing with drill-down navigation
- Meeting → Race → Contestant hierarchy
- Global search functionality
- Export capabilities (CSV, Excel)

### Race Meetings Calendar  
- **ID:** f7e3a4b2-8c5d-4a6f-9d2c-7b1e5f3a8c9d
- Calendar view of race meetings
- Day/Week/Month views
- Authority and track filtering
- Color-coded by racing authority

## ⚙️ Configuration

No additional configuration required. The web parts will automatically connect to the Racing Data environment (https://racingdata.crm6.dynamics.com).

## 🔧 Technical Details

- **Framework:** SharePoint Framework 1.21.1
- **React:** 17.0.1
- **TypeScript:** 5.3.3
- **Node:** 22.14.0+
- **Build Warnings:** 11077 (all non-critical linting warnings)

## 📝 Version History

- **v1.4.1** - Bug fixes for data loading, UI layout, and track normalization
- **v1.4.0** - Added enterprise UI components and global search
- **v1.3.0** - Performance optimizations and virtual scrolling
- **v1.2.0** - Added export functionality
- **v1.1.0** - Added analytics and caching
- **v1.0.0** - Initial release

## 🏁 Tracks Now Available

All 18 NSW greyhound racing tracks are now properly included:
- Broken Hill, Bulli, Casino, Dapto, Dubbo
- Gosford, Goulburn, Grafton, Gunnedah
- Lithgow, Maitland, Nowra, Richmond
- Taree, Temora, The Gardens
- Wagga Wagga, Wentworth Park

## 📞 Support

For issues or questions, please contact the GRNSW Development Team or create an issue in the repository.