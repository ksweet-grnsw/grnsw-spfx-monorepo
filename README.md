# GRNSW SharePoint Framework Monorepo

A monorepo containing SharePoint Framework solutions for Greyhound Racing NSW, organized into three main packages:
- Weather data visualization
- Race management
- Greyhound health tracking

## Structure

```
grnsw-spfx-monorepo/
├── packages/
│   ├── shared/                 # Shared services and utilities
│   ├── weather-spfx/          # Weather data web parts
│   ├── race-management/       # Race management web parts
│   └── greyhound-health/      # Greyhound health web parts
└── package.json               # Root workspace configuration
```

## Packages

### @grnsw/shared
Common services and utilities used across all packages:
- **AuthService**: Handles AAD authentication and token management
- **BaseDataverseService**: Base class for all Dataverse operations
- **Logger**: Centralized logging utility
- **Config**: Shared configuration for Dataverse connections

### @grnsw/weather-spfx
Weather data visualization web parts:
- Weather Dashboard
- Temperature Analysis
- Rainfall Tracking
- Wind Analysis
- Track Conditions

### @grnsw/race-management-spfx
Race management web parts:
- Race Meetings Calendar
- Race Results
- Track Management
- Performance Analytics

### @grnsw/greyhound-health-spfx
Greyhound health and welfare web parts:
- Injury Tracking
- Treatment Records
- Veterinary Reports
- Health Analytics

## Prerequisites

- Node.js v22.14.0 or higher (but less than v23.0.0)
- npm v8 or higher
- SharePoint Online tenant
- Access to Microsoft Dataverse

## Installation

1. Clone the repository
2. Install dependencies from the root:
   ```bash
   npm install
   ```

## Development

### Working with individual packages

```bash
# Serve weather package
npm run serve:weather

# Serve race management package
npm run serve:race

# Serve greyhound health package
npm run serve:health
```

### Building packages

```bash
# Build all packages
npm run build

# Build specific package
npm run build:weather
npm run build:race
npm run build:health
```

### Creating production packages

```bash
# Package all solutions
npm run package-all

# Or from individual package directories
cd packages/weather-spfx
npm run package-solution -- --ship
```

## Shared Services

All packages use the shared services from `@grnsw/shared`:

```typescript
import { AuthService, BaseDataverseService, dataverseConfig } from '@grnsw/shared';

// Example: Create a service for race meetings
export class RaceMeetingService extends BaseDataverseService<IRaceMeeting> {
  protected tableName = 'cr4cc_racemeetings';
  
  constructor(context: WebPartContext) {
    super(context, dataverseConfig);
  }
  
  // Add custom methods specific to race meetings
  async getMeetingsByTrack(trackId: string): Promise<IRaceMeeting[]> {
    return this.getAll({
      filter: `_cr4cc_track_value eq ${trackId}`,
      orderBy: 'cr4cc_race_date desc'
    });
  }
}
```

## Configuration

The shared configuration is located in `packages/shared/src/config/dataverseConfig.ts`:

```typescript
export const dataverseConfig = {
  environment: 'https://org98489e5d.crm6.dynamics.com',
  apiVersion: 'v9.2',
  clientId: '3e9eb05b-3a09-4a77-8b2b-9a714ab84e12',
  tenantId: '78247cd5-7ce6-4361-bd6c-cadfc9f8f547'
};
```

## Deployment

1. Build the packages with `npm run build`
2. Create production packages with `npm run package-all`
3. Upload the `.sppkg` files to your SharePoint App Catalog
4. Deploy and add web parts to your SharePoint sites

## Benefits of Monorepo Structure

1. **Code Sharing**: Common services and utilities are shared across all packages
2. **Consistent Updates**: Dependencies are managed centrally
3. **Atomic Changes**: Related changes across packages can be committed together
4. **Separate Deployments**: Each package produces its own `.sppkg` file
5. **Independent Versioning**: Each package can have its own version number

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and ensure builds pass
4. Submit a pull request

## License

[Your License Here]