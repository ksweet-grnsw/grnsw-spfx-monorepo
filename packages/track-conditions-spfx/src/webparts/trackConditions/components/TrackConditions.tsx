import * as React from 'react';
import styles from './TrackConditions.module.scss';
import type { ITrackConditionsProps } from './ITrackConditionsProps';
import { IDataverseWeatherData } from '../../../models/IDataverseWeatherData';
import { DataverseService } from '../../../services/DataverseService';
import { Icon } from '@fluentui/react/lib/Icon';
import { degreesToCardinal } from '../../../utils/windUtils';

export interface ITrackConditionsState {
  weatherData: IDataverseWeatherData | null;
  loading: boolean;
  error: string | null;
  selectedPeriod: string;
  historicalData: IDataverseWeatherData[];
}

export interface ITrackCondition {
  surface: 'Dry' | 'Damp' | 'Wet';
  gripLevel: number;
  visibility: number;
  windImpact: 'Low' | 'Medium' | 'High';
  overallRating: 'Optimal' | 'Good' | 'Fair' | 'Poor';
  alerts: string[];
  trackTemp: number;
  airTemp: number;
  humidity: number;
  dryingRate: number;
}

export default class TrackConditions extends React.Component<ITrackConditionsProps, ITrackConditionsState> {
  private dataverseService: DataverseService;
  private refreshInterval: number | null = null;

  constructor(props: ITrackConditionsProps) {
    super(props);
    this.state = {
      weatherData: null,
      loading: false,
      error: null,
      selectedPeriod: '1h',
      historicalData: []
    };
    this.dataverseService = new DataverseService(props.context);
  }

  public componentDidMount(): void {
    this.loadWeatherData();
    this.refreshInterval = window.setInterval(() => this.loadWeatherData(), 300000);
  }

  public componentWillUnmount(): void {
    if (this.refreshInterval) {
      window.clearInterval(this.refreshInterval);
    }
  }

  public componentDidUpdate(prevProps: ITrackConditionsProps): void {
    if (prevProps.selectedTrackId !== this.props.selectedTrackId) {
      this.loadWeatherData();
    }
  }

  private async loadWeatherData(): Promise<void> {
    if (!this.props.selectedTrackId) {
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      // Get the display name for the track
      const trackDisplayName = this.getTrackDisplayName(this.props.selectedTrackId);
      // Use exact match with track name
      const filter = `cr4cc_track_name eq '${trackDisplayName}'`;
      const query = `$filter=${filter}&$orderby=createdon desc&$top=1`;
      
      console.log('Track Conditions - Loading data for:', trackDisplayName);
      console.log('Track Conditions - Filter:', filter);
      
      const data = await this.dataverseService.getWeatherDataWithQuery(query);
      const weatherData = data && data.length > 0 ? data[0] : null;
      
      this.setState({ 
        weatherData,
        historicalData: [],
        loading: false 
      });
      
      if (!weatherData) {
        console.log('Track Conditions - No data found for track:', trackDisplayName);
      }
    } catch (error) {
      console.error('Track Conditions - Error loading weather data:', error);
      this.setState({ 
        error: 'Failed to load weather data',
        loading: false 
      });
    }
  }

  private getTrackDisplayName(trackId: string): string {
    // Convert track ID like 'wentworth-park' to 'Wentworth Park'
    if (!trackId) return '';
    return trackId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }


