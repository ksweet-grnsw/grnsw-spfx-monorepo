import * as React from 'react';
import styles from './HistoricalPatternAnalyzer.module.scss';
import { IHistoricalPatternAnalyzerProps } from './IHistoricalPatternAnalyzerProps';
import { DataverseService } from '../../../services';
import { IDataverseWeatherData } from '../../../models/IDataverseWeatherData';
import { IOptimalScore, IPrediction } from '../../../models';
import { CalculationService } from '../../../services/CalculationService';
import { Logger, ErrorHandler } from '../../../utils';
import { 
  Spinner, 
  SpinnerSize, 
  MessageBar, 
  MessageBarType,
  Dropdown,
  IDropdownOption,
  DefaultButton,
  Toggle,
  Stack,
  Text
} from '@fluentui/react';

// Import components
import OptimalScoreGauge from './OptimalScoreGauge/OptimalScoreGauge';
import PatternHeatmap from './PatternHeatmap/PatternHeatmap';
import TrackComparison from './TrackComparison/TrackComparison';
import VolatilityMonitor from './VolatilityMonitor/VolatilityMonitor';
import PredictiveInsights from './PredictiveInsights/PredictiveInsights';

export interface IHistoricalPatternAnalyzerState {
  isLoading: boolean;
  error: string | null;
  currentConditions: Map<string, IDataverseWeatherData>;
  historicalData: IDataverseWeatherData[];
  selectedTracks: string[];
  timeRange: string;
  optimalScores: Map<string, IOptimalScore>;
  predictions: IPrediction[];
  lastUpdated: Date | null;
  autoRefresh: boolean;
  alerts: Array<{
    id: string;
    type: 'optimal' | 'poor' | 'deteriorating' | 'rain';
    message: string;
    timestamp: Date;
  }>;
}

export default class HistoricalPatternAnalyzer extends React.Component<
  IHistoricalPatternAnalyzerProps,
  IHistoricalPatternAnalyzerState
