# Claude Instructions for GRNSW SPFx Monorepo

## Project Overview
This is a SharePoint Framework (SPFx) monorepo containing weather tracking and race management web parts for Greyhound Racing NSW.

## Monorepo Structure
```
grnsw-spfx-monorepo/
├── packages/
│   ├── track-conditions-spfx/    # Weather tracking web parts (v2.1.0+)
│   ├── race-management/          # Race meeting calendar web parts (v1.0.0+)
│   ├── gap-spfx/                 # Greyhound Adoption Program web parts
│   ├── greyhound-health/         # Health and injury tracking web parts
│   └── shared/                   # Shared utilities and services
├── releases/                     # Production-ready .sppkg files
├── scripts/                      # Build and deployment scripts
└── shared-styles/               # Global SCSS variables
```

## Web Parts Catalog

### Track Conditions Package (6 web parts)
1. **Temperature Web Part** (ID: 52d1bd5b-0541-4da2-9c88-c20ddc4edbc4)
   - Current temperature with "feels like"
   - Time period selection (today/week/month)
   - Statistics and chart visualization

2. **Rainfall Web Part** (ID: a3f9e8b2-1c4d-4e6f-9b8a-5d7c3e2a1f9b)
   - Hourly, daily, monthly rainfall tracking
   - Statistical analysis (total, max, average, rain days)
   - Line and bar chart options

3. **Wind Analysis Web Part** (ID: c5f8a2d1-4e9b-4a3c-8f7d-2b6e9c5a3d1f)
   - Wind speed, direction, and gusts
   - Wind rose visualization
   - Cardinal direction conversion

4. **Track Conditions Analysis** (ID: da04608a-c229-4ba5-a755-177695dfb3b7)
   - Comprehensive track safety scoring
   - Surface condition assessment (Dry/Damp/Wet)
   - Grip level and visibility calculations
   - Race-specific alerts and recommendations

5. **Weather Dashboard** (ID: 9ee7883c-3ad1-45e5-a624-cf395903bf9e)
   - Live multi-station weather display
   - 181 data points from Dataverse
   - Station health monitoring (battery, solar)

6. **Historical Pattern Analyzer** (ID: b4a9c3e2-5d8f-4a7b-9c1e-3f2a8b7d4e5c)
   - Advanced optimal score calculations
   - Predictive insights and recovery time
   - Volatility monitoring and alerts

### Race Management Package (1 web part)
1. **Race Meetings Calendar** (ID: f7e3a4b2-8c5d-4a6f-9d2c-7b1e5f3a8c9d)
   - Calendar views (day/week/month)
   - Authority and track filtering
   - Color-coded racing authorities
   - Meeting detail panels

## Key Technologies and Dependencies
- **Framework:** SharePoint Framework (SPFx) 1.21.1
- **React:** 17.0.1
- **TypeScript:** 5.3.3
- **Charting:** Chart.js 4.5.0 with react-chartjs-2
- **Node:** 22.14.0+ (< 23.0.0)
- **UI:** Fluent UI React 8.106.4

## Build and Release Process
When creating releases, always:
1. Run `npm run build` in the package directory
2. Run `npm run lint` to check for issues
3. Run `npm run typecheck` if available
4. Create releases in `sharepoint/solution/` directory
5. Name releases with semantic versioning (e.g., v2.1.0)

## 🚨 CRITICAL VERSION SYNCHRONIZATION 🚨
**THIS IS THE #1 CAUSE OF SHAREPOINT DEPLOYMENT ISSUES - READ CAREFULLY!**

### Version Sync Requirements
SharePoint Framework REQUIRES perfect version synchronization or it WILL display wrong version numbers. This causes major deployment problems for the user.

**BEFORE ANY BUILD, YOU MUST:**
1. Run `npm run check-version` to verify synchronization
2. If versions are out of sync, run `npm run sync-version [version]` to fix them
3. NEVER proceed with a build if versions are not synchronized

### Version Files That MUST Match:
1. `package.json` → `"version": "x.y.z"` (e.g., "2.2.7")
2. `config/package-solution.json` → `"solution.version": "x.y.z.0"` (e.g., "2.2.7.0")
3. `config/package-solution.json` → `"features[0].version": "x.y.z.0"` (e.g., "2.2.7.0")

### Creating a New Release - MANDATORY STEPS:
```bash
# 1. ALWAYS sync versions first
cd packages/track-conditions-spfx
npm run sync-version 2.2.8  # Replace with your version

# 2. Verify sync was successful
npm run check-version

# 3. Only if verification passes, build
npm run build:prod

# 4. Create release folder and copy files
mkdir -p ../../releases/track-conditions/v2.2.8
cp sharepoint/solution/*.sppkg ../../releases/track-conditions/v2.2.8/
```

