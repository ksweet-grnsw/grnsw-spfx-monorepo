import * as React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import styles from './RaceDataExplorer.module.scss';
import { IRaceDataExplorerProps } from './IRaceDataExplorerProps';
import { RaceDataService } from '../../../services/RaceDataService';
import { IMeeting, IRace, IContestant, ISearchResults } from '../../../models/IRaceData';
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
  
  // Filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  
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

  // Initialize service
  const dataService = useMemo(() => {
    // Always create the service, it will use default URL if none provided
    return new RaceDataService(httpClient, dataverseUrl || undefined, props.context);
  }, [dataverseUrl, httpClient, props.context]);

  // Load meetings
  const loadMeetings = useCallback(async () => {
    if (!dataService) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await dataService.getMeetings({
        dateFrom,
        dateTo,
        track: selectedTrack
      });
      setMeetings(data);
    } catch (err) {
      setError(`Failed to load meetings: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [dataService, dateFrom, dateTo, selectedTrack]);

  // Load races for a meeting
  const loadRaces = useCallback(async (meeting: IMeeting) => {
    if (!dataService) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await dataService.getRacesForMeeting(meeting.cr4cc_racemeetingid);
      setRaces(data);
      setViewState({ type: 'races', meeting });
    } catch (err) {
      setError(`Failed to load races: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  // Load contestants for a race
  const loadContestants = useCallback(async (race: IRace) => {
    if (!dataService) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await dataService.getContestantsForRace(race.cr616_racesid);
      setContestants(data);
      setViewState({ type: 'contestants', meeting: viewState.meeting, race });
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
  const showContestantInfo = useCallback((contestant: IContestant) => {
    setSelectedContestant(contestant);
    setShowContestantModal(true);
  }, []);

  // Column definitions for meetings
  const meetingColumns: DataGridColumn<IMeeting>[] = [
    {
      key: 'cr4cc_meetingdate',
      label: 'Date',
      sortable: true,
      width: '120px',
      render: (value: string) => new Date(value).toLocaleDateString('en-AU')
    },
    {
      key: 'cr4cc_trackname',
      label: 'Track',
      sortable: true,
      width: '150px'
    },
    {
      key: 'cr4cc_authority',
      label: 'Authority',
      sortable: true,
      width: '100px',
      render: (value: string) => <StatusBadge status={value} variant="info" size="small" />
    },
    {
      key: 'cr4cc_timeslot',
      label: 'Timeslot',
      sortable: true,
      width: '120px',
      render: (value: string) => {
        const getTimeslotIcon = (timeslot: string) => {
          const slot = timeslot?.toLowerCase();
          if (slot === 'night') return '🌙';
          if (slot === 'twilight') return '🌆';
          if (slot === 'day') return '☀️';
          if (slot === 'morning') return '🌅';
          if (slot === 'afternoon') return '🌤️';
          if (slot === 'evening') return '🌇';
          return '📅'; // default icon
        };
        
        return (
          <span>
            {getTimeslotIcon(value)} {value}
          </span>
        );
      }
    },
    {
      key: 'cr4cc_type',
      label: 'Type',
      sortable: true,
      width: '100px',
      render: (value: string) => value || 'Race'
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      align: 'center',
      render: (_: any, row: IMeeting) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadRaces(row);
            }}
            className={styles.actionButton}
            title="View Races"
          >
            <img src={racingFlagIconUrl} alt="View Races" className={styles.actionIcon} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              showMeetingInfo(row);
            }}
            className={styles.actionButton}
            title="Meeting Details"
          >
            <img src={detailsIconUrl} alt="Details" className={`${styles.actionIcon} ${styles.detailsIcon}`} />
          </button>
        </div>
      )
    }
  ];

  // Column definitions for races
  const raceColumns: DataGridColumn<IRace>[] = [
    {
      key: 'cr616_racenumber',
      label: 'Race #',
      sortable: true,
      width: '80px'
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
      align: 'center',
      render: (_: any, row: IRace) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadContestants(row);
            }}
            className={styles.actionButton}
            title="View Contestants"
          >
            <img src={greyhoundIconUrl} alt="View Contestants" className={styles.actionIcon} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              showRaceInfo(row);
            }}
            className={styles.actionButton}
            title="Race Details"
          >
            <img src={detailsIconUrl} alt="Details" className={`${styles.actionIcon} ${styles.detailsIcon}`} />
          </button>
        </div>
      )
    }
  ];

  // Column definitions for contestants
  const contestantColumns: DataGridColumn<IContestant>[] = [
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
      label: 'Details',
      width: '80px',
      align: 'center',
      render: (_: any, row: IContestant) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            showContestantInfo(row);
          }}
          className={styles.actionButton}
          title="Contestant Details"
        >
          <img src={detailsIconUrl} alt="Details" className={styles.actionIcon} />
        </button>
      )
    }
  ];

  // Load initial data
  useEffect(() => {
    if (viewState.type === 'meetings') {
      loadMeetings();
    }
  }, [loadMeetings, viewState.type]);

  // Render filter panel
  const renderFilters = () => {
    if (!showFilters || viewState.type !== 'meetings') return null;

    return (
      <div className={styles.filterBar}>
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
        <button onClick={loadMeetings} className={styles.applyButton}>
          Apply
        </button>
        <button onClick={clearFilters} className={styles.clearFiltersButton}>
          Clear
        </button>
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
            placeholder="Search greyhound name, trainer, owner, track..."
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
          
          {searchResults.totalResults === 0 && (
            <div className={styles.noResults}>
              No results found for your search.
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
            pageSize={pageSize}
            sortable
            hoverable
            striped
          />
        </div>
      );
    }

    if (viewState.type === 'races') {
      return (
        <div className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Races</h2>
            <button 
              onClick={() => {
                setViewState({ type: 'meetings' });
                loadMeetings();
              }}
              className={styles.returnButton}
            >
              ← Back to Meetings
            </button>
          </div>
          <DataGrid
            data={races}
            columns={raceColumns}
            theme="race"
            loading={loading}
            error={error}
            pagination
            pageSize={pageSize}
            sortable
            hoverable
            striped
          />
        </div>
      );
    }

    if (viewState.type === 'contestants') {
      return (
        <div className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Contestants</h2>
            <button 
              onClick={() => {
                if (viewState.meeting) {
                  loadRaces(viewState.meeting);
                }
              }}
              className={styles.returnButton}
            >
              ← Back to Races
            </button>
          </div>
          <DataGrid
            data={contestants}
            columns={contestantColumns}
            theme="contestant"
            loading={loading}
            error={error}
            pagination
            pageSize={pageSize}
            sortable
            hoverable
            striped
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
              <span className={styles.detailValue}>{selectedMeeting.cr4cc_trackname}</span>
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
    </div>
  );
};

export default RaceDataExplorer;