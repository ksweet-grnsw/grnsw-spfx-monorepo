# Development Documentation

## Project Overview

This monorepo contains SharePoint Framework (SPFx) solutions for Greyhound Racing NSW (GRNSW), organized into four main categories:

1. **Track Conditions** - Weather data and track condition monitoring
2. **Race Management** - Race meetings, results, and performance tracking
3. **Greyhound Health** - Health tracking, injury management, and veterinary reports
4. **GAP (Greyhound Adoption Program)** - Adoption management and greyhound rehoming

### Repository Structure

```
grnsw-spfx-monorepo/
├── packages/
│   ├── shared/                 # Shared services and utilities
│   ├── track-conditions-spfx/  # Track conditions & weather (formerly weather-spfx)
│   ├── race-management-spfx/   # Race management web parts
│   ├── greyhound-health-spfx/  # Health tracking web parts
│   └── gap-spfx/              # Greyhound Adoption Program web parts
├── releases/                   # Built .sppkg files organized by package
├── scripts/                    # Build and release automation scripts
└── docs/                       # Additional documentation
```

## Prerequisites

- **Node.js**: v22.14.0 or higher (but less than v23.0.0)
- **npm**: v8 or higher
- **SharePoint Online**: Access to a SharePoint Online tenant
- **Microsoft Dataverse**: Access to the GRNSW Dataverse environment
- **Git**: For version control

## Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ksweet-grnsw/grnsw-spfx-monorepo.git
   cd grnsw-spfx-monorepo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This will install all dependencies for the root and all workspace packages.

3. **Configure environment**
   - Ensure you have the correct SharePoint tenant URL
   - Verify Dataverse connection settings in `packages/shared/src/config/dataverseConfig.ts`

## Development Workflow

### Working with Packages

Each package can be developed independently:

```bash
# Serve track conditions package
npm run serve:track

# Serve race management package
npm run serve:race

# Serve greyhound health package
npm run serve:health

# Serve GAP package
npm run serve:gap
```

### Building Packages

```bash
# Build all packages
npm run build

# Build specific package
npm run build:track
npm run build:race
npm run build:health
npm run build:gap
```

### Package Structure

Each SPFx package follows this structure:
```
packages/[package-name]/
├── config/                 # SPFx configuration files
├── src/
│   ├── models/            # TypeScript interfaces and types
│   ├── services/          # Business logic and API calls
│   └── webparts/          # Web part implementations
├── teams/                 # Microsoft Teams icons
├── package.json          # Package dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Shared Services

The `@grnsw/shared` package provides common functionality:

### BaseDataverseService

All Dataverse operations extend this base class:

```typescript
import { BaseDataverseService, dataverseConfig } from '@grnsw/shared';

export class MyService extends BaseDataverseService<IMyEntity> {
  protected tableName = 'cr4cc_mytable';
  
  constructor(context: WebPartContext) {
    super(context, dataverseConfig);
  }
}
```

### Available Shared Services

1. **AuthService** - AAD authentication and token management
2. **BaseDataverseService** - CRUD operations for Dataverse
3. **Logger** - Centralized logging
4. **ErrorHandler** - Consistent error handling

## Recent Modifications

### Race Meetings Web Part UI Update (v1.8.0)

The race meetings calendar month view was updated to show colored rectangles with track names instead of dots:

**Before**: Small colored dots representing race meetings
**After**: Colored rectangles with track names that stack vertically

Files modified:
- `packages/race-management/src/webparts/raceMeetings/components/RaceMeetings.tsx`
- `packages/race-management/src/webparts/raceMeetings/components/RaceMeetings.module.scss`

### Monorepo Migration

Migrated from single package (`full-weather-data-spfx`) to monorepo structure:
- Separated weather and race management components
- Created shared services package
- Added health tracking and GAP packages
- Renamed "weather" to "track-conditions" for clarity

## Dataverse Integration

### Configuration

Dataverse settings are in `packages/shared/src/config/dataverseConfig.ts`:

```typescript
export const dataverseConfig = {
  environment: 'https://org98489e5d.crm6.dynamics.com',
  apiVersion: 'v9.2',
  clientId: '3e9eb05b-3a09-4a77-8b2b-9a714ab84e12',
  tenantId: '78247cd5-7ce6-4361-bd6c-cadfc9f8f547'
};
```

### Table Mappings

Each domain has specific Dataverse tables:

- **Track Conditions**: weatherdatas, trackconditions
- **Race Management**: racemeetings, races, raceresults, tracks
- **Health**: greyhounds, injuries, treatments, veterinaryreports
- **GAP**: adoptablegreyhounds, adoptionapplications, adoptions

## Version Management

### Versioning Strategy

- Each package maintains independent version numbers
- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Version locations:
  - Package version: `package.json`
  - SharePoint solution: `config/package-solution.json`

### Creating a Release

1. **Update version**
   ```bash
   cd packages/track-conditions-spfx
   npm version minor
   ```

2. **Create release**
   ```bash
   npm run release track-conditions-spfx
   ```

3. **Push changes**
   ```bash
   git push && git push --tags
   ```

Release artifacts are stored in `releases/[package-name]/`

## Testing

### Local Testing

1. Start the local workbench:
   ```bash
   npm run serve:[package]
   ```

2. Navigate to: `https://[tenant].sharepoint.com/_layouts/15/workbench.aspx`

### SharePoint Testing

1. Package the solution:
   ```bash
   cd packages/[package-name]
   npm run package-solution
   ```

2. Upload to SharePoint App Catalog
3. Deploy and test on actual SharePoint sites

## Troubleshooting

### Common Issues

1. **npm install failures**
   - Clear npm cache: `npm cache clean --force`
   - Use legacy peer deps: `npm install --legacy-peer-deps`

2. **Build errors**
   - Check Node.js version (must be v22.14.0+)
   - Ensure all dependencies are installed
   - Run `npm run clean` before building

3. **Dataverse connection issues**
   - Verify credentials in dataverseConfig.ts
   - Check network connectivity
   - Ensure proper permissions in Dataverse

## CI/CD Considerations

Future improvements could include:
- GitHub Actions for automated builds
- Automated testing pipelines
- Release automation
- Dependency updates automation

## Contributing

1. Create a feature branch
2. Make changes following existing patterns
3. Update relevant documentation
4. Test thoroughly
5. Submit pull request

## Support

For questions or issues:
- Check existing documentation
- Review code examples in the packages
- Contact the development team

## License

[Specify license here]