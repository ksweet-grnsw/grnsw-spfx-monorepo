import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import styles from './RealTimeSafetyDashboard.module.scss';
import type { IRealTimeSafetyDashboardProps } from './IRealTimeSafetyDashboardProps';
import { Cra5eInjuryDataService } from '../../../services/Cra5eInjuryDataService';
import { ICra5eInjurydata, IInjuryStatistics } from '../../../models/ICra5eInjuryData';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { Icon } from '@fluentui/react/lib/Icon';
import { Stack, StackItem } from '@fluentui/react/lib/Stack';
import { Text } from '@fluentui/react/lib/Text';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { Pivot, PivotItem } from '@fluentui/react/lib/Pivot';

interface IDashboardState {
  loading: boolean;
  error: string | null;
  // All tracks data
  allTracksMonthlyInjuries: number;
  allTracksYTDFatalities: number;
  allTracksDaysSinceSerious: number;
  allTracksTopRisks: Array<{ name: string; count: number; risk: 'high' | 'medium' | 'low' }>;
  allTracksSafetyStatus: 'green' | 'yellow' | 'red';
  allTracksStatistics: IInjuryStatistics | null;
  // Single track data
  trackMonthlyInjuries: number;
  trackYTDFatalities: number;
  trackDaysSinceSerious: number;
  trackSafetyStatus: 'green' | 'yellow' | 'red';
  trackStatistics: IInjuryStatistics | null;
  trackRecentInjuries: ICra5eInjurydata[];
  // General
  selectedTrack: string;
  availableTracks: string[];
  lastRefresh: Date;
}

