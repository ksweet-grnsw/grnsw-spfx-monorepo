import * as React from 'react';
import styles from './Rainfall.module.scss';
import type { IRainfallProps } from './IRainfallProps';
import { DataverseService } from '../../../services';
import { IDataverseWeatherData } from '../../../models/IDataverseWeatherData';
import { Logger, ErrorHandler } from '../../../utils';
import { Icon } from '@fluentui/react/lib/Icon';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type TimePeriod = 'today' | 'week' | 'month';
type ChartType = 'line' | 'bar';
type ViewType = 'stats' | 'chart';

interface IRainfallState {
  selectedPeriod: TimePeriod;
  rainfallData: IDataverseWeatherData[];
  loading: boolean;
  error: string | undefined;
  trackName: string;
  chartType: ChartType;
  viewType: ViewType;
}

export default class Rainfall extends React.Component<IRainfallProps, IRainfallState> {
  private dataverseService: DataverseService;

  constructor(props: IRainfallProps) {
    super(props);
    
    this.state = {
      selectedPeriod: props.defaultPeriod || 'today',
      rainfallData: [],
      loading: false,
      error: undefined,
      trackName: '',
      chartType: props.defaultChartType || 'bar',
      viewType: props.defaultView || 'stats'
    };

    this.dataverseService = new DataverseService(this.props.context);
  }

  public async componentDidMount(): Promise<void> {
    // Clear track cache to ensure fresh data
    // Cache cleared
    await this.loadRainfallData();
  }

  public async componentDidUpdate(prevProps: IRainfallProps): Promise<void> {
    if (prevProps.selectedTrack !== this.props.selectedTrack) {
      await this.loadRainfallData();
    }
  }

