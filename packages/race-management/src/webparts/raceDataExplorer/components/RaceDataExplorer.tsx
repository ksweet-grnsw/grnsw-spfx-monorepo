import * as React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import styles from './RaceDataExplorer.module.scss';
import { IRaceDataExplorerProps } from './IRaceDataExplorerProps';
import { RaceDataService } from '../../../services/RaceDataService';
import { IMeeting, IRace, IContestant, ISearchResults } from '../../../models/IRaceData';
import { DataGrid } from '../../../enterprise-ui/components/DataDisplay/DataGrid';
import { VirtualDataGrid } from '../../../enterprise-ui/components/DataDisplay/DataGrid/VirtualDataGrid';
import { StatusBadge } from '../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import { Breadcrumb } from '../../../enterprise-ui/components/Navigation/Breadcrumb/Breadcrumb';
import { FilterPanel } from '../../../enterprise-ui/components/Forms/FilterPanel/FilterPanel';
import { VirtualScrollNotification } from './VirtualScrollNotification/VirtualScrollNotification';
import { TableSkeleton } from './TableSkeleton/TableSkeleton';

// Import our new custom hooks
import {
  useMultiModalManager,
  useDataFetching,
  useTableColumns,
  useActionColumns,
  useFilters,
  useInjuryTracking,
  useOptimisticUpdate
} from '../../../hooks';

// Import helper utilities
import {
  renderPlacement,
  formatDate,
  formatCurrency,
  formatDistance,
  formatWeight,
  formatMargin,
  getTimeslotVariant,
  getStatusVariant
} from '../../../utils/tableConfig/columnHelpers';

// Import modals (to be created)
import { MeetingDetailsModal } from './Modals/MeetingDetailsModal';
import { RaceDetailsModal } from './Modals/RaceDetailsModal';
import { ContestantDetailsModal } from './Modals/ContestantDetailsModal';

type ViewType = 'meetings' | 'races' | 'contestants' | 'search';

interface ViewState {
  type: ViewType;
  meeting?: IMeeting;
  race?: IRace;
  searchTerm?: string;
}

/**
 * Refactored RaceDataExplorer component using custom hooks
 * Reduced from 2042 lines to ~400 lines with better separation of concerns
 */
