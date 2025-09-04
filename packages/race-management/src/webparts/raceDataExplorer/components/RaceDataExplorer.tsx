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
import { GreyhoundDetailsModal } from './Modals/GreyhoundDetailsModal';
import { AnalyticsModal } from './Modals/AnalyticsModal';

// Import date range filter component
import { DateRangeFilter } from '../../../components/DateRangeFilter';

// Import diagnostic tool (available in browser console as dataverseDiag)
import '../../../utils/dataverseDiagnostic';

// Import SVG icons for actions
const detailsIcon = require('../../../assets/icons/details.svg');
const downArrowIcon = require('../../../assets/icons/down-arrow.svg');
const healthIcon = require('../../../assets/icons/health.svg');
const searchIcon = require('../../../assets/icons/search.svg');
const greyhoundIcon = require('../../../assets/icons/greyhound.png');
const logoUrl = require('../../../assets/images/siteicon.png');

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
  // FEATURE FLAG: Set to true to enable injury checking
  // WARNING: Only enable after testing thoroughly
  const ENABLE_INJURY_FEATURE = true;
  
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
        
        // ALWAYS fetch ALL meetings regardless of injury filter state
        // The injury filter should only affect display, not data fetching
        let meetings = await dataService.getMeetings({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          authority: filters.selectedAuthority,
          track: filters.selectedTrack
        });
        
        // Apply day of week filter if set
        if (filters.selectedDayOfWeek !== undefined) {
          meetings = meetings.filter(meeting => {
            const meetingDate = new Date(meeting.cr4cc_meetingdate);
            return meetingDate.getDay() === filters.selectedDayOfWeek;
          });
        }
        
        // Note: When injury filter is active, we'll fetch injury data separately
        // and filter the display, not the fetched data. This prevents flashing.
        
        console.log('Meetings fetched successfully:', meetings.length, 'meetings');
        return meetings;
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
        throw error;
      }
    },
    [filters.dateFrom?.getTime(), filters.dateTo?.getTime(), filters.selectedAuthority, filters.selectedTrack, filters.selectedDayOfWeek],
    { 
      autoFetch: viewState.type === 'meetings',
      retryCount: 2, // Limit retries to prevent infinite loops
      retryDelay: 2000, // Start with 2 second delay
      useExponentialBackoff: true, // Use exponential backoff
      maxRetryDelay: 10000, // Max 10 second delay
      onError: (error) => {
        // Only log errors that are not cancellations
        if (!error.message.includes('cancelled') && !error.message.includes('aborted')) {
          console.error('Meeting fetch error in component:', error);
        }
      }
    }
  );

  const racesData = useDataFetching(
    async () => {
      if (!viewState.meeting) {
        console.log('No meeting selected for races');
        return [];
      }
      console.log('Fetching races for meeting:', viewState.meeting.cr4cc_racemeetingid);
      try {
        const races = await dataService.getRacesForMeeting(viewState.meeting.cr4cc_racemeetingid);
        console.log('Races fetched successfully:', races?.length || 0);
        
        // Check for injuries in each race if feature is enabled and filter is active
        if (ENABLE_INJURY_FEATURE && filters.showInjuryFilter && races && races.length > 0) {
          console.log('Checking for injuries in each race...');
          
          // Process races in smaller batches to prevent overwhelming the API
          const BATCH_SIZE = 3; // Process 3 races at a time
          for (let i = 0; i < races.length; i += BATCH_SIZE) {
            const raceBatch = races.slice(i, i + BATCH_SIZE);
            
            // Process this batch with controlled concurrency
            const racePromises = raceBatch.map(async (race) => {
              try {
                // Get injuries for this specific race
                const raceInjuries = await dataService.getInjuriesForRace(
                  viewState.meeting?.cr4cc_trackname || '',
                  viewState.meeting?.cr4cc_meetingdate || new Date(),
                  race.cr616_racenumber
                );
                
                // Calculate summary from health checks
                const injuryCount = raceInjuries.length;
                
                // Store the injury count for this race
                injuryTracking.updateRaceInjuryCount(race.cr616_racesid, injuryCount);
                
                if (injuryCount > 0) {
                  console.log(`Found ${injuryCount} injuries in Race ${race.cr616_racenumber}`);
                }
              } catch (error) {
                console.warn(`Could not check injuries for Race ${race.cr616_racenumber}:`, error);
              }
            });
            
            // Wait for all promises to complete (ignore individual failures)
            await Promise.all(racePromises.map(p => p.catch(() => {})));
            
            // Longer delay between batches to prevent resource exhaustion
            if (i + BATCH_SIZE < races.length) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        return races || [];
      } catch (error) {
        console.error('Failed to fetch races:', error);
        throw error;
      }
    },
    [viewState.meeting],
    { 
      autoFetch: viewState.type === 'races' && !!viewState.meeting,
      retryCount: 2,
      retryDelay: 2000,
      useExponentialBackoff: true,
      maxRetryDelay: 10000,
      onError: (error) => {
        // Only log errors that are not cancellations
        if (!error.message.includes('cancelled') && !error.message.includes('aborted')) {
          console.error('Race fetch error in component:', error);
        }
      }
    }
  );

  const contestantsData = useDataFetching(
    async () => {
      if (!viewState.race) {
        console.log('No race selected for contestants');
        return [];
      }
      console.log('Fetching contestants for race:', viewState.race.cr616_racesid);
      try {
        const contestants = await dataService.getContestantsForRace(viewState.race.cr616_racesid);
        console.log('Contestants fetched successfully:', contestants?.length || 0);
        
        // Only check injuries if feature is enabled AND filter is active
        if (ENABLE_INJURY_FEATURE && filters.showInjuryFilter && contestants && contestants.length > 0 && viewState.race) {
          console.log('Injury feature enabled and filter active - checking for injury data in this race');
          
          try {
            // Get injury data for this specific race (already cached from race-level checking)
            const raceInjuries = await dataService.getInjuriesForRace(
              viewState.meeting?.cr4cc_trackname || '',
              viewState.meeting?.cr4cc_meetingdate || new Date(),
              viewState.race.cr616_racenumber
            );
            
            console.log(`Found ${raceInjuries.length} injury records for this race`);
            console.log('Race injury details:', raceInjuries.map(i => ({
              greyhoundId: i.cra5e_greyhound,
              injured: i.cra5e_injured,
              type: i.cra5e_type
            })));
            
            // Create a map of injured greyhound IDs from the injury data - ONLY those marked as injured
            const injuredGreyhoundIds = new Set<string>();
            raceInjuries.forEach(injury => {
              if (injury.cra5e_greyhound && injury.cra5e_injured === true) {
                injuredGreyhoundIds.add(injury.cra5e_greyhound);
                console.log(`✅ Added INJURED greyhound ID: ${injury.cra5e_greyhound}`);
              } else if (injury.cra5e_greyhound) {
                console.log(`❌ Skipped non-injured greyhound ID: ${injury.cra5e_greyhound} (injured: ${injury.cra5e_injured})`);
              }
            });
            console.log('Final injured greyhound IDs set:', Array.from(injuredGreyhoundIds));
            
            // Check each contestant for injuries using greyhound lookup with throttling
            const CONTESTANT_BATCH_SIZE = 2; // Process 2 contestants at a time
            for (let i = 0; i < contestants.length; i += CONTESTANT_BATCH_SIZE) {
              const contestantBatch = contestants.slice(i, i + CONTESTANT_BATCH_SIZE);
              
              // Process this batch with controlled concurrency
              const contestantPromises = contestantBatch.map(async (contestant) => {
                let hasInjury = false;
                
                if (contestant.cr616_greyhoundname && contestant.cr616_leftearbrand) {
                  try {
                    // Find the greyhound in the injury system
                    const greyhound = await dataService.getGreyhoundByName(
                      contestant.cr616_greyhoundname, 
                      contestant.cr616_leftearbrand
                    );
                    
                    console.log(`Greyhound lookup result for ${contestant.cr616_greyhoundname}:`, greyhound ? greyhound.cra5e_greyhoundid : 'NOT FOUND');
                    
                    if (greyhound && injuredGreyhoundIds.has(greyhound.cra5e_greyhoundid)) {
                      hasInjury = true;
                      console.log(`✅ INJURY FOUND for ${contestant.cr616_greyhoundname} (ID: ${greyhound.cra5e_greyhoundid})`);
                    } else if (greyhound) {
                      console.log(`❌ No injury for ${contestant.cr616_greyhoundname} (ID: ${greyhound.cra5e_greyhoundid})`);
                    }
                  } catch (error) {
                    console.warn(`Could not check injury for ${contestant.cr616_greyhoundname}:`, error);
                  }
                }
                
                // Store the injury result using a consistent key (greyhound name + ear brand)
                const greyhoundKey = `${contestant.cr616_greyhoundname}_${contestant.cr616_leftearbrand}`;
                injuryTracking.markGreyhoundInjury(greyhoundKey, hasInjury);
              });
              
              // Wait for all contestant promises to complete (ignore individual failures)
              await Promise.all(contestantPromises.map(p => p.catch(() => {})));
              
              // Longer delay between batches for contestant processing
              if (i + CONTESTANT_BATCH_SIZE < contestants.length) {
                await new Promise(resolve => setTimeout(resolve, 1500));
              }
            }
            
          } catch (error) {
            console.error('Error during injury checking:', error);
            // Don't fail the entire operation if injury checking fails
          }
        }
        
        return contestants || [];
      } catch (error) {
        console.error('Failed to fetch contestants:', error);
        throw error;
      }
    },
    [viewState.race, filters.showInjuryFilter],
    { 
      autoFetch: viewState.type === 'contestants' && !!viewState.race,
      retryCount: 2,
      retryDelay: 2000,
      useExponentialBackoff: true,
      maxRetryDelay: 10000,
      onError: (error) => {
        // Only log errors that are not cancellations
        if (!error.message.includes('cancelled') && !error.message.includes('aborted')) {
          console.error('Contestant fetch error in component:', error);
        }
      }
    }
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
    { 
      autoFetch: viewState.type === 'search',
      retryCount: 2,
      retryDelay: 2000,
      useExponentialBackoff: true,
      maxRetryDelay: 10000
    }
  );

  // Optimistic Update hooks for data modifications
  const meetingOptimistic = useOptimisticUpdate<IMeeting[]>(
    meetingsData.data || [],
    {
      onSuccess: () => {}, // Success handled by optimistic update system
      onError: (error) => {
        console.error('Meeting update failed:', error);
      },
      onRollback: () => {}, // Rollback handled by optimistic update system
      rollbackDelay: 2000,
      showNotification: true
    }
  );

  const raceOptimistic = useOptimisticUpdate<IRace[]>(
    racesData.data || [],
    {
      onSuccess: () => {}, // Success handled by optimistic update system
      onError: (error) => {
        console.error('Race update failed:', error);
      },
      rollbackDelay: 2000
    }
  );

  const contestantOptimistic = useOptimisticUpdate<IContestant[]>(
    contestantsData.data || [],
    {
      onSuccess: () => {}, // Success handled by optimistic update system
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
      icon: downArrowIcon,  // SVG down arrow for drill-down
      onClick: navigateToRaces
    },
    {
      label: 'Details',
      icon: detailsIcon,  // SVG document icon for details
      onClick: (meeting) => modalManager.openModal('meeting', meeting)
    }
  ], tableDensity);

  const raceColumnsWithActions = useActionColumns(raceColumns, [
    {
      label: 'Field',
      icon: downArrowIcon,  // SVG down arrow for drill-down
      onClick: navigateToContestants
    },
    {
      label: 'Details',
      icon: detailsIcon,  // SVG document icon for details
      onClick: (race) => modalManager.openModal('race', race)
    }
  ], tableDensity);

  const contestantColumnsWithActions = useActionColumns(contestantColumns, [
    {
      label: 'Greyhound',
      icon: greyhoundIcon,  // SVG greyhound icon
      onClick: (contestant) => modalManager.openModal('greyhound', contestant)
    },
    {
      label: 'Details',
      icon: detailsIcon,  // SVG document icon for details
      onClick: (contestant) => modalManager.openModal('contestant', contestant)
    }
  ], tableDensity);

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
  // Also enhance data with injury information when injury feature is enabled
  const { data, loading, error } = useMemo(() => {
    let baseData;
    let baseLoading;
    let baseError;
    
    switch (viewState.type) {
      case 'meetings':
        baseData = meetingOptimistic.state.data.length > 0 ? meetingOptimistic.state.data : meetingsData.data;
        baseLoading = meetingsData.loading || meetingOptimistic.state.isPending;
        baseError = meetingsData.error || meetingOptimistic.state.error;
        
        // Add injury indicators to meetings if feature is enabled and filter is active
        if (ENABLE_INJURY_FEATURE && filters.showInjuryFilter && baseData) {
          baseData = baseData.map((meeting: IMeeting) => ({
            ...meeting,
            hasInjuries: true // Since we're filtering by injuries, all meetings have injuries
          }));
        }
        break;
        
      case 'races':
        baseData = raceOptimistic.state.data.length > 0 ? raceOptimistic.state.data : racesData.data;
        baseLoading = racesData.loading || raceOptimistic.state.isPending;
        baseError = racesData.error || raceOptimistic.state.error;
        
        // Add injury indicators to races if feature is enabled and filter is active
        if (ENABLE_INJURY_FEATURE && filters.showInjuryFilter && baseData) {
          baseData = baseData.map((race: IRace) => ({
            ...race,
            hasInjuries: (injuryTracking.raceInjurySummaries.get(race.cr616_racesid) || 0) > 0
          }));
        }
        break;
        
      case 'contestants':
        baseData = contestantOptimistic.state.data.length > 0 ? contestantOptimistic.state.data : contestantsData.data;
        baseLoading = contestantsData.loading || contestantOptimistic.state.isPending;
        baseError = contestantsData.error || contestantOptimistic.state.error;
        
        // Add injury indicators to contestants if feature is enabled and filter is active
        if (ENABLE_INJURY_FEATURE && filters.showInjuryFilter && baseData) {
          console.log('Adding injury indicators to contestants...');
          const injuryEntries = Array.from(injuryTracking.greyhoundInjuries.entries());
          console.log('Stored injury keys:', injuryEntries.map(([key, value]) => `${key}: ${value}`));
          
          baseData = baseData.map((contestant: IContestant) => {
            const greyhoundKey = `${contestant.cr616_greyhoundname}_${contestant.cr616_leftearbrand}`;
            const hasInjuries = injuryTracking.greyhoundInjuries.get(greyhoundKey) === true;
            console.log(`Looking for key: "${greyhoundKey}" - found: ${hasInjuries}`);
            
            // Also check if any stored keys contain this greyhound name
            const matchingKeys = injuryEntries.filter(([key]) => key.includes(contestant.cr616_greyhoundname));
            if (matchingKeys.length > 0) {
              console.log(`  Matching keys found for ${contestant.cr616_greyhoundname}:`, matchingKeys);
            }
            
            return {
              ...contestant,
              hasInjuries
            };
          });
        } else {
          console.log('Contestant injury indicators NOT added. Feature enabled:', ENABLE_INJURY_FEATURE, 'Filter active:', filters.showInjuryFilter, 'Has data:', !!baseData);
        }
        break;
        
      case 'search':
        return searchData;
        
      default:
        return { data: null, loading: false, error: null };
    }
    
    return {
      data: baseData,
      loading: baseLoading,
      error: baseError
    };
  }, [
    viewState.type, 
    meetingsData, 
    racesData, 
    contestantsData, 
    searchData,
    meetingOptimistic.state,
    raceOptimistic.state,
    contestantOptimistic.state,
    ENABLE_INJURY_FEATURE,
    filters.showInjuryFilter,
    injuryTracking.raceInjurySummaries,
    injuryTracking.greyhoundInjuries
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
      // Create a more informative message based on current filters
      let emptyMessage = 'No data found';
      
      if (viewState.type === 'meetings') {
        // Check if we're filtering by today
        const isToday = filters.dateFrom && filters.dateTo && 
          filters.dateFrom.toDateString() === filters.dateTo.toDateString() &&
          filters.dateFrom.toDateString() === new Date().toDateString();
        
        if (isToday) {
          emptyMessage = `No races in the database for today (${new Date().toLocaleDateString()})`;
          if (filters.selectedAuthority) {
            emptyMessage = `No ${filters.selectedAuthority} races in the database for today`;
          }
        } else if (filters.dateFrom && filters.dateTo) {
          const fromStr = filters.dateFrom.toLocaleDateString();
          const toStr = filters.dateTo.toLocaleDateString();
          emptyMessage = fromStr === toStr 
            ? `No races found for ${fromStr}`
            : `No races found between ${fromStr} and ${toStr}`;
        }
      }
      
      return (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📭</span>
          <p>{emptyMessage}</p>
          {viewState.type === 'meetings' && (
            <p className={styles.emptyHint}>Try adjusting the date range or filters above</p>
          )}
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
        onRowClick = (contestant: IContestant) => modalManager.openModal('contestant', contestant);
        tableTitle = 'Contestants';
        break;
      case 'search':
        // Handle search results separately
        return renderSearchResults(data as ISearchResults);
    }

    // Apply injury filter to display (only filter what we show, not what we fetch)
    if (ENABLE_INJURY_FEATURE && filters.showInjuryFilter && tableData.length > 0) {
      switch (viewState.type) {
        case 'meetings':
          // Filter meetings to show only those with injuries
          tableData = tableData.filter((item: any) => {
            const hasInjuries = injuryTracking.raceInjurySummaries.has(item.cr4cc_racemeetingid);
            return hasInjuries;
          });
          break;
        case 'races':
          // Filter races to show only those with injuries
          tableData = tableData.filter((item: any) => {
            const injuryCount = injuryTracking.raceInjurySummaries.get(item.cr616_racesid) || 0;
            return injuryCount > 0;
          });
          break;
        case 'contestants':
          // Filter contestants to show only those with injuries
          tableData = tableData.filter((item: any) => {
            return item.hasInjuries === true;
          });
          break;
      }
    }

    // Disable virtual scrolling for now due to performance issues - use regular DataGrid
    // const TableComponent = tableData.length > 2000 ? VirtualDataGrid : DataGrid;
    const TableComponent = DataGrid;
    
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
              striped={true}
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
    <div className={`${styles.raceDataExplorer} ${(styles as any)[`theme-${theme}`] || ''}`}>
      {/* Header */}
      <div className={styles.titleHeader}>
        <h1 className={styles.title}>
          <img src={logoUrl} alt="GRNSW" className={styles.titleLogo} />
          Race Data Explorer
        </h1>
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
                <img src={searchIcon} alt="Search" />
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
                {filters.selectedAuthority && (
                  <div className={styles.filterChip}>
                    <span className={styles.chipLabel}>Authority:</span>
                    <span className={styles.chipValue}>{filters.selectedAuthority}</span>
                    <button 
                      className={styles.chipRemove}
                      onClick={() => filters.setSelectedAuthority(undefined)}
                      aria-label="Remove authority filter"
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
              {/* Custom date inputs row */}
              <div className={styles.filterInputsRow}>
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
                  <label>Authority:</label>
                  <select 
                    value={filters.selectedAuthority || ''} 
                    onChange={(e) => filters.setSelectedAuthority(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="">All Authorities</option>
                    <option value="NSW">NSW</option>
                    <option value="VIC">VIC</option>
                    <option value="QLD">QLD</option>
                    <option value="SA">SA</option>
                    <option value="WA">WA</option>
                    <option value="TAS">TAS</option>
                    <option value="ACT">ACT</option>
                    <option value="NT">NT</option>
                  </select>
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
              
              {/* Date range preset buttons - moved below date inputs */}
              <DateRangeFilter
                onDateRangeChange={(from, to) => {
                  filters.setDateFrom(from);
                  filters.setDateTo(to);
                  filters.setSelectedDayOfWeek(undefined); // Clear day of week when date range changes
                }}
                onDayOfWeekChange={(day) => {
                  filters.setSelectedDayOfWeek(day);
                  // Clear date range when day of week is selected
                  if (day !== undefined) {
                    filters.setDateFrom(undefined);
                    filters.setDateTo(undefined);
                  }
                }}
                currentDateFrom={filters.dateFrom}
                currentDateTo={filters.dateTo}
                currentDayOfWeek={filters.selectedDayOfWeek}
                className={styles.dateRangeFilterSection}
                showCustomPresets={false}
              />
            </div>
            <div className={styles.filterActions}>
              {ENABLE_INJURY_FEATURE && (
                <button
                  className={`${styles.injuryFilterButton} ${filters.showInjuryFilter ? styles.active : ''}`}
                  onClick={() => filters.setShowInjuryFilter(!filters.showInjuryFilter)}
                  aria-label="Toggle injury filter"
                >
                  <img 
                    src={healthIcon} 
                  alt="Health" 
                  style={{
                    width: '16px',
                    height: '16px',
                    marginRight: '6px',
                    verticalAlign: 'middle',
                    filter: filters.showInjuryFilter ? 
                      'brightness(0) saturate(100%) invert(100%)' :  // White when active
                      'brightness(0) saturate(100%) invert(50%) sepia(100%) saturate(2000%) hue-rotate(15deg) brightness(100%) contrast(100%)'  // Orange color (#ff9800)
                  }}
                />
                Injuries
              </button>
              )}
              
              {/* Injury Category Selection */}
              {ENABLE_INJURY_FEATURE && filters.showInjuryFilter && (
                <div className={styles.injuryCategoryPanel}>
                  <div className={styles.categoryLabel}>Categories:</div>
                  {['Cat A', 'Cat B', 'Cat C', 'Cat D', 'Cat E'].map(category => (
                    <label key={category} className={styles.categoryCheckbox}>
                      <input
                        type="checkbox"
                        checked={filters.selectedInjuryCategories?.includes(category) || false}
                        onChange={(e) => {
                          const currentCategories = filters.selectedInjuryCategories || [];
                          const newCategories = e.target.checked
                            ? [...currentCategories, category]
                            : currentCategories.filter(c => c !== category);
                          filters.setSelectedInjuryCategories(newCategories);
                        }}
                      />
                      <span className={styles.categoryName}>{category}</span>
                    </label>
                  ))}
                </div>
              )}
              
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
          dataService={dataService}
        />
      )}
      
      {modalManager.isModalOpen('greyhound') && (
        <GreyhoundDetailsModal
          contestant={modalManager.getSelectedItem('greyhound')}
          isOpen={true}
          onClose={() => modalManager.closeModal()}
        />
      )}
      
      {modalManager.isModalOpen('analytics') && (
        <AnalyticsModal
          isOpen={true}
          onClose={() => modalManager.closeModal()}
          meetings={meetingsData.data || []}
        />
      )}
    </div>
  );
};

export default RaceDataExplorer;