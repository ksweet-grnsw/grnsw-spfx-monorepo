# Greyhound Health SPFx v1.1.5 Release

**Release Date:** December 12, 2024  
**Package:** greyhound-health-spfx-v1.1.5-PROD.sppkg

## 🐕 Critical Bug Fix

### Bug Fixes
- **Fixed Euthanasia Count Showing 0**: Corrected the calculation logic for euthanasia metrics in both Safety Dashboard and Real-Time Safety Dashboard web parts
  - Now properly uses the `cra5e_injurystate` field with value "Euthanised" as the primary indicator
  - Implements secondary validation using stand down days (empty/zero values combined with determinedserious flag)
  - Updated both dashboard components to ensure consistent euthanasia counting across all tracks

### Technical Details
- **Updated Components:**
  - `SafetyDashboard.tsx`: Fixed euthanasia counting in processInjuryData function
  - `RealTimeSafetyDashboard.tsx`: Applied same fix for consistency
  - `RealTimeSafetyDashboardWebPart.ts`: Updated hardcoded version display from 1.1.4 to 1.1.5
  - `InjuryDataService.ts`: Updated getYearToDateFatalities method to use correct field
  - `Cra5eInjuryDataService.ts`: Added new getEuthanasiaRecords method and included standdowndays in select statements
  - `ICra5eInjuryData.ts`: Added missing cra5e_standdowndays field to interface

- **Build Information:**
  - Built with gulp bundle --ship and gulp package-solution --ship
  - Version properly synchronized in package.json and package-solution.json before building
  - 38 lint warnings (existing code style issues, not related to this fix)

## Installation Instructions

1. **Upload to SharePoint App Catalog:**
   - Navigate to your SharePoint App Catalog
   - Upload the `greyhound-health-spfx-v1.1.5-PROD.sppkg` file
   - Check "Make this solution available to all sites" if required
   - Deploy the solution

2. **Update Existing Sites:**
   - Go to each site where the web parts are installed
   - Navigate to Site Contents > Site Settings > Manage Apps
   - Find "Greyhound Health SPFx" and update to version 1.1.5

3. **Verify the Fix:**
   - Add or refresh the Safety Dashboard web part
   - Check that euthanasia counts now show actual numbers instead of 0
   - Verify counts match your expected data from Dataverse

## Configuration
No configuration changes required. The fix automatically applies to all existing instances of the Safety Dashboard and Real-Time Safety Dashboard web parts.

## Known Issues
- Lint warnings exist in the codebase but do not affect functionality
- These will be addressed in a future code quality improvement release

## Support
For issues or questions about this release, please contact the GRNSW Development Team.