  private async loadRainfallData(): Promise<void> {
    if (!this.props.selectedTrack) {
      return;
    }

    this.setState({ loading: true, error: undefined });
    
    try {
      const filter = this.buildFilter();
      const query = `$filter=${filter}&$orderby=createdon desc&$select=cr4cc_rainfall_day_mm,cr4cc_rainfall_last_60_min_mm,cr4cc_rainfall_last_24_hr_mm,cr4cc_rainfall_month_mm,cr4cc_rainfall_year_mm,createdon,cr4cc_track_name`;
      
      // Set track name immediately from the selection
      const displayName = this.getTrackDisplayName(this.props.selectedTrack);
      this.setState({ trackName: displayName });
      
      Logger.info(`Loading rainfall data for track: ${this.props.selectedTrack}`, 'Rainfall');
      Logger.info(`Filter being used: ${filter}`, 'Rainfall');
      
      const data = await this.dataverseService.getWeatherDataWithQuery(query);
      
      // Update track name from data if available
      const trackName = data.length > 0 ? data[0].cr4cc_track_name : displayName;
      
      this.setState({ 
        rainfallData: data, 
        loading: false,
        trackName: trackName
      });
      
      Logger.info(`Loaded ${data.length} rainfall records`, 'Rainfall');
    } catch (error) {
      const errorObj = ErrorHandler.handleError(error, 'Rainfall');
      console.error('Rainfall data loading error:', error);
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
      case 'today': {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = `createdon ge ${todayStart.toISOString()}`;
        break;
      }
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `createdon ge ${weekAgo.toISOString()}`;
        break;
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = `createdon ge ${monthAgo.toISOString()}`;
        break;
      }
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
      this.loadRainfallData().catch(error => {
        console.error('Failed to load rainfall data:', error);
      });
    });
  }

  private calculateStats(): { total: number; average: number; max: number; rainDays: number } {
    const rainfall = this.state.rainfallData
      .map(d => d.cr4cc_rainfall_day_mm)
      .filter(r => r !== null && r !== undefined);
    
    if (rainfall.length === 0) {
      return { total: 0, average: 0, max: 0, rainDays: 0 };
    }
    
    const total = rainfall.reduce((a, b) => a + b, 0);
    const rainDays = rainfall.filter(r => r > 0).length;
    
    return {
      total: total,
      average: total / rainfall.length,
      max: Math.max(...rainfall),
      rainDays: rainDays
    };
  }

  private prepareChartData(): ChartData<'line' | 'bar'> {
    const reversedData = [...this.state.rainfallData].reverse();
    
    const labels = reversedData.map(d => {
      const date = new Date(d.createdon);
      if (this.state.selectedPeriod === 'today') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    });

    const rainfallData = reversedData.map(d => d.cr4cc_rainfall_day_mm || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Rainfall (mm)',
          data: rainfallData,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: this.state.chartType === 'bar' ? 'rgba(54, 162, 235, 0.5)' : 'rgba(54, 162, 235, 0.2)',
          tension: 0.1
        }
      ]
    };
  }

  private getChartOptions(): ChartOptions<'line' | 'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `${context.parsed.y.toFixed(1)}mm`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value + 'mm';
            }
          }
        }
      }
    };
  }

  private renderChart(): JSX.Element {
    if (this.state.rainfallData.length === 0) {
      return <div className={styles.noData}>No rainfall data available for this period</div>;
    }

    const chartData = this.prepareChartData();
    const options = this.getChartOptions();

    return (
      <div className={styles.chartContainer}>
        {this.state.chartType === 'line' ? (
          <Line data={chartData as ChartData<'line'>} options={options as ChartOptions<'line'>} />
        ) : (
          <Bar data={chartData as ChartData<'bar'>} options={options as ChartOptions<'bar'>} />
        )}
      </div>
    );
  }

  private renderRainfallDisplay(): JSX.Element {
    const stats = this.calculateStats();
    const latestData = this.state.rainfallData[0];
    
    if (!latestData && !this.state.loading) {
      return <div className={styles.noData}>No rainfall data available for this period</div>;
    }
    
    return (
      <div className={styles.rainfallDisplay}>
        {this.state.selectedPeriod === 'today' && latestData ? (
          <div className={styles.currentRainfall}>
            <div className={styles.mainRainfall}>
              {latestData.cr4cc_rainfall_day_mm?.toFixed(1) || '0.0'}mm
            </div>
            <div className={styles.rainfallDetail}>
              Last hour: {latestData.cr4cc_rainfall_last_60_min_mm?.toFixed(1) || '0.0'}mm
            </div>
            <div className={styles.rainfallDetail}>
              Last 24 hours: {latestData.cr4cc_rainfall_last_24_hr_mm?.toFixed(1) || '0.0'}mm
            </div>
            <div className={styles.timestamp}>
              {new Date(latestData.createdon).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className={styles.statsDisplay}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Current</div>
              <div className={styles.statValue}>{latestData?.cr4cc_rainfall_day_mm?.toFixed(1) || '0.0'}mm</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total</div>
              <div className={styles.statValue}>{stats.total?.toFixed(1) || '0.0'}mm</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Max</div>
              <div className={styles.statValue}>{stats.max?.toFixed(1) || '0.0'}mm</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Avg</div>
              <div className={styles.statValue}>{stats.average.toFixed(1)}mm</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  public render(): React.ReactElement<IRainfallProps> {
    const { isDarkTheme, hasTeamsContext } = this.props;
    const { selectedPeriod, loading, error, trackName, viewType, chartType } = this.state;

    return (
      <section className={`${styles.rainfall} ${hasTeamsContext ? styles.teams : ''} ${isDarkTheme ? styles.dark : ''}`}>
        <div className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{trackName || 'Rainfall'}</h3>
            <Icon iconName="Rain" style={{ fontSize: 32, color: '#4dabf7' }} />
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

        {viewType === 'chart' && (
          <div className={styles.chartTypeSelector}>
            <button
              className={chartType === 'line' ? styles.active : ''}
              onClick={() => this.setState({ chartType: 'line' })}
              disabled={loading}
            >
              Line
            </button>
            <button
              className={chartType === 'bar' ? styles.active : ''}
              onClick={() => this.setState({ chartType: 'bar' })}
              disabled={loading}
            >
              Bar
            </button>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading rainfall data...</p>
          </div>
        ) : (
          <div className={styles.contentArea}>
            {viewType === 'stats' ? this.renderRainfallDisplay() : this.renderChart()}
          </div>
        )}

        <div className={styles.viewToggle}>
          <button
            className={viewType === 'stats' ? styles.active : ''}
            onClick={() => this.setState({ viewType: 'stats' })}
            disabled={loading}
          >
            Stats
          </button>
          <button
            className={viewType === 'chart' ? styles.active : ''}
            onClick={() => this.setState({ viewType: 'chart' })}
            disabled={loading}
          >
            Chart
          </button>
        </div>
      </section>
    );
  }
}