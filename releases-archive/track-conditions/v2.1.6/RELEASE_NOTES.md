# Release Notes - v2.1.6

## Release Date
August 5, 2025

## New Features

### Wind Rose Visualization
- Added a new WindRose component in the Wind Analysis web part
- Professional wind rose visualization based on user-provided design
- Interactive time period selector (Day/Week/Month)
- Color-coded wind speed bins:
  - 0-3 km/h (Green)
  - 3-6 km/h (Light Green)
  - 6-10 km/h (Blue)
  - 10-13 km/h (Light Blue)
  - 13-16 km/h (Orange)
  - 16-32 km/h (Red)
  - >32 km/h (Black)
- SVG-based rendering with proper data binning
- Toggle between Current wind view and Wind Rose view

## Technical Details
- Wind data is binned by direction (8 cardinal directions) and speed
- Percentage-based visualization shows frequency distribution
- Built with React and TypeScript
- No external charting libraries required for wind rose

## Bug Fixes
- None in this release

## Breaking Changes
- None

## Notes
- Wind Rose feature requires existing wind data in the Dataverse Weather Data table
- The visualization updates based on the selected time period (Day/Week/Month)