# Race Management Web Parts v1.1.33

**Release Date:** August 14, 2025

## New Features

### Medal-Style Placement Badges
- Added gold, silver, and bronze circular badges for 1st, 2nd, and 3rd place finishers
- Metallic gradient backgrounds with distinct border colors
- Implemented across both contestants table and modal views
- Provides instant visual recognition of top performers

## Previous Updates (v1.1.32)
- Redesigned breadcrumb navigation as button-style boxes
- Created reusable enterprise UI breadcrumb component
- Updated "Back to" navigation buttons with improved styling

## Previous Updates (v1.1.31)
- NSW-compliant rug colors with exact pattern matching
- Custom PNG icons for details, races, and contestants
- GRNSW logo integration in modal headers
- Removed internal ID fields for cleaner UI

## Installation Instructions

1. **Upload to SharePoint App Catalog:**
   - Navigate to your SharePoint App Catalog
   - Upload `race-management-spfx.sppkg`
   - Check "Make this solution available to all sites"
   - Click "Deploy"

2. **Add to SharePoint Site:**
   - Go to your SharePoint site
   - Site Settings → Add an app
   - Find "grnsw-race-management-spfx-client-side-solution"
   - Click "Add"

3. **Add Web Parts to Pages:**
   - Edit a SharePoint page
   - Click the + icon to add a web part
   - Find web parts under "GRNSW Tools" category
   - Select "Race Data Explorer" or "Race Meetings Calendar"

## Technical Details

- **Build Version:** 1.1.33
- **SPFx Version:** 1.21.1
- **Node Version:** 22.17.1
- **Build Date:** August 14, 2025
- **Build Flags:** --ship (production)

## Configuration

The web parts connect to Dataverse API endpoints:
- **Racing Data Environment:** https://racingdata.crm6.dynamics.com/api/data/v9.1

## Features Included

- Race Data Explorer with drill-down navigation
- NSW-compliant rug color badges
- Medal-style placement indicators
- Custom icons and GRNSW branding
- Enterprise UI component library
- Responsive design with mobile support
- Advanced filtering and search capabilities

## Known Issues

- Build process shows linting warnings (cosmetic only, does not affect functionality)
- CSS module naming warnings for enterprise UI components

## Support

For issues or questions, contact the GRNSW Development Team.

---
🏆 Enhanced with medal badges for top finishers