# Release Notes - v1.0.1

## Release Date
August 5, 2025

## Bug Fixes

### Race Meetings Web Part
- Fixed filter persistence: Authority and Track selections are now saved and restored when the web part is refreshed
- Added `updateFilters` callback method to synchronize component state with web part properties
- Filter selections now persist across page reloads and browser sessions

## Technical Details
- Updated RaceMeetingsWebPart to include filter persistence properties
- Added callback mechanism to update web part properties when filters change
- Fixed import issues with Logger utility

## Breaking Changes
- None

## Notes
- This is a patch release that fixes the filter persistence issue reported in v1.0.0
- No changes to data structure or API calls