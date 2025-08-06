# Track Conditions SPFx v2.2.0 Release

**Release Date:** August 5, 2025

## New Features

### Historical Weather Pattern Analyzer Web Part 🎉
A comprehensive new web part that provides advanced analytics and insights into historical weather patterns across GRNSW tracks.

**Key Features:**
- **Optimal Conditions Score:** Real-time calculation and visualization of racing conditions (0-100 score)
- **Multi-Track Comparison:** Side-by-side comparison of up to 4 tracks with best track highlighting
- **Pattern Heatmap:** Hourly and daily pattern visualization showing optimal racing times
- **Volatility Monitor:** Real-time stability tracking with visual indicators and alerts
- **Predictive Insights:** Forward-looking predictions based on historical patterns with confidence levels

**Technical Implementation:**
- SVG-based circular gauge for optimal score visualization
- Chart.js integration for volatility trends
- Responsive design with mobile-friendly layouts
- Real-time data refresh every 5 minutes
- Support for all GRNSW tracks

## Bug Fixes

### Previous Release (v2.1.9) Issues Resolved:
- Fixed wind chill temperature conversion from Fahrenheit to Celsius
- Added default view properties for Rainfall and WindAnalysis web parts
- Fixed property persistence issues across all weather web parts

## Technical Details

### Build Information
- SPFx Version: 1.18.2
- Node Version: 22.17.1
- TypeScript: 4.7.4
- React: 17.0.2
- Build Warnings: 60 (consistent with previous releases - mostly null vs undefined from Dataverse API)

### New Dependencies
- Chart.js for data visualization in Historical Pattern Analyzer
- Additional TypeScript types for es2017.object support

### SCSS Improvements
- Converted problematic Fluent UI SCSS imports to standard CSS
- Improved build performance by removing external SCSS dependencies
- All components now use CSS modules with standard color values

## Installation Instructions

1. Upload the `track-conditions-spfx.sppkg` file to your SharePoint App Catalog
2. Deploy the solution (check "Make this solution available to all sites")
3. Add the new Historical Pattern Analyzer web part to any modern SharePoint page
4. Configure the web part properties:
   - Select tracks to analyze (up to 4)
   - Choose analysis period (24h, 7d, 30d)
   - Set refresh interval (1-10 minutes)

## Configuration

### Historical Pattern Analyzer Properties
- **Selected Tracks:** Multi-select dropdown for track selection
- **Analysis Period:** Timeframe for historical analysis
- **Refresh Interval:** Auto-refresh frequency in minutes
- **Show Volatility Alerts:** Toggle for volatility notifications
- **Display Mode:** Compact, Standard, or Detailed view

### Existing Web Parts
All existing web parts maintain backward compatibility with enhanced features:
- Default view settings now persist across sessions
- Improved error handling and data validation
- Enhanced accessibility features

## Known Issues
- Dataverse API continues to return null values which are preserved as per API contract
- Some TypeScript warnings remain due to external API constraints

## Support
For issues or questions, please contact the GRNSW Development Team.

---
*This release was built and tested in the GRNSW development environment*