> {
  private dataverseService: DataverseService;
  private refreshTimer: number | undefined;
  private cacheExpiry: Date | null = null;

  constructor(props: IHistoricalPatternAnalyzerProps) {
    super(props);

    this.state = {
      isLoading: true,
      error: null,
      currentConditions: new Map(),
      historicalData: [],
      selectedTracks: props.defaultTracks || [],
      timeRange: props.defaultTimeRange,
      optimalScores: new Map(),
      predictions: [],
      lastUpdated: null,
      autoRefresh: true,
      alerts: []
    };

    this.dataverseService = new DataverseService(props.context);
  }

  public async componentDidMount(): Promise<void> {
    await this.loadData();
    this.startAutoRefresh();
  }

  public componentWillUnmount(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  private startAutoRefresh(): void {
    if (this.state.autoRefresh && this.props.refreshInterval > 0) {
      this.refreshTimer = window.setInterval(() => {
        this.loadCurrentConditions().catch(error => {
          console.error('Auto-refresh failed:', error);
        });
      }, this.props.refreshInterval * 60 * 1000);
    }
  }

  private async loadData(): Promise<void> {
    this.setState({ isLoading: true, error: null });

    try {
      // Load current conditions for all tracks
      await this.loadCurrentConditions();

      // Load historical data if cache expired or not loaded
      if (!this.cacheExpiry || new Date() > this.cacheExpiry) {
        await this.loadHistoricalData();
        this.cacheExpiry = new Date();
        this.cacheExpiry.setMinutes(this.cacheExpiry.getMinutes() + this.props.cacheMinutes);
      }

      // Calculate optimal scores
      this.calculateOptimalScores();

      // Generate predictions
      this.generatePredictions();

      // Check for alerts
      this.checkAlerts();

      this.setState({ 
        isLoading: false, 
        lastUpdated: new Date() 
      });

    } catch (error) {
      const errorObj = ErrorHandler.handleError(error, 'HistoricalPatternAnalyzer');
      this.setState({
        error: ErrorHandler.formatErrorMessage(errorObj),
        isLoading: false
      });
    }
  }

  private async loadCurrentConditions(): Promise<void> {
    // Check if any tracks are selected
    if (this.state.selectedTracks.length === 0) {
      this.setState({ 
        currentConditions: new Map(),
        error: 'Please select at least one track to view historical patterns'
      });
      return;
    }

    // Get latest reading for each selected track
    const currentConditions = new Map<string, IDataverseWeatherData>();
    
    // Fetch current data for each track separately to ensure we get the latest for each
    for (const track of this.state.selectedTracks) {
      const trackQuery = `$filter=cr4cc_track_name eq '${track}'&$orderby=createdon desc&$top=1`;
      const trackData = await this.dataverseService.getWeatherDataWithQuery(trackQuery);
      
      if (trackData && trackData.length > 0) {
        currentConditions.set(track, trackData[0]);
      }
    }

    this.setState({ currentConditions });
  }

  private async loadHistoricalData(): Promise<void> {
    // Check if any tracks are selected
    if (this.state.selectedTracks.length === 0) {
      this.setState({ historicalData: [] });
      return;
    }

    const dateFilter = this.getDateFilter();
    const trackFilter = this.state.selectedTracks
      .map(track => `cr4cc_track_name eq '${track}'`)
      .join(' or ');

    const query = `$filter=(${trackFilter}) and ${dateFilter}&$orderby=createdon desc&$top=${this.props.maxRecords}`;

    const data = await this.dataverseService.getWeatherDataWithQuery(query);
    
    this.setState({ historicalData: data });
    
    Logger.info(`Loaded ${data.length} historical records`, 'HistoricalPatternAnalyzer');
  }

  private getDateFilter(): string {
    const now = new Date();
    let startDate: Date;

    switch (this.state.timeRange) {
      case '24hours':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return `createdon ge ${startDate.toISOString()}`;
  }

  private calculateOptimalScores(): void {
    const scores = new Map<string, IOptimalScore>();

    this.state.currentConditions.forEach((data, trackName) => {
      const score = CalculationService.calculateOptimalScore(data);
      
      // Calculate trend based on historical scores
      const historicalScores = this.state.historicalData
        .filter(d => d.cr4cc_track_name === trackName)
        .slice(0, 10)
        .map(d => CalculationService.calculateOptimalScore(d).score);

      score.trend = CalculationService.calculateTrend(score.score, historicalScores);
      
      scores.set(trackName, score);
    });

    this.setState({ optimalScores: scores });
  }

  private generatePredictions(): void {
    const predictions: IPrediction[] = [];

    this.state.selectedTracks.forEach(trackName => {
      const currentData = this.state.currentConditions.get(trackName);
      if (!currentData) return;

      // Recovery time prediction after rain
      if ((currentData.cr4cc_rainfall_last_24_hr_mm || 0) > 0) {
        const recoveryTime = CalculationService.calculateRecoveryTime(currentData);
        predictions.push({
          type: 'recovery_time',
          trackName,
          timestamp: new Date(),
          prediction: {
            value: recoveryTime,
            unit: 'hours',
            confidence: 85
          },
          basedOn: 'Current rainfall and evaporation rate'
        });
      }

      // Find next optimal window based on patterns
      const optimalHours = this.findOptimalHours(trackName);
      if (optimalHours.length > 0) {
        const nextOptimal = this.getNextOptimalTime(optimalHours);
        predictions.push({
          type: 'optimal_window',
          trackName,
          timestamp: new Date(),
          prediction: {
            value: nextOptimal,
            unit: 'time',
            confidence: 75
          },
          basedOn: 'Historical pattern analysis'
        });
      }
    });

    this.setState({ predictions });
  }

  private findOptimalHours(trackName: string): number[] {
    const trackData = this.state.historicalData.filter(d => d.cr4cc_track_name === trackName);
    const hourScores: Map<number, number[]> = new Map();

    trackData.forEach(data => {
      const hour = new Date(data.createdon).getHours();
      const score = CalculationService.calculateOptimalScore(data).score;
      
      if (!hourScores.has(hour)) {
        hourScores.set(hour, []);
      }
      hourScores.get(hour)!.push(score);
    });

    const optimalHours: number[] = [];
    hourScores.forEach((scores, hour) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgScore >= this.props.optimalScoreThreshold) {
        optimalHours.push(hour);
      }
    });

    return optimalHours;
  }

  private getNextOptimalTime(optimalHours: number[]): string {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Find next optimal hour
    let nextHour = optimalHours.find(h => h > currentHour);
    if (!nextHour && optimalHours.length > 0) {
      nextHour = optimalHours[0]; // Tomorrow
    }

    if (nextHour !== undefined) {
      const nextTime = new Date(now);
      if (nextHour <= currentHour) {
        nextTime.setDate(nextTime.getDate() + 1);
      }
      nextTime.setHours(nextHour, 0, 0, 0);
      return nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return 'Unknown';
  }

  private checkAlerts(): void {
    const alerts = this.state.alerts.filter(a => 
      new Date().getTime() - a.timestamp.getTime() < 3600000 // Keep alerts for 1 hour
    );

    this.state.optimalScores.forEach((score, trackName) => {
      // Check for optimal conditions
      if (score.score >= this.props.optimalScoreThreshold) {
        const alertId = `optimal-${trackName}-${Date.now()}`;
        if (!alerts.find(a => a.id.startsWith(`optimal-${trackName}`))) {
          alerts.push({
            id: alertId,
            type: 'optimal',
            message: `Optimal racing conditions detected at ${trackName} (Score: ${score.score})`,
            timestamp: new Date()
          });
        }
      }

      // Check for poor conditions
      if (score.score < 40) {
        const alertId = `poor-${trackName}-${Date.now()}`;
        if (!alerts.find(a => a.id.startsWith(`poor-${trackName}`))) {
          alerts.push({
            id: alertId,
            type: 'poor',
            message: `Poor racing conditions at ${trackName} (Score: ${score.score})`,
            timestamp: new Date()
          });
        }
      }
    });

    this.setState({ alerts });
  }

  private handleTimeRangeChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    if (option) {
      this.setState({ timeRange: option.key as string }, () => {
        this.loadData().catch(error => {
          console.error('Failed to reload data:', error);
        });
      });
    }
  };

  private handleTrackSelectionChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    if (option) {
      const selectedTracks = option.selected
        ? [...this.state.selectedTracks, option.key as string]
        : this.state.selectedTracks.filter(t => t !== option.key);

      this.setState({ selectedTracks }, () => {
        // Save the selection to props so it persists
        if (this.props.onUpdateProperty) {
          this.props.onUpdateProperty('defaultTracks', selectedTracks);
        }
        this.loadData().catch(error => {
          console.error('Failed to reload data:', error);
        });
      });
    }
  };

  private handleRefresh = (): void => {
    this.loadData().catch(error => {
      console.error('Manual refresh failed:', error);
    });
  };

  private handleAutoRefreshToggle = (checked: boolean): void => {
    this.setState({ autoRefresh: checked }, () => {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = undefined;
      }
      if (checked) {
        this.startAutoRefresh();
      }
    });
  };

  public render(): React.ReactElement<IHistoricalPatternAnalyzerProps> {
    const { 
      isLoading, 
      error, 
      currentConditions, 
      historicalData,
      selectedTracks,
      timeRange,
      optimalScores,
      predictions,
      lastUpdated,
      autoRefresh,
      alerts
    } = this.state;

    const { isDarkTheme, hasTeamsContext, viewMode, enableAlerts } = this.props;

    if (isLoading && historicalData.length === 0) {
      return (
        <div className={styles.historicalPatternAnalyzer}>
          <Spinner size={SpinnerSize.large} label="Loading historical patterns..." />
        </div>
      );
    }

    const timeRangeOptions: IDropdownOption[] = [
      { key: '24hours', text: 'Last 24 Hours' },
      { key: '7days', text: 'Last 7 Days' },
      { key: '30days', text: 'Last 30 Days' },
      { key: '90days', text: 'Last 90 Days' }
    ];

    const trackOptions: IDropdownOption[] = [
      { key: 'Albion Park', text: 'Albion Park' },
      { key: 'Appin', text: 'Appin' },
      { key: 'Bathurst', text: 'Bathurst' },
      { key: 'Broken Hill', text: 'Broken Hill' },
      { key: 'Bulli', text: 'Bulli' },
      { key: 'Casino', text: 'Casino' },
      { key: 'Dapto', text: 'Dapto' },
      { key: 'Dubbo', text: 'Dubbo' },
      { key: 'Gosford', text: 'Gosford' },
      { key: 'Goulburn', text: 'Goulburn' },
      { key: 'Grafton', text: 'Grafton' },
      { key: 'Gunnedah', text: 'Gunnedah' },
      { key: 'Lismore', text: 'Lismore' },
      { key: 'Lithgow', text: 'Lithgow' },
      { key: 'Maitland', text: 'Maitland' },
      { key: 'Nowra', text: 'Nowra' },
      { key: 'Richmond', text: 'Richmond' },
      { key: 'Taree', text: 'Taree' },
      { key: 'Temora', text: 'Temora' },
      { key: 'The Gardens', text: 'The Gardens' },
      { key: 'Wagga Wagga', text: 'Wagga Wagga' },
      { key: 'Wentworth Park', text: 'Wentworth Park' }
    ];

    return (
      <section className={`${styles.historicalPatternAnalyzer} ${hasTeamsContext ? styles.teams : ''} ${isDarkTheme ? styles.dark : ''}`}>
        <div className={styles.header}>
          <h2>Historical Weather Pattern Analysis</h2>
          <div className={styles.controls}>
            <Stack horizontal tokens={{ childrenGap: 10 }}>
              <Dropdown
                placeholder="Select time range"
                options={timeRangeOptions}
                selectedKey={timeRange}
                onChange={this.handleTimeRangeChange}
                styles={{ root: { minWidth: 150 } }}
              />
              <Dropdown
                placeholder="Select tracks"
                multiSelect
                options={trackOptions}
                selectedKeys={selectedTracks}
                onChange={this.handleTrackSelectionChange}
                styles={{ root: { minWidth: 200 } }}
              />
              <DefaultButton
                text="Refresh"
                iconProps={{ iconName: 'Refresh' }}
                onClick={this.handleRefresh}
                disabled={isLoading}
              />
              <Toggle
                label="Auto-refresh"
                checked={autoRefresh}
                onChange={(_, checked) => this.handleAutoRefreshToggle(checked || false)}
              />
            </Stack>
          </div>
        </div>

        {error && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            {error}
          </MessageBar>
        )}

        {!isLoading && selectedTracks.length === 0 && !error && (
          <MessageBar messageBarType={MessageBarType.info} isMultiline={false}>
            Please select at least one track from the dropdown above to view historical weather patterns and analysis.
          </MessageBar>
        )}

        {enableAlerts && alerts.length > 0 && (
          <div className={styles.alerts}>
            {alerts.map(alert => (
              <MessageBar
                key={alert.id}
                messageBarType={
                  alert.type === 'optimal' ? MessageBarType.success :
                  alert.type === 'poor' ? MessageBarType.error :
                  MessageBarType.warning
                }
                isMultiline={false}
              >
                {alert.message}
              </MessageBar>
            ))}
          </div>
        )}

        {selectedTracks.length > 0 && (
        <div className={`${styles.content} ${styles[viewMode]}`}>
          <div className={styles.primarySection}>
            <div className={styles.scoreSection}>
              <TrackComparison
                tracks={selectedTracks}
                currentConditions={currentConditions}
                optimalScores={optimalScores}
                onTrackSelect={(track) => console.log('Track selected:', track)}
              />
            </div>

            {viewMode !== 'compact' && (
              <div className={styles.heatmapSection}>
                <PatternHeatmap
                  historicalData={historicalData}
                  selectedTracks={selectedTracks}
                  timeRange={timeRange}
                />
              </div>
            )}
          </div>

          {viewMode === 'detailed' && (
            <>
              <div className={styles.secondarySection}>
                <div className={styles.volatilitySection}>
                  <VolatilityMonitor
                    historicalData={historicalData}
                    selectedTracks={selectedTracks}
                    volatilityThreshold={this.props.volatilityThreshold}
                  />
                </div>

                <div className={styles.predictionsSection}>
                  <PredictiveInsights
                    predictions={predictions}
                    currentConditions={currentConditions}
                    historicalData={historicalData}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        )}

        <div className={styles.footer}>
          <Text variant="small">
            {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
            {autoRefresh && ` • Auto-refresh every ${this.props.refreshInterval} minutes`}
          </Text>
        </div>
      </section>
    );
  }
}