  private calculateTrackConditions(): ITrackCondition | null {
    const { weatherData } = this.state;
    if (!weatherData) return null;

    const rainfall1h = weatherData.cr4cc_rainfall_last_24_hr_mm ? weatherData.cr4cc_rainfall_last_24_hr_mm / 24 : 0;
    const rainfall6h = weatherData.cr4cc_rainfall_last_24_hr_mm ? weatherData.cr4cc_rainfall_last_24_hr_mm / 4 : 0;
    const humidity = weatherData.cr4cc_hum || 0;
    const windSpeed = weatherData.cr4cc_wind_speed_avg_last_10_min || 0;
    const visibility = 10000; // Default visibility
    const airTemp = weatherData.cr4cc_temp_celsius || 20;
    const solarRadiation = weatherData.cr4cc_solar_rad || 0;
    const dewPoint = weatherData.cr4cc_dew_point_celsius || 0;
    
    // Calculate track temperature (simplified model)
    const trackTemp = airTemp + (solarRadiation / 50) - (windSpeed / 2);
    
    // Surface condition
    let surface: 'Dry' | 'Damp' | 'Wet' = 'Dry';
    if (rainfall1h > 0.5 || rainfall6h > 5) {
      surface = 'Wet';
    } else if (rainfall1h > 0 || humidity > 85 || airTemp - dewPoint < 2) {
      surface = 'Damp';
    }
    
    // Track safety score (0-100) for greyhound racing
    let gripLevel = 100;
    if (surface === 'Wet') {
      gripLevel = 40 + Math.max(0, 20 - rainfall1h * 10);
    } else if (surface === 'Damp') {
      gripLevel = 70 + Math.max(0, 15 - humidity / 6);
    } else {
      gripLevel = Math.min(100, 85 + Math.min(15, (trackTemp - 10) / 2));
    }
    
    // Visibility score (0-100)
    const visibilityScore = Math.min(100, (visibility / 10000) * 100);
    
    // Wind impact
    let windImpact: 'Low' | 'Medium' | 'High' = 'Low';
    if (windSpeed > 40) {
      windImpact = 'High';
    } else if (windSpeed > 20) {
      windImpact = 'Medium';
    }
    
    // Drying rate
    const dryingRate = surface !== 'Dry' ? 
      Math.max(0, ((airTemp - 10) / 10) + (windSpeed / 20) + (solarRadiation / 200)) : 0;
    
    // Overall rating
    let overallRating: 'Optimal' | 'Good' | 'Fair' | 'Poor' = 'Optimal';
    const avgScore = (gripLevel + visibilityScore) / 2;
    if (avgScore < 40 || windImpact === 'High') {
      overallRating = 'Poor';
    } else if (avgScore < 60 || windImpact === 'Medium') {
      overallRating = 'Fair';
    } else if (avgScore < 80) {
      overallRating = 'Good';
    }
    
    // Generate alerts for greyhound racing
    const alerts: string[] = [];
    if (surface === 'Wet') {
      alerts.push('Wet track - Increased injury risk for greyhounds');
    }
    if (windSpeed > 40) {
      alerts.push('Strong winds may affect greyhound performance');
    }
    if (visibilityScore < 50) {
      alerts.push('Reduced visibility conditions');
    }
    if (trackTemp > 35) {
      alerts.push('High track temperature - Risk of paw pad burns');
    }
    if (trackTemp < 5) {
      alerts.push('Cold track - Risk of muscle injuries');
    }
    
    return {
      surface,
      gripLevel: Math.round(gripLevel),
      visibility: Math.round(visibilityScore),
      windImpact,
      overallRating,
      alerts,
      trackTemp: Math.round(trackTemp),
      airTemp: Math.round(airTemp),
      humidity: Math.round(humidity),
      dryingRate: Math.round(dryingRate * 10) / 10
    };
  }

  private getConditionColor(rating: string): string {
    switch (rating) {
      case 'Optimal': return '#4CAF50';
      case 'Good': return '#8BC34A';
      case 'Fair': return '#FF9800';
      case 'Poor': return '#F44336';
      default: return '#757575';
    }
  }

  private renderGauge(value: number, label: string, color: string = '#2196F3'): JSX.Element {
    const radius = 45;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    // Calculate offset to show completed portion in color
    const strokeDashoffset = circumference - (circumference * value / 100);

    return (
      <div className={styles.gauge}>
        <svg height={radius * 2} width={radius * 2}>
          <circle
            stroke="#E0E0E0"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <text x="50%" y="50%" textAnchor="middle" dy=".3em" className={styles.gaugeValue}>
            {value}%
          </text>
        </svg>
        <div className={styles.gaugeLabel}>{label}</div>
      </div>
    );
  }

