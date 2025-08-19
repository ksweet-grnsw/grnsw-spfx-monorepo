# GRNSW SPFx Monorepo Instructions

## 🚨 CRITICAL: Version Before Build
**ALWAYS update version BEFORE building. SharePoint will show wrong version if you don't!**

### Build Checklist (MANDATORY)
1. Update version in BOTH `package.json` AND `config/package-solution.json`
2. Run `gulp clean`
3. Run `gulp bundle --ship`
4. Run `gulp package-solution --ship`
5. Copy .sppkg to releases folder

## Project Structure
```
grnsw-spfx-monorepo/
├── packages/
│   ├── track-conditions-spfx/    # Weather tracking (6 web parts)
│   ├── race-management/          # Race calendar
│   ├── gap-spfx/                # Adoption program
│   └── greyhound-health/        # Health tracking
├── releases/                    # Production .sppkg files
└── docs/dataverse/             # Field documentation
```

## Tech Stack
- SPFx 1.21.1, React 17.0.1, TypeScript 5.3.3
- Node 22.14.0+ (< 23.0.0)
- Chart.js 4.5.0

## Dataverse Environments

### Racing Data
- **URL:** https://racingdata.crm6.dynamics.com/api/data/v9.1
- **Tables:** cr4cc_racemeetings, cr616_races, cr616_contestants

### Weather Data  
- **URL:** https://org98489e5d.crm6.dynamics.com/api/data/v9.1
- **Table:** cr4cc_weatherdatas (180+ fields)

### Injury Data
- **URL:** https://orgfc8a11f1.crm6.dynamics.com/api/data/v9.1
- **Tables:** cra5e_injurydatas, cra5e_greyhounds, cra5e_heathchecks

### GAP (Adoption)
- **URL:** https://orgda56a300.crm6.dynamics.com/api/data/v9.1
- **Table:** cr0d3_hounds

## Field Documentation
Run `npm run discover:fields` to update field documentation in `docs/dataverse/`

## Build Commands
```bash
# Track Conditions
cd packages/track-conditions-spfx
npm run sync-version 2.2.8  # Has version sync scripts
gulp clean && gulp bundle --ship && gulp package-solution --ship

# Race Management (manual version update)
cd packages/race-management
# UPDATE package.json and config/package-solution.json MANUALLY
gulp clean && gulp bundle --ship && gulp package-solution --ship
```

## Code Standards

### Architecture
- SOLID principles
- DRY - no code duplication
- Functional components with hooks
- TypeScript strict mode
- Error boundaries

### Project Structure
```
src/
├── components/      # UI components
├── hooks/          # Custom React hooks
├── services/       # API and business logic
├── utils/          # Utility functions
├── models/         # TypeScript interfaces
└── webparts/       # SPFx web parts
```

### Enterprise UI (when available)
- Import design tokens: `@import '../../../enterprise-ui/styles/tokens';`
- Use tokens for colors, spacing, typography
- Apply domain themes (meeting, race, weather, health)

## SharePoint
- **Tenant:** grnsw21.sharepoint.com
- **App Catalog:** https://grnsw21.sharepoint.com/sites/appcatalog
- **Workbench:** https://grnsw21.sharepoint.com/_layouts/workbench.aspx

## Track Names (18 official)
Broken Hill, Bulli, Casino, Dapto, Dubbo, Gosford, Goulburn, Grafton, Gunnedah, Lithgow, Maitland, Nowra, Richmond, Taree, Temora, The Gardens, Wagga Wagga, Wentworth Park

## Dataverse Quirks
- Tables may double-pluralize: cr616_races → cr616_raceses
- Always test both forms
- Unix timestamps need *1000 for JS dates
- Many fields return null - preserve them

## Current Versions
- **Track Conditions:** 2.2.4
- **Race Management:** 1.5.17  
- **GAP:** 1.0.0

## Important Rules
- NEVER create files unless necessary
- ALWAYS prefer editing over creating
- NEVER commit unless explicitly asked
- Include version in property pane
- Use --ship flag for production builds