# Infrastructure Components - Working Examples

## Overview

This document provides complete, working examples of infrastructure components from `@grnsw/shared`. Copy and adapt these examples for your projects.

## Table of Contents

1. [Complete Dashboard Example](#complete-dashboard-example)
2. [Data Service with Full Infrastructure](#data-service-with-full-infrastructure)
3. [Form with Error Handling](#form-with-error-handling)
4. [Real-Time Data Component](#real-time-data-component)
5. [Analytics Dashboard](#analytics-dashboard)
6. [File Upload Component](#file-upload-component)

## Complete Dashboard Example

Full-featured dashboard with all infrastructure components:

```typescript
// WeatherDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  ErrorBoundary,
  DataverseErrorBoundary,
  LoadingSpinner,
  DashboardSkeleton,
  useTelemetry,
  useAsyncOperation,
  useProgressiveLoading,
  LazyComponent,
  CacheService,
  CacheStatsDisplay
} from '@grnsw/shared';
import { IWeatherDashboardProps } from './IWeatherDashboardProps';
import styles from './WeatherDashboard.module.scss';

// Lazy load heavy components
const ChartComponent = React.lazy(() => 
  import(/* webpackChunkName: "weather-charts" */ './WeatherCharts')
);

const WeatherDashboardContent: React.FC<IWeatherDashboardProps> = ({
  context,
  isDarkTheme
}) => {
  // Initialize infrastructure hooks
  const { 
    trackAction, 
    trackPerformance, 
    trackError,
    trackMetric 
  } = useTelemetry(context, {
    componentName: 'WeatherDashboard',
    enabled: true,
    autoTrackLifecycle: true,
    bufferEvents: true,
    bufferSize: 20
  });

  // Progressive loading for complex dashboard
  const { 
    loadingState: progressiveState, 
    results, 
    currentStep,
    executeSteps 
  } = useProgressiveLoading({
    stepDelay: 300,
    continueOnError: true
  });

  // Async operation management
  const { 
    loadingState, 
    data: weatherData, 
    execute 
  } = useAsyncOperation<IWeatherData[]>({
    minLoadingTime: 500,
    showProgress: true
  });

  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'charts'>('cards');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // Load dashboard data progressively
  const loadDashboardData = useCallback(async () => {
    trackAction('load', 'dashboard_data', { track: selectedTrack });

    await executeSteps([
      {
        name: 'weather',
        message: 'Loading weather data...',
        execute: async () => {
          const cacheKey = `weather_${selectedTrack}`;
          const cached = CacheService.get(cacheKey);
          
          if (cached && !CacheService.isExpired(cacheKey)) {
            trackMetric('cache', 'hit', 1);
            return cached;
          }

          const data = await trackPerformance('fetch_weather_data', async () => {
            const response = await fetch(`/api/weather/${selectedTrack}`);
            if (!response.ok) throw new Error('Failed to fetch weather data');
            return response.json();
          });

          CacheService.set(cacheKey, data, 2 * 60 * 1000); // 2 minutes
          trackMetric('data', 'weather_records', data.length);
          
          return data;
        }
      },
      {
        name: 'statistics',
        message: 'Calculating statistics...',
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate calculation
          return {
            avgTemp: 22.5,
            avgHumidity: 65,
            alertCount: 3
          };
        }
      },
      {
        name: 'alerts',
        message: 'Checking alerts...',
        execute: async () => {
          const response = await fetch('/api/weather/alerts');
          return response.json();
        }
      }
    ]);
  }, [selectedTrack, executeSteps, trackAction, trackMetric, trackPerformance]);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh setup
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        trackAction('auto_refresh', 'dashboard');
        loadDashboardData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, loadDashboardData, trackAction]);

  // Handle view mode change
  const handleViewModeChange = (mode: typeof viewMode) => {
    trackAction('click', 'view_mode_change', { 
      from: viewMode, 
      to: mode 
    });
    setViewMode(mode);
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    trackAction('click', 'manual_refresh');
    CacheService.invalidate(`weather_${selectedTrack}`);
    await loadDashboardData();
  };

  // Render loading state
  if (progressiveState.isLoading && !results.weather) {
    return (
      <DashboardSkeleton
        type="weather"
        showHeader={true}
        showStats={true}
        statsCount={4}
        showCharts={viewMode === 'charts'}
        showTable={viewMode === 'table'}
        animated={true}
      />
    );
  }

  // Render error state
  if (progressiveState.error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Unable to load dashboard</h3>
        <p>{progressiveState.error}</p>
        <button onClick={handleRefresh}>Try Again</button>
      </div>
    );
  }

  return (
    <div className={`${styles.dashboard} ${isDarkTheme ? styles.dark : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Weather Monitoring Dashboard</h2>
        <div className={styles.controls}>
          {/* Track selector */}
          <select 
            value={selectedTrack} 
            onChange={(e) => {
              trackAction('change', 'track_filter', { 
                track: e.target.value 
              });
              setSelectedTrack(e.target.value);
            }}
          >
            <option value="all">All Tracks</option>
            <option value="richmond">Richmond</option>
            <option value="wentworth">Wentworth Park</option>
            <option value="gosford">Gosford</option>
          </select>

          {/* View mode toggle */}
          <div className={styles.viewToggle}>
            {(['cards', 'table', 'charts'] as const).map(mode => (
              <button
                key={mode}
                className={viewMode === mode ? styles.active : ''}
                onClick={() => handleViewModeChange(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Refresh controls */}
          <button onClick={handleRefresh} disabled={progressiveState.isLoading}>
            {progressiveState.isLoading ? (
              <LoadingSpinner size="small" inline />
            ) : (
              'Refresh'
            )}
          </button>

          {/* Auto-refresh */}
          <select 
            value={refreshInterval || ''} 
            onChange={(e) => {
              const interval = e.target.value ? parseInt(e.target.value) : null;
              trackAction('change', 'auto_refresh', { interval });
              setRefreshInterval(interval);
            }}
          >
            <option value="">Manual Refresh</option>
            <option value="30000">30 seconds</option>
            <option value="60000">1 minute</option>
            <option value="300000">5 minutes</option>
          </select>
        </div>
      </div>

      {/* Progress indicator for partial loads */}
      {progressiveState.isLoading && results.weather && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progress} 
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
          <span>{progressiveState.message}</span>
        </div>
      )}

      {/* Statistics Cards */}
      {results.statistics && (
        <div className={styles.statsGrid}>
          <StatCard
            title="Average Temperature"
            value={`${results.statistics.avgTemp}°C`}
            icon="Sunny"
            trend="+2.3°"
          />
          <StatCard
            title="Average Humidity"
            value={`${results.statistics.avgHumidity}%`}
            icon="Drop"
            trend="-5%"
          />
          <StatCard
            title="Active Alerts"
            value={results.statistics.alertCount}
            icon="Warning"
            status={results.statistics.alertCount > 0 ? 'warning' : 'success'}
          />
          <StatCard
            title="Last Update"
            value={new Date().toLocaleTimeString()}
            icon="Clock"
          />
        </div>
      )}

      {/* Alerts Section */}
      {results.alerts && results.alerts.length > 0 && (
        <div className={styles.alerts}>
          <h3>Active Weather Alerts</h3>
          {results.alerts.map((alert: any) => (
            <div key={alert.id} className={`${styles.alert} ${styles[alert.severity]}`}>
              <strong>{alert.title}</strong>
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className={styles.content}>
        {viewMode === 'cards' && results.weather && (
          <div className={styles.cardGrid}>
            {results.weather.map((item: any) => (
              <WeatherCard key={item.id} data={item} />
            ))}
          </div>
        )}

        {viewMode === 'table' && results.weather && (
          <WeatherTable data={results.weather} />
        )}

        {viewMode === 'charts' && (
          <React.Suspense fallback={<LoadingSpinner label="Loading charts..." />}>
            <LazyComponent
              importFunction={() => import('./WeatherCharts')}
              componentProps={{ data: results.weather }}
              fallback={<DashboardSkeleton type="charts" />}
              retryAttempts={3}
              preload={true}
            />
          </React.Suspense>
        )}
      </div>

      {/* Cache Statistics (Dev Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={styles.devTools}>
          <h4>Cache Statistics</h4>
          <CacheStatsDisplay
            detailed={true}
            showClearButton={true}
            onClear={() => {
              CacheService.clearAll();
              handleRefresh();
            }}
          />
        </div>
      )}
    </div>
  );
};

// Main component with error boundaries
const WeatherDashboard: React.FC<IWeatherDashboardProps> = (props) => {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div className={styles.errorFallback}>
          <h2>Dashboard Error</h2>
          <p>{error.message}</p>
          <button onClick={retry}>Reload Dashboard</button>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.error('Dashboard error:', error, errorInfo);
      }}
    >
      <DataverseErrorBoundary
        maxRetries={3}
        retryDelay={1000}
        onRetry={() => console.log('Retrying Dataverse operation...')}
      >
        <WeatherDashboardContent {...props} />
      </DataverseErrorBoundary>
    </ErrorBoundary>
  );
};

export default WeatherDashboard;
```

## Data Service with Full Infrastructure

Complete data service with caching, retry, and telemetry:

```typescript
// WeatherDataService.ts
import {
  BaseDataverseService,
  TelemetryService,
  CacheService,
  retryOperation,
  ThrottleService
} from '@grnsw/shared';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IWeatherDataService {
  getLatestData(trackId?: string): Promise<IWeatherData[]>;
  getHistoricalData(startDate: Date, endDate: Date): Promise<IWeatherData[]>;
  getAlerts(): Promise<IWeatherAlert[]>;
  refreshCache(): Promise<void>;
}

export class WeatherDataService extends BaseDataverseService implements IWeatherDataService {
  private telemetry: TelemetryService;
  private throttle: ThrottleService;
  private readonly BASE_URL = 'https://org98489e5d.crm6.dynamics.com/api/data/v9.1';
  
  constructor(context: WebPartContext) {
    super(context);
    this.telemetry = new TelemetryService(context, {
      componentName: 'WeatherDataService',
      enabled: true
    });
    this.throttle = new ThrottleService({
      maxRequests: 10,
      perInterval: 1000
    });
  }

  /**
   * Get latest weather data with caching and retry
   */
  async getLatestData(trackId: string = 'all'): Promise<IWeatherData[]> {
    const cacheKey = `weather_latest_${trackId}`;
    const timer = this.telemetry.startTimer('fetch_latest_weather');

    try {
      // Check cache first
      const cached = CacheService.get<IWeatherData[]>(cacheKey);
      if (cached && !CacheService.isExpired(cacheKey)) {
        this.telemetry.trackMetric('cache', 'hit', 1, 'count', { key: cacheKey });
        timer.end({ source: 'cache', trackId });
        return cached;
      }

      // Fetch with retry logic
      const data = await retryOperation(
        async () => {
          // Apply throttling
          await this.throttle.acquire();
          
          const query = trackId === 'all' 
            ? `${this.BASE_URL}/cr4cc_weatherdatas?$top=50&$orderby=createdon desc`
            : `${this.BASE_URL}/cr4cc_weatherdatas?$filter=cr4cc_track_name eq '${trackId}'&$top=50&$orderby=createdon desc`;

          const response = await this.fetchWithAuth(query);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const json = await response.json();
          return this.transformWeatherData(json.value);
        },
        {
          maxRetries: 3,
          delay: 1000,
          backoff: true,
          retryIf: (error) => {
            // Retry on network errors or 5xx status codes
            return error.message.includes('fetch') || 
                   error.message.includes('HTTP 5');
          }
        }
      );

      // Cache the result
      CacheService.set(cacheKey, data, 2 * 60 * 1000); // 2 minutes
      
      // Track metrics
      timer.end({ 
        source: 'api', 
        trackId, 
        recordCount: data.length 
      });
      
      this.telemetry.trackMetric('data', 'weather_records_fetched', data.length, 'count');
      
      return data;

    } catch (error) {
      timer.end({ success: false, error: error.message });
      this.telemetry.trackError(error, 'WeatherDataService', 'getLatestData', {
        trackId
      });
      throw this.handleDataverseError(error);
    }
  }

  /**
   * Get historical weather data with pagination
   */
  async getHistoricalData(
    startDate: Date, 
    endDate: Date,
    pageSize: number = 100
  ): Promise<IWeatherData[]> {
    const cacheKey = `weather_historical_${startDate.getTime()}_${endDate.getTime()}`;
    
    // Use stale-while-revalidate pattern for historical data
    const cached = CacheService.get<IWeatherData[]>(cacheKey);
    if (cached) {
      // Return cached data immediately
      this.refreshHistoricalCache(startDate, endDate, cacheKey);
      return cached;
    }

    return this.fetchHistoricalData(startDate, endDate, pageSize, cacheKey);
  }

  private async fetchHistoricalData(
    startDate: Date,
    endDate: Date,
    pageSize: number,
    cacheKey: string
  ): Promise<IWeatherData[]> {
    const timer = this.telemetry.startTimer('fetch_historical_weather');
    const allData: IWeatherData[] = [];
    let nextLink: string | null = null;

    try {
      // Build OData query
      const filter = `createdon ge ${startDate.toISOString()} and createdon le ${endDate.toISOString()}`;
      let url = `${this.BASE_URL}/cr4cc_weatherdatas?$filter=${filter}&$top=${pageSize}&$orderby=createdon desc`;

      // Paginate through results
      do {
        await this.throttle.acquire();
        
        const response = await this.fetchWithAuth(nextLink || url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        const pageData = this.transformWeatherData(json.value);
        allData.push(...pageData);

        // Check for next page
        nextLink = json['@odata.nextLink'] || null;

        // Track progress
        this.telemetry.trackMetric('data', 'historical_pages_loaded', 1, 'count');

      } while (nextLink && allData.length < 1000); // Limit to 1000 records

      // Cache for 1 hour
      CacheService.set(cacheKey, allData, 60 * 60 * 1000);

      timer.end({
        success: true,
        recordCount: allData.length,
        dateRange: `${startDate.toISOString()}_${endDate.toISOString()}`
      });

      return allData;

    } catch (error) {
      timer.end({ success: false, error: error.message });
      this.telemetry.trackError(error, 'WeatherDataService', 'getHistoricalData');
      throw this.handleDataverseError(error);
    }
  }

  /**
   * Get active weather alerts
   */
  async getAlerts(): Promise<IWeatherAlert[]> {
    const cacheKey = 'weather_alerts_active';
    
    try {
      // Short cache for alerts (30 seconds)
      const cached = CacheService.get<IWeatherAlert[]>(cacheKey);
      if (cached && !CacheService.isExpired(cacheKey)) {
        return cached;
      }

      const alerts = await this.fetchAlerts();
      
      CacheService.set(cacheKey, alerts, 30 * 1000);
      
      // Track alert metrics
      this.telemetry.trackMetric('alerts', 'active_count', alerts.length, 'count');
      
      if (alerts.some(a => a.severity === 'critical')) {
        this.telemetry.trackEvent({
          name: 'critical_alert_detected',
          properties: {
            count: alerts.filter(a => a.severity === 'critical').length
          }
        });
      }

      return alerts;

    } catch (error) {
      this.telemetry.trackError(error, 'WeatherDataService', 'getAlerts');
      // Return empty array on error to prevent UI breaking
      return [];
    }
  }

  /**
   * Refresh all caches
   */
  async refreshCache(): Promise<void> {
    this.telemetry.trackAction('click', 'refresh_all_caches');
    
    // Clear weather-related caches
    CacheService.invalidate('weather_*');
    
    // Pre-populate cache with fresh data
    await Promise.all([
      this.getLatestData('all'),
      this.getAlerts()
    ]);
  }

  /**
   * Transform Dataverse response to domain model
   */
  private transformWeatherData(data: any[]): IWeatherData[] {
    return data.map(item => ({
      id: item.cr4cc_weatherdataid,
      trackName: item.cr4cc_track_name,
      temperature: item.cr4cc_temp_celsius,
      humidity: item.cr4cc_hum,
      windSpeed: item.cr4cc_wind_speed_kmh,
      windDirection: item.cr4cc_wind_dir_last,
      pressure: item.cr4cc_pressure_hpa,
      rainfall24hr: item.cr4cc_rainfall_last_24_hr_mm,
      dewPoint: item.cr4cc_dew_point_celsius,
      heatIndex: item.cr4cc_heat_index_celsius,
      battery: item.cr4cc_battery_percent,
      timestamp: new Date(item.createdon)
    }));
  }

  private async fetchAlerts(): Promise<IWeatherAlert[]> {
    // Mock implementation - replace with actual API
    return [
      {
        id: '1',
        title: 'High Temperature Warning',
        message: 'Temperature exceeds 35°C at Richmond',
        severity: 'warning',
        timestamp: new Date()
      }
    ];
  }

  private async refreshHistoricalCache(
    startDate: Date,
    endDate: Date,
    cacheKey: string
  ): Promise<void> {
    // Refresh cache in background
    this.fetchHistoricalData(startDate, endDate, 100, cacheKey)
      .catch(error => {
        console.error('Background cache refresh failed:', error);
      });
  }

  private handleDataverseError(error: any): Error {
    if (error.status === 401) {
      return new Error('Authentication failed. Please sign in again.');
    }
    if (error.status === 429) {
      return new Error('Too many requests. Please wait a moment.');
    }
    if (error.status >= 500) {
      return new Error('Dataverse service is temporarily unavailable.');
    }
    return new Error(error.message || 'Failed to fetch data');
  }
}
```

## Form with Error Handling

Complete form example with validation, error handling, and telemetry:

```typescript
// SettingsForm.tsx
import React, { useState, useEffect } from 'react';
import {
  ErrorBoundary,
  useErrorHandler,
  useTelemetry,
  useAsyncOperation,
  LoadingSpinner
} from '@grnsw/shared';
import { TextField, Dropdown, Toggle, PrimaryButton } from '@fluentui/react';
import styles from './SettingsForm.module.scss';

interface ISettingsFormData {
  refreshInterval: number;
  trackFilter: string[];
  enableAlerts: boolean;
  alertThreshold: number;
  emailNotifications: boolean;
  notificationEmail: string;
}

const SettingsFormContent: React.FC<{ context: any }> = ({ context }) => {
  const [formData, setFormData] = useState<ISettingsFormData>({
    refreshInterval: 60000,
    trackFilter: [],
    enableAlerts: true,
    alertThreshold: 35,
    emailNotifications: false,
    notificationEmail: ''
  });

  const [validation, setValidation] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const { handleError, error, clearError } = useErrorHandler({
    componentName: 'SettingsForm'
  });

  const { trackAction, trackMetric } = useTelemetry(context, {
    componentName: 'SettingsForm'
  });

  const { loadingState, execute } = useAsyncOperation();

  // Load existing settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    await execute(async () => {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setFormData(data);
      return data;
    }, 'Loading settings...');
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.emailNotifications && !formData.notificationEmail) {
      errors.notificationEmail = 'Email is required when notifications are enabled';
    }

    if (formData.notificationEmail && !isValidEmail(formData.notificationEmail)) {
      errors.notificationEmail = 'Please enter a valid email address';
    }

    if (formData.alertThreshold < 0 || formData.alertThreshold > 50) {
      errors.alertThreshold = 'Threshold must be between 0 and 50';
    }

    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    trackAction('submit', 'settings_form');
    clearError();

    if (!validateForm()) {
      trackAction('validation_failed', 'settings_form', {
        errors: Object.keys(validation)
      });
      return;
    }

    const result = await execute(async () => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      return response.json();
    }, 'Saving settings...');

    if (result) {
      trackAction('success', 'settings_saved');
      trackMetric('settings', 'saves', 1);
      setIsDirty(false);
      
      // Show success message
      alert('Settings saved successfully!');
    }
  };

  // Handle field changes
  const handleFieldChange = (field: keyof ISettingsFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear validation error for this field
    if (validation[field]) {
      setValidation(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    trackAction('field_change', field);
  };

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <form onSubmit={handleSubmit} className={styles.settingsForm}>
      <h2>Dashboard Settings</h2>

      {/* Refresh Interval */}
      <Dropdown
        label="Auto-Refresh Interval"
        selectedKey={formData.refreshInterval}
        onChange={(e, option) => handleFieldChange('refreshInterval', option?.key)}
        options={[
          { key: 30000, text: '30 seconds' },
          { key: 60000, text: '1 minute' },
          { key: 300000, text: '5 minutes' },
          { key: 600000, text: '10 minutes' }
        ]}
        required
      />

      {/* Track Filter */}
      <Dropdown
        label="Track Filter"
        multiSelect
        selectedKeys={formData.trackFilter}
        onChange={(e, option) => {
          if (option) {
            const newSelection = option.selected
              ? [...formData.trackFilter, option.key as string]
              : formData.trackFilter.filter(k => k !== option.key);
            handleFieldChange('trackFilter', newSelection);
          }
        }}
        options={[
          { key: 'richmond', text: 'Richmond' },
          { key: 'wentworth', text: 'Wentworth Park' },
          { key: 'gosford', text: 'Gosford' },
          { key: 'dapto', text: 'Dapto' }
        ]}
        placeholder="Select tracks to monitor"
      />

      {/* Alerts Section */}
      <div className={styles.section}>
        <h3>Alert Configuration</h3>
        
        <Toggle
          label="Enable Weather Alerts"
          checked={formData.enableAlerts}
          onChange={(e, checked) => handleFieldChange('enableAlerts', checked)}
        />

        {formData.enableAlerts && (
          <TextField
            label="Temperature Alert Threshold (°C)"
            type="number"
            value={formData.alertThreshold.toString()}
            onChange={(e, value) => handleFieldChange('alertThreshold', parseInt(value || '0'))}
            errorMessage={validation.alertThreshold}
            min={0}
            max={50}
          />
        )}

        <Toggle
          label="Email Notifications"
          checked={formData.emailNotifications}
          onChange={(e, checked) => handleFieldChange('emailNotifications', checked)}
        />

        {formData.emailNotifications && (
          <TextField
            label="Notification Email"
            type="email"
            value={formData.notificationEmail}
            onChange={(e, value) => handleFieldChange('notificationEmail', value || '')}
            errorMessage={validation.notificationEmail}
            placeholder="user@example.com"
            required
          />
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.error}>
          <p>{error.message}</p>
          <button type="button" onClick={clearError}>Dismiss</button>
        </div>
      )}

      {/* Form Actions */}
      <div className={styles.actions}>
        <PrimaryButton
          type="submit"
          disabled={loadingState.isLoading || !isDirty}
          text={loadingState.isLoading ? 'Saving...' : 'Save Settings'}
          iconProps={loadingState.isLoading ? undefined : { iconName: 'Save' }}
        />
        
        {loadingState.isLoading && <LoadingSpinner size="small" inline />}
        
        <button
          type="button"
          onClick={() => {
            setFormData({
              refreshInterval: 60000,
              trackFilter: [],
              enableAlerts: true,
              alertThreshold: 35,
              emailNotifications: false,
              notificationEmail: ''
            });
            setIsDirty(true);
            trackAction('click', 'reset_form');
          }}
          disabled={loadingState.isLoading}
        >
          Reset to Defaults
        </button>
      </div>

      {isDirty && (
        <div className={styles.unsavedWarning}>
          You have unsaved changes
        </div>
      )}
    </form>
  );
};

// Export with error boundary
export default (props: any) => (
  <ErrorBoundary
    fallback={({ error, retry }) => (
      <div className={styles.errorFallback}>
        <h3>Settings Form Error</h3>
        <p>{error.message}</p>
        <button onClick={retry}>Reload Form</button>
      </div>
    )}
  >
    <SettingsFormContent {...props} />
  </ErrorBoundary>
);
```

## Real-Time Data Component

Component with real-time updates and connection management:

```typescript
// RealTimeMonitor.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  useErrorHandler,
  useTelemetry,
  LoadingSpinner,
  ErrorBoundary
} from '@grnsw/shared';

const RealTimeMonitor: React.FC<{ context: any }> = ({ context }) => {
  const [data, setData] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);

  const { handleError } = useErrorHandler({ componentName: 'RealTimeMonitor' });
  const { trackAction, trackMetric, trackError } = useTelemetry(context, {
    componentName: 'RealTimeMonitor'
  });

  const connect = () => {
    try {
      setConnectionStatus('connecting');
      
      const ws = new WebSocket('wss://api.example.com/realtime');
      
      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        trackAction('websocket', 'connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setData(prev => [...prev.slice(-99), message]); // Keep last 100 messages
          trackMetric('realtime', 'messages_received', 1);
        } catch (error) {
          handleError(error, 'PARSE_ERROR');
        }
      };

      ws.onerror = (error) => {
        trackError(error, 'RealTimeMonitor', 'websocket');
        handleError(error, 'CONNECTION_ERROR');
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        trackAction('websocket', 'disconnected');
        
        // Reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      wsRef.current = ws;
    } catch (error) {
      handleError(error, 'CONNECTION_FAILED');
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div>
      <div className={`status ${connectionStatus}`}>
        Status: {connectionStatus}
        {connectionStatus === 'connecting' && <LoadingSpinner size="small" inline />}
      </div>
      
      <div className="data-stream">
        {data.map((item, index) => (
          <div key={index} className="data-item">
            {JSON.stringify(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default (props: any) => (
  <ErrorBoundary>
    <RealTimeMonitor {...props} />
  </ErrorBoundary>
);
```

## Complete Working Example - Analytics Dashboard

Full analytics dashboard with all infrastructure features:

```typescript
// AnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  ErrorBoundary,
  DataverseErrorBoundary,
  DashboardSkeleton,
  useTelemetry,
  useProgressiveLoading,
  LazyComponent,
  CacheService
} from '@grnsw/shared';

// Lazy load heavy analytics components
const ChartSection = React.lazy(() => 
  import(/* webpackChunkName: "analytics-charts" */ './ChartSection')
);

const ReportSection = React.lazy(() => 
  import(/* webpackChunkName: "analytics-reports" */ './ReportSection')
);

const AnalyticsDashboard: React.FC<{ context: any }> = ({ context }) => {
  const { trackAction, trackPerformance } = useTelemetry(context, {
    componentName: 'AnalyticsDashboard'
  });

  const { loadingState, results, executeSteps } = useProgressiveLoading();

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    await executeSteps([
      {
        name: 'metrics',
        message: 'Loading key metrics...',
        execute: async () => {
          const cached = CacheService.get('analytics_metrics');
          if (cached) return cached;
          
          const data = await trackPerformance('fetch_metrics', async () => {
            const response = await fetch('/api/analytics/metrics');
            return response.json();
          });
          
          CacheService.set('analytics_metrics', data, 10 * 60 * 1000);
          return data;
        }
      },
      {
        name: 'trends',
        message: 'Analyzing trends...',
        execute: async () => {
          const response = await fetch('/api/analytics/trends');
          return response.json();
        }
      },
      {
        name: 'predictions',
        message: 'Generating predictions...',
        execute: async () => {
          const response = await fetch('/api/analytics/predictions');
          return response.json();
        }
      }
    ]);
  };

  if (loadingState.isLoading && !results.metrics) {
    return <DashboardSkeleton type="analytics" />;
  }

  return (
    <div className="analytics-dashboard">
      {/* Key Metrics */}
      {results.metrics && (
        <div className="metrics-section">
          <h2>Key Performance Indicators</h2>
          <MetricsGrid data={results.metrics} />
        </div>
      )}

      {/* Charts Section */}
      {results.trends && (
        <React.Suspense fallback={<LoadingSpinner label="Loading charts..." />}>
          <LazyComponent
            importFunction={() => import('./ChartSection')}
            componentProps={{ data: results.trends }}
            preload={true}
          />
        </React.Suspense>
      )}

      {/* Reports Section */}
      {results.predictions && (
        <React.Suspense fallback={<LoadingSpinner label="Loading reports..." />}>
          <LazyComponent
            importFunction={() => import('./ReportSection')}
            componentProps={{ data: results.predictions }}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default (props: any) => (
  <ErrorBoundary>
    <DataverseErrorBoundary>
      <AnalyticsDashboard {...props} />
    </DataverseErrorBoundary>
  </ErrorBoundary>
);
```

## Best Practices Summary

1. **Always wrap components with error boundaries**
2. **Use telemetry for all user actions and data operations**
3. **Implement proper loading states with skeletons**
4. **Cache API responses appropriately**
5. **Lazy load heavy components**
6. **Handle errors gracefully with user-friendly messages**
7. **Use progressive loading for complex dashboards**
8. **Implement retry logic for network operations**
9. **Track performance metrics**
10. **Provide fallback UI for all error scenarios**