# Race Management SPFx Package - v1.1.35

## Release Date
December 12, 2024

## New Features
### Enhanced Race Data Explorer with Greyhound Health Integration
- **Greyhound Profile Integration**: Added ability to view detailed greyhound information directly from the contestants table
- **Health Check Tracking**: Integrated health check data from the Injury Data environment to track greyhound injuries
- **Visual Injury Indicators**: Red cross (✕) button appears for injured greyhounds, providing quick access to injury details
- **Multi-Environment Support**: Web part now connects to both Racing Data and Injury Data Dataverse environments

### UI Improvements
- **Three-Button Layout**: Contestants table now shows up to 3 action buttons:
  - Details button (always shown) - View contestant race information
  - Greyhound button (when match found) - View greyhound profile and breeding information
  - Red cross button (when injuries exist) - Quick access to latest injury details
- **Enhanced Modals**: 
  - New Greyhound Details modal showing comprehensive profile information
  - New Health Check modal displaying injury classifications and treatment details
  - Removed redundant navigation button from contestant modal

## Bug Fixes
- Improved data loading performance with async greyhound matching
- Enhanced error handling for cross-environment API calls
- Fixed button width in Actions column to accommodate multiple buttons

## Technical Details
- **Version**: 1.1.35
- **Build Type**: Production (--ship flag)
- **Framework**: SharePoint Framework 1.21.1
- **React**: 17.0.1
- **TypeScript**: 5.3.3

## Installation
1. Upload the .sppkg file to your SharePoint App Catalog
2. Deploy the solution
3. Add the Race Data Explorer web part to your SharePoint pages
4. Configure the web part properties as needed

## Configuration
- The web part will automatically attempt to match contestants with greyhounds in the Injury Data environment
- Health check data is loaded on-demand when users interact with the interface
- All features work gracefully with partial or missing data

## Breaking Changes
None

## Known Issues
- Build includes warnings from Enterprise UI utility classes (these can be safely ignored)

## Dependencies
- Requires access to both Racing Data and Injury Data Dataverse environments
- Azure AD authentication must be configured for both environments

---
Generated with SharePoint Framework Build Tools v3.19.0