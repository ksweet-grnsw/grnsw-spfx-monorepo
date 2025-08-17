import * as React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import styles from './RaceDataExplorer.module.scss';
import { IRaceDataExplorerProps } from './IRaceDataExplorerProps';
import { RaceDataService } from '../../../services/RaceDataService';
import { IMeeting, IRace, IContestant, IGreyhound, IHealthCheck, ISearchResults } from '../../../models/IRaceData';
import { DataGrid, DataGridColumn } from '../../../enterprise-ui/components/DataDisplay/DataGrid';
import { StatusBadge } from '../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import { Breadcrumb } from '../../../enterprise-ui/components/Navigation/Breadcrumb/Breadcrumb';

// Import the GRNSW logo and icons
const logoUrl = require('../../../assets/images/siteicon.png');
const detailsIconUrl = require('../../../assets/images/details.png');
const racingFlagIconUrl = require('../../../assets/images/racing-flag.png');
const greyhoundIconUrl = require('../../../assets/images/greyhound.png');
import { FilterPanel } from '../../../enterprise-ui/components/Forms/FilterPanel/FilterPanel';

type ViewType = 'meetings' | 'races' | 'contestants' | 'search';

interface ViewState {
  type: ViewType;
  meeting?: IMeeting;
  race?: IRace;
  searchTerm?: string;
}

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

  // State management
  const [viewState, setViewState] = useState<ViewState>({ type: defaultView || 'meetings' });
  const [meetings, setMeetings] = useState<IMeeting[]>([]);
  const [races, setRaces] = useState<IRace[]>([]);
  const [contestants, setContestants] = useState<IContestant[]>([]);
  const [searchResults, setSearchResults] = useState<ISearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<IMeeting | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedRace, setSelectedRace] = useState<IRace | null>(null);
  const [showRaceModal, setShowRaceModal] = useState(false);
  const [selectedContestant, setSelectedContestant] = useState<IContestant | null>(null);
  const [showContestantModal, setShowContestantModal] = useState(false);
  const [selectedGreyhound, setSelectedGreyhound] = useState<IGreyhound | null>(null);
  const [showGreyhoundModal, setShowGreyhoundModal] = useState(false);
  const [selectedHealthCheck, setSelectedHealthCheck] = useState<IHealthCheck | null>(null);
  const [showHealthCheckModal, setShowHealthCheckModal] = useState(false);
  const [greyhoundHealthChecks, setGreyhoundHealthChecks] = useState<IHealthCheck[]>([]);
  const [greyhoundInjuries, setGreyhoundInjuries] = useState<Map<string, boolean>>(new Map());
  const [greyhoundMatches, setGreyhoundMatches] = useState<Map<string, IGreyhound>>(new Map());
  const [parentGreyhounds, setParentGreyhounds] = useState<Map<string, IGreyhound>>(new Map());
  const [greyhoundHistory, setGreyhoundHistory] = useState<IGreyhound[]>([]);
  
  // Load saved filters from localStorage
  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem('raceDataExplorerFilters');
      if (saved) {
        const filters = JSON.parse(saved);
        return {
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
          selectedTrack: filters.selectedTrack || '',
          showInjuryFilter: filters.showInjuryFilter || false,
          selectedInjuryCategories: filters.selectedInjuryCategories || ['Cat D', 'Cat E']
        };
      }
    } catch (e) {
      console.error('Failed to load saved filters:', e);
    }
    return null;
  };

  const savedFilters = loadSavedFilters();
  
  // Filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>(savedFilters?.dateFrom);
  const [dateTo, setDateTo] = useState<Date | undefined>(savedFilters?.dateTo);
  const [selectedTrack, setSelectedTrack] = useState<string>(savedFilters?.selectedTrack || '');
  
  // Injury filter states
  const [showInjuryFilter, setShowInjuryFilter] = useState(savedFilters?.showInjuryFilter || false);
  const [selectedInjuryCategories, setSelectedInjuryCategories] = useState<string[]>(savedFilters?.selectedInjuryCategories || ['Cat D', 'Cat E']);
  const [meetingInjurySummaries, setMeetingInjurySummaries] = useState<Map<string, {total: number; byCategory: Record<string, number>}>>(new Map());
  const [raceInjurySummaries, setRaceInjurySummaries] = useState<Map<string, number>>(new Map());
  
  // Table enhancement states
  // Table options with fixed defaults (no longer user-configurable)
  // tableDensity now comes from props (set in property pane)
  const showRowNumbers = false;
  const useStripedRows = true;
  const [currentPageSize, setCurrentPageSize] = useState(pageSize || 25);
  
  // Helper function to render placement with medal style
  const renderPlacement = (placement: number | string | null | undefined) => {
    if (!placement) return '-';
    const place = typeof placement === 'string' ? parseInt(placement, 10) : placement;
    
    if (place === 1 || place === 2 || place === 3) {
      const medalClass = place === 1 ? 'gold' : place === 2 ? 'silver' : 'bronze';
      return (
        <span className={`${styles.placementBadge} ${styles[medalClass]}`}>
          {place}
        </span>
      );
    }
    return place;
  };

  // Calculate active filter count
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (selectedTrack) count++;
    if (showInjuryFilter && selectedInjuryCategories.length > 0) {
      count++;
    }
    return count;
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label?: string): void => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log(`Copied ${label || 'value'}: ${text}`);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  // Initialize service
  const dataService = useMemo(() => {
    // Always create the service, it will use default URL if none provided
    return new RaceDataService(httpClient, dataverseUrl || undefined, props.context);
  }, [dataverseUrl, httpClient, props.context]);

  // Load meetings
  const loadMeetings = useCallback(async () => {
    if (!dataService) return;
    
    console.log('loadMeetings called - showInjuryFilter:', showInjuryFilter, 'categories:', selectedInjuryCategories);
    
    setLoading(true);
    setError('');
    
    try {
      let data: IMeeting[];
      
      if (showInjuryFilter) {
        console.log('Loading meetings with injuries, categories:', selectedInjuryCategories);
        // Load only meetings with injuries in selected categories
        data = await dataService.getMeetingsWithInjuries(selectedInjuryCategories);
        
        // Also apply regular filters if set
        if (dateFrom) {
          data = data.filter(m => new Date(m.cr4cc_meetingdate) >= dateFrom);
        }
        if (dateTo) {
          data = data.filter(m => new Date(m.cr4cc_meetingdate) <= dateTo);
        }
        if (selectedTrack) {
          data = data.filter(m => m.cr4cc_trackname === selectedTrack);
        }
        
        // Load injury summaries for each meeting
        const summaries = new Map<string, {total: number; byCategory: Record<string, number>}>();
        for (const meeting of data) {
          if (meeting.cr4cc_trackname) {
            const summary = await dataService.getInjurySummaryForMeeting(
              meeting.cr4cc_trackname,
              meeting.cr4cc_meetingdate
            );
            summaries.set(meeting.cr4cc_racemeetingid, summary);
          }
        }
        setMeetingInjurySummaries(summaries);
      } else {
        // Regular meeting load
        data = await dataService.getMeetings({
          dateFrom,
          dateTo,
          track: selectedTrack
        });
        setMeetingInjurySummaries(new Map());
      }
      
      console.log('Setting meetings data:', data.length, 'meetings');
      setMeetings(data);
    } catch (err) {
      console.error('Error loading meetings:', err);
      setError(`Failed to load meetings: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [dataService, dateFrom, dateTo, selectedTrack, showInjuryFilter, selectedInjuryCategories]);

  // Load races for a meeting
  const loadRaces = useCallback(async (meeting: IMeeting) => {
    if (!dataService) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await dataService.getRacesForMeeting(meeting.cr4cc_racemeetingid);
      setRaces(data);
      setViewState({ type: 'races', meeting });
      
      // Load injury information for each race if injury filter is active
      if (showInjuryFilter && meeting.cr4cc_trackname) {
        const raceSummaries = new Map<string, number>();
        for (const race of data) {
          const injuries = await dataService.getInjuriesForRace(
            meeting.cr4cc_trackname,
            meeting.cr4cc_meetingdate,
            race.cr616_racenumber
          );
          if (injuries.length > 0) {
            raceSummaries.set(race.cr616_racesid, injuries.length);
          }
        }
        setRaceInjurySummaries(raceSummaries);
      } else {
        setRaceInjurySummaries(new Map());
      }
    } catch (err) {
      setError(`Failed to load races: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [dataService, showInjuryFilter]);

  // Load contestants for a race
  const loadContestants = useCallback(async (race: IRace) => {
    if (!dataService) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await dataService.getContestantsForRace(race.cr616_racesid);
      setContestants(data);
      setViewState({ type: 'contestants', meeting: viewState.meeting, race });
      
      // Check for greyhounds and injuries for each contestant
      const injuryMap = new Map<string, boolean>();
      const matchMap = new Map<string, IGreyhound>();
      for (const contestant of data) {
        if (contestant.cr616_greyhoundname) {
          try {
            const greyhound = await dataService.getGreyhoundByName(
              contestant.cr616_greyhoundname,
              contestant.cr616_leftearbrand
            );
            if (greyhound) {
              matchMap.set(contestant.cr616_contestantsid, greyhound);
              const hasInjury = await dataService.hasInjuries(greyhound.cra5e_greyhoundid);
              injuryMap.set(contestant.cr616_contestantsid, hasInjury);
            }
          } catch (error) {
            console.error('Error checking greyhound for', contestant.cr616_greyhoundname, error);
          }
        }
      }
      setGreyhoundMatches(matchMap);
      setGreyhoundInjuries(injuryMap);
    } catch (err) {
      setError(`Failed to load contestants: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [dataService, viewState.meeting]);

  // Perform search
  const performSearch = useCallback(async () => {
    if (!dataService || !searchTerm.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const results = await dataService.searchAll(searchTerm);
      setSearchResults(results);
      setViewState({ type: 'search', searchTerm });
    } catch (err) {
      setError(`Search failed: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [dataService, searchTerm]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults({ meetings: [], races: [], contestants: [], totalResults: 0 });
    setViewState({ type: 'meetings' });
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedTrack('');
  }, []);

  // Navigate back
  const navigateBack = useCallback(() => {
    if (viewState.type === 'contestants' && viewState.meeting) {
      loadRaces(viewState.meeting);
    } else if (viewState.type === 'races' || viewState.type === 'search') {
      setViewState({ type: 'meetings' });
      loadMeetings();
    }
  }, [viewState, loadRaces, loadMeetings]);

  // Build breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items: Array<{label: string; onClick: () => void}> = [
      {
        label: 'Meetings',
        onClick: () => {
          setViewState({ type: 'meetings' });
          loadMeetings();
        }
      }
    ];

    if (viewState.type === 'races' && viewState.meeting) {
      items.push({
        label: `${viewState.meeting.cr4cc_trackname} - ${new Date(viewState.meeting.cr4cc_meetingdate).toLocaleDateString('en-AU')}`,
        onClick: () => loadRaces(viewState.meeting!)
      });
    }

    if (viewState.type === 'contestants' && viewState.race) {
      if (viewState.meeting) {
        items.push({
          label: `${viewState.meeting.cr4cc_trackname} - ${new Date(viewState.meeting.cr4cc_meetingdate).toLocaleDateString('en-AU')}`,
          onClick: () => loadRaces(viewState.meeting!)
        });
      }
      items.push({
        label: `Race ${viewState.race.cr616_racenumber}`,
        onClick: () => {}
      });
    }

    if (viewState.type === 'search') {
      items.push({
        label: `Search Results: "${viewState.searchTerm}"`,
        onClick: () => {}
      });
    }

    return items;
  }, [viewState, loadMeetings, loadRaces]);

  // Handle meeting info
  const showMeetingInfo = useCallback((meeting: IMeeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingModal(true);
  }, []);

  // Close modals
  const closeMeetingModal = useCallback(() => {
    setShowMeetingModal(false);
    setSelectedMeeting(null);
  }, []);

  const closeRaceModal = useCallback(() => {
    setShowRaceModal(false);
    setSelectedRace(null);
  }, []);

  const closeContestantModal = useCallback(() => {
    setShowContestantModal(false);
    setSelectedContestant(null);
  }, []);

  // Show race info
  const showRaceInfo = useCallback((race: IRace) => {
    setSelectedRace(race);
    setShowRaceModal(true);
  }, []);

  // Show contestant info
  const showContestantInfo = useCallback(async (contestant: IContestant) => {
    setSelectedContestant(contestant);
    setShowContestantModal(true);
    
    // Try to fetch greyhound information
    if (contestant.cr616_greyhoundname && dataService) {
      try {
        const greyhound = await dataService.getGreyhoundByName(
          contestant.cr616_greyhoundname,
          contestant.cr616_leftearbrand
        );
        if (greyhound) {
          setSelectedGreyhound(greyhound);
          // Check for injuries
          const hasInjury = await dataService.hasInjuries(greyhound.cra5e_greyhoundid);
          setGreyhoundInjuries(new Map([[greyhound.cra5e_greyhoundid, hasInjury]]));
        }
      } catch (error) {
        console.error('Error fetching greyhound info:', error);
      }
    }
  }, [dataService]);
  
  // Show greyhound details
  const showGreyhoundInfo = useCallback(async (greyhound: IGreyhound, addToHistory: boolean = true) => {
    setShowGreyhoundModal(true);
    setSelectedGreyhound(greyhound);
    
    // Add to history if navigating to parent
    if (addToHistory && selectedGreyhound) {
      setGreyhoundHistory(prev => [...prev, selectedGreyhound]);
    }
    
    // Fetch health checks and check for parents
    if (dataService) {
      try {
        // Fetch health checks
        const healthChecks = await dataService.getHealthChecksForGreyhound(greyhound.cra5e_greyhoundid);
        setGreyhoundHealthChecks(healthChecks);
        
        // Check if sire exists in database
        if (greyhound.cra5e_sire && !parentGreyhounds.has(greyhound.cra5e_sire)) {
          const sireGreyhound = await dataService.getGreyhoundBySireOrDam(greyhound.cra5e_sire);
          if (sireGreyhound) {
            setParentGreyhounds(prev => new Map(prev).set(greyhound.cra5e_sire!, sireGreyhound));
          }
        }
        
        // Check if dam exists in database
        if (greyhound.cra5e_dam && !parentGreyhounds.has(greyhound.cra5e_dam)) {
          const damGreyhound = await dataService.getGreyhoundBySireOrDam(greyhound.cra5e_dam);
          if (damGreyhound) {
            setParentGreyhounds(prev => new Map(prev).set(greyhound.cra5e_dam!, damGreyhound));
          }
        }
      } catch (error) {
        console.error('Error fetching greyhound data:', error);
      }
    }
  }, [dataService, parentGreyhounds, selectedGreyhound]);
  
  // Show health check details
  const showHealthCheckInfo = useCallback(async (healthCheck: IHealthCheck) => {
    setSelectedHealthCheck(healthCheck);
    setShowHealthCheckModal(true);
    
    // If there's a race number and track, try to fetch the race to get steward comments
    if (healthCheck.cra5e_racenumber && healthCheck.cra5e_trackname && healthCheck.cra5e_datechecked && dataService) {
      try {
        // Find the meeting for this date and track
        const meetings = await dataService.getMeetings({
          track: healthCheck.cra5e_trackname,
          dateFrom: new Date(healthCheck.cra5e_datechecked),
          dateTo: new Date(healthCheck.cra5e_datechecked)
        });
        
        if (meetings.length > 0) {
          // Get races for the meeting
          const races = await dataService.getRacesForMeeting(meetings[0].cr4cc_racemeetingid);
          // Find the specific race
          const race = races.find(r => r.cr616_racenumber === healthCheck.cra5e_racenumber);
          if (race && race.cr616_stewardracecomment) {
            // Store the steward comment in the health check object for display
            (healthCheck as any).raceStewardComment = race.cr616_stewardracecomment;
          }
        }
      } catch (error) {
        console.error('Error fetching race steward comments:', error);
      }
    }
  }, [dataService]);
  
  // Close modals
  const closeGreyhoundModal = useCallback(() => {
    setShowGreyhoundModal(false);
    setGreyhoundHealthChecks([]);
    setGreyhoundHistory([]);
  }, []);
  
  const closeHealthCheckModal = useCallback(() => {
    setShowHealthCheckModal(false);
  }, []);

  // Add row number column if enabled
  const addRowNumberColumn = <T,>(columns: DataGridColumn<T>[]): DataGridColumn<T>[] => {
    if (!showRowNumbers) return columns;
    
    const rowNumberColumn: DataGridColumn<T> = {
      key: '_rowNumber',
      label: '#',
      width: '50px',
      align: 'center',
      render: (_: any, __: T, index?: number) => (
        <span style={{ color: '#666', fontSize: '12px' }}>
          {(index || 0) + 1 + (currentPageSize * ((viewState.type === 'meetings' ? 0 : 0)))}
        </span>
      )
    };
    
    return [rowNumberColumn, ...columns];
  };

  // Column definitions for meetings
  const meetingColumns: DataGridColumn<IMeeting>[] = addRowNumberColumn([
    {
      key: 'cr4cc_meetingdate',
      label: 'Date',
      sortable: true,
      width: '120px',
      render: (value: string) => (
        <span title={`Full date/time: ${new Date(value).toLocaleString('en-AU')}`}>
          {new Date(value).toLocaleDateString('en-AU')}
        </span>
      )
    },
    {
      key: 'cr4cc_trackname',
      label: 'Track',
      sortable: true,
      width: '150px',
      render: (value: string, row: IMeeting) => {
        const injurySummary = meetingInjurySummaries.get(row.cr4cc_racemeetingid);
        if (injurySummary && injurySummary.total > 0) {
          // Show serious injuries (Cat D and E) with red indicator
          const seriousInjuries = (injurySummary.byCategory['Cat D'] || 0) + (injurySummary.byCategory['Cat E'] || 0);
          const otherInjuries = injurySummary.total - seriousInjuries;
          
          return (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {value}
              {seriousInjuries > 0 && (
                <span 
                  className={styles.injuryIndicator} 
                  style={{ color: '#dc143c', fontWeight: 'bold' }}
                  title={`${seriousInjuries} serious injuries (Cat D/E)`}
                >
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '900', 
                    fontFamily: 'Arial Black, sans-serif',
                    display: 'inline-block',
                    lineHeight: '1'
                  }}>+</span>
                  {seriousInjuries}
                </span>
              )}
              {otherInjuries > 0 && (
                <span 
                  className={styles.injuryIndicator}
                  style={{ color: '#ff9800' }}
                  title={`${otherInjuries} minor injuries`}
                >
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '900', 
                    fontFamily: 'Arial Black, sans-serif',
                    display: 'inline-block',
                    lineHeight: '1'
                  }}>+</span>
                  {otherInjuries}
                </span>
              )}
            </span>
          );
        }
        return value;
      }
    },
    {
      key: 'cr4cc_authority',
      label: 'Authority',
      sortable: true,
      width: '100px',
      render: (value: string) => (
        <span title={value === 'NSW' ? 'New South Wales' : value === 'VIC' ? 'Victoria' : value === 'QLD' ? 'Queensland' : value || 'New South Wales'}>
          <StatusBadge status={value} variant="info" size="small" />
        </span>
      )
    },
    {
      key: 'cr4cc_timeslot',
      label: 'Timeslot',
      sortable: true,
      width: '120px',
      render: (value: string) => {
        const getTimeslotColor = (timeslot: string): 'info' | 'warning' | 'neutral' => {
          const slot = timeslot?.toLowerCase();
          if (slot === 'morning' || slot === 'day') return 'info';
          if (slot === 'afternoon' || slot === 'twilight') return 'warning';
          return 'neutral';
        };
        
        return value ? (
          <StatusBadge 
            status={value} 
            variant={getTimeslotColor(value)}
            size="small"
          />
        ) : (
          <span style={{ color: '#666' }}>-</span>
        );
      }
    },
    {
      key: 'cr4cc_type',
      label: 'Type',
      sortable: true,
      width: '100px',
      render: (value: string) => (
        <span title={value ? `Meeting type: ${value}` : 'Standard race meeting'}>
          {value || 'Race'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      align: 'right',
      render: (_: any, row: IMeeting) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadRaces(row);
            }}
            className={styles.modernActionButton}
            title="View all races for this meeting"
          >
            <span className={styles.actionIcon}>🏁</span>
            <span className={styles.actionLabel}>Races</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              showMeetingInfo(row);
            }}
            className={styles.modernActionButton}
            title="View meeting details"
          >
            <span className={styles.actionIcon}>📋</span>
            <span className={styles.actionLabel}>Details</span>
          </button>
        </div>
      )
    }
  ]);

  // Column definitions for races
  const raceColumns: DataGridColumn<IRace>[] = addRowNumberColumn([
    {
      key: 'cr616_racenumber',
      label: 'Race #',
      sortable: true,
      width: '80px',
      render: (value: number, row: IRace) => {
        const injuryCount = raceInjurySummaries.get(row.cr616_racesid);
        if (injuryCount && injuryCount > 0) {
          return (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {value}
              <span 
                className={styles.injuryIndicator}
                style={{ color: '#dc143c', fontWeight: 'bold' }}
                title={`${injuryCount} injury(s) in this race`}
              >
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '900', 
                  fontFamily: 'Arial Black, sans-serif',
                  display: 'inline-block',
                  lineHeight: '1'
                }}>+</span>
                {injuryCount}
              </span>
            </span>
          );
        }
        return value;
      }
    },
    {
      key: 'cr616_racetitle',
      label: 'Title',
      sortable: true,
      width: '250px'
    },
    {
      key: 'cr616_distance',
      label: 'Distance',
      sortable: true,
      width: '100px',
      render: (value: number) => `${value}m`
    },
    {
      key: 'cr616_racegrading',
      label: 'Grade',
      sortable: true,
      width: '100px'
    },
    {
      key: 'cr616_starttime',
      label: 'Start Time',
      sortable: true,
      width: '100px'
    },
    {
      key: 'cr616_numberofcontestants',
      label: 'No of Contestants',
      sortable: true,
      width: '130px',
      align: 'center'
    },
    {
      key: 'cr616_prize1',
      label: 'Prize (1st)',
      sortable: true,
      width: '100px',
      render: (value: number) => value ? `$${value.toLocaleString()}` : '-'
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      align: 'right',
      render: (_: any, row: IRace) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadContestants(row);
            }}
            className={styles.modernActionButton}
            title="View contestants in this race"
          >
            <span className={styles.actionIcon}>🐕</span>
            <span className={styles.actionLabel}>Field</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              showRaceInfo(row);
            }}
            className={styles.modernActionButton}
            title="View race details"
          >
            <span className={styles.actionIcon}>📋</span>
            <span className={styles.actionLabel}>Details</span>
          </button>
        </div>
      )
    }
  ]);

  // Column definitions for contestants
  const contestantColumns: DataGridColumn<IContestant>[] = addRowNumberColumn([
    {
      key: 'cr616_rugnumber',
      label: 'Rug',
      sortable: true,
      width: '60px',
      align: 'center',
      render: (value: number) => (
        <span className={`${styles.rugBadge} ${styles[`rug${value}`]}`}>
          {value}
        </span>
      )
    },
    {
      key: 'cr616_greyhoundname',
      label: 'Greyhound',
      sortable: true,
      width: '180px'
    },
    {
      key: 'cr616_ownername',
      label: 'Owner',
      sortable: true,
      width: '150px'
    },
    {
      key: 'cr616_trainername',
      label: 'Trainer',
      sortable: true,
      width: '150px'
    },
    {
      key: 'cr616_doggrade',
      label: 'Grade',
      sortable: true,
      width: '80px'
    },
    {
      key: 'cr616_placement',
      label: 'Place',
      sortable: true,
      width: '80px',
      align: 'center',
      render: (value: number) => renderPlacement(value)
    },
    {
      key: 'cr616_margin',
      label: 'Margin',
      sortable: true,
      width: '80px',
      render: (value: number) => value ? `${value}L` : '-'
    },
    {
      key: 'cr616_weight',
      label: 'Weight',
      sortable: true,
      width: '80px',
      render: (value: number) => value ? `${value}kg` : '-'
    },
    {
      key: 'cr616_status',
      label: 'Status',
      sortable: true,
      width: '100px',
      render: (value: string) => {
        const variant = value === 'Runner' ? 'success' : 
                       value === 'Scratched' ? 'error' : 'neutral';
        return <StatusBadge status={value} variant={variant} size="small" />;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '150px',
      align: 'right',
      render: (_: any, row: IContestant) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              showContestantInfo(row);
            }}
            className={styles.modernActionButton}
            title="View contestant details"
          >
            <span className={styles.actionIcon}>📋</span>
            <span className={styles.actionLabel}>Details</span>
          </button>
          {greyhoundMatches.get(row.cr616_contestantsid) && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const greyhound = greyhoundMatches.get(row.cr616_contestantsid);
                if (greyhound) {
                  await showGreyhoundInfo(greyhound, false);
                }
              }}
              className={styles.modernActionButton}
              title="View greyhound profile"
            >
              <span className={styles.actionIcon}>🐕</span>
              <span className={styles.actionLabel}>Profile</span>
            </button>
          )}
          {greyhoundInjuries.get(row.cr616_contestantsid) && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const greyhound = greyhoundMatches.get(row.cr616_contestantsid);
                if (greyhound) {
                  const latestCheck = await dataService.getLatestHealthCheckForGreyhound(greyhound.cra5e_greyhoundid);
                  if (latestCheck) {
                    showHealthCheckInfo(latestCheck);
                  }
                }
              }}
              className={`${styles.modernActionButton} ${styles.injuryButton}`}
              title="View injury details"
            >
              <span className={styles.actionIcon} style={{ color: '#dc143c' }}>🏥</span>
              <span className={styles.actionLabel} style={{ color: '#dc143c' }}>Injury</span>
            </button>
          )}
        </div>
      )
    }
  ]);


  // Save filters to localStorage when they change
  useEffect(() => {
    const filters = {
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
      selectedTrack,
      showInjuryFilter,
      selectedInjuryCategories
    };
    try {
      localStorage.setItem('raceDataExplorerFilters', JSON.stringify(filters));
    } catch (e) {
      console.error('Failed to save filters:', e);
    }
  }, [dateFrom, dateTo, selectedTrack, showInjuryFilter, selectedInjuryCategories]);

  // Load initial data
  useEffect(() => {
    if (viewState.type === 'meetings') {
      loadMeetings();
    }
  }, [loadMeetings, viewState.type]);

  // Render filter panel
  const renderFilters = () => {
    if (!showFilters || viewState.type !== 'meetings') return null;

    // Quick date preset helper
    const setDatePreset = (preset: 'today' | '7d' | '30d' | '90d') => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (preset) {
        case 'today':
          setDateFrom(today);
          setDateTo(today);
          break;
        case '7d': {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          setDateFrom(weekAgo);
          setDateTo(today);
          break;
        }
        case '30d': {
          const monthAgo = new Date(today);
          monthAgo.setDate(monthAgo.getDate() - 30);
          setDateFrom(monthAgo);
          setDateTo(today);
          break;
        }
        case '90d': {
          const threeMonthsAgo = new Date(today);
          threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
          setDateFrom(threeMonthsAgo);
          setDateTo(today);
          break;
        }
      }
    };

    // Filter summary chips
    const getFilterChips = () => {
      const chips: Array<{ label: string; value: string; onRemove: () => void }> = [];
      
      if (dateFrom) {
        chips.push({
          label: 'From',
          value: dateFrom.toLocaleDateString(),
          onRemove: () => setDateFrom(undefined)
        });
      }
      
      if (dateTo) {
        chips.push({
          label: 'To',
          value: dateTo.toLocaleDateString(),
          onRemove: () => setDateTo(undefined)
        });
      }
      
      if (selectedTrack) {
        chips.push({
          label: 'Track',
          value: selectedTrack,
          onRemove: () => setSelectedTrack('')
        });
      }
      
      if (showInjuryFilter && selectedInjuryCategories.length > 0) {
        chips.push({
          label: 'Injuries',
          value: selectedInjuryCategories.join(', '),
          onRemove: () => {
            setShowInjuryFilter(false);
            setSelectedInjuryCategories([]);
          }
        });
      }
      
      return chips;
    };

    const filterChips = getFilterChips();

    return (
      <div className={styles.filterBar}>
        {/* Filter summary chips */}
        {filterChips.length > 0 && (
          <div className={styles.filterChips}>
            <span className={styles.filterChipsLabel}>Active Filters:</span>
            {filterChips.map((chip, index) => (
              <div key={index} className={styles.filterChip}>
                <span className={styles.chipLabel}>{chip.label}:</span>
                <span className={styles.chipValue}>{chip.value}</span>
                <button
                  onClick={chip.onRemove}
                  className={styles.chipRemove}
                  title="Remove filter"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                clearFilters();
                setShowInjuryFilter(false);
                setSelectedInjuryCategories([]);
              }}
              className={styles.clearAllChips}
              title="Clear all filters"
            >
              Clear All
            </button>
          </div>
        )}
        
        <div className={styles.filterRow}>
          {/* Date presets */}
          <div className={styles.datePresets}>
            <button
              onClick={() => setDatePreset('today')}
              className={styles.presetButton}
              title="Show today's meetings"
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset('7d')}
              className={styles.presetButton}
              title="Show last 7 days"
            >
              7d
            </button>
            <button
              onClick={() => setDatePreset('30d')}
              className={styles.presetButton}
              title="Show last 30 days"
            >
              30d
            </button>
            <button
              onClick={() => setDatePreset('90d')}
              className={styles.presetButton}
              title="Show last 90 days"
            >
              90d
            </button>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="dateFrom">Date From</label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom ? dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : undefined)}
              className={styles.filterInput}
              placeholder="dd/mm/yyyy"
              title="Select start date"
            />
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="dateTo">Date To</label>
            <input
              id="dateTo"
              type="date"
              value={dateTo ? dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) => setDateTo(e.target.value ? new Date(e.target.value) : undefined)}
              className={styles.filterInput}
              placeholder="dd/mm/yyyy"
              title="Select end date"
            />
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="track">Track</label>
            <select
              id="track"
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className={styles.filterInput}
            >
              <option value="">All Tracks</option>
              <option value="Wentworth Park">Wentworth Park</option>
              <option value="Richmond">Richmond</option>
              <option value="The Gardens">The Gardens</option>
              <option value="Gosford">Gosford</option>
              <option value="Dapto">Dapto</option>
              <option value="Bulli">Bulli</option>
              <option value="Casino">Casino</option>
              <option value="Dubbo">Dubbo</option>
              <option value="Goulburn">Goulburn</option>
              <option value="Grafton">Grafton</option>
              <option value="Gunnedah">Gunnedah</option>
              <option value="Lithgow">Lithgow</option>
              <option value="Maitland">Maitland</option>
              <option value="Nowra">Nowra</option>
              <option value="Taree">Taree</option>
              <option value="Temora">Temora</option>
              <option value="Wagga Wagga">Wagga Wagga</option>
              <option value="Broken Hill">Broken Hill</option>
            </select>
          </div>
          <button 
            onClick={loadMeetings} 
            className={styles.applyButton}
            disabled={loading}
            title="Apply filters to search"
          >
            {loading ? 'Loading...' : 'Apply'}
          </button>
          <button 
            onClick={clearFilters} 
            className={styles.clearFiltersButton}
            title={`Clear all filters${getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()} active)` : ''}`}
          >
            Clear {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </button>
        </div>
        
        {/* Injury Filter Section - Second Row */}
        <div className={styles.injuryFilterRow}>
          <button 
            onClick={() => {
              const newState = !showInjuryFilter;
              setShowInjuryFilter(newState);
              // If turning off, reload regular meetings
              if (!newState) {
                setTimeout(() => loadMeetings(), 100);
              }
            }}
            className={`${styles.injuryFilterButton} ${showInjuryFilter ? styles.active : ''}`}
            title={showInjuryFilter ? 'Hide injury filter' : 'Show only meetings with injuries'}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>+</span>
              Injuries
            </span>
          </button>
          
          {showInjuryFilter && (
            <div className={styles.injuryCategoryFilters}>
              <span className={styles.categoryLabel}>Categories:</span>
              {['A', 'B', 'C', 'D', 'E'].map(category => {
                const fullCategory = `Cat ${category}`;
                return (
                  <label key={fullCategory} className={styles.categoryCheckbox} title={`Category ${category}`}>
                    <input
                      type="checkbox"
                      checked={selectedInjuryCategories.indexOf(fullCategory) !== -1}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInjuryCategories([...selectedInjuryCategories, fullCategory]);
                        } else {
                          setSelectedInjuryCategories(selectedInjuryCategories.filter(c => c !== fullCategory));
                        }
                      }}
                    />
                    <span className={category === 'D' || category === 'E' ? styles.seriousCategory : ''}>
                      {category}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };


  // Navigate to home
  const navigateHome = useCallback(() => {
    setViewState({ type: 'meetings' });
    setSearchTerm('');
    setSearchResults(null);
    loadMeetings();
  }, [loadMeetings]);

  // Render search bar
  const renderSearchBar = () => {
    if (!showSearch) return null;

    return (
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            placeholder="Search by name, Salesforce ID, microchip, trainer, owner, track..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                performSearch();
              }
            }}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button 
              onClick={clearSearch} 
              className={styles.clearButton}
              title="Clear search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button onClick={performSearch} className={styles.searchButton}>
          Search
        </button>
        {viewState.type === 'search' && (
          <button onClick={navigateHome} className={styles.homeButton} title="Back to Home">
            🏠 Home
          </button>
        )}
      </div>
    );
  };

  // Render main content
  const renderContent = () => {
    if (viewState.type === 'search' && searchResults) {
      return (
        <div className={styles.searchResults}>
          <h3>Search Results for "{viewState.searchTerm}"</h3>
          
          {searchResults.meetings.length > 0 && (
            <div className={styles.resultSection}>
              <h4>Meetings ({searchResults.meetings.length})</h4>
              <DataGrid
                data={searchResults.meetings}
                columns={meetingColumns}
                theme="meeting"
                density="compact"
                onRowClick={(meeting) => loadRaces(meeting)}
                pageSize={10}
              />
            </div>
          )}
          
          {searchResults.races.length > 0 && (
            <div className={styles.resultSection}>
              <h4>Races ({searchResults.races.length})</h4>
              <DataGrid
                data={searchResults.races}
                columns={raceColumns}
                theme="race"
                density="compact"
                onRowClick={(race) => loadContestants(race)}
                pageSize={10}
              />
            </div>
          )}
          
          {searchResults.contestants.length > 0 && (
            <div className={styles.resultSection}>
              <h4>Contestants ({searchResults.contestants.length})</h4>
              <DataGrid
                data={searchResults.contestants}
                columns={contestantColumns}
                theme="contestant"
                density="compact"
                pageSize={10}
              />
            </div>
          )}
          
          {searchResults.greyhounds && searchResults.greyhounds.length > 0 && (
            <div className={styles.resultSection}>
              <h4>Greyhounds ({searchResults.greyhounds.length})</h4>
              <DataGrid
                data={searchResults.greyhounds}
                columns={[
                  {
                    key: 'cra5e_name',
                    label: 'Name',
                    sortable: true,
                    width: '200px'
                  },
                  {
                    key: 'cra5e_microchip',
                    label: 'Microchip',
                    sortable: true,
                    width: '150px',
                    render: (value: string) => value || '-'
                  },
                  {
                    key: 'cra5e_sfid',
                    label: 'Salesforce ID',
                    sortable: true,
                    width: '150px',
                    render: (value: string) => value || '-'
                  },
                  {
                    key: 'cra5e_leftearbrand',
                    label: 'Left Ear',
                    sortable: true,
                    width: '100px',
                    render: (value: string) => value || '-'
                  },
                  {
                    key: 'cra5e_rightearbrand',
                    label: 'Right Ear',
                    sortable: true,
                    width: '100px',
                    render: (value: string) => value || '-'
                  },
                  {
                    key: 'cra5e_status',
                    label: 'Status',
                    sortable: true,
                    width: '120px',
                    render: (value: string) => value || '-'
                  },
                  {
                    key: 'actions',
                    label: 'Actions',
                    width: '100px',
                    align: 'center',
                    render: (_: any, row: IGreyhound) => (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await showGreyhoundInfo(row, false);
                        }}
                        className={styles.actionButton}
                        title="View Greyhound Profile"
                      >
                        <img src={greyhoundIconUrl} alt="View" className={styles.actionIcon} />
                      </button>
                    )
                  }
                ]}
                theme="contestant"
                density="compact"
                pageSize={10}
                onRowClick={async (greyhound) => {
                  await showGreyhoundInfo(greyhound, false);
                }}
              />
            </div>
          )}
          
          {searchResults.totalResults === 0 && (
            <div className={styles.noResults}>
              <div className={styles.noResultsIcon}>🔍</div>
              <div className={styles.noResultsText}>No results found for "{searchTerm}"</div>
              <div className={styles.noResultsHint}>
                Try different keywords or check your spelling
              </div>
            </div>
          )}
        </div>
      );
    }

    if (viewState.type === 'meetings') {
      return (
        <div className={styles.contentSection}>
          <h2 className={styles.sectionTitle}>Meetings</h2>
          <DataGrid
            data={meetings}
            columns={meetingColumns}
            theme="meeting"
            loading={loading}
            error={error}
            pagination
            pageSize={currentPageSize}
            sortable
            hoverable
            striped={useStripedRows}
            density={tableDensity}
            stickyHeader
            onRowClick={(meeting) => loadRaces(meeting)}
          />
        </div>
      );
    }

    if (viewState.type === 'races') {
      return (
        <div className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Races</h2>
          </div>
          <DataGrid
            data={races}
            columns={raceColumns}
            theme="race"
            loading={loading}
            error={error}
            pagination
            pageSize={currentPageSize}
            sortable
            hoverable
            striped={useStripedRows}
            density={tableDensity}
            stickyHeader
            onRowClick={(race) => loadContestants(race)}
          />
        </div>
      );
    }

    if (viewState.type === 'contestants') {
      return (
        <div className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Contestants</h2>
          </div>
          <DataGrid
            data={contestants}
            columns={contestantColumns}
            theme="contestant"
            loading={loading}
            error={error}
            pagination
            pageSize={currentPageSize}
            sortable
            hoverable
            striped={useStripedRows}
            density={tableDensity}
            stickyHeader
            onRowClick={(contestant) => showContestantInfo(contestant)}
          />
        </div>
      );
    }

    return null;
  };

  // Render race info modal
  const renderRaceModal = () => {
    if (!showRaceModal || !selectedRace) return null;

    return (
      <div className={styles.modalOverlay} onClick={closeRaceModal}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>
              <img src={logoUrl} alt="GRNSW" className={styles.modalLogo} />
              Race Details
            </h2>
            <button onClick={closeRaceModal} className={styles.closeButton}>×</button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Race Number:</span>
              <span className={styles.detailValue}>{selectedRace.cr616_racenumber}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Race Title:</span>
              <span className={styles.detailValue}>{selectedRace.cr616_racetitle}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Distance:</span>
              <span className={styles.detailValue}>{selectedRace.cr616_distance}m</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Grade:</span>
              <span className={styles.detailValue}>{selectedRace.cr616_racegrading}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Start Time:</span>
              <span className={styles.detailValue}>{selectedRace.cr616_starttime}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>No of Contestants:</span>
              <span className={styles.detailValue}>{selectedRace.cr616_numberofcontestants}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Prize Money (1st):</span>
              <span className={styles.detailValue}>{selectedRace.cr616_prize1 ? `$${selectedRace.cr616_prize1.toLocaleString()}` : '-'}</span>
            </div>
            {selectedRace.cr616_prize2 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Prize Money (2nd):</span>
                <span className={styles.detailValue}>${selectedRace.cr616_prize2.toLocaleString()}</span>
              </div>
            )}
            {selectedRace.cr616_prize3 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Prize Money (3rd):</span>
                <span className={styles.detailValue}>${selectedRace.cr616_prize3.toLocaleString()}</span>
              </div>
            )}
            {selectedRace.cr616_prize4 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Prize Money (4th):</span>
                <span className={styles.detailValue}>${selectedRace.cr616_prize4.toLocaleString()}</span>
              </div>
            )}
            {selectedRace.cr616_status && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status:</span>
                <span className={styles.detailValue}>{selectedRace.cr616_status}</span>
              </div>
            )}
            {selectedRace.cr616_firstsectionaltime && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>First Sectional:</span>
                <span className={styles.detailValue}>{selectedRace.cr616_firstsectionaltime}</span>
              </div>
            )}
            {selectedRace.cr616_secondsectiontime && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Second Sectional:</span>
                <span className={styles.detailValue}>{selectedRace.cr616_secondsectiontime}</span>
              </div>
            )}
            {selectedRace.cr616_stewardracecomment && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Steward Comment:</span>
                <span className={styles.detailValue}>{selectedRace.cr616_stewardracecomment}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render contestant info modal
  const renderContestantModal = () => {
    if (!showContestantModal || !selectedContestant) return null;

    return (
      <div className={styles.modalOverlay} onClick={closeContestantModal}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>
              <img src={logoUrl} alt="GRNSW" className={styles.modalLogo} />
              Contestant Details
            </h2>
            <button onClick={closeContestantModal} className={styles.closeButton}>×</button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Rug Number:</span>
              <span className={styles.detailValue}>
                <span className={`${styles.rugBadge} ${styles[`rug${selectedContestant.cr616_rugnumber}`]}`}>
                  {selectedContestant.cr616_rugnumber}
                </span>
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Greyhound Name:</span>
              <span className={styles.detailValue}>{selectedContestant.cr616_greyhoundname}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Owner:</span>
              <span className={styles.detailValue}>{selectedContestant.cr616_ownername}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Trainer:</span>
              <span className={styles.detailValue}>{selectedContestant.cr616_trainername}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Grade:</span>
              <span className={styles.detailValue}>{selectedContestant.cr616_doggrade}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Status:</span>
              <span className={styles.detailValue}>{selectedContestant.cr616_status}</span>
            </div>
            {selectedContestant.cr616_placement !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Placement:</span>
                <span className={styles.detailValue}>{renderPlacement(selectedContestant.cr616_placement)}</span>
              </div>
            )}
            {selectedContestant.cr616_margin !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Margin:</span>
                <span className={styles.detailValue}>{selectedContestant.cr616_margin ? `${selectedContestant.cr616_margin}L` : '-'}</span>
              </div>
            )}
            {selectedContestant.cr616_weight !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Weight:</span>
                <span className={styles.detailValue}>{selectedContestant.cr616_weight ? `${selectedContestant.cr616_weight}kg` : '-'}</span>
              </div>
            )}
            {selectedContestant.cr616_finishtime && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Finish Time:</span>
                <span className={styles.detailValue}>{selectedContestant.cr616_finishtime}</span>
              </div>
            )}
            {selectedContestant.cr616_prizemoney !== undefined && selectedContestant.cr616_prizemoney > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Prize Money:</span>
                <span className={styles.detailValue}>${selectedContestant.cr616_prizemoney.toLocaleString()}</span>
              </div>
            )}
            {selectedContestant.cr616_dayssincelastrace !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Days Since Last Race:</span>
                <span className={styles.detailValue}>{selectedContestant.cr616_dayssincelastrace}</span>
              </div>
            )}
            {selectedContestant.cr616_totalnumberofwinds !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Total Wins:</span>
                <span className={styles.detailValue}>{selectedContestant.cr616_totalnumberofwinds}</span>
              </div>
            )}
            {selectedContestant.cr616_failedtofinish !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Failed to Finish:</span>
                <span className={styles.detailValue}>{selectedContestant.cr616_failedtofinish ? 'Yes' : 'No'}</span>
              </div>
            )}
            {selectedContestant.cr616_racewithin2days !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Raced Within 2 Days:</span>
                <span className={styles.detailValue}>{selectedContestant.cr616_racewithin2days ? 'Yes' : 'No'}</span>
              </div>
            )}
            {selectedContestant.cr616_leftearbrand && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Left Ear Brand:</span>
                <span className={styles.detailValue}>{selectedContestant.cr616_leftearbrand}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render greyhound info modal
  const renderGreyhoundModal = () => {
    if (!showGreyhoundModal || !selectedGreyhound) return null;

    return (
      <div className={styles.modalOverlay} onClick={closeGreyhoundModal}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>
              <img src={logoUrl} alt="GRNSW" className={styles.modalLogo} />
              Greyhound Details
            </h2>
            <button onClick={closeGreyhoundModal} className={styles.closeButton}>×</button>
          </div>
          {greyhoundHistory.length > 0 && (
            <div className={styles.navigationBar}>
              <button
                onClick={() => {
                  const previousGreyhound = greyhoundHistory[greyhoundHistory.length - 1];
                  setGreyhoundHistory(prev => prev.slice(0, -1));
                  showGreyhoundInfo(previousGreyhound, false);
                }}
                className={styles.backButton}
              >
                ← Back to {greyhoundHistory[greyhoundHistory.length - 1].cra5e_name}
              </button>
            </div>
          )}
          <div className={styles.modalBody}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Name:</span>
              <span className={styles.detailValue}>{selectedGreyhound.cra5e_name}</span>
            </div>
            {selectedGreyhound.cra5e_microchip && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Microchip:</span>
                <span className={styles.detailValue}>{selectedGreyhound.cra5e_microchip}</span>
              </div>
            )}
            {selectedGreyhound.cra5e_leftearbrand && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Left Ear Brand:</span>
                <span className={styles.detailValue}>{selectedGreyhound.cra5e_leftearbrand}</span>
              </div>
            )}
            {selectedGreyhound.cra5e_rightearbrand && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Right Ear Brand:</span>
                <span className={styles.detailValue}>{selectedGreyhound.cra5e_rightearbrand}</span>
              </div>
            )}
            {selectedGreyhound.cra5e_colour && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Colour:</span>
                <span className={styles.detailValue}>{selectedGreyhound.cra5e_colour}</span>
              </div>
            )}
            {selectedGreyhound.cra5e_gender && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Gender:</span>
                <span className={styles.detailValue}>{selectedGreyhound.cra5e_gender}</span>
              </div>
            )}
            {selectedGreyhound.cra5e_whelpeddate && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Whelped Date:</span>
                <span className={styles.detailValue}>{new Date(selectedGreyhound.cra5e_whelpeddate).toLocaleDateString('en-AU')}</span>
              </div>
            )}
            {selectedGreyhound.cra5e_sire && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Sire:</span>
                <span className={styles.detailValue}>
                  {parentGreyhounds.has(selectedGreyhound.cra5e_sire) ? (
                    <button
                      onClick={() => {
                        const sireGreyhound = parentGreyhounds.get(selectedGreyhound.cra5e_sire!);
                        if (sireGreyhound) {
                          showGreyhoundInfo(sireGreyhound);
                        }
                      }}
                      className={styles.parentLink}
                      title="View Sire Details"
                    >
                      {parentGreyhounds.get(selectedGreyhound.cra5e_sire)?.cra5e_name || selectedGreyhound.cra5e_sire} →
                    </button>
                  ) : (
                    selectedGreyhound.cra5e_sire
                  )}
                </span>
              </div>
            )}
            {selectedGreyhound.cra5e_dam && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Dam:</span>
                <span className={styles.detailValue}>
                  {parentGreyhounds.has(selectedGreyhound.cra5e_dam) ? (
                    <button
                      onClick={() => {
                        const damGreyhound = parentGreyhounds.get(selectedGreyhound.cra5e_dam!);
                        if (damGreyhound) {
                          showGreyhoundInfo(damGreyhound);
                        }
                      }}
                      className={styles.parentLink}
                      title="View Dam Details"
                    >
                      {parentGreyhounds.get(selectedGreyhound.cra5e_dam)?.cra5e_name || selectedGreyhound.cra5e_dam} →
                    </button>
                  ) : (
                    selectedGreyhound.cra5e_dam
                  )}
                </span>
              </div>
            )}
            {selectedGreyhound.cra5e_ownername && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Owner:</span>
                <span className={styles.detailValue}>{selectedGreyhound.cra5e_ownername}</span>
              </div>
            )}
            {selectedGreyhound.cra5e_trainername && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Trainer:</span>
                <span className={styles.detailValue}>{selectedGreyhound.cra5e_trainername}</span>
              </div>
            )}
            {selectedGreyhound.cra5e_status && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status:</span>
                <span className={styles.detailValue}>{selectedGreyhound.cra5e_status}</span>
              </div>
            )}
            {selectedGreyhound.cra5e_prizemoney !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Total Prize Money:</span>
                <span className={styles.detailValue}>${(selectedGreyhound.cra5e_prizemoney || 0).toLocaleString()}</span>
              </div>
            )}
            {greyhoundHealthChecks.length > 0 && (
              <>
                <h3 className={styles.subHeading}>Recent Health Checks ({greyhoundHealthChecks.length})</h3>
                <div className={styles.healthCheckList}>
                  {greyhoundHealthChecks.slice(0, 5).map((check) => (
                    <div key={check.cra5e_heathcheckid} className={styles.healthCheckItem}>
                      <span>{new Date(check.cra5e_datechecked).toLocaleDateString('en-AU')}</span>
                      {check.cra5e_injured && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc143c', fontWeight: 'bold' }}>
                          <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '900', 
                    fontFamily: 'Arial Black, sans-serif',
                    display: 'inline-block',
                    lineHeight: '1'
                  }}>+</span>
                          Injured
                        </span>
                      )}
                      {check.cra5e_injuryclassification && <span>({check.cra5e_injuryclassification})</span>}
                      <button
                        onClick={() => showHealthCheckInfo(check)}
                        className={styles.healthCheckDetailsButton}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render health check modal
  const renderHealthCheckModal = () => {
    if (!showHealthCheckModal || !selectedHealthCheck) return null;

    return (
      <div className={styles.modalOverlay} onClick={closeHealthCheckModal}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>
              <img src={logoUrl} alt="GRNSW" className={styles.modalLogo} />
              Health Check Details
            </h2>
            <button onClick={closeHealthCheckModal} className={styles.closeButton}>×</button>
          </div>
          <div className={styles.modalBody}>
            {selectedHealthCheck.cra5e_name && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Check ID:</span>
                <span className={styles.detailValue}>{selectedHealthCheck.cra5e_name}</span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Date Checked:</span>
              <span className={styles.detailValue}>{new Date(selectedHealthCheck.cra5e_datechecked).toLocaleDateString('en-AU')}</span>
            </div>
            {selectedHealthCheck.cra5e_type && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Check Type:</span>
                <span className={styles.detailValue}>{selectedHealthCheck.cra5e_type}</span>
              </div>
            )}
            {selectedHealthCheck.cra5e_trackname && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Track:</span>
                <span className={styles.detailValue}>{selectedHealthCheck.cra5e_trackname}</span>
              </div>
            )}
            {selectedHealthCheck.cra5e_racenumber && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Race Number:</span>
                <span className={styles.detailValue}>{selectedHealthCheck.cra5e_racenumber}</span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Injured:</span>
              <span className={styles.detailValue} style={{ color: selectedHealthCheck.cra5e_injured ? 'red' : 'green', fontWeight: 'bold' }}>
                {selectedHealthCheck.cra5e_injured ? 'Yes' : 'No'}
              </span>
            </div>
            {selectedHealthCheck.cra5e_injuryclassification && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Injury Classification:</span>
                <span className={styles.detailValue}>{selectedHealthCheck.cra5e_injuryclassification}</span>
              </div>
            )}
            {selectedHealthCheck.cra5e_standdowndays && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Stand Down Days:</span>
                <span className={styles.detailValue}>{selectedHealthCheck.cra5e_standdowndays}</span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Examining Vet:</span>
              <span className={styles.detailValue}>{selectedHealthCheck.cra5e_examiningvet || 'Not recorded'}</span>
            </div>
            
            <h3 className={styles.subHeading}>Comments</h3>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Steward Comments:</span>
              <span className={styles.detailValue} style={{ 
                fontStyle: ((selectedHealthCheck as any).raceStewardComment || selectedHealthCheck.cra5e_stewardcomments) ? 'normal' : 'italic', 
                color: ((selectedHealthCheck as any).raceStewardComment || selectedHealthCheck.cra5e_stewardcomments) ? 'inherit' : '#999' 
              }}>
                {(selectedHealthCheck as any).raceStewardComment || selectedHealthCheck.cra5e_stewardcomments || 'No steward comments recorded'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Follow-up Information:</span>
              <span className={styles.detailValue} style={{ 
                fontStyle: selectedHealthCheck.cra5e_followupinformation ? 'normal' : 'italic', 
                color: selectedHealthCheck.cra5e_followupinformation ? 'inherit' : '#999' 
              }}>
                {selectedHealthCheck.cra5e_followupinformation || 'No follow-up information recorded'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render meeting info modal
  const renderMeetingModal = () => {
    if (!showMeetingModal || !selectedMeeting) return null;

    return (
      <div className={styles.modalOverlay} onClick={closeMeetingModal}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>
              <img src={logoUrl} alt="GRNSW" className={styles.modalLogo} />
              Meeting Details
            </h2>
            <button onClick={closeMeetingModal} className={styles.closeButton}>×</button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Track:</span>
              <span className={styles.detailValue}>
                {selectedMeeting.cr4cc_trackname}
                <button
                  onClick={() => copyToClipboard(selectedMeeting.cr4cc_trackname, 'Track name')}
                  style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    fontSize: '12px',
                    background: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  title="Copy track name"
                >
                  📋
                </button>
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Date:</span>
              <span className={styles.detailValue}>{new Date(selectedMeeting.cr4cc_meetingdate).toLocaleDateString('en-AU')}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Time Slot:</span>
              <span className={styles.detailValue}>{selectedMeeting.cr4cc_timeslot}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Authority:</span>
              <span className={styles.detailValue}>{selectedMeeting.cr4cc_authority}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Type:</span>
              <span className={styles.detailValue}>{selectedMeeting.cr4cc_type || 'Race'}</span>
            </div>
            {selectedMeeting.cr616_weather && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Weather:</span>
                <span className={styles.detailValue}>{selectedMeeting.cr616_weather}</span>
              </div>
            )}
            {selectedMeeting.cr616_trackcondition && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Track Condition:</span>
                <span className={styles.detailValue}>{selectedMeeting.cr616_trackcondition}</span>
              </div>
            )}
            {selectedMeeting.cr616_stewardcomment && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Steward Comment:</span>
                <span className={styles.detailValue}>{selectedMeeting.cr616_stewardcomment}</span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Status:</span>
              <span className={styles.detailValue}>{selectedMeeting.cr4cc_status || 'Unknown'}</span>
            </div>
            {selectedMeeting.cr4cc_cancelled !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Cancelled:</span>
                <span className={styles.detailValue}>{selectedMeeting.cr4cc_cancelled ? 'Yes' : 'No'}</span>
              </div>
            )}
            {selectedMeeting.modifiedon && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Last Modified:</span>
                <span className={styles.detailValue}>{new Date(selectedMeeting.modifiedon).toLocaleString('en-AU')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.raceDataExplorer} ${styles[`theme-${theme}`]}`}>
      <h1 className={styles.mainTitle}>Race Meetings</h1>
      {renderSearchBar()}
      {renderFilters()}
      
      {viewState.type !== 'meetings' && (
        <Breadcrumb 
          items={breadcrumbItems} 
          theme={viewState.type === 'search' ? 'neutral' : viewState.type as any}
        />
      )}
      
      <div className={styles.mainContent}>
        {renderContent()}
      </div>
      {renderMeetingModal()}
      {renderRaceModal()}
      {renderContestantModal()}
      {renderGreyhoundModal()}
      {renderHealthCheckModal()}
    </div>
  );
};

export default RaceDataExplorer;