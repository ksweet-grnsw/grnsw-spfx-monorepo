import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import styles from './SafetyDashboard.module.scss';
import type { ISafetyDashboardProps } from './ISafetyDashboardProps';
import { InjuryDataService, IInjuryDataRecord } from '../../../services/InjuryDataService';
import { Icon } from '@fluentui/react/lib/Icon';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { Stack, StackItem } from '@fluentui/react/lib/Stack';
import { Text } from '@fluentui/react/lib/Text';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Import new infrastructure components from @grnsw/shared
import { 
  ErrorBoundary,
  DataverseErrorBoundary,
  LoadingSpinner,
  DashboardSkeleton,
  useTelemetry,
  useAsyncOperation,
  useProgressiveLoading,
  LazyComponent
} from '@grnsw/shared';

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
  viewMode: 'dashboard' | 'table';
}

/**
 * Modern Safety Dashboard using Enterprise UI components
 * Demonstrates DRY principle by using shared components
 */
export const SafetyDashboardModern: React.FC<ISafetyDashboardProps> = (props) => {
  const [state, setState] = useState<IDashboardState>({
    loading: true,
    error: undefined,
    selectedTrack: 'all',
    injuries: [],
    totalInjuries: 0,
    euthanasiaCount: 0,
    fatalityRate: 0,
    ninetyDayInjuries: 0,
    sixtyDayInjuries: 0,
    activeTracks: 0,
    viewMode: 'dashboard'
  });

  const injuryService = useMemo(
    () => new InjuryDataService(props.context),
    [props.context]
  );

  const loadInjuryData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const data = await injuryService.getInjuryData(state.selectedTrack);
      const stats = calculateStatistics(data);
      
      setState(prev => ({
        ...prev,
        injuries: data,
        ...stats,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to load injury data: ${error.message}`,
        loading: false
      }));
    }
  }, [injuryService, state.selectedTrack]);

  useEffect(() => {
    loadInjuryData();
  }, [loadInjuryData]);

  const calculateStatistics = (injuries: IInjuryDataRecord[]) => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const euthanasias = injuries.filter(i => i.cra5e_euthanasia === true).length;
    const ninetyDayCount = injuries.filter(i => new Date(i.createdon) >= ninetyDaysAgo).length;
    const sixtyDayCount = injuries.filter(i => new Date(i.createdon) >= sixtyDaysAgo).length;
    const uniqueTracks = new Set(injuries.map(i => i.cra5e_track_name)).size;
    
    return {
      totalInjuries: injuries.length,
      euthanasiaCount: euthanasias,
      fatalityRate: injuries.length > 0 ? (euthanasias / injuries.length) * 100 : 0,
      ninetyDayInjuries: ninetyDayCount,
      sixtyDayInjuries: sixtyDayCount,
      activeTracks: uniqueTracks
    };
  };

  // Define columns for DataGrid view
  const columns: DataGridColumn<IInjuryDataRecord>[] = [
    {
      key: 'cra5e_greyhound_name',
      label: 'Greyhound',
      sortable: true
    },
    {
      key: 'cra5e_track_name',
      label: 'Track',
      sortable: true
    },
    {
      key: 'cra5e_injury_category',
      label: 'Category',
      sortable: true,
      render: (item) => (
        <StatusBadge
          status={item.cra5e_injury_category || 'Unknown'}
          variant={getSeverityVariant(item.cra5e_injury_category)}
          size="small"
        />
      )
    },
    {
      key: 'cra5e_euthanasia',
      label: 'Status',
      sortable: true,
      render: (item) => (
        <StatusBadge
          status={item.cra5e_euthanasia ? 'Euthanised' : 'Treated'}
          variant={item.cra5e_euthanasia ? 'error' : 'success'}
          size="small"
          dot
        />
      )
    },
    {
      key: 'createdon',
      label: 'Date',
      sortable: true,
      render: (item) => new Date(item.createdon).toLocaleDateString()
    }
  ];

  const getSeverityVariant = (category: string | undefined) => {
    if (!category) return 'neutral';
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('fatal') || lowerCategory.includes('catastrophic')) return 'error';
    if (lowerCategory.includes('major') || lowerCategory.includes('serious')) return 'warning';
    return 'info';
  };

  const trackOptions: IDropdownOption[] = [
    { key: 'all', text: 'All Tracks' },
    { key: 'richmond', text: 'Richmond' },
    { key: 'wentworth', text: 'Wentworth Park' },
    { key: 'gosford', text: 'Gosford' },
    { key: 'dapto', text: 'Dapto' }
  ];

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <div className={styles.statCard} style={{ borderLeftColor: color }}>
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
        <Icon iconName={icon} style={{ fontSize: 24, color }} />
        <Stack>
          <Text variant="large" style={{ fontWeight: 600 }}>{value}</Text>
          <Text variant="small" style={{ color: '#666' }}>{title}</Text>
        </Stack>
      </Stack>
    </div>
  );

  const { isDarkTheme, hasTeamsContext } = props;
  const { loading, error, viewMode, totalInjuries, euthanasiaCount, fatalityRate, 
          ninetyDayInjuries, sixtyDayInjuries, activeTracks, injuries } = state;

  return (
    <section className={`${styles.safetyDashboard} ${hasTeamsContext ? styles.teams : ''} ${isDarkTheme ? styles.dark : ''}`}>
      <div className={styles.header}>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <div>
            <h2>Greyhound Safety Dashboard</h2>
            <Text variant="medium">Real-time injury tracking and analysis</Text>
          </div>
          <Icon iconName="Health" style={{ fontSize: 32, color: '#0078d4' }} />
        </Stack>
      </div>

      <FilterPanel
        title="Dashboard Controls"
        theme="health"
        collapsible
        defaultExpanded={true}
      >
        <Stack horizontal tokens={{ childrenGap: 20 }} verticalAlign="center">
          <Dropdown
            label="Track Filter"
            options={trackOptions}
            selectedKey={state.selectedTrack}
            onChange={(e, option) => setState(prev => ({ ...prev, selectedTrack: option?.key as string }))}
            style={{ minWidth: 200 }}
          />
          <div>
            <label>View Mode:</label>
            <Stack horizontal tokens={{ childrenGap: 10 }}>
              <button 
                className={viewMode === 'dashboard' ? styles.activeButton : ''}
                onClick={() => setState(prev => ({ ...prev, viewMode: 'dashboard' }))}
              >
                Dashboard
              </button>
              <button 
                className={viewMode === 'table' ? styles.activeButton : ''}
                onClick={() => setState(prev => ({ ...prev, viewMode: 'table' }))}
              >
                Table
              </button>
            </Stack>
          </div>
          <button onClick={loadInjuryData} disabled={loading}>
            <Icon iconName="Refresh" /> Refresh
          </button>
        </Stack>
      </FilterPanel>

      {error && (
        <MessageBar messageBarType={MessageBarType.error}>
          {error}
        </MessageBar>
      )}

      {loading ? (
        <Spinner size={SpinnerSize.large} label="Loading injury data..." />
      ) : viewMode === 'dashboard' ? (
        <>
          <div className={styles.statsGrid}>
            {renderStatCard('Total Injuries', totalInjuries, 'Health', '#0078d4')}
            {renderStatCard('Euthanasia Cases', euthanasiaCount, 'Warning', '#d83b01')}
            {renderStatCard('Fatality Rate', `${fatalityRate.toFixed(1)}%`, 'LineChart', '#881798')}
            {renderStatCard('90-Day Injuries', ninetyDayInjuries, 'Calendar', '#107c10')}
            {renderStatCard('60-Day Injuries', sixtyDayInjuries, 'Recent', '#00bcf2')}
            {renderStatCard('Active Tracks', activeTracks, 'MapPin', '#ffb900')}
          </div>

          {/* Charts would go here - keeping existing chart implementation */}
        </>
      ) : (
        <DataGrid<IInjuryDataRecord>
          data={injuries}
          columns={columns}
          theme="health"
          pagination
          pageSize={20}
          sortable
          loading={loading}
          error={error}
        />
      )}
    </section>
  );
};

export default SafetyDashboardModern;