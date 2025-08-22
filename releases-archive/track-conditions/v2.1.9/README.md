# Track Conditions SPFx v2.1.9 Release Notes

**Release Date:** August 5, 2025

## New Features

### Default View Properties
- **Rainfall Web Part**: Added configurable default views
  - Default view mode: Statistics or Chart
  - Default time period: Today, Week, or Month
  - Default chart type: Line or Bar
  - Added new preconfigured entry "Rainfall (Chart View)" that starts in chart mode

- **Wind Analysis Web Part**: Added configurable default views
  - Default view mode: Current Wind or Wind Rose
  - Default time period: Today, Week, or Month
  - Added new preconfigured entry "Wind Analysis (Wind Rose)" that starts with wind rose visualization

## Bug Fixes

### Wind Chill Temperature Conversion
- Fixed wind chill temperature displaying Fahrenheit values as Celsius
- Added proper conversion formula: `(°F - 32) × 5/9`
- Wind chill now correctly displays in Celsius

### Code Quality Improvements
- Fixed TypeScript type mismatch for ViewType ('windrose' → 'windRose')
- Maintained consistent naming conventions across components

## Technical Details

- Build warnings: 52 (unchanged from previous release)
- All high-priority deprecation warnings previously addressed
- Compatible with SharePoint Online and Teams

## Installation

Upload `track-conditions-spfx.sppkg` to your SharePoint App Catalog and update the existing app.

## Configuration

After installation, users can configure default views through the web part property pane:
- Select default view mode (stats/chart for Rainfall, current/windRose for Wind)
- Select default time period
- Select default chart type (Rainfall only)