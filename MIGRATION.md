# Migration Guide

## Migrating from full-weather-data-spfx to Monorepo Structure

### Overview

The monorepo structure separates concerns into three distinct packages while sharing common code. This guide helps you migrate from the existing combined package to the new structure.

### Key Changes

1. **Race Meetings web part** is now part of `@grnsw/race-management-spfx`
2. **Weather web parts** remain in `@grnsw/weather-spfx`
3. **Shared services** are now in `@grnsw/shared`

### Migration Steps

#### 1. For Site Administrators

##### Current State (v1.x.x)
- Single package: `full-weather-data-spfx.sppkg`
- Contains all web parts (weather + race meetings)

##### New State (v2.0.0+)
- Four packages:
  - `track-conditions-spfx.sppkg` - Track conditions monitoring with weather data
  - `race-management-spfx.sppkg` - Race meetings and race-related web parts
  - `greyhound-health-spfx.sppkg` - Health and injury tracking web parts
  - `gap-spfx.sppkg` - Greyhound Adoption Program web parts

##### Migration Process

1. **Identify Usage**
   - List all sites using the current package
   - Document which web parts are used on each site

2. **Deploy New Packages**
   - Upload all four new packages to the App Catalog (or only those needed)
   - Do NOT remove the old package yet

3. **Update Sites**
   - For sites using only weather/track conditions web parts:
     - Add the new `track-conditions-spfx` app
     - Replace existing weather web parts with new versions
     - Remove the old `full-weather-data-spfx` app
   
   - For sites using race meetings:
     - Add the new `race-management-spfx` app
     - Replace the race meetings web part with the new version
     - If also using weather web parts, add `weather-spfx` app
     - Remove the old `full-weather-data-spfx` app

4. **Verify**
   - Test all web parts are functioning correctly
   - Check that data connections are working

5. **Cleanup**
   - Once all sites are migrated, remove the old package from App Catalog

#### 2. For Developers

##### Code Structure Changes

###### Old Structure
```
full-weather-data-spfx/
├── src/
│   ├── services/
│   │   ├── AuthService.ts
│   │   ├── DataverseService.ts
│   │   └── RaceMeetingService.ts
│   └── webparts/
│       ├── raceMeetings/
│       └── weatherDashboard/
```

###### New Structure
```
grnsw-spfx-monorepo/
├── packages/
│   ├── shared/
│   │   └── src/
│   │       └── services/
│   │           ├── AuthService.ts
│   │           └── BaseDataverseService.ts
│   ├── weather-spfx/
│   │   └── src/
│   │       └── services/
│   │           └── WeatherDataService.ts
│   └── race-management/
│       └── src/
│           └── services/
│               └── RaceMeetingService.ts
```

##### Service Updates

###### Old Way
```typescript
import { DataverseService } from '../../services/DataverseService';

const dataverseService = new DataverseService(this.context);
const weatherData = await dataverseService.getWeatherData();
```

###### New Way
```typescript
import { WeatherDataService } from '../services/WeatherDataService';

const weatherService = new WeatherDataService(this.context);
const weatherData = await weatherService.getLatestWeatherData();
```

##### Using Shared Services

All packages now extend from `BaseDataverseService`:

```typescript
import { BaseDataverseService, dataverseConfig } from '@grnsw/shared';

export class MyCustomService extends BaseDataverseService<IMyEntity> {
  protected tableName = 'cr4cc_mytable';

  constructor(context: WebPartContext) {
    super(context, dataverseConfig);
  }

  // Your custom methods here
}
```

### Benefits After Migration

1. **Smaller Package Sizes**: Each site only loads what it needs
2. **Independent Updates**: Update weather features without affecting race management
3. **Better Organization**: Clear separation of concerns
4. **Shared Code**: Common functionality maintained in one place
5. **Type Safety**: Shared interfaces ensure consistency

### Rollback Plan

If issues occur during migration:

1. The old package remains in the App Catalog
2. Remove the new apps from affected sites
3. Re-add the old `full-weather-data-spfx` app
4. Investigate and resolve issues before attempting migration again

### Support

For migration assistance:
- Check the [README](./README.md) for setup instructions
- Review the example implementations in each package
- Contact the development team for specific issues