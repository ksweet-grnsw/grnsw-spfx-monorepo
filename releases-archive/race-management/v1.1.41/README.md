# Race Management SPFx Package - v1.1.41

## Release Date
December 12, 2024

## UI Improvements and Bug Fixes

This release includes multiple UI improvements and bug fixes based on user feedback.

### 🎨 UI Improvements

1. **Removed Test Data Button**
   - Removed the blue "Test Data" button from the filter bar as it's no longer needed
   - Injuries are now loading properly without debug tools

2. **Enhanced Injury Filter Layout**
   - Moved injury filters to a separate row below date filters for better organization
   - Increased checkbox sizes from 14px to 18px for better accessibility
   - Increased font sizes from 12px to 14px for better readability
   - Added more spacing between categories (16px gap)
   - Added padding around checkboxes for larger click areas
   - Added hover effects for better user feedback

3. **Removed Redundant Navigation**
   - Removed "Back to Meetings" and "Back to Races" buttons
   - Breadcrumb navigation provides all needed navigation functionality

4. **Medical Cross Icon**
   - Replaced warning symbols (⚠️) with proper CSS-based medical cross icons
   - Red cross for serious injuries
   - Orange cross for minor injuries
   - Consistent medical theming throughout

5. **Health Check Details Button**
   - Changed "View Details" from link style to proper button style
   - Blue background with white text for better visibility
   - Hover effects for better interactivity

### 🐛 Bug Fixes

1. **Fixed Injury Icon Click Functionality**
   - Medical cross icon in contestant table now properly opens health check details
   - Fixed `getLatestHealthCheckForGreyhound` to use `cra5e_injuryclassification ne null` instead of `cra5e_injured eq true`

2. **Fixed Injury Data Loading**
   - All injury-related queries now use classification field instead of unreliable injured boolean
   - Methods updated: `getMeetingsWithInjuries`, `getInjurySummaryForMeeting`, `getInjuriesForRace`, `hasInjuries`

### 📋 Enhanced Health Check Details

1. **Vet and Steward Comments**
   - Added prominent display of vet comments (from treatment information field)
   - Added steward comments fetched from associated race data
   - Shows "No ... recorded" when fields are empty for clarity
   - Automatically fetches race steward comments when viewing health checks

2. **Improved Information Display**
   - All comment fields are always visible, even when empty
   - Clear indication when data is not available
   - Better organization with section headers

### Technical Details

- **Version**: 1.1.41
- **Framework**: SharePoint Framework 1.21.1
- **React**: 17.0.1
- **TypeScript**: 5.3.3
- **Build Status**: Success with warnings (Enterprise UI utility warnings - safe to ignore)

### Breaking Changes
None - All changes are backwards compatible

### Known Issues
- Build includes warnings from Enterprise UI utilities (safe to ignore)
- Some CSS class warnings for non-camelCase classes (intentional for utility classes)

## Installation
1. Upload the .sppkg file to your SharePoint App Catalog
2. Deploy the solution (may need to update existing installation)
3. Refresh pages with Race Data Explorer web part

## What's New for Users
- Cleaner interface without debug buttons
- Better organized injury filters with improved spacing
- Proper medical icons instead of warning symbols
- Click medical cross in contestant table to see health check details
- View vet and steward comments in health check details
- Simplified navigation with breadcrumbs only

## Dependencies
- Requires access to Racing Data and Injury Data environments
- Azure AD authentication for both environments
- Steward comments are fetched from race data when available

---
Generated with SharePoint Framework Build Tools v3.19.0