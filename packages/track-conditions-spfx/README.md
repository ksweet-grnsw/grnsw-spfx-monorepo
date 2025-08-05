# Track Conditions SPFx Package

## Overview

This package (formerly weather-spfx) contains SharePoint web parts for monitoring track conditions and weather data at GRNSW racing venues. It provides real-time weather monitoring and historical analysis capabilities.

## Web Parts

### 1. Weather Dashboard

Comprehensive weather overview showing all key metrics in a single view.

**Features**:
- Current conditions summary
- 24-hour forecast
- Key metrics display (temperature, rainfall, wind)
- Track condition indicators

### 2. Temperature Analysis

Detailed temperature monitoring and trends.

**Features**:
- Real-time temperature readings
- Historical temperature charts
- Heat index calculations
- Temperature alerts for extreme conditions

### 3. Rainfall Tracking

Monitor precipitation levels and patterns.

**Features**:
- Current rainfall measurements
- Cumulative rainfall charts
- Rainfall intensity tracking
- Historical rainfall patterns

### 4. Wind Analysis

Track wind conditions affecting race meetings.

**Features**:
- Wind speed and direction
- Gust monitoring
- Wind pattern analysis
- Safety threshold alerts

### 5. Track Conditions Monitoring

Overall track condition assessment based on weather data.

**Features**:
- Track moisture levels
- Surface condition ratings
- Weather impact assessments
- Condition history tracking

## Services

### WeatherDataService

Provides access to weather data from Dataverse:

```typescript
const weatherService = new WeatherDataService(this.context);
const latestData = await weatherService.getLatestWeatherData();
const historicalData = await weatherService.getWeatherDataByDateRange(startDate, endDate);
```

## Data Integration

This package integrates with 181 weather data fields from Microsoft Dataverse, including:
- Temperature metrics
- Rainfall measurements
- Wind conditions
- Atmospheric pressure
- Humidity levels
- Track-specific conditions

## Configuration

Weather data refresh intervals and display preferences can be configured in each web part's property pane.

## Dependencies

- `chart.js` - For data visualization
- `react-chartjs-2` - React wrapper for Chart.js
- `@fluentui/react` - UI components
- `@grnsw/shared` - Shared services

## Development

```bash
# Serve locally
npm run serve

# Build
npm run build

# Package for deployment
npm run package-solution -- --ship
```

## Migration Notes

This package was renamed from `weather-spfx` to `track-conditions-spfx` to better reflect its purpose of monitoring overall track conditions, not just weather data.

## Future Enhancements

1. Predictive weather modeling
2. Integration with race scheduling
3. Automated track condition alerts
4. Weather data API integration
5. Mobile app companion