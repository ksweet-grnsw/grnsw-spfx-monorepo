# Race Management SPFx Package - v1.1.37

## Release Date
December 12, 2024

## New Features
### Enhanced Search Capabilities
- **Search by Salesforce ID**: Users can now search for meetings, races, and contestants using their Salesforce IDs
- **Search by Microchip Number**: Added ability to search for greyhounds by their microchip number
- **Greyhound Search Results**: Search now includes results from the Greyhound table in the Injury Data environment
- **Multi-field Search**: The search bar now searches across:
  - Greyhound names, microchip numbers, and Salesforce IDs
  - Meeting Salesforce IDs (cr4cc_salesforceid)
  - Race Salesforce IDs (cr616_sfraceid)
  - Contestant Salesforce IDs (cr616_sfcontestantid)

### Search Results Display
- **New Greyhounds Section**: Search results now display a dedicated Greyhounds section when matches are found
- **Greyhound Information Grid**: Shows Name, Microchip, Salesforce ID, Ear Brands, and Status
- **Direct Navigation**: Click on any greyhound result to view their detailed profile
- **Improved Search Placeholder**: Updated to indicate all searchable fields including IDs and microchip

## Improvements from v1.1.36
- **Broader Search Coverage**: Search now spans across both Racing Data and Injury Data environments
- **Better ID Tracking**: Salesforce ID search helps users track records across systems
- **Enhanced Data Discovery**: Microchip search allows finding greyhounds by their permanent ID

## Features Included from Previous Versions
- Parent greyhound navigation with name display
- Greyhound profile integration with breeding information
- Health check tracking with injury indicators
- Three-button layout in contestants table (Details, Greyhound, Injury)
- Multi-environment support for Racing and Injury Data
- Navigation history with back button

## Technical Details
- **Version**: 1.1.37
- **Build Type**: Production (--ship flag)
- **Framework**: SharePoint Framework 1.21.1
- **React**: 17.0.1
- **TypeScript**: 5.3.3

## Installation
1. Upload the .sppkg file to your SharePoint App Catalog
2. Deploy the solution
3. Add the Race Data Explorer web part to your SharePoint pages
4. Configure the web part properties as needed

## Search Functionality Details
### What You Can Search
- **Greyhound Names**: Partial match from the beginning
- **Trainer Names**: Partial match from the beginning
- **Owner Names**: Partial match from the beginning
- **Track Names**: Partial match from the beginning
- **Microchip Numbers**: Contains search (any part of the microchip)
- **Salesforce IDs**: Contains search across all entities
- **Race Names and Titles**: Partial match from the beginning

### Search Results Organization
Results are grouped by entity type:
1. **Meetings**: Shows track, date, authority, and meeting details
2. **Races**: Shows race number, name, distance, and grade
3. **Contestants**: Shows greyhound, trainer, owner, and placement
4. **Greyhounds**: Shows profile, microchip, IDs, and status

## Breaking Changes
None

## Known Issues
- Build includes warnings from Enterprise UI utility classes (these can be safely ignored)

## Dependencies
- Requires access to both Racing Data and Injury Data Dataverse environments
- Azure AD authentication must be configured for both environments

---
Generated with SharePoint Framework Build Tools v3.19.0