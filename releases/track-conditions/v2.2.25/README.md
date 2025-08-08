# Track Conditions SPFx - Release v2.2.25

## Release Date
January 8, 2025

## Release Type
UI Enhancement

## Changes in This Release

### Visual Improvements to Track Conditions Analysis

#### 1. Dynamic Color System for Safety Metrics (from v2.2.24)
Modified the Track Safety and Visibility circular gauges to use a dynamic red-amber-green warning system:
- **Green Zone (70-100%)**: Safe conditions - displayed in green (#4CAF50)
- **Amber Zone (50-69%)**: Caution required - displayed in amber/orange (#FF9800)  
- **Red Zone (0-49%)**: Warning/dangerous conditions - displayed in red (#F44336)

#### 2. Reduced Percentage Text Size (NEW in v2.2.25)
- Fixed issue where percentage text was hitting the edges of the circular gauges
- Reduced font size from default to 14px for better visual spacing
- Text now fits comfortably within the circle boundaries

### Technical Implementation
- Added inline style `fontSize: '14px'` to the SVG text element
- Maintains readability while preventing text overflow
- Applied to both Track Safety and Visibility gauges

## Files Modified
- `src/webparts/trackConditions/components/TrackConditions.tsx`

## Installation Instructions

1. Upload `track-conditions-spfx.sppkg` to your SharePoint App Catalog
2. If v2.2.24 is installed, delete it first before uploading v2.2.25
3. Deploy to all sites when prompted
4. Clear browser cache if changes don't appear immediately (Ctrl+F5)

## Version Information
- Version: 2.2.25
- SharePoint Framework: 1.21.1
- Node Version: 22.17.1
- Build Type: Production (--ship flag used)

## Visual Changes Summary

### Before (v2.2.23 and earlier)
- Static colors: Track Safety (green), Visibility (blue)
- Large percentage text that could touch circle edges

### After (v2.2.25)
- Dynamic colors based on percentage values
- Smaller, properly sized percentage text (14px)
- Clear visual warnings through color coding

## Color Thresholds

### Track Safety Score
- **70-100% (Green)**: Optimal track conditions
- **50-69% (Amber)**: Acceptable but monitor closely
- **0-49% (Red)**: Poor conditions, high injury risk

### Visibility Score  
- **70-100% (Green)**: Excellent visibility
- **50-69% (Amber)**: Moderate visibility
- **0-49% (Red)**: Poor visibility

## Testing Notes
- Verify percentage text no longer touches circle edges
- Confirm colors change appropriately with different weather conditions
- Test across different screen sizes and zoom levels

## Known Issues
- Build contains 59 linting warnings (non-critical)
- These warnings do not affect functionality

## Support
For issues or questions, contact the GRNSW Development Team.

---
*Generated for Greyhound Racing NSW*