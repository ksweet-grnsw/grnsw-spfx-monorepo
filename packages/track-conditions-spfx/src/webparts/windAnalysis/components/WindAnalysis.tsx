import * as React from 'react';
import styles from './WindAnalysis.module.scss';
import type { IWindAnalysisProps } from './IWindAnalysisProps';
import { DataverseService } from '../../../services';
import { IDataverseWeatherData } from '../../../models/IDataverseWeatherData';
import { Logger, ErrorHandler } from '../../../utils';
import { degreesToCardinal } from '../../../utils/windUtils';
import { Icon } from '@fluentui/react/lib/Icon';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

type TimePeriod = 'today' | 'week' | 'month';
type ViewType = 'current' | 'windrose';

interface IWindAnalysisState {
  selectedPeriod: TimePeriod;
  windData: IDataverseWeatherData[];
  loading: boolean;
  error: string | null;
  trackName: string;
  viewType: ViewType;
}

interface WindRoseData {
  direction: string;
  degrees: number;
  speedCategories: {
    '0-3': number;
    '3-6': number;
    '6-10': number;
    '10-13': number;
    '13-16': number;
    '16-32': number;
    '32+': number;
  };
  totalCount: number;
}

export default class WindAnalysis extends React.Component<IWindAnalysisProps, IWindAnalysisState> {
  private dataverseService: DataverseService;

  constructor(props: IWindAnalysisProps) {
    super(props);
    
    this.state = {
      selectedPeriod: 'today',
      windData: [],
      loading: false,
      error: null,
      trackName: '',
      viewType: 'current'
    };

    this.dataverseService = new DataverseService(this.props.context);
  }

  public async componentDidMount(): Promise<void> {
    // Cache cleared
    await this.loadWindData();
  }

  public async componentDidUpdate(prevProps: IWindAnalysisProps): Promise<void> {
    if (prevProps.selectedTrack !== this.props.selectedTrack) {
      await this.loadWindData();
    }
  }

  private async loadWindData(): Promise<void> {
    if (!this.props.selectedTrack) {
      return;
    }

    this.setState({ loading: true, error: null });
    
    try {
      const filter = this.buildFilter();
      const query = `$filter=${filter}&$orderby=createdon desc&$select=cr4cc_wind_speed_kmh,cr4cc_wind_speed_last,cr4cc_wind_dir_last,cr4cc_wind_direction_cardinal,cr4cc_wind_speed_hi_kmh,cr4cc_wind_speed_hi_last_10_min,cr4cc_wind_chill,cr4cc_wind_speed_avg_last_10_min,createdon,cr4cc_track_name`;
      
      // Set track name immediately from the selection
      const displayName = this.getTrackDisplayName(this.props.selectedTrack);
      this.setState({ trackName: displayName });
      
      Logger.info(`Loading wind data for track: ${this.props.selectedTrack}`, 'WindAnalysis');
      Logger.info(`Filter being used: ${filter}`, 'WindAnalysis');
      
      const data = await this.dataverseService.getWeatherDataWithQuery(query);
      
      // Update track name from data if available
      const trackName = data.length > 0 ? data[0].cr4cc_track_name : displayName;
      
      this.setState({ 
        windData: data, 
        loading: false,
        trackName: trackName
      });
      
      Logger.info(`Loaded ${data.length} wind records`, 'WindAnalysis');
    } catch (error) {
      const errorObj = ErrorHandler.handleError(error, 'WindAnalysis');
      console.error('Wind data loading error:', error);
      this.setState({ 
        error: ErrorHandler.formatErrorMessage(errorObj), 
        loading: false 
      });
    }
  }

  private buildFilter(): string {
    // Get the display name for the track
    const trackDisplayName = this.getTrackDisplayName(this.props.selectedTrack);
    // Use exact match with track name
    const trackFilter = `cr4cc_track_name eq '${trackDisplayName}'`;
    
    const now = new Date();
    let dateFilter = '';
    
    switch (this.state.selectedPeriod) {
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = `createdon ge ${todayStart.toISOString()}`;
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `createdon ge ${weekAgo.toISOString()}`;
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = `createdon ge ${monthAgo.toISOString()}`;
        break;
    }
    
    return `${trackFilter} and ${dateFilter}`;
  }

