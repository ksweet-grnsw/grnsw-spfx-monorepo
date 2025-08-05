# GRNSW SPFx Releases

This directory contains production-ready SharePoint packages (.sppkg files) for all GRNSW solutions.

## Directory Structure

Each package has its own folder with version subdirectories:

```
releases/
├── track-conditions/
│   └── v2.1.0/
│       ├── RELEASE_NOTES.md
│       ├── track-conditions-spfx-v2.1.0.sppkg (DEBUG)
│       └── track-conditions-spfx-v2.1.0-PROD.sppkg (PRODUCTION)
├── race-management/
│   └── v1.0.0/
│       ├── RELEASE_NOTES.md
│       └── race-management-spfx-v1.0.0.sppkg
├── greyhound-health/
│   └── v1.0.0/
│       ├── RELEASE_NOTES.md
│       └── greyhound-health-spfx-v1.0.0.sppkg
└── gap/
    └── v1.0.0/
        ├── RELEASE_NOTES.md
        └── gap-spfx-v1.0.0.sppkg
```

## Latest Versions

- **Track Conditions**: v2.1.0 (Aug 5, 2025)
- **Race Management**: v1.0.0 (TBD)
- **Greyhound Health**: v1.0.0 (TBD)
- **GAP**: v1.0.0 (TBD)

## Deployment Instructions

1. Navigate to the package and version you want to deploy
2. Use the PRODUCTION build (marked with -PROD) for deployment
3. Upload the .sppkg file to your SharePoint App Catalog
4. Deploy the app in the App Catalog
5. Update the app on sites where it's already installed

## Version Naming Convention

- **vX.Y.Z** - Standard semantic versioning
  - X: Major version (breaking changes)
  - Y: Minor version (new features)
  - Z: Patch version (bug fixes)
- **-PROD** suffix indicates production build with minified code
- **No suffix** indicates debug build (not for production use)

## Important Notes

- Always check the RELEASE_NOTES.md in each version folder for details
- Production builds include all dependencies bundled
- Debug builds require SharePoint CDN or local hosting