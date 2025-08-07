# Greyhound Health SPFx v1.0.0

**Release Date:** January 7, 2025

## New Features

### Real-Time Safety Dashboard Web Part
- **Executive Safety Overview**: High-level dashboard for safety officers and executives
- **Dual View System**: 
  - All Tracks Overview - Aggregate statistics across all tracks
  - Track Details - Individual track statistics with drill-down capability
- **Key Metrics**:
  - Current month injury count vs configurable target
  - Year-to-date fatality tracking
  - Days since last serious injury counter
  - Top 3 highest-risk tracks identification
  - Recent injuries list for selected track
- **Traffic Light Status System**: Green/Yellow/Red safety indicators
- **Auto-refresh**: Configurable refresh interval (default 15 minutes)
- **Track Selection**: Persistent track selection with dropdown selector

### Schema Explorer Web Part
- Utility web part for exploring Dataverse table schemas
- Useful for development and debugging

## Technical Details

- **SPFx Version:** 1.21.1
- **Node Version:** 22.17.1
- **Build Type:** DEBUG (for testing)
- **Package Name:** greyhound-health-spfx.sppkg

## Installation Instructions

1. Upload `greyhound-health-spfx.sppkg` to your SharePoint App Catalog
2. Deploy the solution
3. Add the app to your SharePoint site
4. Add the "Real-Time Safety Dashboard" web part to any page
5. Configure the web part properties:
   - Monthly Injury Target (default: 10)
   - Refresh Interval in minutes (default: 15)
   - Default Track (optional)

## Configuration

The web part connects to Microsoft Dataverse table `cra5e_injurydata` and requires:
- Proper authentication configured for Dataverse access
- The injury data table populated with data

## Web Parts Included

1. **Real-Time Safety Dashboard** (ID: c27db737-dc69-469a-9093-e6c980db4d48)
   - Group: GRNSW Tools
   - Icon: Health

2. **Schema Explorer** (ID: e8f5a2b1-7c3d-4a6f-9b2e-1d4c8e9f5a3b)
   - Group: GRNSW Tools
   - Utility for developers

## Known Issues

- Some lint warnings exist but do not affect functionality
- Localization files for Schema Explorer are missing (non-critical)

## Next Steps

For production deployment:
1. Build with `gulp bundle --ship && gulp package-solution --ship`
2. Test thoroughly in a development environment first
3. Ensure Dataverse connectivity is properly configured