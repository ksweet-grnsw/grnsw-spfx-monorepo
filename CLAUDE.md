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

## ⚠️⚠️⚠️ STOP AND READ - CRITICAL BUILD PROCESS ⚠️⚠️⚠️
# VERSION MUST BE UPDATED BEFORE BUILDING
# THIS IS THE #1 CAUSE OF FAILED DEPLOYMENTS
# FAILURE TO FOLLOW THIS WILL RESULT IN WRONG VERSION IN SHAREPOINT

## 🚨 MANDATORY PRE-BUILD CHECKLIST - DO NOT SKIP 🚨
Before ANY build operation, you MUST complete this checklist IN ORDER:
- [ ] CHECK: Run `cat package.json | grep version` to see current version
- [ ] CHECK: Run `cat config/package-solution.json | grep version` to verify both versions match
- [ ] UPDATE: If creating new release, update BOTH files to new version FIRST
- [ ] VERIFY: Run the version check commands again to confirm updates
- [ ] CLEAN: Run `gulp clean` to remove ALL old artifacts
- [ ] BUILD: Run `gulp bundle --ship` (MUST have --ship flag)
- [ ] PACKAGE: Run `gulp package-solution --ship` (MUST have --ship flag)
- [ ] COPY: Copy .sppkg to release folder ONLY after successful build

## ❌ CRITICAL FAILURES - NEVER DO THESE ❌
1. **NEVER** build before updating version - SharePoint will show old version
2. **NEVER** run gulp bundle without --ship for production
3. **NEVER** skip gulp clean after version update
4. **NEVER** trust that the version is correct without checking
5. **NEVER** update version AFTER building - the package will have wrong version
6. **NEVER** proceed if package.json and package-solution.json versions don't match

## Build and Release Process

### ⚠️ CRITICAL: Version Update Sequence ⚠️
**ALWAYS update versions BEFORE building!** Building with old versions then updating will result in SharePoint showing the wrong version number.

**Correct Order:**
1. ✅ Update version → Clean → Build → Package
2. ❌ Build → Update version → Package (WRONG - will show old version!)

When creating releases, always follow this EXACT sequence:
1. **UPDATE VERSIONS FIRST** in both `package.json` and `config/package-solution.json`
2. Run `gulp clean` to clean ALL previous build artifacts
3. Run `gulp bundle --ship` for production bundling (REQUIRED for SharePoint deployment)
4. Run `gulp package-solution --ship` to create the production .sppkg file
5. Run `npm run lint` to check for issues
6. Run `npm run typecheck` if available
7. Copy the .sppkg from `sharepoint/solution/` to release folder
8. Name releases with semantic versioning (e.g., v2.1.0)

**CRITICAL**: The `--ship` flag is MANDATORY for production packages. Without it, the web parts will not appear correctly in SharePoint.

## 🚨 CRITICAL VERSION SYNCHRONIZATION 🚨
**THIS IS THE #1 CAUSE OF SHAREPOINT DEPLOYMENT ISSUES - READ CAREFULLY!**

### Patch Version Strategy
**IMPORTANT**: Always increment patch versions when creating new releases. Never overwrite existing release files!
- v1.0.0 → v1.0.1 → v1.0.2 (patch increments for fixes)
- v1.1.0 (minor increment for new features)
- v2.0.0 (major increment for breaking changes)

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

#### For packages WITHOUT version sync scripts (race-management, greyhound-health, etc.):
```bash
# 1. CRITICAL: Update versions FIRST (before ANY build commands!)
cd packages/race-management

# 2. Manually update BOTH files to the SAME version:
#    - package.json: "version": "1.0.6"
#    - config/package-solution.json: "solution.version": "1.0.6.0"
#    - config/package-solution.json: "features[0].version": "1.0.6.0"

# 3. ONLY AFTER versions are updated, clean and build:
gulp clean
gulp bundle --ship
gulp package-solution --ship

# 4. Create release folder and copy files
mkdir -p ../../releases/race-management/v1.0.6
cp sharepoint/solution/*.sppkg ../../releases/race-management/v1.0.6/
```

