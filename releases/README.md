# Release Artifacts

This directory contains the built SharePoint package files (.sppkg) for each package in the monorepo.

## Structure

```
releases/
├── track-conditions/     # Track conditions & weather monitoring packages
├── race-management/      # Race management packages
├── greyhound-health/     # Health tracking packages
└── gap/                  # Greyhound Adoption Program packages
```

## File Naming Convention

Files are named as: `[package-name]-[version].sppkg`

Example: `track-conditions-spfx-2.1.0.sppkg`

## Latest Releases

### Track Conditions
- Latest: -
- Previous: -

### Race Management  
- Latest: -
- Previous: -

### Greyhound Health
- Latest: -
- Previous: -

### GAP (Greyhound Adoption Program)
- Latest: -
- Previous: -

## Deployment Instructions

1. Navigate to your SharePoint App Catalog
2. Upload the desired `.sppkg` file
3. Check "Make this solution available to all sites"
4. Deploy the solution
5. Add the web parts to your sites

## Version History

See individual package CHANGELOG.md files for detailed version history.

## Notes

- These files are built artifacts and should not be edited directly
- Always build from source using `npm run package-solution -- --ship`
- Ensure version numbers match between package.json and package-solution.json