const RealTimeSafetyDashboard: React.FC<IRealTimeSafetyDashboardProps> = (props) => {
  const [state, setState] = useState<IDashboardState>({
    loading: true,
    error: null,
    allTracksMonthlyInjuries: 0,
    allTracksYTDFatalities: 0,
    allTracksDaysSinceSerious: 0,
    allTracksTopRisks: [],
    allTracksSafetyStatus: 'green',
    allTracksStatistics: null,
    trackMonthlyInjuries: 0,
    trackYTDFatalities: 0,
    trackDaysSinceSerious: 0,
    trackSafetyStatus: 'green',
    trackStatistics: null,
    trackRecentInjuries: [],
    selectedTrack: props.selectedTrack || props.defaultTrack || '',
    availableTracks: [],
    lastRefresh: new Date()
  });

  const injuryService = new Cra5eInjuryDataService(props.context);

  const calculateSafetyStatus = useCallback((monthlyInjuries: number, fatalities: number, daysSinceSerious: number): 'green' | 'yellow' | 'red' => {
    if (fatalities > 0 || monthlyInjuries > props.injuryTargetPerMonth * 1.5 || daysSinceSerious < 7) {
      return 'red';
    }
    if (monthlyInjuries > props.injuryTargetPerMonth || daysSinceSerious < 14) {
      return 'yellow';
    }
    return 'green';
  }, [props.injuryTargetPerMonth]);

  const loadDashboardData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Get available tracks
      const trackNames = await injuryService.getTrackNames();

      // Load all tracks data
      const [
        allMonthlyInjuries,
        allYearlyInjuries,
        allSeriousInjuries,
        allYearStats
      ] = await Promise.all([
        injuryService.getInjuriesByDateRange(startOfMonth, endOfMonth),
        injuryService.getInjuriesByDateRange(startOfYear, now),
        injuryService.getSeriousInjuries(),
        injuryService.getInjuryStatistics(startOfYear, now)
      ]);

      // Calculate all tracks metrics
      const allTracksMonthlyCount = allMonthlyInjuries.length;
      const allTracksFatalities = allYearlyInjuries.filter(injury => 
        injury.cra5e_determinedserious === 'Yes' && 
        injury.cra5e_failedtofinish === 'Yes'
      ).length;

      let allTracksDaysSinceSerious = 999;
      if (allSeriousInjuries.length > 0) {
        const mostRecentSerious = allSeriousInjuries
          .filter(i => i.cra5e_racedate)
          .sort((a, b) => new Date(b.cra5e_racedate!).getTime() - new Date(a.cra5e_racedate!).getTime())[0];
        
        if (mostRecentSerious && mostRecentSerious.cra5e_racedate) {
          const lastSeriousDate = new Date(mostRecentSerious.cra5e_racedate);
          allTracksDaysSinceSerious = Math.floor((now.getTime() - lastSeriousDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      // Calculate top risk tracks
      const trackCounts: { [key: string]: number } = {};
      allYearlyInjuries.forEach(injury => {
        if (injury.cra5e_trackname) {
          trackCounts[injury.cra5e_trackname] = (trackCounts[injury.cra5e_trackname] || 0) + 1;
        }
      });

      const allTracksTopRisks = Object.keys(trackCounts)
        .map(name => ({ name, count: trackCounts[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(({ name, count }) => ({
          name,
          count,
          risk: count > 10 ? 'high' : count > 5 ? 'medium' : 'low' as 'high' | 'medium' | 'low'
        }));

      const allTracksSafetyStatus = calculateSafetyStatus(allTracksMonthlyCount, allTracksFatalities, allTracksDaysSinceSerious);

      // Load single track data if selected
      let trackData = {
        trackMonthlyInjuries: 0,
        trackYTDFatalities: 0,
        trackDaysSinceSerious: 999,
        trackSafetyStatus: 'green' as 'green' | 'yellow' | 'red',
        trackStatistics: null as IInjuryStatistics | null,
        trackRecentInjuries: [] as ICra5eInjurydata[]
      };

      if (state.selectedTrack) {
        const trackMonthlyInjuries = allMonthlyInjuries.filter(i => i.cra5e_trackname === state.selectedTrack);
        const trackYearlyInjuries = allYearlyInjuries.filter(i => i.cra5e_trackname === state.selectedTrack);
        const trackSeriousInjuries = allSeriousInjuries.filter(i => i.cra5e_trackname === state.selectedTrack);
        
        trackData.trackMonthlyInjuries = trackMonthlyInjuries.length;
        trackData.trackYTDFatalities = trackYearlyInjuries.filter(injury => 
          injury.cra5e_determinedserious === 'Yes' && 
          injury.cra5e_failedtofinish === 'Yes'
        ).length;

        if (trackSeriousInjuries.length > 0) {
          const mostRecentSerious = trackSeriousInjuries
            .filter(i => i.cra5e_racedate)
            .sort((a, b) => new Date(b.cra5e_racedate!).getTime() - new Date(a.cra5e_racedate!).getTime())[0];
          
          if (mostRecentSerious && mostRecentSerious.cra5e_racedate) {
            const lastSeriousDate = new Date(mostRecentSerious.cra5e_racedate);
            trackData.trackDaysSinceSerious = Math.floor((now.getTime() - lastSeriousDate.getTime()) / (1000 * 60 * 60 * 24));
          }
        }

        trackData.trackSafetyStatus = calculateSafetyStatus(
          trackData.trackMonthlyInjuries, 
          trackData.trackYTDFatalities, 
          trackData.trackDaysSinceSerious
        );

        const recentTrackInjuries = await injuryService.getInjuriesByTrack(state.selectedTrack);
        trackData.trackRecentInjuries = recentTrackInjuries.slice(0, 5);
      }

      setState({
        loading: false,
        error: null,
        allTracksMonthlyInjuries: allTracksMonthlyCount,
        allTracksYTDFatalities: allTracksFatalities,
        allTracksDaysSinceSerious: allTracksDaysSinceSerious,
        allTracksTopRisks: allTracksTopRisks,
        allTracksSafetyStatus: allTracksSafetyStatus,
        allTracksStatistics: allYearStats,
        ...trackData,
        selectedTrack: state.selectedTrack,
        availableTracks: trackNames,
        lastRefresh: new Date()
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [injuryService, calculateSafetyStatus, state.selectedTrack]);

  useEffect(() => {
    loadDashboardData().catch(console.error);
  }, [state.selectedTrack]); // Reload when track changes

  useEffect(() => {
    const intervalMs = props.refreshInterval || 900000;
    const interval = setInterval(() => {
      loadDashboardData().catch(console.error);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [loadDashboardData, props.refreshInterval]);

  const handleTrackChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    if (option) {
      const newTrack = option.key as string;
      setState(prev => ({ ...prev, selectedTrack: newTrack }));
      props.onTrackChange(newTrack);
    }
  };

  const getStatusColor = (status: 'green' | 'yellow' | 'red'): string => {
    switch (status) {
      case 'green': return '#107C10';
      case 'yellow': return '#FFB900';
      case 'red': return '#D13438';
      default: return '#605E5C';
    }
  };

  const getStatusIcon = (status: 'green' | 'yellow' | 'red'): string => {
    switch (status) {
      case 'green': return 'CheckMark';
      case 'yellow': return 'Warning';
      case 'red': return 'ErrorBadge';
      default: return 'Unknown';
    }
  };

  const getRiskColor = (risk: 'high' | 'medium' | 'low'): string => {
    switch (risk) {
      case 'high': return '#D13438';
      case 'medium': return '#FFB900';
      case 'low': return '#107C10';
      default: return '#605E5C';
    }
  };

  const renderMetricsSection = (
    title: string,
    monthlyInjuries: number,
    ytdFatalities: number,
    daysSinceSerious: number,
    safetyStatus: 'green' | 'yellow' | 'red',
    topRisks?: Array<{ name: string; count: number; risk: 'high' | 'medium' | 'low' }>,
    recentInjuries?: ICra5eInjurydata[]
  ): JSX.Element => (
    <div className={styles.metricsSection}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" className={styles.sectionHeader}>
        <Text variant="large" className={styles.sectionTitle}>{title}</Text>
        <div className={styles.statusIndicator} style={{ backgroundColor: getStatusColor(safetyStatus) }}>
          <Icon iconName={getStatusIcon(safetyStatus)} className={styles.statusIcon} />
          <Text variant="medium" className={styles.statusText}>
            {safetyStatus.toUpperCase()}
          </Text>
        </div>
      </Stack>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <Icon iconName="Calendar" className={styles.metricIcon} />
            <Text variant="medium" className={styles.metricTitle}>Current Month</Text>
          </div>
          <div className={styles.metricContent}>
            <Text variant="xxLarge" className={styles.metricValue}>{monthlyInjuries}</Text>
            <Text variant="small" className={styles.metricTarget}>
              Target: {props.injuryTargetPerMonth}
            </Text>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <Icon iconName="Warning" className={styles.metricIcon} />
            <Text variant="medium" className={styles.metricTitle}>YTD Fatalities</Text>
          </div>
          <div className={styles.metricContent}>
            <Text variant="xxLarge" className={styles.metricValue}>{ytdFatalities}</Text>
            <Text variant="small" className={styles.metricSubtext}>
              {ytdFatalities === 0 ? 'No fatalities' : 'Requires investigation'}
            </Text>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <Icon iconName="Clock" className={styles.metricIcon} />
            <Text variant="medium" className={styles.metricTitle}>Days Since Serious</Text>
          </div>
          <div className={styles.metricContent}>
            <Text variant="xxLarge" className={styles.metricValue}>{daysSinceSerious}</Text>
            <Text variant="small" className={styles.metricSubtext}>
              {daysSinceSerious > 30 ? 'Excellent' : daysSinceSerious > 14 ? 'Good' : 'Needs attention'}
            </Text>
          </div>
        </div>

        {topRisks && (
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <Icon iconName="Location" className={styles.metricIcon} />
              <Text variant="medium" className={styles.metricTitle}>Highest Risk Tracks</Text>
            </div>
            <div className={styles.trackList}>
              {topRisks.map((track, index) => (
                <div key={index} className={styles.trackItem}>
                  <Stack horizontal horizontalAlign="space-between">
                    <Text variant="small">{track.name}</Text>
                    <div className={styles.riskBadge} style={{ backgroundColor: getRiskColor(track.risk) }}>
                      <Text variant="small" className={styles.riskText}>{track.count}</Text>
                    </div>
                  </Stack>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {recentInjuries && recentInjuries.length > 0 && (
        <div className={styles.recentSection}>
          <Text variant="medium" className={styles.recentTitle}>Recent Injuries</Text>
          <div className={styles.recentList}>
            {recentInjuries.map((injury, index) => (
              <div key={index} className={styles.recentItem}>
                <Stack horizontal tokens={{ childrenGap: 10 }}>
                  <Icon 
                    iconName={injury.cra5e_determinedserious === 'Yes' ? 'ErrorBadge' : 'Info'} 
                    style={{ color: injury.cra5e_determinedserious === 'Yes' ? '#D13438' : '#605E5C' }}
                  />
                  <StackItem grow>
                    <Text variant="small">{injury.cra5e_greyhoundname || 'Unknown'}</Text>
                    <Text variant="xSmall" className={styles.injuryDetails}>
                      {injury.cra5e_injurycategory || 'N/A'}
                    </Text>
                  </StackItem>
                  <Text variant="xSmall">
                    {injury.cra5e_racedate ? new Date(injury.cra5e_racedate).toLocaleDateString() : 'N/A'}
                  </Text>
                </Stack>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (state.loading) {
    return (
      <div className={styles.realTimeSafetyDashboard}>
        <div className={styles.loadingContainer}>
          <Spinner size={SpinnerSize.large} label="Loading safety dashboard..." />
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={styles.realTimeSafetyDashboard}>
        <MessageBar messageBarType={MessageBarType.error} isMultiline>
          {state.error}
        </MessageBar>
      </div>
    );
  }

  const trackOptions: IDropdownOption[] = [
    { key: '', text: 'Select a track...' },
    ...state.availableTracks.map(track => ({ key: track, text: track }))
  ];

  return (
    <div className={styles.realTimeSafetyDashboard}>
      <div className={styles.header}>
        <Text variant="xLarge" className={styles.title}>Real-Time Safety Dashboard</Text>
      </div>

      <Pivot className={styles.pivotContainer}>
        <PivotItem headerText="All Tracks Overview">
          {renderMetricsSection(
            'All Tracks Statistics',
            state.allTracksMonthlyInjuries,
            state.allTracksYTDFatalities,
            state.allTracksDaysSinceSerious,
            state.allTracksSafetyStatus,
            state.allTracksTopRisks
          )}
        </PivotItem>

        <PivotItem headerText="Track Details">
          <div className={styles.trackSection}>
            <Dropdown
              label="Select Track"
              selectedKey={state.selectedTrack}
              onChange={handleTrackChange}
              options={trackOptions}
              className={styles.trackSelector}
            />
            
            {state.selectedTrack ? (
              renderMetricsSection(
                `${state.selectedTrack} Statistics`,
                state.trackMonthlyInjuries,
                state.trackYTDFatalities,
                state.trackDaysSinceSerious,
                state.trackSafetyStatus,
                undefined,
                state.trackRecentInjuries
              )
            ) : (
              <MessageBar messageBarType={MessageBarType.info}>
                Please select a track to view detailed statistics
              </MessageBar>
            )}
          </div>
        </PivotItem>
      </Pivot>

      <div className={styles.footer}>
        <Stack horizontal horizontalAlign="space-between">
          <Text variant="xSmall" className={styles.lastRefresh}>
            Last updated: {state.lastRefresh.toLocaleTimeString()}
          </Text>
          <Text variant="xSmall" className={styles.refreshInterval}>
            Auto-refresh: {props.refreshInterval / 60000} minutes
          </Text>
        </Stack>
      </div>
    </div>
  );
};

export default RealTimeSafetyDashboard;