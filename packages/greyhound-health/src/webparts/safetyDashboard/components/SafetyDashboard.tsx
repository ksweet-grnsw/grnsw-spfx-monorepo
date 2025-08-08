import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './SafetyDashboard.module.scss';
import type { ISafetyDashboardProps } from './ISafetyDashboardProps';
import { InjuryDataService, IInjuryDataRecord } from '../../../services/InjuryDataService';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { Icon } from '@fluentui/react/lib/Icon';
import { Stack, StackItem } from '@fluentui/react/lib/Stack';
import { Text } from '@fluentui/react/lib/Text';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface IDashboardState {
  loading: boolean;
  error: string | undefined;
  selectedTrack: string;
  injuries: IInjuryDataRecord[];
  totalInjuries: number;
  euthanasiaCount: number;
  fatalityRate: number;
  ninetyDayInjuries: number;
  sixtyDayInjuries: number;
  activeTracks: number;
  lastRefresh: Date;
  // Chart data
  injuryLocationData: any;
  trackInjuryData: any;
  severityData: any;
  startingBoxData: any;
}

const GRNSW_TRACKS = [
  'All Tracks',
  'Broken Hill', 'Bulli', 'Casino', 'Dapto', 'Dubbo',
  'Gosford', 'Goulburn', 'Grafton', 'Gunnedah', 'Lithgow',
  'Maitland', 'Nowra', 'Richmond', 'Taree', 'Temora',
  'The Gardens', 'Wagga Wagga', 'Wentworth Park'
];