#### For packages WITH version sync scripts (track-conditions-spfx):
```bash
# 1. ALWAYS sync versions first
cd packages/track-conditions-spfx
npm run sync-version 2.2.8  # Replace with your version

# 2. Verify sync was successful
npm run check-version

# 3. Only if verification passes, build with production flags
gulp clean
gulp bundle --ship
gulp package-solution --ship

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
- Building BEFORE updating versions (SharePoint will show old version!)
- Updating only package.json
- Updating only package-solution.json  
- Using different version formats (2.2.7 vs 2.2.7.0)
- Building without running version check
- Running `gulp bundle` or `gulp package-solution` before version update

✅ **ALWAYS DO THIS:**
- **UPDATE VERSIONS FIRST, THEN BUILD**
- Run `gulp clean` after version update to ensure clean build
- Use the sync-version script for ALL version changes (if available)
- Run check-version before EVERY build (if available)
- Use the same version number everywhere (with .0 suffix in package-solution.json)
- Verify the version shows correctly in SharePoint after deployment

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
- **ALWAYS include version number in property pane**: Add an "About" group with PropertyPaneLabel showing the current version
  ```typescript
  {
    groupName: 'About',
    groupFields: [
      PropertyPaneLabel('version', {
        text: `Version: ${version}`
      })
    ]
  }
  ```

## Enterprise UI Standards (MANDATORY for all new/refactored components)

### Component Architecture
- **Use Enterprise UI components** from `src/enterprise-ui/components` for all UI elements
- **Replace Fluent UI components** with Enterprise UI equivalents where available:
  - Tables → `DataGrid`
  - Status displays → `StatusBadge`
  - Navigation → `Breadcrumb`
  - Filters → `FilterPanel`
- **Use functional components** with React hooks instead of class components
- **Implement proper TypeScript interfaces** for all props and state

### Styling Rules (CRITICAL - Separation of Concerns)
- **NEVER use hardcoded values** in SCSS files
- **ALWAYS import design tokens** at the top of SCSS files:
  ```scss
  @import '../../../enterprise-ui/styles/tokens';
  ```
- **Use design tokens for ALL styling**:
  - Colors: Use `$brand-primary`, `$text-primary`, etc., NOT `#0078d4`
  - Spacing: Use `$spacing-md`, `$spacing-lg`, etc., NOT `16px`
  - Typography: Use `@include typography('body')`, NOT custom font sizes
  - Shadows: Use `$shadow-sm`, `$shadow-md`, etc.
  - Borders: Use `var(--border-default)`, NOT `1px solid #ccc`

### Theme Application
- **Apply domain-specific themes** to components:
  - Meetings: `theme="meeting"` (blue)
  - Races: `theme="race"` (green)
  - Contestants: `theme="contestant"` (orange)
  - Weather: `theme="weather"` (dark blue)
  - Health: `theme="health"` (green)
  - Financial: `theme="financial"` (purple)

### Responsive Design
- **Use responsive mixins** for breakpoints:
  ```scss
  @include media-down('lg') {
    // Tablet and below styles
  }
  ```
- **Never use hardcoded media queries**

### Example SCSS File Structure
```scss
// ALWAYS start with token import
@import '../../../enterprise-ui/styles/tokens';

.component {
  // Use spacing tokens
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
  
  // Use color variables
  background: var(--bg-primary);
  color: var(--text-primary);
  
  // Use shadow tokens
  box-shadow: $shadow-sm;
  
  // Use typography mixins
  @include typography('h2');
  
  // Responsive design
  @include media-down('md') {
    padding: $spacing-md;
  }
}
```

### Component Refactoring Checklist
When refactoring existing components:
1. ✅ Convert class components to functional components
2. ✅ Replace Fluent UI data tables with `DataGrid`
3. ✅ Replace custom status displays with `StatusBadge`
4. ✅ Import design tokens in SCSS
5. ✅ Replace hardcoded colors with token variables
6. ✅ Replace hardcoded spacing with token variables
7. ✅ Use typography mixins for text styles
8. ✅ Apply appropriate domain theme
9. ✅ Use responsive mixins for breakpoints
10. ✅ Remove inline styles and use CSS modules

## Testing
Before committing any changes:
- Ensure no TypeScript errors with `npm run build`
- Fix any ESLint warnings where possible
- Test that all web parts load correctly