const RaceDataExplorer: React.FC<IRaceDataExplorerProps> = (props) => {
  const {
    dataverseUrl,
    defaultView,
    pageSize,
    showFilters,
    showSearch,
    theme,
    tableDensity,
    httpClient
  } = props;

  // Initialize service
  const dataService = useMemo(
    () => new RaceDataService(httpClient, dataverseUrl),
    [httpClient, dataverseUrl]
  );

  // View state management
  const [viewState, setViewState] = useState<ViewState>({ 
    type: defaultView || 'meetings' 
  });

  // Use our custom hooks for cleaner code
  const modalManager = useMultiModalManager();
  const filters = useFilters({ 
    storageKey: 'raceDataExplorerFilters' 
  });
  const injuryTracking = useInjuryTracking();
  const { meetingColumns, raceColumns, contestantColumns } = useTableColumns();

  // Data fetching with loading states
  const meetingsData = useDataFetching(
    async () => {
      const meetings = await dataService.getMeetings();
      
      // Process injury data if filter is active
      // TODO: Implement injury data processing when API methods are available
      
      return meetings;
    },
    [filters.dateFrom, filters.dateTo, filters.selectedTrack, filters.showInjuryFilter],
    { autoFetch: viewState.type === 'meetings' }
  );

  const racesData = useDataFetching(
    async () => {
      if (!viewState.meeting) return [];
      return await dataService.getRacesForMeeting(viewState.meeting.cr4cc_racemeetingid);
    },
    [viewState.meeting],
    { autoFetch: viewState.type === 'races' && !!viewState.meeting }
  );

  const contestantsData = useDataFetching(
    async () => {
      if (!viewState.race) return [];
      const contestants = await dataService.getContestantsForRace(viewState.race.cr616_racesid);
      
      // TODO: Load injury data when API methods are available
      
      return contestants;
    },
    [viewState.race, filters.showInjuryFilter],
    { autoFetch: viewState.type === 'contestants' && !!viewState.race }
  );

  const searchData = useDataFetching<ISearchResults>(
    async () => {
      if (!filters.searchTerm || filters.searchTerm.length < 3) {
        return { 
          meetings: [], 
          races: [], 
          contestants: [], 
          greyhounds: [],
          totalResults: 0 
        } as ISearchResults;
      }
      return await dataService.searchAll(filters.searchTerm);
    },
    [filters.searchTerm],
    { autoFetch: viewState.type === 'search' }
  );

  // Optimistic Update hooks for data modifications
  const meetingOptimistic = useOptimisticUpdate<IMeeting[]>(
    meetingsData.data || [],
    {
      onSuccess: () => {
        console.log('Meeting update successful');
      },
      onError: (error) => {
        console.error('Meeting update failed:', error);
      },
      onRollback: () => {
        console.log('Rolling back meeting update');
      },
      rollbackDelay: 2000,
      showNotification: true
    }
  );

  const raceOptimistic = useOptimisticUpdate<IRace[]>(
    racesData.data || [],
    {
      onSuccess: () => {
        console.log('Race update successful');
      },
      onError: (error) => {
        console.error('Race update failed:', error);
      },
      rollbackDelay: 2000
    }
  );

  const contestantOptimistic = useOptimisticUpdate<IContestant[]>(
    contestantsData.data || [],
    {
      onSuccess: () => {
        console.log('Contestant update successful');
      },
      onError: (error) => {
        console.error('Contestant update failed:', error);
      },
      rollbackDelay: 2000
    }
  );

  // Example function to update a meeting optimistically
  const handleUpdateMeeting = useCallback(async (meeting: IMeeting, updates: Partial<IMeeting>) => {
    const updatedMeeting = { ...meeting, ...updates };
    
    await meetingOptimistic.updateOptimistically(
      (prevMeetings) => prevMeetings.map(m => 
        m.cr4cc_racemeetingid === meeting.cr4cc_racemeetingid ? updatedMeeting : m
      ),
      async () => {
        // This would be the actual API call
        // return await dataService.updateMeeting(meeting.cr4cc_racemeetingid, updates);
        // For now, simulate with a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return meetingsData.data || [];
      }
    );
  }, [meetingOptimistic, meetingsData.data]);

  // Navigation handlers
  const navigateToRaces = useCallback((meeting: IMeeting) => {
    setViewState({ type: 'races', meeting });
  }, []);

  const navigateToContestants = useCallback((race: IRace) => {
    setViewState({ type: 'contestants', race, meeting: viewState.meeting });
  }, [viewState.meeting]);

  const navigateBack = useCallback(() => {
    if (viewState.type === 'contestants' && viewState.meeting) {
      setViewState({ type: 'races', meeting: viewState.meeting });
    } else {
      setViewState({ type: 'meetings' });
    }
  }, [viewState]);

  // Add action columns to table columns
  const meetingColumnsWithActions = useActionColumns(meetingColumns, [
    {
      label: 'View Races',
      icon: '🏁',
      onClick: navigateToRaces
    },
    {
      label: 'View Details',
      icon: '📋',
      onClick: (meeting) => modalManager.openModal('meeting', meeting)
    }
  ]);

  const raceColumnsWithActions = useActionColumns(raceColumns, [
    {
      label: 'View Field',
      icon: '🐕',
      onClick: navigateToContestants
    },
    {
      label: 'View Details',
      icon: '📋',
      onClick: (race) => modalManager.openModal('race', race)
    }
  ]);

  const contestantColumnsWithActions = useActionColumns(contestantColumns, [
    {
      label: 'View Details',
      icon: '📋',
      onClick: (contestant) => modalManager.openModal('contestant', contestant)
    },
    {
      label: 'View Profile',
      icon: '🐕',
      onClick: async (contestant) => {
        // TODO: Load greyhound profile when API method is available
        modalManager.openModal('greyhound', contestant);
      },
      isVisible: (contestant) => !!contestant.cr616_greyhoundname
    },
    {
      label: 'View Injury',
      icon: '🏥',
      onClick: async (contestant) => {
        // TODO: Load health check when API method is available
        modalManager.openModal('healthCheck', {});
      },
      isVisible: (contestant) => injuryTracking.greyhoundInjuries.get(contestant.cr616_contestantsid) || false
    }
  ]);

  // Breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'Meetings', onClick: () => setViewState({ type: 'meetings' }) }];
    
    if (viewState.meeting) {
      items.push({
        label: `${viewState.meeting.cr4cc_trackname} - ${formatDate(viewState.meeting.cr4cc_meetingdate)}`,
        onClick: () => setViewState({ type: 'races', meeting: viewState.meeting })
      });
    }
    
    if (viewState.race) {
      items.push({
        label: `Race ${viewState.race.cr616_racenumber}`,
        onClick: () => setViewState({ type: 'contestants', race: viewState.race, meeting: viewState.meeting })
      });
    }
    
    if (viewState.type === 'search') {
      items.push({ 
        label: `Search: "${filters.searchTerm}"`, 
        onClick: () => {} // No action for search breadcrumb
      });
    }
    
    return items;
  }, [viewState, filters.searchTerm]);

  // Search handler
  const handleSearch = useCallback((term: string) => {
    filters.setSearchTerm(term);
    if (term.length >= 3) {
      setViewState({ type: 'search', searchTerm: term });
    } else if (term.length === 0) {
      setViewState({ type: 'meetings' });
    }
  }, [filters]);

  // Get current data and loading state based on view
  // Use optimistic data when available, otherwise fall back to fetched data
  const { data, loading, error } = useMemo(() => {
    switch (viewState.type) {
      case 'meetings':
        return {
          data: meetingOptimistic.state.data.length > 0 ? meetingOptimistic.state.data : meetingsData.data,
          loading: meetingsData.loading || meetingOptimistic.state.isPending,
          error: meetingsData.error || meetingOptimistic.state.error
        };
      case 'races':
        return {
          data: raceOptimistic.state.data.length > 0 ? raceOptimistic.state.data : racesData.data,
          loading: racesData.loading || raceOptimistic.state.isPending,
          error: racesData.error || raceOptimistic.state.error
        };
      case 'contestants':
        return {
          data: contestantOptimistic.state.data.length > 0 ? contestantOptimistic.state.data : contestantsData.data,
          loading: contestantsData.loading || contestantOptimistic.state.isPending,
          error: contestantsData.error || contestantOptimistic.state.error
        };
      case 'search':
        return searchData;
      default:
        return { data: null, loading: false, error: null };
    }
  }, [
    viewState.type, 
    meetingsData, 
    racesData, 
    contestantsData, 
    searchData,
    meetingOptimistic.state,
    raceOptimistic.state,
    contestantOptimistic.state
  ]);

  // Render table based on view type
  const renderTable = () => {
    if (loading) {
      return <TableSkeleton rows={10} columns={5} />;
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <p>Error loading data: {error}</p>
          <button onClick={() => location.reload()}>Retry</button>
        </div>
      );
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📭</span>
          <p>No data found</p>
        </div>
      );
    }

    // Determine which table to render
    let tableData: any[] = [];
    let columns: any[] = [];
    let onRowClick: any = undefined;

    switch (viewState.type) {
      case 'meetings':
        tableData = data as IMeeting[];
        columns = meetingColumnsWithActions;
        onRowClick = navigateToRaces;
        break;
      case 'races':
        tableData = data as IRace[];
        columns = raceColumnsWithActions;
        onRowClick = navigateToContestants;
        break;
      case 'contestants':
        tableData = data as IContestant[];
        columns = contestantColumnsWithActions;
        break;
      case 'search':
        // Handle search results separately
        return renderSearchResults(data as ISearchResults);
    }

    // Use VirtualDataGrid for large datasets
    const TableComponent = tableData.length > 500 ? VirtualDataGrid : DataGrid;
    
    return (
      <>
        {tableData.length > 500 && (
          <VirtualScrollNotification 
            itemCount={tableData.length}
            threshold={500}
            dataType={viewState.type}
          />
        )}
        <TableComponent
          data={tableData}
          columns={columns}
          theme={theme as any}
          density={tableDensity}
          striped={true}
          pageSize={pageSize}
          sortable={true}
          selectable={false}
          onRowClick={onRowClick}
          stickyHeader
        />
      </>
    );
  };

  // Render search results
  const renderSearchResults = (results: ISearchResults) => {
    return (
      <div className={styles.searchResults}>
        {results.meetings.length > 0 && (
          <div className={styles.resultSection}>
            <h3>Meetings ({results.meetings.length})</h3>
            <DataGrid
              data={results.meetings}
              columns={meetingColumnsWithActions}
              density={tableDensity}
              onRowClick={navigateToRaces}
            />
          </div>
        )}
        {results.races.length > 0 && (
          <div className={styles.resultSection}>
            <h3>Races ({results.races.length})</h3>
            <DataGrid
              data={results.races}
              columns={raceColumnsWithActions}
              density={tableDensity}
            />
          </div>
        )}
        {results.contestants.length > 0 && (
          <div className={styles.resultSection}>
            <h3>Contestants ({results.contestants.length})</h3>
            <DataGrid
              data={results.contestants}
              columns={contestantColumnsWithActions}
              density={tableDensity}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${styles.raceDataExplorer} ${styles[`theme-${theme}`]}`}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Race Data Explorer</h1>
        {viewState.type !== 'meetings' && (
          <button onClick={navigateBack} className={styles.backButton}>
            ← Back
          </button>
        )}
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search meetings, races, or greyhounds..."
            value={filters.searchTerm || ''}
            onChange={(e) => handleSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      )}

      {/* Filters */}
      {showFilters && viewState.type === 'meetings' && (
        <FilterPanel
          showClearAll={filters.hasActiveFilters()}
          onClearAll={filters.clearFilters}
          theme={theme as any}
        >
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label>Date From:</label>
              <input 
                type="date" 
                value={filters.dateFrom?.toISOString().split('T')[0] || ''} 
                onChange={(e) => filters.setDateFrom(e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label>Date To:</label>
              <input 
                type="date" 
                value={filters.dateTo?.toISOString().split('T')[0] || ''} 
                onChange={(e) => filters.setDateTo(e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label>Track:</label>
              <select 
                value={filters.selectedTrack || ''} 
                onChange={(e) => filters.setSelectedTrack(e.target.value)}
              >
                <option value="">All Tracks</option>
                <option value="Wentworth Park">Wentworth Park</option>
                <option value="The Gardens">The Gardens</option>
                <option value="Richmond">Richmond</option>
                <option value="Gosford">Gosford</option>
              </select>
            </div>
            <div>Active filters: {filters.getActiveFilterCount()}</div>
          </div>
        </FilterPanel>
      )}

      {/* Breadcrumb */}
      {viewState.type !== 'meetings' && (
        <Breadcrumb items={breadcrumbItems} theme={theme as any} />
      )}

      {/* Optimistic Update Indicators */}
      {(meetingOptimistic.state.isRollingBack || 
        raceOptimistic.state.isRollingBack || 
        contestantOptimistic.state.isRollingBack) && (
        <div className={styles.rollbackNotification}>
          <span className={styles.rollbackIcon}>⚠️</span>
          <span>Update failed. Rolling back changes...</span>
        </div>
      )}

      {/* Main Content */}
      <div className={styles.content}>
        {renderTable()}
      </div>

      {/* Modals */}
      {modalManager.isModalOpen('meeting') && (
        <MeetingDetailsModal
          meeting={modalManager.getSelectedItem('meeting')}
          isOpen={true}
          onClose={() => modalManager.closeModal()}
        />
      )}
      
      {modalManager.isModalOpen('race') && (
        <RaceDetailsModal
          race={modalManager.getSelectedItem('race')}
          isOpen={true}
          onClose={() => modalManager.closeModal()}
        />
      )}
      
      {modalManager.isModalOpen('contestant') && (
        <ContestantDetailsModal
          contestant={modalManager.getSelectedItem('contestant')}
          isOpen={true}
          onClose={() => modalManager.closeModal()}
        />
      )}
    </div>
  );
};

export default RaceDataExplorer;