const SafetyDashboard: React.FC<ISafetyDashboardProps> = (props) => {
  const [state, setState] = useState<IDashboardState>({
    loading: true,
    error: undefined,
    selectedTrack: props.defaultTrack || 'All Tracks',
    injuries: [],
    totalInjuries: 0,
    euthanasiaCount: 0,
    fatalityRate: 0,
    ninetyDayInjuries: 0,
    sixtyDayInjuries: 0,
    activeTracks: 18,
    lastRefresh: new Date(),
    injuryLocationData: null,
    trackInjuryData: null,
    severityData: null,
    startingBoxData: null
  });

  const injuryService = useMemo(() => new InjuryDataService(props.context), [props.context]);

  const processInjuryData = useCallback((injuries: IInjuryDataRecord[]) => {
    // Calculate statistics
    const totalInjuries = injuries.length;
    
    // Count euthanasias using Injury State field (primary) with Stand Down Days as validation
    const euthanasiaCount = injuries.filter(i => {
      // Primary check: Injury State field indicates euthanasia
      // The field uses 'Euthanased' spelling (with 'a' not 'i')
      if (i.cra5e_injurystate) {
        const state = i.cra5e_injurystate.toLowerCase();
        if (state === 'euthanased' || state === 'euthanised' || state === 'deceased') {
          return true;
        }
      }
      // Secondary check: Empty stand down days with determinedserious = true can indicate euthanasia
      // Only used as fallback if injury state is not available
      if (!i.cra5e_injurystate && 
          (i.cra5e_standdowndays === null || i.cra5e_standdowndays === undefined || i.cra5e_standdowndays === 0) &&
          i.cra5e_determinedserious === true) {
        return true;
      }
      return false;
    }).length;
    const fatalityRate = totalInjuries > 0 ? (euthanasiaCount / totalInjuries * 100) : 0;
    const ninetyDayInjuries = injuries.filter(i => i.cra5e_standdowndays && i.cra5e_standdowndays >= 90).length;
    const sixtyDayInjuries = injuries.filter(i => i.cra5e_standdowndays && i.cra5e_standdowndays >= 60 && i.cra5e_standdowndays < 90).length;

    // Process injury locations
    const locationCounts: Record<string, number> = {};
    const injuryLocations = [
      'Turn off back straight',
      'Back straight',
      'Turn into home straight',
      'Home straight',
      'Soon after start'
    ];

    injuries.forEach(injury => {
      const location = injury.cra5e_runstage || 'Other';
      const mappedLocation = injuryLocations.find(loc => 
        location.toLowerCase().includes(loc.toLowerCase())
      ) || 'Other locations';
      locationCounts[mappedLocation] = (locationCounts[mappedLocation] || 0) + 1;
    });

    const injuryLocationData = {
      labels: Object.keys(locationCounts),
      datasets: [{
        data: Object.values(locationCounts),
        backgroundColor: [
          '#e74c3c',
          '#f39c12',
          '#f1c40f',
          '#3498db',
          '#2ecc71',
          '#95a5a6'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // Process track injury counts
    const trackCounts: Record<string, number> = {};
    injuries.forEach(injury => {
      if (injury.cra5e_trackname) {
        trackCounts[injury.cra5e_trackname] = (trackCounts[injury.cra5e_trackname] || 0) + 1;
      }
    });

    // Sort tracks by injury count and take top 10
    const sortedTracks = Object.entries(trackCounts)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 10);

    const trackInjuryData = {
      labels: sortedTracks.map((t: [string, number]) => t[0]),
      datasets: [{
        label: 'Injuries',
        data: sortedTracks.map((t: [string, number]) => t[1]),
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 1
      }]
    };

    // Process severity distribution
    const severityData = {
      labels: ['60-Day Stand Down', '90+ Day Stand Down'],
      datasets: [{
        data: [sixtyDayInjuries, ninetyDayInjuries],
        backgroundColor: ['#f39c12', '#e74c3c'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // Process starting box data
    const boxCounts: Record<number, number> = {};
    for (let i = 1; i <= 8; i++) {
      boxCounts[i] = 0;
    }
    
    injuries.forEach(injury => {
      const box = injury.cra5e_runbox;
      if (box && box >= 1 && box <= 8) {
        boxCounts[box]++;
      }
    });

    const startingBoxData = {
      labels: ['Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5', 'Box 6', 'Box 7', 'Box 8'],
      datasets: [{
        label: 'Injuries',
        data: Object.values(boxCounts),
        backgroundColor: [
          '#3498db', '#2ecc71', '#f39c12', '#e74c3c',
          '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
        ],
        borderWidth: 1
      }]
    };

    setState(prev => ({
      ...prev,
      loading: false,
      totalInjuries,
      euthanasiaCount,
      fatalityRate,
      ninetyDayInjuries,
      sixtyDayInjuries,
      injuryLocationData,
      trackInjuryData,
      severityData,
      startingBoxData
    }));
  }, []);

  const loadDashboardData = useCallback(async (track: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: undefined }));

      // Fetch injury data based on selected track
      const filter = track !== 'All Tracks' 
        ? `cra5e_trackname eq '${track}'`
        : undefined;

      const injuries = await injuryService.getInjuryData(filter);
      setState(prev => ({ ...prev, injuries }));
      
      processInjuryData(injuries);
      
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Failed to load dashboard data: ${err.message}`
      }));
    }
  }, [injuryService, processInjuryData]);

  useEffect(() => {
    void loadDashboardData(state.selectedTrack);
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      void loadDashboardData(state.selectedTrack);
    }, props.refreshInterval || 900000); // Default 15 minutes

    return () => clearInterval(interval);
  }, [state.selectedTrack, loadDashboardData, props.refreshInterval]);

  const handleTrackChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    if (option) {
      setState(prev => ({ ...prev, selectedTrack: option.key as string }));
      if (props.onTrackChange) {
        props.onTrackChange(option.key as string);
      }
    }
  };

  const chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    }
  };

  const barChartOptions: ChartOptions<'bar'> = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Injuries'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Racing Tracks'
        }
      }
    }
  };

  if (state.loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size={SpinnerSize.large} label="Loading safety data..." />
      </div>
    );
  }

  if (state.error) {
    return (
      <MessageBar messageBarType={MessageBarType.error}>
        {state.error}
      </MessageBar>
    );
  }

  const getSafetyStatus = (): { status: 'green' | 'yellow' | 'red'; text: string } => {
    if (state.fatalityRate > 10 || state.euthanasiaCount > 10) {
      return { status: 'red', text: 'Critical' };
    }
    if (state.fatalityRate > 5 || state.euthanasiaCount > 5) {
      return { status: 'yellow', text: 'Warning' };
    }
    return { status: 'green', text: 'Normal' };
  };

  const safetyStatus = getSafetyStatus();

  return (
    <div className={styles.safetyDashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Greyhound Racing Safety Dashboard
        </h1>
        <p className={styles.subtitle}>
          {state.selectedTrack === 'All Tracks' ? 'All Tracks Analysis' : `${state.selectedTrack} Track Analysis`}
        </p>
      </div>

      <div className={styles.trackSelector}>
        <Dropdown
          label="Select Track"
          selectedKey={state.selectedTrack}
          onChange={handleTrackChange}
          options={GRNSW_TRACKS.map(track => ({
            key: track,
            text: track
          }))}
          styles={{
            dropdown: { width: 300 }
          }}
        />
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{state.totalInjuries}</div>
          <div className={styles.statLabel}>Total Injuries</div>
        </div>
        <div className={`${styles.statCard} ${styles.critical}`}>
          <div className={styles.statNumber}>{state.euthanasiaCount}</div>
          <div className={styles.statLabel}>Euthanasia Cases</div>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statNumber}>{state.fatalityRate.toFixed(1)}%</div>
          <div className={styles.statLabel}>Fatality Rate</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{state.ninetyDayInjuries}</div>
          <div className={styles.statLabel}>90+ Day Injuries</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{state.sixtyDayInjuries}</div>
          <div className={styles.statLabel}>60-Day Injuries</div>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statNumber}>{state.activeTracks}</div>
          <div className={styles.statLabel}>Active Tracks</div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        {state.injuryLocationData && (
          <div className={styles.chartContainer}>
            <div className={styles.chartTitle}>Injury Location During Race</div>
            <div className={styles.chartCanvas}>
              <Doughnut data={state.injuryLocationData} options={chartOptions} />
            </div>
          </div>
        )}

        {state.trackInjuryData && (
          <div className={styles.chartContainer}>
            <div className={styles.chartTitle}>Top 10 Tracks by Injury Count</div>
            <div className={styles.chartCanvas}>
              <Bar data={state.trackInjuryData} options={barChartOptions} />
            </div>
          </div>
        )}

        {state.severityData && (
          <div className={styles.chartContainer}>
            <div className={styles.chartTitle}>Injury Severity Distribution</div>
            <div className={styles.chartCanvas}>
              <Pie data={state.severityData} options={chartOptions} />
            </div>
          </div>
        )}

        {state.startingBoxData && (
          <div className={styles.chartContainer}>
            <div className={styles.chartTitle}>Starting Box Analysis</div>
            <div className={styles.chartCanvas}>
              <Bar data={state.startingBoxData} options={barChartOptions} />
            </div>
          </div>
        )}
      </div>

      <div className={styles.insightsSection}>
        <div className={styles.insightsTitle}>Key Insights & Risk Patterns</div>
        
        <div className={`${styles.insightItem} ${styles.critical}`}>
          <h4>High-Risk Race Sections</h4>
          <p>Analysis shows the "Turn off back straight" is the most dangerous section of the track. Combined with back straight injuries, over 40% of injuries happen in these critical areas.</p>
        </div>

        <div className={`${styles.insightItem} ${styles.warning}`}>
          <h4>Track Safety Concerns</h4>
          <p>Certain tracks show significantly higher injury rates. This suggests potential track-specific safety issues requiring investigation.</p>
        </div>

        <div className={styles.insightItem}>
          <h4>Starting Box Risks</h4>
          <p>Analysis shows varying injury rates by starting box position, potentially due to wider starting positions affecting race dynamics and collision risks.</p>
        </div>

        <div className={styles.insightItem}>
          <h4>Severity Concerns</h4>
          <p>{((state.ninetyDayInjuries / (state.totalInjuries || 1)) * 100).toFixed(0)}% of injuries result in 90+ day stand-downs, indicating serious injuries. The {state.fatalityRate.toFixed(1)}% euthanasia rate highlights the critical nature of racing injuries.</p>
        </div>
      </div>

      <div className={styles.recommendations}>
        <h3>Prevention Recommendations</h3>
        <ul className={styles.recommendationList}>
          <li><strong>Track Design Review:</strong> Focus on the turn off back straight area - consider banking, surface material, and turn radius modifications</li>
          <li><strong>High-Risk Track Investigation:</strong> Immediate safety audit required for tracks with disproportionately high injury rates</li>
          <li><strong>Starting Box Positioning:</strong> Review box placement and consider modifications to reduce wide-position risks</li>
          <li><strong>Speed Management:</strong> Implement speed monitoring at high-risk track sections to identify dangerous racing patterns</li>
          <li><strong>Pre-Race Screening:</strong> Enhanced veterinary checks focusing on dogs with previous injuries or specific risk factors</li>
          <li><strong>Track Surface Monitoring:</strong> Regular analysis of track conditions, especially moisture content and surface consistency</li>
          <li><strong>Data-Driven Scheduling:</strong> Use injury patterns to optimize race scheduling and track maintenance timing</li>
        </ul>
      </div>

      <div className={styles.footer}>
        <Stack horizontal horizontalAlign="space-between">
          <Text className={styles.lastRefresh}>
            Last refresh: {state.lastRefresh.toLocaleTimeString()}
          </Text>
          <div className={`${styles.statusIndicator} ${styles[safetyStatus.status]}`}>
            <Icon iconName={safetyStatus.status === 'green' ? 'CheckMark' : safetyStatus.status === 'yellow' ? 'Warning' : 'ErrorBadge'} className={styles.statusIcon} />
            <Text className={styles.statusText}>Safety Status: {safetyStatus.text}</Text>
          </div>
        </Stack>
      </div>
    </div>
  );
};

export default SafetyDashboard;