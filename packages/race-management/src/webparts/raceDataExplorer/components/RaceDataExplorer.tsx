import * as React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import styles from './RaceDataExplorer.module.scss';
import { IRaceDataExplorerProps } from './IRaceDataExplorerProps';
import { RaceDataService } from '../../../services/RaceDataService';
import { IMeeting, IRace, IContestant, ISearchResults } from '../../../models/IRaceData';
import { DataGrid, DataGridColumn } from '../../../enterprise-ui/components/DataDisplay/DataGrid';
import { StatusBadge } from '../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import { Breadcrumb, BreadcrumbItem } from '../../../enterprise-ui/components/Navigation/Breadcrumb/Breadcrumb';
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
  
  // Filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('');

  // Initialize service
  const dataService = useMemo(() => {
    if (dataverseUrl && httpClient) {
      return new RaceDataService(httpClient, dataverseUrl);
    }
    return null;
  }, [dataverseUrl, httpClient]);

  // Load meetings
  const loadMeetings = useCallback(async () => {
    if (!dataService) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await dataService.getMeetings({
        dateFrom,
        dateTo,
        track: selectedTrack,
        authority: selectedAuthority
      });
      setMeetings(data);
    } catch (err) {
      setError(`Failed to load meetings: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [dataService, dateFrom, dateTo, selectedTrack, selectedAuthority]);

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
      const data = await dataService.getContestantsForRace(race.cr616_raceid);
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

  // Clear filters
  const clearFilters = useCallback(() => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedTrack('');
    setSelectedAuthority('');
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
  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
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
        label: `${viewState.meeting.cr4cc_trackheld} - ${new Date(viewState.meeting.cr4cc_meetingdate).toLocaleDateString()}`,
        onClick: () => loadRaces(viewState.meeting!)
      });
    }

    if (viewState.type === 'contestants' && viewState.race) {
      if (viewState.meeting) {
        items.push({
          label: `${viewState.meeting.cr4cc_trackheld} - ${new Date(viewState.meeting.cr4cc_meetingdate).toLocaleDateString()}`,
          onClick: () => loadRaces(viewState.meeting!)
        });
      }
      items.push({
        label: `Race ${viewState.race.cr616_racenumber}: ${viewState.race.cr616_racename}`,
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

  // Column definitions for meetings
  const meetingColumns: DataGridColumn<IMeeting>[] = [
    {
      key: 'cr4cc_meetingdate',
      label: 'Date',
      sortable: true,
      width: '120px',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'cr4cc_trackheld',
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
      width: '100px'
    },
    {
      key: 'cr4cc_meetingtype',
      label: 'Type',
      sortable: true,
      width: '100px'
    },
    {
      key: 'cr4cc_status',
      label: 'Status',
      sortable: true,
      width: '100px',
      render: (value: string) => {
        const variant = value === 'Completed' ? 'success' : 
                       value === 'Scheduled' ? 'info' : 'neutral';
        return <StatusBadge status={value || 'Unknown'} variant={variant} size="small" />;
      }
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
      key: 'cr616_racename',
      label: 'Race Name',
      sortable: true,
      width: '200px'
    },
    {
      key: 'cr616_racetitle',
      label: 'Title',
      sortable: true,
      width: '200px'
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
      key: 'cr616_noofcontestants',
      label: 'Contestants',
      sortable: true,
      width: '100px',
      align: 'center'
    },
    {
      key: 'cr616_prize1',
      label: 'Prize (1st)',
      sortable: true,
      width: '100px',
      render: (value: number) => value ? `$${value.toLocaleString()}` : '-'
    }
  ];

  // Column definitions for contestants
  const contestantColumns: DataGridColumn<IContestant>[] = [
    {
      key: 'cr616_rugnumber',
      label: 'Rug',
      sortable: true,
      width: '60px',
      align: 'center'
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
      render: (value: number) => {
        if (!value) return '-';
        const variant = value === 1 ? 'success' : 
                       value === 2 ? 'info' :
                       value === 3 ? 'warning' : 'neutral';
        return <StatusBadge status={value.toString()} variant={variant} size="small" />;
      }
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
      <FilterPanel
        title="Meeting Filters"
        theme={theme}
        showClearAll
        onClearAll={clearFilters}
        className={styles.filterPanel}
      >
        <div className={styles.filterGroup}>
          <label htmlFor="dateFrom">Date From</label>
          <input
            id="dateFrom"
            type="date"
            value={dateFrom ? dateFrom.toISOString().split('T')[0] : ''}
            onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : undefined)}
            className={styles.filterInput}
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
        <div className={styles.filterGroup}>
          <label htmlFor="authority">Authority</label>
          <select
            id="authority"
            value={selectedAuthority}
            onChange={(e) => setSelectedAuthority(e.target.value)}
            className={styles.filterInput}
          >
            <option value="">All Authorities</option>
            <option value="NSW">NSW</option>
            <option value="VIC">VIC</option>
            <option value="QLD">QLD</option>
            <option value="SA">SA</option>
            <option value="WA">WA</option>
            <option value="TAS">TAS</option>
            <option value="NT">NT</option>
            <option value="ACT">ACT</option>
          </select>
        </div>
        <button onClick={loadMeetings} className={styles.applyButton}>
          Apply Filters
        </button>
      </FilterPanel>
    );
  };

  // Render search bar
  const renderSearchBar = () => {
    if (!showSearch) return null;

    return (
      <div className={styles.searchBar}>
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
        <button onClick={performSearch} className={styles.searchButton}>
          Search
        </button>
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
        <DataGrid
          data={meetings}
          columns={meetingColumns}
          theme="meeting"
          loading={loading}
          error={error}
          onRowClick={(meeting) => loadRaces(meeting)}
          pagination
          pageSize={pageSize}
          sortable
          hoverable
          striped
        />
      );
    }

    if (viewState.type === 'races') {
      return (
        <DataGrid
          data={races}
          columns={raceColumns}
          theme="race"
          loading={loading}
          error={error}
          onRowClick={(race) => loadContestants(race)}
          pagination
          pageSize={pageSize}
          sortable
          hoverable
          striped
        />
      );
    }

    if (viewState.type === 'contestants') {
      return (
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
      );
    }

    return null;
  };

  return (
    <div className={`${styles.raceDataExplorer} ${styles[`theme-${theme}`]}`}>
      {renderSearchBar()}
      
      <Breadcrumb 
        items={breadcrumbItems} 
        theme={viewState.type === 'search' ? 'neutral' : viewState.type as any}
        className={styles.breadcrumb}
      />
      
      <div className={styles.mainContent}>
        {renderFilters()}
        <div className={styles.dataContainer}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default RaceDataExplorer;