  public render(): React.ReactElement<ITrackConditionsProps> {
    const { weatherData, loading, error } = this.state;
    const { hasTeamsContext } = this.props;
    const conditions = this.calculateTrackConditions();

    if (!this.props.selectedTrackId) {
      return (
        <div className={`${styles.trackConditions} ${hasTeamsContext ? styles.teams : ''}`}>
          <div className={styles.noData}>Please select a track in the web part properties</div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className={`${styles.trackConditions} ${hasTeamsContext ? styles.teams : ''}`}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            Loading track conditions...
          </div>
        </div>
      );
    }

    if (error || !weatherData || !conditions) {
      return (
        <div className={`${styles.trackConditions} ${hasTeamsContext ? styles.teams : ''}`}>
          <div className={styles.error}>{error || 'No weather data available'}</div>
        </div>
      );
    }

    return (
      <div className={`${styles.trackConditions} ${hasTeamsContext ? styles.teams : ''}`}>
        <div className={styles.trackTitle}>
          <h1>{this.props.selectedTrackName}</h1>
        </div>
        <div className={styles.header}>
          <h2>Track Conditions Analysis</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
            <div className={styles.timestamp}>
              Last updated: {new Date(weatherData.cr4cc_last_packet_received_timestamp || Date.now()).toLocaleTimeString()}
            </div>
            <Icon iconName="Flag" style={{ fontSize: 24, color: '#333333' }} />
          </div>
        </div>

        <div className={styles.overallCondition} style={{ borderColor: this.getConditionColor(conditions.overallRating) }}>
          <div className={styles.rating} style={{ color: this.getConditionColor(conditions.overallRating) }}>
            {conditions.overallRating}
          </div>
          <div className={styles.surface}>
            Track Surface: <strong>{conditions.surface}</strong>
          </div>
        </div>

        {conditions.alerts.length > 0 && (
          <div className={styles.alerts}>
            {conditions.alerts.map((alert, index) => (
              <div key={index} className={styles.alert}>
                ⚠️ {alert}
              </div>
            ))}
          </div>
        )}

        <div className={styles.metrics}>
          {this.renderGauge(conditions.gripLevel, 'Track Safety', '#4CAF50')}
          {this.renderGauge(conditions.visibility, 'Visibility', '#2196F3')}
          <div className={styles.windImpact}>
            <div className={styles.windLabel}>Wind Impact</div>
            <div className={`${styles.windValue} ${conditions.windImpact.toLowerCase() === 'low' ? styles.low : conditions.windImpact.toLowerCase() === 'medium' ? styles.medium : styles.high}`}>
              {conditions.windImpact}
            </div>
          </div>
        </div>

        <div className={styles.scoreExplanation}>
          <h4>Track Safety Score Calculation</h4>
          <p>The track safety score (0-100) is calculated based on:</p>
          <ul>
            <li><strong>Surface Condition:</strong> Dry tracks start at 85-100, damp tracks at 70-85, wet tracks at 40-60</li>
            <li><strong>Rainfall Impact:</strong> Recent rainfall reduces the score proportionally</li>
            <li><strong>Humidity Factor:</strong> High humidity (&gt;85%) indicates potential dampness</li>
            <li><strong>Temperature Adjustment:</strong> Optimal track temperature improves grip and safety</li>
            <li><strong>Dew Point Proximity:</strong> When air temp is close to dew point, condensation risk increases</li>
          </ul>
          <p>A higher score indicates safer racing conditions for greyhounds with better grip and reduced injury risk.</p>
        </div>

        <div className={styles.conditions}>
          <div className={styles.conditionCard}>
            <div className={styles.conditionTitle}>Temperature</div>
            <div className={styles.conditionData}>
              <div>
                <span className={styles.label}>Track:</span>
                <span className={styles.value}>{conditions.trackTemp}°C</span>
              </div>
              <div>
                <span className={styles.label}>Air:</span>
                <span className={styles.value}>{conditions.airTemp}°C</span>
              </div>
            </div>
          </div>

          <div className={styles.conditionCard}>
            <div className={styles.conditionTitle}>Moisture</div>
            <div className={styles.conditionData}>
              <div>
                <span className={styles.label}>Humidity:</span>
                <span className={styles.value}>{conditions.humidity}%</span>
              </div>
              {conditions.surface !== 'Dry' && (
                <div>
                  <span className={styles.label}>Drying Rate:</span>
                  <span className={styles.value}>{conditions.dryingRate}/hr</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.conditionCard}>
            <div className={styles.conditionTitle}>Wind</div>
            <div className={styles.conditionData}>
              <div>
                <span className={styles.label}>Speed:</span>
                <span className={styles.value}>{Math.round(weatherData.cr4cc_wind_speed_avg_last_10_min || 0)} km/h</span>
              </div>
              <div>
                <span className={styles.label}>Direction:</span>
                <span className={styles.value}>
                  {degreesToCardinal(weatherData.cr4cc_wind_dir_scalar_avg_last_10_min || 0)} ({Math.round(weatherData.cr4cc_wind_dir_scalar_avg_last_10_min || 0)}°)
                </span>
              </div>
            </div>
          </div>

          <div className={styles.conditionCard}>
            <div className={styles.conditionTitle}>Rainfall</div>
            <div className={styles.conditionData}>
              <div>
                <span className={styles.label}>1 hour:</span>
                <span className={styles.value}>{(weatherData.cr4cc_rainfall_last_24_hr_mm ? weatherData.cr4cc_rainfall_last_24_hr_mm / 24 : 0).toFixed(1)} mm</span>
              </div>
              <div>
                <span className={styles.label}>6 hour:</span>
                <span className={styles.value}>{(weatherData.cr4cc_rainfall_last_24_hr_mm ? weatherData.cr4cc_rainfall_last_24_hr_mm / 4 : 0).toFixed(1)} mm</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.recommendations}>
          <h3>Race Recommendations</h3>
          <ul>
            {conditions.surface === 'Wet' && (
              <li>Consider postponing races - wet track increases injury risk</li>
            )}
            {conditions.surface === 'Damp' && (
              <li>Monitor track conditions closely - may need additional maintenance</li>
            )}
            {conditions.trackTemp > 30 && (
              <li>Ensure adequate hydration for greyhounds between races</li>
            )}
            {conditions.trackTemp < 10 && (
              <li>Allow extra warm-up time to prevent muscle injuries</li>
            )}
            {conditions.windImpact !== 'Low' && (
              <li>Strong winds may affect greyhound times and performance</li>
            )}
            {conditions.visibility < 70 && (
              <li>Ensure track lighting is optimal for handlers and officials</li>
            )}
          </ul>
        </div>
      </div>
    );
  }
}