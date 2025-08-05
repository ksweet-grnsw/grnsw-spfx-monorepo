# Versioning and Release Strategy

## Overview

This monorepo uses independent versioning for each package, allowing them to be released separately based on their individual changes.

## Version Locations

### 1. Package Versions
Each package maintains its own version in its `package.json`:
- `packages/track-conditions-spfx/package.json`
- `packages/race-management-spfx/package.json`
- `packages/greyhound-health-spfx/package.json`
- `packages/gap-spfx/package.json`
- `packages/shared/package.json`

### 2. SharePoint Solution Versions
Each SPFx package has its solution version in:
- `packages/[package-name]/config/package-solution.json`

### 3. Release Artifacts
Built `.sppkg` files are stored in:
```
releases/
├── track-conditions/
│   ├── track-conditions-spfx-2.0.0.sppkg
│   └── track-conditions-spfx-2.1.0.sppkg
├── race-management/
│   ├── race-management-spfx-1.0.0.sppkg
│   └── race-management-spfx-1.1.0.sppkg
├── greyhound-health/
│   └── greyhound-health-spfx-1.0.0.sppkg
└── gap/
    └── gap-spfx-1.0.0.sppkg
```

## Versioning Rules

### Semantic Versioning
We follow semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Package Dependencies
- When updating `@grnsw/shared`, consider if dependent packages need version bumps
- Use exact versions for internal dependencies to ensure consistency

## Release Process

### 1. Update Version Numbers
```bash
# For a specific package
cd packages/track-conditions-spfx
npm version minor  # or major/patch
```

### 2. Update SharePoint Solution Version
Edit `config/package-solution.json`:
```json
{
  "solution": {
    "version": "2.1.0.0"
  }
}
```

### 3. Build and Package
```bash
# From package directory
npm run build
npm run package-solution -- --ship
```

### 4. Copy to Releases
```bash
# Copy the .sppkg to releases folder
cp sharepoint/solution/*.sppkg ../../releases/track-conditions/
```

### 5. Git Tag
```bash
# Tag the release
git tag track-conditions-v2.1.0
git tag -a track-conditions-v2.1.0 -m "Track conditions v2.1.0: Added new features"
```

### 6. GitHub Release
Create a GitHub release with:
- Tag: `track-conditions-v2.1.0`
- Title: `Track Conditions v2.1.0`
- Attach the `.sppkg` file
- Include changelog

## Version Tracking

### Current Versions
| Package | Current Version | Last Release Date |
|---------|----------------|-------------------|
| @grnsw/shared | 1.0.0 | - |
| @grnsw/track-conditions-spfx | 2.0.0 | - |
| @grnsw/race-management-spfx | 1.0.0 | - |
| @grnsw/greyhound-health-spfx | 1.0.0 | - |
| @grnsw/gap-spfx | 1.0.0 | - |

## Changelog Management

Each package maintains its own `CHANGELOG.md`:
- `packages/track-conditions-spfx/CHANGELOG.md`
- `packages/race-management-spfx/CHANGELOG.md`
- `packages/greyhound-health-spfx/CHANGELOG.md`
- `packages/gap-spfx/CHANGELOG.md`
- `packages/shared/CHANGELOG.md`

## Automated Releases (Future)

Consider implementing:
1. Changesets for version management
2. GitHub Actions for automated builds
3. Automatic changelog generation
4. Release automation with proper tagging