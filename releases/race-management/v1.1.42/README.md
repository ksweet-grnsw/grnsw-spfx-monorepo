# Race Management SPFx Package - v1.1.42

## Release Date
December 16, 2024

## Final UI Refinements

This release includes final UI refinements based on user feedback, replacing the CSS medical cross with a simpler, cleaner design.

### 🎨 UI Improvements

1. **Simplified Injury Indicators**
   - Replaced CSS-based medical cross with simple bold plus signs (+)
   - Red plus sign for serious injuries (Cat A, B, C)
   - Orange plus sign for minor injuries (Cat D, E)
   - Cleaner, more modern appearance
   - Better cross-browser compatibility

2. **Orange Injuries Button**
   - Changed "Show Injuries" button from default blue to orange (#ff9800)
   - Provides better visual distinction for injury-related functionality
   - Darker orange on hover (#e68900) for better interactivity
   - Active state uses even darker orange (#ff6600)

### 📦 Package Contents

- **File**: race-management-spfx.sppkg
- **Size**: ~1.2 MB
- **Version**: 1.1.42
- **Web Part**: Race Data Explorer

### Technical Details

- **Version**: 1.1.42
- **Framework**: SharePoint Framework 1.21.1
- **React**: 17.0.1
- **TypeScript**: 5.3.3
- **Node**: 22.14.0
- **Build Status**: Success with warnings (Enterprise UI utility warnings - safe to ignore)

### What's Changed from v1.1.41

- Removed CSS-based medical cross design
- Implemented simple bold plus sign (font-size: 18px, font-weight: bold)
- Changed injuries button color from blue to orange
- No functional changes - purely visual improvements

### Breaking Changes
None - All changes are backwards compatible

### Known Issues
- Build includes warnings from Enterprise UI utilities (safe to ignore)
- Some CSS class warnings for non-camelCase classes (intentional for utility classes)

## Installation
1. Upload the .sppkg file to your SharePoint App Catalog
2. Deploy the solution (may need to update existing installation)
3. Refresh pages with Race Data Explorer web part
4. Clear browser cache if old icons persist (Ctrl+F5)

## What's New for Users
- Cleaner, simpler injury indicators using plus signs instead of complex CSS shapes
- Orange "Show Injuries" button for better visual hierarchy
- All functionality from v1.1.41 remains unchanged

## Feature Summary (Cumulative)
- **Race Data Explorer**: Comprehensive drill-down navigation through meetings → races → contestants
- **Injury Tracking**: Filter by injury categories (Cat A-E) with visual indicators
- **Health Check Details**: View vet comments and steward comments in modal dialogs
- **Smart Search**: Global search across all racing data
- **Breadcrumb Navigation**: Easy navigation between data levels
- **Responsive Design**: Works on desktop and tablet devices

## Dependencies
- Requires access to Racing Data and Injury Data environments
- Azure AD authentication for both environments
- Steward comments are fetched from race data when available

## Version History
- v1.1.42 - Simplified injury icons and orange button styling
- v1.1.41 - Enhanced health check details with vet/steward comments
- v1.1.40 - Fixed injury icon click functionality
- v1.1.39 - Improved injury filter layout and removed debug buttons
- v1.1.38 - Initial injury tracking implementation

---
Generated with SharePoint Framework Build Tools v3.19.0