## Common Commands
- Build track-conditions: `cd packages/track-conditions-spfx && gulp bundle --ship && gulp package-solution --ship`
- Build race-management: `cd packages/race-management && gulp bundle --ship && gulp package-solution --ship`
- Build greyhound-health: `cd packages/greyhound-health && gulp bundle --ship && gulp package-solution --ship`
- Clean and rebuild: `gulp clean && gulp bundle --ship && gulp package-solution --ship`
- Create production package: `gulp package-solution --ship` (MUST run `gulp bundle --ship` first!)
- Serve locally: `gulp serve` (opens https://grnsw21.sharepoint.com/_layouts/workbench.aspx)
- Serve with no browser: `gulp serve --nobrowser`
- Test in SharePoint Online workbench: Navigate to https://grnsw21.sharepoint.com/_layouts/workbench.aspx

## API Considerations
- The Dataverse API returns many `null` values that must be preserved
- Weather data timestamps are in Unix seconds (need *1000 for JS dates)
- Track names in API use spaces (e.g., "Wentworth Park")
- API fields are prefixed with cr8e9_

## SharePoint Environment
- **Tenant:** grnsw21.sharepoint.com
- **Tenant ID:** grnsw21
- **SharePoint URL:** https://grnsw21.sharepoint.com
- **App Catalog:** https://grnsw21.sharepoint.com/sites/appcatalog
- **Workbench URL:** https://grnsw21.sharepoint.com/_layouts/workbench.aspx

## Dataverse Environments
Each package connects to a specific Dataverse environment:

### 1. Racing Data Environment
- **URL:** https://racingdata.crm6.dynamics.com/
- **Base URL:** https://racingdata.crm6.dynamics.com
- **API Endpoint:** https://racingdata.crm6.dynamics.com/api/data/v9.1
- **Used By:** race-management package
- **Tables:**
  | Display Name | Logical Name (Singular) | Logical Name (Plural for API) | Description |
  |-------------|------------------------|-------------------------------|-------------|
  | Meeting | cr4cc_racemeeting | cr4cc_racemeetings | Race meeting information |
  | Races | cr616_races | cr616_raceses | Individual race details (NOTE: double plural!) |
  | Contestants | cr616_contestants | cr616_contestantses | Greyhound contestants (NOTE: double plural!) |

### 2. Weather Data Production Environment
- **URL:** https://org98489e5d.crm6.dynamics.com/
- **API Endpoint:** https://org98489e5d.crm6.dynamics.com/api/data/v9.1
- **Used By:** track-conditions-spfx package
- **Tables:**
  | Display Name | Logical Name (Singular) | Logical Name (Plural for API) | Description |
  |-------------|------------------------|-------------------------------|-------------|
  | Weather Data | cr4cc_weatherdata | cr4cc_weatherdatas | Weather station data with 180+ fields |
  
  **Note:** Weather data includes extensive fields for temperature, rainfall, wind, humidity, solar radiation, battery status, and more.

### 3. Injury Data Environment
- **URL:** https://orgfc8a11f1.crm6.dynamics.com/
- **API Endpoint:** https://orgfc8a11f1.crm6.dynamics.com/api/data/v9.1
- **Used By:** greyhound-health package
- **Tables:**
  | Display Name | Logical Name (Singular) | Logical Name (Plural for API) | Description |
  |-------------|------------------------|-------------------------------|-------------|
  | Injury Data | cra5e_injurydata | cra5e_injurydatas | Greyhound injury tracking records |
  | Injuries | cr4cc_injury | cr4cc_injuries | Alternative injury table (legacy) |

### 4. GAP Environment (Greyhound Adoption Program)
- **URL:** https://org16bdb053.crm6.dynamics.com/
- **API Endpoint:** https://org16bdb053.crm6.dynamics.com/api/data/v9.1
- **Used By:** gap-spfx package
- **Tables:** Not yet configured

## Data Integration
- **Primary Source:** Microsoft Dataverse (formerly CDS)
- **Authentication:** Azure AD via AuthService
- **API Version:** v9.1
- **Multiple Environments:** Each functional area has its own Dataverse environment

## Important Dataverse Notes
### Table Naming Conventions
- **Singular vs Plural:** Dataverse uses singular names internally but plural names for API endpoints
- **Example:** Table "Meeting" (cr4cc_racemeeting) becomes "cr4cc_racemeetings" in API calls
- **CRITICAL:** Some tables use DOUBLE PLURAL forms - this is NOT a mistake:
  - Table "Races" (cr616_races) becomes "cr616_raceses" in API calls (YES, double plural!)
  - Table "Contestants" (cr616_contestants) becomes "cr616_contestantses" in API calls (YES, double plural!)
- **VERIFIED:** These double-plural names have been tested and confirmed working as of August 2025

### Key Field Mappings for Racing Data (VERIFIED via API Discovery - August 2025)

#### Meeting Table (cr4cc_racemeetings) - 50 fields total
**Key Fields:**
- cr4cc_racemeetingid: Unique identifier
- cr4cc_meetingdate: Date of the race meeting (includes time)
- cr4cc_trackname: Track name (e.g., "Wentworth Park") - **CONFIRMED FIELD NAME**
- cr4cc_authority: Racing authority (e.g., "NSW")
- cr4cc_timeslot: Time slot (Morning/Afternoon/Evening)
- cr4cc_type: Meeting type
- cr4cc_meetingname: Meeting name
- cr4cc_cancelled: Boolean for cancelled meetings
- cr4cc_salesforceid: Salesforce integration ID

**Additional Fields:**
- cr616_weather: Weather conditions
- cr616_stewardcomment: Steward's comments
- cr616_trackcondition: Track condition
- statecode: State code (active/inactive)
- statuscode: Status code
- versionnumber: Version number for concurrency
- modifiedon: Last modified timestamp
- createdon: Creation timestamp
- _ownerid_value: Owner ID
- _owningbusinessunit_value: Business unit ID
- _modifiedby_value: Modified by user ID
- _createdby_value: Created by user ID

#### Races Table (cr616_raceses) - 84 fields total - NOTE: API uses "raceses" (double plural!)
**Key Fields:**
- cr616_racesid: Unique identifier (NOTE: not "raceid")
- cr616_racenumber: Race number in sequence
- cr616_racename: Name of the race
- cr616_racetitle: Full title of the race
- cr616_distance: Race distance in meters
- cr616_racegrading: Grade of the race (corrected from cr616_racegrading)
- cr616_starttime: Scheduled start time
- cr616_numberofcontestants: Number of contestants (corrected from cr616_noofcontestants)
- cr616_racedate: Date of the race
- _cr616_meeting_value: Foreign key to Meeting

**Prize Money Fields:**
- cr616_prize1: First place prize money
- cr616_prize2: Second place prize money
- cr616_prize3: Third place prize money
- cr616_prize4: Fourth place prize money
- cr616_prize1_base: Base currency value
- cr616_prize2_base: Base currency value
- cr616_prize3_base: Base currency value
- cr616_prize4_base: Base currency value

**Additional Fields:**
- cr616_trackheld: Track where race was held
- cr616_sfraceid: Salesforce race ID
- cr616_firstsectionaltime: First sectional time
- cr616_secondsectiontime: Second section time
- cr616_racesectionaloverview: Sectional overview
- cr616_status: Race status
- cr616_stewardracecomment: Steward's race comment
- _transactioncurrencyid_value: Currency ID
- exchangerate: Exchange rate

#### Contestants Table (cr616_contestantses) - 78 fields total - NOTE: API uses "contestantses" (double plural!)
**Key Fields:**
- cr616_contestantsid: Unique identifier (NOTE: not "contestantid")
- cr616_rugnumber: Rug/box number (1-8)
- cr616_greyhoundname: Name of the greyhound
- cr616_ownername: Owner's name
- cr616_trainername: Trainer's name
- cr616_doggrade: Grade of the dog
- cr616_placement: Final placement
- cr616_margin: Margin of victory/defeat
- cr616_weight: Weight of the greyhound
- cr616_status: Contestant status
- _cr616_race_value: Foreign key to Race
- _cr616_meeting_value: Foreign key to Meeting

**Performance Fields:**
- cr616_finishtime: Finish time
- cr616_dayssincelastrace: Days since last race
- cr616_totalnumberofwinds: Total number of wins
- cr616_failedtofinish: Boolean for DNF
- cr616_racewithin2days: Raced within 2 days flag

**Additional Fields:**
- cr616_trackheld: Track where race was held
- cr616_meetingdate: Meeting date
- cr616_racenumber: Race number
- cr616_leftearbrand: Left ear brand
- cr616_sfcontestantid: Salesforce contestant ID
- cr616_prizemoney: Prize money won
- cr616_prizemoney_base: Base currency value

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

## Track Names (Official API Values - All 18 GRNSW Tracks)
- "Broken Hill"
- "Bulli"
- "Casino"
- "Dapto"
- "Dubbo"
- "Gosford"
- "Goulburn"
- "Grafton"
- "Gunnedah"
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