### Version Sync Scripts Available:
- `npm run check-version` - Checks if versions are synchronized (RUN BEFORE EVERY BUILD!)
- `npm run sync-version [version]` - Automatically synchronizes all version files
- `npm run build:prod` - Runs version check, then builds production package

### Common Version Sync Failures:
❌ **NEVER DO THIS:**
- Updating only package.json
- Updating only package-solution.json
- Using different version formats (2.2.7 vs 2.2.7.0)
- Building without running version check

✅ **ALWAYS DO THIS:**
- Use the sync-version script for ALL version changes
- Run check-version before EVERY build
- Use the same version number everywhere (with .0 suffix in package-solution.json)

IMPORTANT: Releases are stored at the monorepo root level, NOT in the package folder!

### Release Notes README.md Template
Always create a README.md in each release folder with:
- Release version and date
- New Features (with details)
- Bug Fixes (with specifics)
- Technical Details (build warnings, compatibility)
- Installation instructions
- Configuration instructions (if applicable)

Example structure:
```
grnsw-spfx-monorepo/
  releases/
    track-conditions/
      v2.1.0/
        track-conditions-spfx.sppkg
      v2.1.1/
        track-conditions-spfx.sppkg
      v2.1.9/
        track-conditions-spfx.sppkg
    race-management/
      v1.0.0/
        race-management.sppkg
```

## Code Standards
- Use TypeScript strict mode where possible
- Replace `null` with `undefined` in component state
- Use `.catch()` for promise error handling instead of `void` operator
- Always add explicit return types to functions
- Use `unknown` instead of `any` for error parameters
- Rename `.scss` files to `.module.scss` for CSS modules

## Testing
Before committing any changes:
- Ensure no TypeScript errors with `npm run build`
- Fix any ESLint warnings where possible
- Test that all web parts load correctly

## Common Commands
- Build track-conditions: `cd packages/track-conditions-spfx && npm run build`
- Build race-management: `cd packages/race-management && npm run build`
- Clean and rebuild: `npm run clean && npm run build`
- Create production package: `gulp package-solution --ship`
- Serve locally: `gulp serve`

## API Considerations
- The Dataverse API returns many `null` values that must be preserved
- Weather data timestamps are in Unix seconds (need *1000 for JS dates)
- Track names in API use spaces (e.g., "Wentworth Park")
- API fields are prefixed with cr8e9_

## Data Integration
- **Primary Source:** Microsoft Dataverse (formerly CDS)
- **Authentication:** Azure AD via AuthService
- **API Version:** v9.1
- **Tables:** cr8e9_iotenvironmentaldatas
- **Weather Station IDs:** Multiple stations reporting to Dataverse

## Known Issues
- Some IDataverseWeatherData fields must remain as `any | null` due to unpredictable API responses
- The monorepo structure requires careful path management for builds
- Build warnings about missing fast-serve configuration can be ignored

## Debugging and Troubleshooting
- If web part properties aren't persisting, check that property changes trigger re-renders
- For "includes is not a function" errors, ensure tsconfig.json includes 'es2015' in lib array
- If seeing duplicate web parts, check manifest.json for duplicate preconfiguredEntries

## Component Patterns
- For circular progress gauges: strokeDashoffset = circumference - (percentage / 100) * circumference
- Wind direction: Convert degrees to 16-point cardinal system using 22.5° segments
- Timestamps from API are Unix seconds - multiply by 1000 for JavaScript Date objects

## Git Commit Guidelines
- Never commit unless explicitly asked by the user
- Use descriptive commit messages focusing on what changed and why
- Include version number in commit messages for releases

## Property Persistence Pattern
When fixing property persistence in web parts:
1. Ensure property is defined in manifest.json
2. Add property to web part props interface
3. Pass property to React component
4. Update property via web part's property update callback
5. Trigger re-render when property changes

## Common Fixes Applied
- Floating promises: Add .catch() handlers
- Void operators: Replace with proper promise handling
- Variable declarations: Use const/let instead of var
- React components: Use self-closing tags for components without children
- Type safety: Replace any with unknown for error handling

## Code Modularity and Reusability

### Shared Services
- DataverseService is used across multiple web parts - keep API logic centralized
- Create shared services in `src/services/` for common functionality
- Export services through index.ts barrel files for clean imports

### Shared Components
- Common UI patterns (like circular gauges) should be extracted to shared components
- Place reusable components in `src/components/shared/`
- Example candidates for extraction:
  - CircularGauge component (used in track conditions)
  - PeriodSelector buttons (used in multiple web parts)
  - LoadingSpinner component
  - ErrorMessage component

### Shared Utilities
- Common calculations belong in `src/utils/`:
  - Wind direction conversion (degrees to cardinal)
  - Temperature conversions
  - Date/time formatting
  - Percentage calculations for gauges
  