  private getTrackDisplayName(trackId: string): string {
    // Convert track ID like 'wentworth-park' to 'Wentworth Park'
    if (!trackId) return '';
    return trackId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private handlePeriodChange = (period: TimePeriod): void => {
    this.setState({ selectedPeriod: period }, () => {
      this.loadWindData();
    });
  }


  private getSpeedCategory(speed: number): keyof WindRoseData['speedCategories'] {
    if (speed >= 32) return '32+';
    if (speed >= 16) return '16-32';
    if (speed >= 13) return '13-16';
    if (speed >= 10) return '10-13';
    if (speed >= 6) return '6-10';
    if (speed >= 3) return '3-6';
    return '0-3';
  }

  private calculateWindRoseData(): WindRoseData[] {
    const windRoseMap = new Map<string, WindRoseData['speedCategories'] & { total: number }>();
    
    // Initialize all 16 directions
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    directions.forEach(dir => {
      windRoseMap.set(dir, {
        '0-3': 0,
        '3-6': 0,
        '6-10': 0,
        '10-13': 0,
        '13-16': 0,
        '16-32': 0,
        '32+': 0,
        total: 0
      });
    });

    // Process wind data
    this.state.windData.forEach(data => {
      if (data.cr4cc_wind_dir_last !== null && data.cr4cc_wind_speed_kmh !== null) {
        const direction = degreesToCardinal(data.cr4cc_wind_dir_last);
        const speedCategory = this.getSpeedCategory(data.cr4cc_wind_speed_kmh);
        const current = windRoseMap.get(direction)!;
        current[speedCategory]++;
        current.total++;
      }
    });

    // Convert to array with degrees
    return directions.map((dir, index) => {
      const data = windRoseMap.get(dir)!;
      const { total, ...speedCategories } = data;
      return {
        direction: dir,
        degrees: index * 22.5,
        speedCategories: speedCategories as WindRoseData['speedCategories'],
        totalCount: total
      };
    });
  }

  private prepareWindRoseChartData(): ChartData<'radar'> {
    const windRoseData = this.calculateWindRoseData();
    const totalObservations = windRoseData.reduce((sum, d) => sum + d.totalCount, 0);
    
    // Define colors for each speed category
    const categoryColors = {
      '0-3': '#4CAF50',     // Green
      '3-6': '#8BC34A',     // Light Green
      '6-10': '#FFEB3B',    // Yellow
      '10-13': '#FFC107',   // Amber
      '13-16': '#FF9800',   // Orange
      '16-32': '#F44336',   // Red
      '32+': '#000000'      // Black
    };

    // Create datasets for each speed category
    const categories: Array<keyof typeof categoryColors> = ['0-3', '3-6', '6-10', '10-13', '13-16', '16-32', '32+'];
    const datasets = categories.map(category => {
      const color = categoryColors[category];
      return {
        label: `${category} km/h`,
        data: windRoseData.map(d => {
          const value = d.speedCategories[category];
          // Convert to percentage
          return totalObservations > 0 ? (value / totalObservations) * 100 : 0;
        }),
        backgroundColor: color + '80', // Add transparency
        borderColor: color,
        borderWidth: 1,
        fill: true
      };
    });

    return {
      labels: windRoseData.map(d => d.direction),
      datasets: datasets
    };
  }

  private getWindRoseChartOptions(): ChartOptions<'radar'> {
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Wind Rose - Speed Distribution by Direction'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          angleLines: {
            display: true
          },
          grid: {
            circular: true
          },
          pointLabels: {
            display: true,
            font: {
              size: 12
            }
          },
          ticks: {
            callback: function(value) {
              return value + '%';
            },
            stepSize: 5
          }
        }
      }
    };
  }

  private renderCurrentWind(): JSX.Element {
    const latestData = this.state.windData[0];
    
    if (!latestData && !this.state.loading) {
      return <div className={styles.noData}>No wind data available</div>;
    }

    if (!latestData) {
      return <div className={styles.noData}>Loading...</div>;
    }

    const windDirection = latestData.cr4cc_wind_direction_cardinal || degreesToCardinal(latestData.cr4cc_wind_dir_last || 0);
    const windSpeed = latestData.cr4cc_wind_speed_kmh || 0;
    const gustSpeed = latestData.cr4cc_wind_speed_hi_kmh || windSpeed;
    const windChill = latestData.cr4cc_wind_chill;
    
    return (
      <div className={styles.currentWind}>
        <div className={styles.windCompass}>
          <div 
            className={styles.windArrow} 
            style={{ transform: `rotate(${latestData.cr4cc_wind_dir_last || 0}deg)` }}
          >
            <div className={styles.arrowHead}>↑</div>
          </div>
          <div className={styles.compassLabels}>
            <span className={styles.north}>N</span>
            <span className={styles.east}>E</span>
            <span className={styles.south}>S</span>
            <span className={styles.west}>W</span>
          </div>
        </div>

        <div className={styles.windStats}>
          <div className={styles.mainStat}>
            <div className={styles.statValue}>{windSpeed.toFixed(1)}</div>
            <div className={styles.statLabel}>km/h</div>
            <div className={styles.statDirection}>{windDirection} ({Math.round(latestData.cr4cc_wind_dir_last || 0)}°)</div>
          </div>

          <div className={styles.secondaryStats}>
            <div className={styles.statItem}>
              <div className={styles.label}>Gusts</div>
              <div className={styles.value}>{gustSpeed.toFixed(1)} km/h</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.label}>10 min avg</div>
              <div className={styles.value}>{(latestData.cr4cc_wind_speed_avg_last_10_min || 0).toFixed(1)} km/h</div>
            </div>
            {windChill !== null && windChill !== undefined && (
              <div className={styles.statItem}>
                <div className={styles.label}>Wind Chill</div>
                <div className={styles.value}>{windChill.toFixed(1)}°C</div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.timestamp}>
          {new Date(latestData.createdon).toLocaleTimeString()}
        </div>
      </div>
    );
  }

  private renderWindRose(): JSX.Element {
    if (this.state.windData.length === 0) {
      return <div className={styles.noData}>No wind data available for wind rose</div>;
    }

    const chartData = this.prepareWindRoseChartData();
    const options = this.getWindRoseChartOptions();

    return (
      <div className={styles.windRoseContainer}>
        <Radar data={chartData} options={options} />
        <div className={styles.windRoseLegend}>
          <p>Wind rose shows percentage of observations by wind speed and direction</p>
        </div>
      </div>
    );
  }

  public render(): React.ReactElement<IWindAnalysisProps> {
    const { isDarkTheme, hasTeamsContext } = this.props;
    const { selectedPeriod, loading, error, trackName, viewType } = this.state;

    return (
      <section className={`${styles.windAnalysis} ${hasTeamsContext ? styles.teams : ''} ${isDarkTheme ? styles.dark : ''}`}>
        <div className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{trackName || 'Wind Analysis'}</h3>
            <Icon iconName="Duststorm" style={{ fontSize: 32, color: '#69db7c' }} />
          </div>
        </div>

        <div className={styles.periodSelector}>
          <button 
            className={selectedPeriod === 'today' ? styles.active : ''}
            onClick={() => this.handlePeriodChange('today')}
            disabled={loading}
          >
            Today
          </button>
          <button 
            className={selectedPeriod === 'week' ? styles.active : ''}
            onClick={() => this.handlePeriodChange('week')}
            disabled={loading}
          >
            Week
          </button>
          <button 
            className={selectedPeriod === 'month' ? styles.active : ''}
            onClick={() => this.handlePeriodChange('month')}
            disabled={loading}
          >
            Month
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading wind data...</p>
          </div>
        ) : (
          <div className={styles.contentArea}>
            {viewType === 'current' ? this.renderCurrentWind() : this.renderWindRose()}
          </div>
        )}

        <div className={styles.viewToggle}>
          <button
            className={viewType === 'current' ? styles.active : ''}
            onClick={() => this.setState({ viewType: 'current' })}
            disabled={loading}
          >
            Current
          </button>
          <button
            className={viewType === 'windrose' ? styles.active : ''}
            onClick={() => this.setState({ viewType: 'windrose' })}
            disabled={loading}
          >
            Wind Rose
          </button>
        </div>
      </section>
    );
  }
}