import * as React from 'react';
import styles from './WeatherDashboard.module.scss';
import type { IWeatherDashboardProps } from './IWeatherDashboardProps';
import { DataverseService } from '../../../services';
import { IDataverseWeatherData } from '../../../models/IDataverseWeatherData';
import { Logger, ErrorHandler } from '../../../utils';
import { Icon } from '@fluentui/react/lib/Icon';

interface IWeatherDashboardState {
  weatherData: IDataverseWeatherData[];
  loading: boolean;
  error: string | undefined;
}

export default class WeatherDashboard extends React.Component<IWeatherDashboardProps, IWeatherDashboardState> {
  private dataverseService: DataverseService;

  constructor(props: IWeatherDashboardProps) {
    super(props);
    
    this.state = {
      weatherData: [],
      loading: false,
      error: undefined
    };

    this.dataverseService = new DataverseService(this.props.context);
  }

  public async componentDidMount(): Promise<void> {
    await this.loadWeatherData();
  }

  public componentWillUnmount(): void {
    // Cancel any pending requests and dispose of service
    if (this.dataverseService) {
      this.dataverseService.dispose();
    }
  }

  private async loadWeatherData(): Promise<void> {
    this.setState({ loading: true, error: undefined });
    
    try {
      Logger.info('Loading data from Dataverse', 'WeatherDashboard');
      const data = await this.dataverseService.getLatestWeatherData(20);
      
      this.setState({ weatherData: data, loading: false });
      Logger.info(`Loaded ${data.length} weather records`, 'WeatherDashboard');
    } catch (error) {
      // Don't show errors for cancelled/aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      const errorObj = ErrorHandler.handleError(error, 'WeatherDashboard');
      this.setState({ 
        error: ErrorHandler.formatErrorMessage(errorObj), 
        loading: false 
      });
    }
  }

  private renderWeatherCard(data: IDataverseWeatherData): JSX.Element {
    return (
      <div key={data.cr4cc_weatherdataid} className={styles.weatherCard}>
        <h4>{data.cr4cc_track_name || data.cr4cc_station_id || 'Weather Station'}</h4>
        <div className={styles.weatherDetails}>
          <p><strong>Temperature:</strong> {data.cr4cc_temp_celsius?.toFixed(1)}°C</p>
          <p><strong>Humidity:</strong> {data.cr4cc_hum}%</p>
          <p><strong>Dew Point:</strong> {data.cr4cc_dew_point_celsius?.toFixed(1)}°C</p>
          <p><strong>Heat Index:</strong> {data.cr4cc_heat_index_celsius?.toFixed(1)}°C</p>
          <p><strong>Wind Speed:</strong> {data.cr4cc_wind_speed_kmh?.toFixed(1)} km/h</p>
          <p><strong>Wind Direction:</strong> {data.cr4cc_wind_dir_last}°</p>
          <p><strong>Pressure:</strong> {data.cr4cc_pressure_hpa} hPa</p>
          <p><strong>Rain (24hr):</strong> {data.cr4cc_rainfall_last_24_hr_mm?.toFixed(1)} mm</p>
        </div>
        <div className={styles.stationInfo}>
          <p><strong>Battery:</strong> {data.cr4cc_battery_percent}%</p>
          <p><strong>Solar Panel:</strong> {data.cr4cc_solar_panel_volt?.toFixed(2)}V</p>
        </div>
        <div className={styles.timestamp}>
          {new Date(data.createdon).toLocaleString()}
        </div>
      </div>
    );
  }

  public render(): React.ReactElement<IWeatherDashboardProps> {
    const { isDarkTheme, hasTeamsContext } = this.props;
    const { weatherData, loading, error } = this.state;

    return (
      <section className={`${styles.weatherDashboard} ${hasTeamsContext ? styles.teams : ''} ${isDarkTheme ? styles.dark : ''}`}>
        <div className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Weather Dashboard</h2>
            <Icon iconName="PartlySunny" style={{ fontSize: 32, color: '#0078d4' }} />
          </div>
          <p>Live weather data from Dataverse with 181 data points</p>
        </div>

        <div className={styles.controls}>
          <button onClick={() => this.loadWeatherData()} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading weather data...</p>
          </div>
        )}

        {!loading && !error && weatherData.length === 0 && (
          <div className={styles.noData}>
            No weather data available
          </div>
        )}

        {!loading && weatherData.length > 0 && (
          <div className={styles.weatherGrid}>
            {weatherData.map(data => this.renderWeatherCard(data))}
          </div>
        )}
      </section>
    );
  }
}