### Style Patterns
- Extract common styles to shared SCSS modules:
  - Button styles (active states, hover effects)
  - Card layouts
  - Loading states
  - Error message styles
- Use CSS variables for consistent theming

### Configuration
- Extract magic numbers to constants:
  ```typescript
  // Instead of inline values
  const REFRESH_INTERVAL = 300000; // 5 minutes
  const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 45;
  const WIND_DIRECTION_SEGMENTS = 16;
  ```

### Inter-package Sharing
- Since this is a monorepo, consider creating a shared package for:
  - Common TypeScript interfaces (IWeatherData, ITrackInfo)
  - Shared utilities used across packages
  - Common React hooks (useWeatherData, useTrackSelection)

## Package-Specific Information

### Track Conditions SPFx Package
- **Location:** `packages/track-conditions-spfx/`
- **Current Version:** 2.1.0+ (check package-solution.json)
- **Key Services:**
  - DataverseService: Main API integration
  - AuthService: Azure AD authentication
  - CalculationService: Weather calculations and scoring
  - WeatherDataService: Data transformation and caching

### Race Management Package
- **Location:** `packages/race-management/`
- **Current Version:** 1.0.0+ (check package-solution.json)
- **Key Services:**
  - RaceMeetingService: Race meeting data operations
  - ErrorHandler: Centralized error handling
  - Logger: Structured logging

### Shared Package
- **Location:** `packages/shared/`
- **Purpose:** Common utilities for all packages
- **Exports:**
  - BaseDataverseService
  - AuthService
  - ErrorHandler
  - Logger

## Track Names (Official API Values - All 22 Tracks)
- "Albion Park"
- "Appin"
- "Bathurst"
- "Broken Hill"
- "Bulli"
- "Casino"
- "Dapto"
- "Dubbo"
- "Gosford"
- "Goulburn"
- "Grafton"
- "Gunnedah"
- "Lismore"
- "Lithgow"
- "Maitland"
- "Nowra"
- "Richmond"
- "Taree"
- "Temora"
- "The Gardens"
- "Wagga Wagga"
- "Wentworth Park"

## Weather Calculation Formulas
- **Feels Like:** `temperature - (windSpeed * 0.7)`
- **Wind Chill:** Applied when temp < 10°C
- **Heat Index:** Applied when temp > 27°C
- **Track Safety Score:** Complex algorithm considering:
  - Temperature impact (optimal 15-25°C)
  - Wind impact (exponential above 30 km/h)
  - Rainfall impact (surface conditions)
  - Visibility calculations

## Release Naming Convention
- Production: `track-conditions-spfx-v{version}-PROD.sppkg`
- Development: `track-conditions-spfx-v{version}.sppkg`
- Example: `track-conditions-spfx-v2.1.9-PROD.sppkg`

## Web Part Group Configuration
All GRNSW web parts are configured to appear in a custom "GRNSW Tools" section in SharePoint:
- **Group ID:** `5c03119e-3074-46fd-976b-c60198311f70` (standard ID for custom groups)
- **Group Name:** "GRNSW Tools"
- This applies to all 7 web parts across both packages
- After deployment, users will find all GRNSW web parts in the "GRNSW Tools" section of the web part picker

## SharePoint Deployment Troubleshooting
If users report seeing old versions after deployment:
1. **Clear browser cache** (Ctrl+F5 or Cmd+Shift+R)
2. **Check App Catalog** to ensure the new version is deployed
3. **Delete old version first** before uploading new version
4. **Remove and re-add the app** on affected sites
5. **Wait 15-30 minutes** for SharePoint CDN to fully propagate
6. **Check version in web part properties** to verify deployment
7. **Note:** Custom group IDs may not work in all SharePoint Online tenants

## Recent Fixes and Learnings
- **Multi-select dropdowns:** Use arrays for state management, add `multiSelect` and `multiSelectDelimiter` props
- **Historical Pattern Analyzer:** Must show all 22 tracks, validate track selection before API calls
- **Error handling:** Display user-friendly messages instead of technical errors
- **Version incrementing:** Always increment version numbers for SharePoint to recognize updates
- **CRITICAL VERSION SYNC:** package.json and package-solution.json MUST have matching versions
  - SPFx build uses package.json version number
  - If they don't match, SharePoint shows wrong version
  - Always update both files before building

## Current Package Versions (as of Dec 12, 2024)
- **Race Management:** v1.0.4 (in v1.0.5 folder - yes, folder name doesn't match)
- **Track Conditions:** v2.2.4 (in v2.2.5 folder - yes, folder name doesn't match)

## Important Notes
- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files unless explicitly requested
- When asked to create a release, always follow the complete process including README.md creation
- Always clean build before creating production packages: `gulp clean && gulp bundle --ship && gulp package-solution --ship`
- Double-check version numbers - folder names may not match package versions