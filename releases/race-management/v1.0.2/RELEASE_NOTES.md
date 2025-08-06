# Release Notes - v1.0.2

## Release Date
August 6, 2025

## Changes

### Race Meetings Web Part
- Removed duplicate "Race Meetings Calendar (Track Filtered)" variant from the web part gallery
- Now only one Race Meetings Calendar web part is available, simplifying the user experience
- The single web part still supports all filtering capabilities

## Technical Details
- Updated RaceMeetingsWebPart.manifest.json to remove the second preconfiguredEntries entry
- No functional changes to the web part itself

## Breaking Changes
- If you have existing pages using "Race Meetings Calendar (Track Filtered)", you'll need to replace it with the standard "Race Meetings Calendar" web part

## Notes
- This release simplifies the web part selection by removing the confusing duplicate entry
- All filtering functionality remains available in the single Race Meetings Calendar web part