import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import styles from './WeatherDashboard.module.scss';
import type { IWeatherDashboardProps } from './IWeatherDashboardProps';
import { DataverseService } from '../../../services';
import { IDataverseWeatherData } from '../../../models/IDataverseWeatherData';
import { Icon } from '@fluentui/react/lib/Icon';

// Import new infrastructure components from @grnsw/shared
import { 
  ErrorBoundary,
  DashboardSkeleton,
  useTelemetry,
  useLoadingState
} from '@grnsw/shared';

// Placeholder types and components - to be moved to @grnsw/shared in future
interface DataGridColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  dot?: boolean;
}

interface FilterPanelProps {
  title: string;
  theme?: unknown;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

interface DataGridProps<T> {
  data: T[];
  columns: DataGridColumn<T>[];
  theme?: unknown;
  pagination?: boolean;
  pageSize?: number;
  sortable?: boolean;
  loading?: boolean;
  error?: string;
}

// Placeholder components for build compatibility
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'success' }) => (
  <span className={`status-badge status-badge--${variant}`}>{status}</span>
);

const FilterPanel: React.FC<FilterPanelProps> = ({ title, children, collapsible, defaultExpanded }) => (
  <div className="filter-panel">
    <h3>{title}</h3>
    <div className="filter-panel__content">
      {children}
    </div>
  </div>
);

