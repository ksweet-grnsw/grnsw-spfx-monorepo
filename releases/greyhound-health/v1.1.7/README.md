# Greyhound Health Dashboard - Release v1.1.7

## Release Date
January 8, 2025

## Release Type
Production - Bug Fix

## Version Information
- Version: 1.1.7
- Package: greyhound-health-spfx.sppkg
- Build Type: Production (--ship flag used)

## Critical Bug Fix

### Fixed: Euthanasia Count Display Issue
- **Problem**: Dashboard was incorrectly showing 0 euthanasias for all tracks
- **Root Cause**: The code was checking the wrong field (`cra5e_determinedserious`) instead of the correct `cra5e_injurystate` field
- **Discovery**: Through debug logging in v1.1.6, discovered the field value is "Euthanased" (spelled with 'a', not 'i')

### Implementation Details

#### Primary Detection Logic
The system now correctly identifies euthanasia cases using:
1. **Primary Check**: `cra5e_injurystate` field with value "Euthanased"
2. **Secondary Validation**: `cra5e_standdowndays` field (null/0 values often indicate euthanasia)

#### Code Changes
Updated euthanasia detection logic in three key files:
- `SafetyDashboard.tsx` (lines 93-110)
- `RealTimeSafetyDashboard.tsx` (lines 99-110, 161-172)  
- `InjuryDataService.ts` (line 105)

#### Field Mapping Discovered
- **Injury State Values**: "Injured" or "Euthanased" (note spelling with 'a')
- **Stand Down Days Values**: 60, 90, or null/empty
- **Correlation**: Empty stand down days typically correlate with euthanasia cases

## Technical Details

### Build Configuration
- SharePoint Framework: 1.21.1
- Node Version: 22.17.1
- Build Tools: 3.19.0
- TypeScript: 5.3.3

### Build Warnings
38 linting warnings (non-critical) related to:
- TypeScript any types
- Null usage deprecation
- These do not affect functionality

## Installation Instructions

1. **Upload to App Catalog**
   - Navigate to your SharePoint App Catalog
   - Upload `greyhound-health-spfx.sppkg`
   - Deploy to all sites when prompted

2. **Clear SharePoint Cache**
   - Due to aggressive caching, you may need to:
   - Delete the old version first
   - Wait 15-30 minutes for CDN propagation
   - Use Ctrl+F5 to force refresh

3. **Verify Version**
   - After deployment, check web part properties
   - Should display "Version: 1.1.7" in the About section

## Testing Validation

### Test Results from v1.1.6 Debug Version
- Total injuries analyzed: 128
- Euthanasias correctly identified: 5
- Field validation confirmed: "Euthanased" spelling verified
- Stand down days correlation validated

### Key Metrics Now Displaying Correctly
- Total Injuries: ✓
- Euthanasia Cases: ✓ (Fixed - was showing 0, now shows actual count)
- Fatality Rate: ✓ (Calculated correctly based on euthanasia count)
- 90+ Day Injuries: ✓
- 60-Day Injuries: ✓

## Web Parts Included

### 1. Safety Dashboard (ID: e8f5a2b1-7c3d-4a6f-9b2e-1d4c8e9f5a3b)
- Comprehensive injury tracking and analytics
- Track-specific filtering
- Visual charts for injury patterns
- Corrected euthanasia counting

### 2. Real-Time Safety Dashboard (ID: c27db737-dc69-469a-9093-e6c980db4d48)
- Live injury monitoring
- Automatic refresh capability
- Multi-track overview
- Individual track details
- Corrected euthanasia counting

## Configuration

### Web Part Properties
- **Injury Target Per Month**: Default 10 (configurable)
- **Refresh Interval**: Default 900000ms (15 minutes)
- **Default Track**: Configurable per deployment
- **Selected Track**: User-selectable from dropdown

## Support

For issues or questions, contact the GRNSW Development Team.

## Change Log

### v1.1.7 (Current)
- Fixed euthanasia count display (was showing 0)
- Corrected field spelling to "Euthanased"
- Removed debug logging from v1.1.6
- Production-ready build

### v1.1.6
- Added debug logging to identify field values
- Discovered correct spelling of "Euthanased"

### v1.1.5
- Initial attempt to fix euthanasia counting
- Used incorrect spelling "Euthanised"

---
*Generated for Greyhound Racing NSW*