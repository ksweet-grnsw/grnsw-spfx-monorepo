# Race Management SPFx Package - v1.1.39

## Release Date
December 12, 2024

## Bug Fixes and UI Improvements

### Fixed Issues from v1.1.38
1. **Injury Filter Data Loading**: Fixed issue where clicking "Show Injuries" showed no data
   - Added proper data refresh when toggling injury filter
   - Improved error handling and logging for debugging
   - Ensured categories are properly passed to API

2. **Checkbox Overflow**: Fixed injury category checkboxes overflowing the filter container
   - Reduced checkbox and label sizes
   - Added flex-wrap for better responsive layout
   - Shortened category labels (A, B, C, D, E instead of Cat A, etc.)

3. **Button Sizing**: Adjusted "Injuries" button to fit better in filter bar
   - Reduced padding and font size
   - Simplified button text (removed "Showing")
   - Better spacing and alignment

### UI Improvements
- **Compact Design**: More compact injury filter section
  - Smaller fonts (12-13px)
  - Reduced spacing between elements
  - Max width constraint to prevent overflow

- **Better Visual Hierarchy**: 
  - Category labels now show just letters (A-E)
  - Serious categories (D & E) remain in bold red
  - Hover tooltips show full category names

- **Improved Responsiveness**:
  - Flex-wrap layout for category checkboxes
  - Better handling of small screen sizes

### Technical Fixes
- Added console logging for debugging injury data loading
- Fixed TypeScript compatibility issues with ES5 targets
- Improved error handling in getMeetingsWithInjuries method

## Features from v1.1.38
- Comprehensive injury filtering system
- Visual injury indicators on meetings and races
- Category-based filtering (Cat A through E)
- Default selection of serious injuries (Cat D & E)

## Known Issues
- Build includes warnings from Enterprise UI utilities (safe to ignore)
- Console logs are included for debugging - will be removed in next version

## Dependencies
- Requires access to Racing Data and Injury Data environments
- Azure AD authentication for both environments

## Installation
1. Upload the .sppkg file to your SharePoint App Catalog
2. Deploy the solution
3. Add the Race Data Explorer web part to your SharePoint pages
4. Check browser console if injury data doesn't load properly

## Debugging
If injury filter shows no data:
1. Open browser console (F12)
2. Click "Injuries" button
3. Select categories and click "Apply"
4. Check console for error messages and API responses
5. Ensure Health Check data exists in Injury Data environment

---
Generated with SharePoint Framework Build Tools v3.19.0