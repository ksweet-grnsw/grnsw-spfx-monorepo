# Changelog - Track Conditions SPFx

## [2.1.0] - 2025-08-05

### Fixed
- **Track Conditions Analysis - Circular Progress Indicators**: Fixed the circular gauge visualization to correctly display progress. Now shows green for the completed portion (e.g., 100% = full green circle, 25% = quarter green circle)
- **Wind Direction Display**: Implemented proper conversion from degrees to cardinal directions (N, NE, E, SE, S, SW, W, NW, etc.) based on API specification
  - Track Conditions component now shows: "NE (45°)" format
  - Wind Analysis component now shows: "NE (45°)" format
  - Uses accurate conversion ranges as specified by the API developer

### Added
- New `windUtils` utility module for consistent wind direction conversion across components
- Both cardinal direction and degrees are displayed for better clarity

### Technical Details
- Fixed strokeDashoffset calculation in renderGauge method
- Removed unnecessary text rotation in gauge percentage display
- Implemented precise cardinal direction boundaries per API spec

## [2.0.0] - 2025-08-04

### Changed
- Renamed package from `weather-spfx` to `track-conditions-spfx`
- Migrated to monorepo structure

### Features
- Weather Dashboard
- Temperature Analysis  
- Rainfall Tracking
- Wind Analysis
- Track Conditions Monitoring

## [1.x.x] - Previous versions

See original repository for version history prior to monorepo migration.