const DataGrid = <T extends object>({ data, columns, loading, error }: DataGridProps<T>): JSX.Element => {
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data.length) return <div>No data available</div>;
  
  return (
    <div className="data-grid">
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={String(col.key)}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={String(col.key)}>
                  {col.render ? col.render(item) : String(item[col.key] || 'N/A')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Modern Weather Dashboard component with infrastructure improvements
 * Demonstrates integration of error boundaries, loading states, telemetry, and lazy loading
 */
const WeatherDashboard: React.FC<IWeatherDashboardProps> = ({
  context,
  isDarkTheme,
  hasTeamsContext
}) => {
  // Initialize telemetry service for performance monitoring
  const { 
    trackAction, 
    trackPerformance, 
    trackError,
    trackMetric 
  } = useTelemetry(context, {
    componentName: 'WeatherDashboard',
    enabled: true,
    autoTrackLifecycle: true
  });

  // Advanced loading state management with error handling and progress tracking
  const { loadingState, startLoading, stopLoading, setError } = useLoadingState();
  const [data, setData] = useState<IDataverseWeatherData[]>([]);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Initialize service
  const [dataverseService] = useState(() => new DataverseService(context));
  
  // Load weather data with telemetry tracking
  const loadWeatherData = useCallback(async () => {
    trackAction('click', 'refresh_weather_data');
    startLoading();
    
    try {
      const result = await trackPerformance('load_weather_data', async () => {
        const weatherData = await dataverseService.getLatestWeatherData(20);
        
        // Track business metrics
        trackMetric('data_usage', 'weather_records_loaded', weatherData.length, 'count');
        trackMetric('performance', 'weather_data_points', 
          weatherData.reduce((sum, record) => sum + Object.keys(record).length, 0), 'count');
        
        return weatherData;
      });
      
      setData(result);
      stopLoading();
      return result;
    } catch (error: unknown) {
      // Don't show errors for cancelled/aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        return [];
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      trackError(error instanceof Error ? error : new Error(errorMessage), 'weather_service', 'load_weather_data');
      setError(errorMessage);
      stopLoading();
      throw error;
    }
  }, [dataverseService, trackAction, trackPerformance, trackError, trackMetric, startLoading, stopLoading, setError]);

  // Load data on component mount and cleanup on unmount
  useEffect(() => {
    void loadWeatherData();
    
    // Cleanup function to dispose of DataverseService
    return () => {
      if (dataverseService) {
        dataverseService.dispose();
      }
    };
  }, [loadWeatherData]);

  const handleViewModeChange = (mode: 'grid' | 'table'): void => {
    trackAction('click', 'view_mode_change', { mode });
    setViewMode(mode);
  };

  // Define columns for DataGrid view
  const columns: DataGridColumn<IDataverseWeatherData>[] = [
    {
      key: 'cr4cc_track_name',
      label: 'Track/Station',
      sortable: true,
      render: (item) => item.cr4cc_track_name || item.cr4cc_station_id || 'Weather Station'
    },
    {
      key: 'cr4cc_temp_celsius',
      label: 'Temperature (°C)',
      sortable: true,
      render: (item) => item.cr4cc_temp_celsius?.toFixed(1) || 'N/A'
    },
    {
      key: 'cr4cc_hum',
      label: 'Humidity (%)',
      sortable: true,
      render: (item) => item.cr4cc_hum ? `${item.cr4cc_hum}%` : 'N/A'
    },
    {
      key: 'cr4cc_wind_speed_kmh',
      label: 'Wind Speed (km/h)',
      sortable: true,
      render: (item) => item.cr4cc_wind_speed_kmh?.toFixed(1) || 'N/A'
    },
    {
      key: 'cr4cc_rainfall_last_24_hr_mm',
      label: 'Rain 24hr (mm)',
      sortable: true,
      render: (item) => item.cr4cc_rainfall_last_24_hr_mm?.toFixed(1) || 'N/A'
    },
    {
      key: 'cr4cc_battery_percent',
      label: 'Battery',
      sortable: true,
      render: (item) => (
        <StatusBadge 
          status={`${item.cr4cc_battery_percent}%`}
          variant={
            item.cr4cc_battery_percent > 75 ? 'success' :
            item.cr4cc_battery_percent > 25 ? 'warning' : 'error'
          }
          size="small"
        />
      )
    },
    {
      key: 'createdon',
      label: 'Last Updated',
      sortable: true,
      render: (item) => new Date(item.createdon).toLocaleString()
    }
  ];

  // Render weather card with telemetry tracking
  const renderWeatherCard = useCallback((weatherData: IDataverseWeatherData): JSX.Element => {
    const handleCardClick = () => {
      trackAction('click', 'weather_card', {
        stationId: weatherData.cr4cc_station_id || 'unknown',
        trackName: weatherData.cr4cc_track_name || 'unknown'
      });
    };

    return (
      <div 
        key={weatherData.cr4cc_weatherdataid} 
        className={styles.weatherCard}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      >
        <h4>{weatherData.cr4cc_track_name || weatherData.cr4cc_station_id || 'Weather Station'}</h4>
        <div className={styles.weatherDetails}>
          <p><strong>Temperature:</strong> {weatherData.cr4cc_temp_celsius?.toFixed(1)}°C</p>
          <p><strong>Humidity:</strong> {weatherData.cr4cc_hum}%</p>
          <p><strong>Dew Point:</strong> {weatherData.cr4cc_dew_point_celsius?.toFixed(1)}°C</p>
          <p><strong>Heat Index:</strong> {weatherData.cr4cc_heat_index_celsius?.toFixed(1)}°C</p>
          <p><strong>Wind Speed:</strong> {weatherData.cr4cc_wind_speed_kmh?.toFixed(1)} km/h</p>
          <p><strong>Wind Direction:</strong> {weatherData.cr4cc_wind_dir_last}°</p>
          <p><strong>Pressure:</strong> {weatherData.cr4cc_pressure_hpa} hPa</p>
          <p><strong>Rain (24hr):</strong> {weatherData.cr4cc_rainfall_last_24_hr_mm?.toFixed(1)} mm</p>
        </div>
        <div className={styles.stationInfo}>
          <p><strong>Battery:</strong> {weatherData.cr4cc_battery_percent}%</p>
          <p><strong>Solar Panel:</strong> {weatherData.cr4cc_solar_panel_volt?.toFixed(2)}V</p>
        </div>
        <div className={styles.timestamp}>
          {new Date(weatherData.createdon).toLocaleString()}
        </div>
      </div>
    );
  }, [trackAction]);

  const handleRefresh = useCallback(() => {
    void loadWeatherData();
  }, [loadWeatherData]);

  return (
    <section className={`${styles.weatherDashboard} ${hasTeamsContext ? styles.teams : ''} ${isDarkTheme ? styles.dark : ''}`}>
      {/* Header Section */}
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Weather Dashboard (Modern)</h2>
          <Icon iconName="PartlySunny" style={{ fontSize: 32, color: '#0078d4' }} />
        </div>
        <p>Live weather data with enhanced loading states, error handling, and telemetry</p>
      </div>

      {/* Controls Section */}
      <div className={styles.controls}>
        <button 
          onClick={handleRefresh} 
          disabled={loadingState.isLoading}
          aria-label="Refresh weather data"
        >
          {loadingState.isLoading ? 'Loading...' : 'Refresh'}
        </button>
        
        <div style={{ marginLeft: '16px' }}>
          <label style={{ marginRight: '16px' }}>
            <input
              type="radio"
              value="grid"
              checked={viewMode === 'grid'}
              onChange={() => handleViewModeChange('grid')}
              style={{ marginRight: '4px' }}
            />
            Card View
          </label>
          <label>
            <input
              type="radio"
              value="table"
              checked={viewMode === 'table'}
              onChange={() => handleViewModeChange('table')}
              style={{ marginRight: '4px' }}
            />
            Table View
          </label>
        </div>
        
        {loadingState.isLoading && (
          <span style={{ marginLeft: '16px', fontSize: '14px', color: '#666' }}>
            {loadingState.message}
          </span>
        )}
      </div>

      {/* Loading State with Dashboard Skeleton */}
      {loadingState.isLoading && !data && (
        <DashboardSkeleton 
          type="weather"
          showHeader={false}
          showStats={true}
          statsCount={4}
          showCharts={false}
          showTable={false}
          animated={true}
        />
      )}

      {/* Error State */}
      {loadingState.error && (
        <div className={styles.error}>
          <h3>⚠️ Weather Data Error</h3>
          <p><strong>Error:</strong> {loadingState.error}</p>
          <button 
            onClick={() => {
              trackAction('click', 'retry_after_error');
              void loadWeatherData();
            }}
            style={{ 
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: '#0078d4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry Loading
          </button>
        </div>
      )}

      {/* No Data State */}
      {!loadingState.isLoading && !loadingState.error && (!data || data.length === 0) && (
        <div className={styles.noData}>
          <Icon iconName="CloudOffline" style={{ fontSize: 48, color: '#666', marginBottom: '16px' }} />
          <h3>No Weather Data Available</h3>
          <p>Unable to retrieve weather data at this time. Please try refreshing.</p>
          <button onClick={handleRefresh} style={{ marginTop: '12px' }}>
            🔄 Try Again
          </button>
        </div>
      )}

      {/* Main Content - Weather Cards */}
      {!loadingState.isLoading && data && data.length > 0 && (
        <>
          {/* Weather Data Display */}
          {viewMode === 'table' ? (
            <DataGrid<IDataverseWeatherData>
              data={data}
              columns={columns as DataGridColumn<IDataverseWeatherData>[]}
              theme={"light" as unknown}
              pagination
              pageSize={10}
              sortable
              loading={loadingState.isLoading}
              error={loadingState.error || undefined}
            />
          ) : (
            <div className={styles.weatherGrid}>
              {data.map(renderWeatherCard)}
            </div>
          )}

          {/* Lazy-loaded Weather Trend Chart */}
          {/* Chart component will be re-enabled when WeatherTrendChart is implemented
          {data.length > 5 && (
            <div style={{ marginTop: '32px' }}>
              <h3>Weather Trends (Lazy Loaded)</h3>
              <LazyComponent
                importFunction={() => import('../../../components/charts/WeatherTrendChart')}
                componentProps={{ data }}
                loadingText="Loading weather trend chart..."
                preload={false}
                retryAttempts={2}
              />
            </div>
          )}
          */}
        </>
      )}

      {/* Real-time Status Footer */}
      <div style={{ 
        marginTop: '24px', 
        padding: '12px', 
        backgroundColor: isDarkTheme ? '#2d2d2d' : '#f8f9fa',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666',
        border: '1px solid ' + (isDarkTheme ? '#444' : '#e1e1e1')
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span>
            📊 Data Points: {data?.reduce((sum, record) => sum + Object.keys(record).length, 0) || 0}
          </span>
          <span>
            🔄 Last Updated: {data?.length ? new Date(data[0].createdon).toLocaleString() : 'Never'}
          </span>
          <span>
            ⚡ Status: {loadingState.isLoading ? 'Loading...' : (loadingState.error ? 'Error' : 'Ready')}
          </span>
        </div>
      </div>
    </section>
  );
};

/**
 * Weather Dashboard with comprehensive error boundaries
 * Wraps the main component with error handling for production resilience
 */
const WeatherDashboardWithErrorBoundaries: React.FC<IWeatherDashboardProps> = (props): JSX.Element => {
  return (
    <ErrorBoundary
      fallback={(props: {error?: Error; reset?: () => void; retry?: () => void}) => (
        <div style={{ 
          padding: '40px 20px', 
          textAlign: 'center',
          border: '2px dashed #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5'
        }}>
          <h2>🛠️ Component Error</h2>
          <p>The Weather Dashboard encountered an unexpected error and needs to be reloaded.</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '12px' }}>
            <strong>Technical Details:</strong> {props.error?.message}
          </p>
          <button 
            onClick={props.retry || (() => window.location.reload())}
            style={{ 
              marginTop: '16px',
              padding: '12px 24px', 
              backgroundColor: '#0078d4', 
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔄 Reload Component
          </button>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.error('Weather Dashboard Error Boundary:', error, errorInfo);
      }}
    >
      <WeatherDashboard {...props} />
    </ErrorBoundary>
  );
};

export default WeatherDashboardWithErrorBoundaries;