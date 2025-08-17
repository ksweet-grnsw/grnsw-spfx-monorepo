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

// Import modals
import { MeetingDetailsModal } from './Modals/MeetingDetailsModal';
import { RaceDetailsModal } from './Modals/RaceDetailsModal';
import { ContestantDetailsModal } from './Modals/ContestantDetailsModal';
import { AnalyticsModal } from './Modals/AnalyticsModal';

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
    httpClient,
    context
  } = props;

  // Initialize service with context for proper authentication
  const dataService = useMemo(
    () => new RaceDataService(httpClient, dataverseUrl, context),
    [httpClient, dataverseUrl, context]
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
      try {
        console.log('Fetching meetings from Dataverse with filters:', {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          track: filters.selectedTrack,
          showInjuryFilter: filters.showInjuryFilter
        });
        
        let meetings: IMeeting[] = [];
        
        if (filters.showInjuryFilter) {
          // Get meetings with injuries using the cross-reference method
          console.log('Fetching meetings with injuries...');
          meetings = await dataService.getMeetingsWithInjuries(filters.selectedInjuryCategories || ['Cat D', 'Cat E']);
          
          // Apply date and track filters to injury results
          if (filters.dateFrom || filters.dateTo || filters.selectedTrack) {
            meetings = meetings.filter(meeting => {
              // Date from filter
              if (filters.dateFrom) {
                const meetingDate = new Date(meeting.cr4cc_meetingdate);
                if (meetingDate < filters.dateFrom) return false;
              }
              
              // Date to filter
              if (filters.dateTo) {
                const meetingDate = new Date(meeting.cr4cc_meetingdate);
                if (meetingDate > filters.dateTo) return false;
              }
              
              // Track filter
              if (filters.selectedTrack && filters.selectedTrack !== '') {
                if (meeting.cr4cc_trackname !== filters.selectedTrack) return false;
              }
              
              return true;
            });
          }
        } else {
          // Get regular meetings with standard filters
          meetings = await dataService.getMeetings({
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            track: filters.selectedTrack
          });
        }
        
        // Add injury status to meetings if we have injury data available
        if (meetings && meetings.length > 0) {
          try {
            console.log('Checking for injury data for meetings...');
            const meetingsWithInjuryStatus = await Promise.all(
              meetings.map(async (meeting) => {
                try {
                  const injurySummary = await dataService.getInjurySummaryForMeeting(
                    meeting.cr4cc_trackname, 
                    meeting.cr4cc_meetingdate
                  );
                  return {
                    ...meeting,
                    hasInjuries: injurySummary.total > 0
                  };
                } catch (error) {
                  console.warn('Could not fetch injury data for meeting:', meeting.cr4cc_racemeetingid);
                  return {
                    ...meeting,
                    hasInjuries: false
                  };
                }
              })
            );
            meetings = meetingsWithInjuryStatus;
          } catch (error) {
            console.warn('Could not fetch injury data for meetings:', error);
          }
        }
        
        console.log('Meetings fetched successfully:', meetings.length, 'meetings');
        return meetings;
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
        throw error;
      }
    },
    [filters.dateFrom, filters.dateTo, filters.selectedTrack, filters.showInjuryFilter, filters.selectedInjuryCategories],
    { 
      autoFetch: viewState.type === 'meetings',
      onError: (error) => {
        console.error('Meeting fetch error in component:', error);
      }
    }
  );

  const racesData = useDataFetching(
    async () => {
      if (!viewState.meeting) return [];
      const races = await dataService.getRacesForMeeting(viewState.meeting.cr4cc_racemeetingid);
      
      // Add injury status to races
      if (races && races.length > 0) {
        try {
          console.log('Checking for injury data for races...');
          const racesWithInjuryStatus = await Promise.all(
            races.map(async (race) => {
              try {
                const injuries = await dataService.getInjuriesForRace(
                  viewState.meeting.cr4cc_trackname,
                  viewState.meeting.cr4cc_meetingdate,
                  race.cr616_racenumber
                );
                return {
                  ...race,
                  hasInjuries: injuries.length > 0
                };
              } catch (error) {
                console.warn('Could not fetch injury data for race:', race.cr616_racesid);
                return {
                  ...race,
                  hasInjuries: false
                };
              }
            })
          );
          return racesWithInjuryStatus;
        } catch (error) {
          console.warn('Could not fetch injury data for races:', error);
          return races;
        }
      }
      
      return races;
    },
    [viewState.meeting],
    { autoFetch: viewState.type === 'races' && !!viewState.meeting }
  );

  const contestantsData = useDataFetching(
    async () => {
      if (!viewState.race) return [];
      const contestants = await dataService.getContestantsForRace(viewState.race.cr616_racesid);
      
      // Add injury status to contestants
      if (contestants && contestants.length > 0 && viewState.meeting) {
        try {
          console.log('Checking for injury data for contestants...');
          const contestantsWithInjuryStatus = await Promise.all(
            contestants.map(async (contestant) => {
              try {
                // Get greyhound injury data by name
                const greyhound = await dataService.getGreyhoundByName(contestant.cr616_greyhoundname);
                if (greyhound) {
                  const latestHealthCheck = await dataService.getLatestHealthCheckForGreyhound(greyhound.cra5e_greyhoundid);
                  const hasRecentInjury = latestHealthCheck && 
                    latestHealthCheck.cra5e_injuryclassification &&
                    new Date(latestHealthCheck.cra5e_datechecked) >= new Date(viewState.meeting.cr4cc_meetingdate);
                  
                  return {
                    ...contestant,
                    hasInjuries: hasRecentInjury
                  };
                } else {
                  return {
                    ...contestant,
                    hasInjuries: false
                  };
                }
              } catch (error) {
                console.warn('Could not fetch injury data for contestant:', contestant.cr616_greyhoundname);
                return {
                  ...contestant,
                  hasInjuries: false
                };
              }
            })
          );
          return contestantsWithInjuryStatus;
        } catch (error) {
          console.warn('Could not fetch injury data for contestants:', error);
          return contestants;
        }
      }
      
      return contestants;
    },
    [viewState.race, viewState.meeting, filters.showInjuryFilter],
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
      label: 'Races',
      icon: '▼',
      onClick: navigateToRaces
    },
    {
      label: 'Details',
      icon: '📋',
      onClick: (meeting) => modalManager.openModal('meeting', meeting)
    }
  ]);

  const raceColumnsWithActions = useActionColumns(raceColumns, [
    {
      label: 'Field',
      icon: '▼',
      onClick: navigateToContestants
    },
    {
      label: 'Details',
      icon: '📋',
      onClick: (race) => modalManager.openModal('race', race)
    }
  ]);

  const contestantColumnsWithActions = useActionColumns(contestantColumns, [
    {
      label: 'Details',
      icon: '📋',
      onClick: (contestant) => modalManager.openModal('contestant', contestant)
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
    let tableTitle = '';

    switch (viewState.type) {
      case 'meetings':
        tableData = data as IMeeting[];
        columns = meetingColumnsWithActions;
        onRowClick = navigateToRaces;
        tableTitle = 'Meetings';
        break;
      case 'races':
        tableData = data as IRace[];
        columns = raceColumnsWithActions;
        onRowClick = navigateToContestants;
        tableTitle = 'Races';
        break;
      case 'contestants':
        tableData = data as IContestant[];
        columns = contestantColumnsWithActions;
        tableTitle = 'Contestants';
        break;
      case 'search':
        // Handle search results separately
        return renderSearchResults(data as ISearchResults);
    }

    // Use VirtualDataGrid for large datasets
    const TableComponent = tableData.length > 500 ? VirtualDataGrid : DataGrid;
    
    return (
      <>
        {tableTitle && (
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>{tableTitle}</h2>
            <span className={styles.tableCount}>({tableData.length} items)</span>
          </div>
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
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder="Search meetings, races, or greyhounds..."
                value={filters.searchTerm || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className={styles.searchInput}
              />
              <button 
                className={styles.searchButton}
                onClick={() => handleSearch(filters.searchTerm || '')}
                aria-label="Search"
              >
                🔍
              </button>
              {filters.searchTerm && filters.searchTerm.length > 0 && (
                <button 
                  className={styles.clearButton}
                  onClick={() => handleSearch('')}
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && viewState.type === 'meetings' && (
        <div className={styles.filterBar}>
          <div className={styles.filterContainer}>
            <div className={styles.filterHeader}>
              <h3 className={styles.filterTitle}>Filters</h3>
              {filters.hasActiveFilters() && (
                <button
                  className={styles.clearAllButton}
                  onClick={filters.clearFilters}
                  aria-label="Clear all filters"
                >
                  Clear All
                </button>
              )}
            </div>
            {/* Filter Chips */}
            {filters.hasActiveFilters() && (
              <div className={styles.filterChips}>
                <span className={styles.filterChipsLabel}>Active Filters:</span>
                {filters.dateFrom && (
                  <div className={styles.filterChip}>
                    <span className={styles.chipLabel}>From:</span>
                    <span className={styles.chipValue}>{filters.dateFrom.toLocaleDateString()}</span>
                    <button 
                      className={styles.chipRemove}
                      onClick={() => filters.setDateFrom(undefined)}
                      aria-label="Remove date from filter"
                    >
                      ×
                    </button>
                  </div>
                )}
                {filters.dateTo && (
                  <div className={styles.filterChip}>
                    <span className={styles.chipLabel}>To:</span>
                    <span className={styles.chipValue}>{filters.dateTo.toLocaleDateString()}</span>
                    <button 
                      className={styles.chipRemove}
                      onClick={() => filters.setDateTo(undefined)}
                      aria-label="Remove date to filter"
                    >
                      ×
                    </button>
                  </div>
                )}
                {filters.selectedTrack && (
                  <div className={styles.filterChip}>
                    <span className={styles.chipLabel}>Track:</span>
                    <span className={styles.chipValue}>{filters.selectedTrack}</span>
                    <button 
                      className={styles.chipRemove}
                      onClick={() => filters.setSelectedTrack(undefined)}
                      aria-label="Remove track filter"
                    >
                      ×
                    </button>
                  </div>
                )}
                {filters.showInjuryFilter && (
                  <div className={styles.filterChip}>
                    <span className={styles.chipLabel}>Injuries:</span>
                    <span className={styles.chipValue}>Enabled</span>
                    <button 
                      className={styles.chipRemove}
                      onClick={() => filters.setShowInjuryFilter(false)}
                      aria-label="Remove injury filter"
                    >
                      ×
                    </button>
                  </div>
                )}
                <button 
                  className={styles.clearAllChips}
                  onClick={filters.clearFilters}
                  aria-label="Clear all filters"
                >
                  Clear All
                </button>
              </div>
            )}
            
            <div className={styles.filterContent}>
              <div className={styles.filterGroup}>
                <label>Date From:</label>
                <input 
                  type="date" 
                  value={filters.dateFrom?.toISOString().split('T')[0] || ''} 
                  onChange={(e) => filters.setDateFrom(e.target.value ? new Date(e.target.value) : undefined)}
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Date To:</label>
                <input 
                  type="date" 
                  value={filters.dateTo?.toISOString().split('T')[0] || ''} 
                  onChange={(e) => filters.setDateTo(e.target.value ? new Date(e.target.value) : undefined)}
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Track:</label>
                <select 
                  value={filters.selectedTrack || ''} 
                  onChange={(e) => filters.setSelectedTrack(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">All Tracks</option>
                  <option value="Broken Hill">Broken Hill</option>
                  <option value="Bulli">Bulli</option>
                  <option value="Casino">Casino</option>
                  <option value="Dapto">Dapto</option>
                  <option value="Dubbo">Dubbo</option>
                  <option value="Gosford">Gosford</option>
                  <option value="Goulburn">Goulburn</option>
                  <option value="Grafton">Grafton</option>
                  <option value="Gunnedah">Gunnedah</option>
                  <option value="Lithgow">Lithgow</option>
                  <option value="Maitland">Maitland</option>
                  <option value="Nowra">Nowra</option>
                  <option value="Richmond">Richmond</option>
                  <option value="Taree">Taree</option>
                  <option value="Temora">Temora</option>
                  <option value="The Gardens">The Gardens</option>
                  <option value="Wagga Wagga">Wagga Wagga</option>
                  <option value="Wentworth Park">Wentworth Park</option>
                </select>
              </div>
              <div className={styles.filterStatus}>Active filters: {filters.getActiveFilterCount()}</div>
            </div>
            <div className={styles.filterActions}>
              <button
                className={`${styles.injuryFilterButton} ${filters.showInjuryFilter ? styles.active : ''}`}
                onClick={() => filters.setShowInjuryFilter(!filters.showInjuryFilter)}
                aria-label="Toggle injury filter"
              >
                🏥 Injuries
              </button>
              <button
                className={styles.analyticsButton}
                onClick={() => modalManager.openModal('analytics', {})}
                aria-label="View analytics"
              >
                📊 Analytics
              </button>
            </div>
          </div>
        </div>
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
      
      {modalManager.isModalOpen('analytics') && (
        <AnalyticsModal
          isOpen={true}
          onClose={() => modalManager.closeModal()}
          meetings={meetingsData.data}
        />
      )}
    </div>
  );
};

export default RaceDataExplorer;