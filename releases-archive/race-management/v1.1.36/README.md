# Race Management SPFx Package - v1.1.36

## Release Date
December 12, 2024

## New Features
### Parent Greyhound Navigation
- **Clickable Sire/Dam Links**: When viewing greyhound details, if the sire or dam exists in the database, their names become clickable buttons
- **Smart Name Display**: Instead of showing ID numbers, the modal now displays the actual greyhound names for sire and dam when found
- **Navigation History**: Added back button to return to previous greyhound when navigating through family trees
- **Unlimited Genealogy Depth**: Users can navigate through multiple generations of greyhounds (parents, grandparents, etc.)

## Improvements from v1.1.35
- **Better Data Display**: Sire and Dam fields now show greyhound names instead of IDs when parent data is available
- **Enhanced Navigation**: Back button shows the name of the previous greyhound for clarity
- **Seamless Parent Exploration**: Users can explore entire family trees without losing context

## Features Included from Previous Versions
- Greyhound profile integration with breeding information
- Health check tracking with injury indicators
- Three-button layout in contestants table (Details, Greyhound, Injury)
- Multi-environment support for Racing and Injury Data

## Technical Details
- **Version**: 1.1.36
- **Build Type**: Production (--ship flag)
- **Framework**: SharePoint Framework 1.21.1
- **React**: 17.0.1
- **TypeScript**: 5.3.3

## Installation
1. Upload the .sppkg file to your SharePoint App Catalog
2. Deploy the solution
3. Add the Race Data Explorer web part to your SharePoint pages
4. Configure the web part properties as needed

## How Parent Navigation Works
- When viewing a greyhound's details, the system automatically checks if the sire and dam exist in the database
- If found, their names are displayed as clickable links with an arrow (→) indicator
- Clicking a parent's name opens their greyhound details modal
- A back button appears allowing users to return to the previous greyhound
- Users can navigate through multiple generations seamlessly

## Breaking Changes
None

## Known Issues
- Build includes warnings from Enterprise UI utility classes (these can be safely ignored)

## Dependencies
- Requires access to both Racing Data and Injury Data Dataverse environments
- Azure AD authentication must be configured for both environments

---
Generated with SharePoint Framework Build Tools v3.19.0