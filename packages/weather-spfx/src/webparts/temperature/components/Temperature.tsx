import * as React from 'react';
import styles from './Temperature.module.scss';
import type { ITemperatureProps } from './ITemperatureProps';
import { DataverseService, TrackService } from '../../../services';
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

interface ITemperatureState {
  selectedPeriod: TimePeriod;
  temperatureData: IDataverseWeatherData[];
  loading: boolean;
  error: string | null;
  trackName: string;
  chartType: ChartType;
  viewType: ViewType;
}

export default class Temperature extends React.Component<ITemperatureProps, ITemperatureState> {
  private dataverseService: DataverseService;

  constructor(props: ITemperatureProps) {
    super(props);
    
    this.state = {
      selectedPeriod: 'today',
      temperatureData: [],
      loading: false,
      error: null,
      trackName: '',
      chartType: 'line',
      viewType: 'stats'
    };

    this.dataverseService = new DataverseService(this.props.context);
  }

  public async componentDidMount(): Promise<void> {
    // Clear track cache to ensure fresh data
    TrackService.clearCache();
    await this.loadTemperatureData();
  }

  public async componentDidUpdate(prevProps: ITemperatureProps): Promise<void> {
    if (prevProps.selectedTrack !== this.props.selectedTrack) {
      await this.loadTemperatureData();
    }
  }

  private async loadTemperatureData(): Promise<void> {
    if (!this.props.selectedTrack) {
      return;
    }

    this.setState({ loading: true, error: null });
    
    try {
      const filter = this.buildFilter();
      const query = `$filter=${filter}&$orderby=createdon desc&$select=cr4cc_temp_celsius,cr4cc_temp,createdon,cr4cc_track_name,cr4cc_heat_index_celsius,cr4cc_wind_chill`;
      
      Logger.info(`Loading temperature data for track: ${this.props.selectedTrack}`, 'Temperature');
      const data = await this.dataverseService.getWeatherDataWithQuery(query);
      
      const trackName = data.length > 0 ? data[0].cr4cc_track_name : this.props.selectedTrack;
      
      this.setState({ 
        temperatureData: data, 
        loading: false,
        trackName: trackName
      });
      
      Logger.info(`Loaded ${data.length} temperature records`, 'Temperature');
    } catch (error) {
      const errorObj = ErrorHandler.handleError(error, 'Temperature');
      this.setState({ 
        error: ErrorHandler.formatErrorMessage(errorObj), 
        loading: false 
      });
    }
  }

  private buildFilter(): string {
    const trackFilter = `cr4cc_station_id eq '${this.props.selectedTrack}'`;
    
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

  private handlePeriodChange = (period: TimePeriod): void => {
    this.setState({ selectedPeriod: period }, () => {
      this.loadTemperatureData();
    });
  }

  private calculateStats() {
    const temps = this.state.temperatureData
      .map(d => d.cr4cc_temp_celsius)
      .filter(t => t !== null && t !== undefined);
    
    if (temps.length === 0) {
      return { current: null, min: null, max: null, avg: null };
    }
    
    return {
      current: temps[0],
      min: Math.min(...temps),
      max: Math.max(...temps),
      avg: temps.reduce((a, b) => a + b, 0) / temps.length
    };
  }

  private prepareChartData(): ChartData<'line' | 'bar'> {
    const reversedData = [...this.state.temperatureData].reverse();
    
    const labels = reversedData.map(d => {
      const date = new Date(d.createdon);
      if (this.state.selectedPeriod === 'today') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    });

    const temperatures = reversedData.map(d => d.cr4cc_temp_celsius || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: temperatures,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: this.state.chartType === 'bar' ? 'rgba(75, 192, 192, 0.5)' : 'rgba(75, 192, 192, 0.2)',
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
              return `${context.parsed.y.toFixed(1)}°C`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return value + '°C';
            }
          }
        }
      }
    };
  }

  private renderChart(): JSX.Element {
    if (this.state.temperatureData.length === 0) {
      return <div className={styles.noData}>No temperature data available for this period</div>;
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

  private renderTemperatureDisplay(): JSX.Element {
    const stats = this.calculateStats();
    const latestData = this.state.temperatureData[0];
    
    if (!latestData && !this.state.loading) {
      return <div className={styles.noData}>No temperature data available for this period</div>;
    }
    
    return (
      <div className={styles.temperatureDisplay}>
        {this.state.selectedPeriod === 'today' && latestData ? (
          <div className={styles.currentTemp}>
            <div className={styles.mainTemp}>
              {latestData.cr4cc_temp_celsius?.toFixed(1)}°C
            </div>
            <div className={styles.feelLike}>
              Feels like: {latestData.cr4cc_heat_index_celsius?.toFixed(1) || latestData.cr4cc_wind_chill?.toFixed(1) || 'N/A'}°C
            </div>
            <div className={styles.timestamp}>
              {new Date(latestData.createdon).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className={styles.statsDisplay}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Current</div>
              <div className={styles.statValue}>{stats.current?.toFixed(1) || 'N/A'}°C</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Min</div>
              <div className={styles.statValue}>{stats.min?.toFixed(1) || 'N/A'}°C</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Max</div>
              <div className={styles.statValue}>{stats.max?.toFixed(1) || 'N/A'}°C</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Avg</div>
              <div className={styles.statValue}>{stats.avg?.toFixed(1) || 'N/A'}°C</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  public render(): React.ReactElement<ITemperatureProps> {
    const { isDarkTheme, hasTeamsContext } = this.props;
    const { selectedPeriod, loading, error, trackName, viewType, chartType } = this.state;

    return (
      <section className={`${styles.temperature} ${hasTeamsContext ? styles.teams : ''} ${isDarkTheme ? styles.dark : ''}`}>
        <div className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{trackName || 'Temperature'}</h3>
            <Icon iconName="Sunny" style={{ fontSize: 32, color: '#ff6b6b' }} />
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
            <div className={styles.spinner}></div>
            <p>Loading temperature data...</p>
          </div>
        ) : (
          <div className={styles.contentArea}>
            {viewType === 'stats' ? this.renderTemperatureDisplay() : this.renderChart()}
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