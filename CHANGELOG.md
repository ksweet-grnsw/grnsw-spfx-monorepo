# Changelog

All notable changes to this monorepo project will be documented in this file.

## [Unreleased]

### Added
- Monorepo structure with npm workspaces
- Four separate packages:
  - `@grnsw/shared` - Common services and utilities
  - `@grnsw/track-conditions-spfx` - Track conditions and weather monitoring
  - `@grnsw/race-management-spfx` - Race management web parts
  - `@grnsw/greyhound-health-spfx` - Health tracking web parts
  - `@grnsw/gap-spfx` - Greyhound Adoption Program web parts
- Versioning and release management system
- Comprehensive development documentation
- Automated release script

### Changed
- Migrated from single package (`full-weather-data-spfx`) to monorepo structure
- Renamed `weather-spfx` to `track-conditions-spfx` for clarity
- Updated race meetings calendar UI (v1.8.0):
  - Month view now shows colored rectangles with track names
  - Replaced small dots with more informative rectangles
  - Improved stacking for multiple meetings per day

### Technical Details
- SharePoint Framework v1.21.1
- React 17 with TypeScript
- Node.js 22.14.0+ required
- Integrated with Microsoft Dataverse for data storage

## Package Versions

### @grnsw/shared - v1.0.0
- Initial release with base services
- AuthService for AAD authentication
- BaseDataverseService for CRUD operations
- Logger and ErrorHandler utilities

### @grnsw/track-conditions-spfx - v2.0.0
- Renamed from weather-spfx
- Contains all weather monitoring web parts
- No functional changes from previous version

### @grnsw/race-management-spfx - v1.0.0
- Extracted from full-weather-data-spfx
- Updated race meetings calendar UI
- Prepared for additional race management features

### @grnsw/greyhound-health-spfx - v1.0.0
- Initial package structure
- Ready for health tracking web parts development

### @grnsw/gap-spfx - v1.0.0
- Initial package structure
- Models and services for adoption management
- Ready for GAP web parts development

## Migration Notes

To migrate from `full-weather-data-spfx` to the new monorepo structure:
1. See `MIGRATION.md` for detailed instructions
2. Deploy new packages separately to SharePoint App Catalog
3. Update existing sites to use new packages
4. Remove old package after successful migration

## Previous History

For changes prior to the monorepo migration, see the original repository:
https://github.com/ksweet-grnsw/full-weather-data-spfx