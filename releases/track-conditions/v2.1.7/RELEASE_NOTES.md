# Release Notes - v2.1.7

## Release Date
August 6, 2025

## Bug Fixes

### Wind Rose Visualization
- Removed redundant "Wind Rose" title and track name from the component
- Fixed wind data scaling issue where wedges extended beyond circle boundaries
- Updated period selector buttons to match existing button styles
- Removed unnecessary close button
- Improved overall visual consistency with other web parts

## Technical Details
- Adjusted radius calculations to ensure wind data stays within the 50-100 pixel radius
- Updated SCSS to use consistent button styling from the parent component
- Cleaned up unnecessary header elements
- Added radius clamping to prevent overflow

## Breaking Changes
- None

## Notes
- This is a patch release that improves the Wind Rose visualization introduced in v2.1.6
- No functional changes, only UI/UX improvements