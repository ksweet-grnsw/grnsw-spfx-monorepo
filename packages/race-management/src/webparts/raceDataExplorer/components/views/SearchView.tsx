import * as React from 'react';
import { ISearchResults, IMeeting, IRace, IContestant } from '../../../../models/IRaceData';
import { DataGrid, DataGridColumn } from '../../../../enterprise-ui/components/DataDisplay/DataGrid';
import { StatusBadge } from '../../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import styles from './SearchView.module.scss';

export interface ISearchViewProps {
  searchResults: ISearchResults | null;
  searchTerm: string;
  loading: boolean;
  error: string;
  onMeetingClick: (meeting: IMeeting) => void;
  onRaceClick: (race: IRace) => void;
  onContestantClick?: (contestant: IContestant) => void;
  onClearSearch: () => void;
}

export const SearchView: React.FC<ISearchViewProps> = ({
  searchResults,
  searchTerm,
  loading,
  error,
  onMeetingClick,
  onRaceClick,
  onContestantClick,
  onClearSearch
}) => {
  if (loading) {
    return (
      <div className={styles.searchView}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Searching for "{searchTerm}"...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.searchView}>
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <h3>Search Error</h3>
          <p>{error}</p>
          <button onClick={onClearSearch} className={styles.retryButton}>
            Clear Search
          </button>
        </div>
      </div>
    );
  }

  if (!searchResults) {
    return (
      <div className={styles.searchView}>
        <div className={styles.emptyState}>
          <span className={styles.searchIcon}>🔍</span>
          <h3>Start Searching</h3>
          <p>Enter a search term above to find meetings, races, or contestants</p>
        </div>
      </div>
    );
  }

  const totalResults = searchResults.totalResults;

  if (totalResults === 0) {
    return (
      <div className={styles.searchView}>
        <div className={styles.noResults}>
          <span className={styles.noResultsIcon}>🔍</span>
          <h3>No Results Found</h3>
          <p>No matches found for "{searchTerm}"</p>
          <p className={styles.suggestion}>Try adjusting your search terms or check the spelling</p>
          <button onClick={onClearSearch} className={styles.clearButton}>
            Clear Search
          </button>
        </div>
      </div>
    );
  }

  // Meeting columns
  const meetingColumns: DataGridColumn<IMeeting>[] = [
    {
      key: 'cr4cc_meetingdate',
      label: 'Date',
      width: '120px',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'cr4cc_trackheld',
      label: 'Track',
      width: '150px'
    },
    {
      key: 'cr4cc_authority',
      label: 'Authority',
      width: '80px',
      render: (value: string) => <StatusBadge status={value} variant="info" size="small" />
    },
    {
      key: 'cr4cc_timeslot',
      label: 'Timeslot',
      width: '80px'
    },
    {
      key: 'cr4cc_meetingtype',
      label: 'Type',
      width: '80px'
    }
  ];

  // Race columns
  const raceColumns: DataGridColumn<IRace>[] = [
    {
      key: 'cr616_racenumber',
      label: 'Race #',
      width: '60px',
      align: 'center'
    },
    {
      key: 'cr616_racename',
      label: 'Race Name',
      width: '180px'
    },
    {
      key: 'cr616_distance',
      label: 'Distance',
      width: '80px',
      render: (value: number) => `${value}m`
    },
    {
      key: 'cr616_racegrading',
      label: 'Grade',
      width: '100px'
    },
    {
      key: 'cr616_Meeting',
      label: 'Meeting',
      width: '200px',
      render: (value: IMeeting) => {
        if (!value) return '-';
        return (
          <div className={styles.meetingReference}>
            <span>{value.cr4cc_trackheld}</span>
            <span className={styles.date}>
              {new Date(value.cr4cc_meetingdate).toLocaleDateString()}
            </span>
          </div>
        );
      }
    }
  ];

  // Contestant columns
  const contestantColumns: DataGridColumn<IContestant>[] = [
    {
      key: 'cr616_rugnumber',
      label: 'Rug',
      width: '50px',
      align: 'center'
    },
    {
      key: 'cr616_greyhoundname',
      label: 'Greyhound',
      width: '150px'
    },
    {
      key: 'cr616_ownername',
      label: 'Owner',
      width: '120px'
    },
    {
      key: 'cr616_trainername',
      label: 'Trainer',
      width: '120px'
    },
    {
      key: 'cr616_status',
      label: 'Status',
      width: '80px',
      render: (value: string) => {
        const variant = value === 'Runner' ? 'success' : 
                       value === 'Scratched' ? 'error' : 'neutral';
        return <StatusBadge status={value} variant={variant} size="small" />;
      }
    },
    {
      key: 'cr616_Race',
      label: 'Race',
      width: '250px',
      render: (value: IRace) => {
        if (!value) return '-';
        const meeting = value.cr616_Meeting;
        return (
          <div className={styles.raceReference}>
            <span>R{value.cr616_racenumber} - {value.cr616_racename}</span>
            {meeting && (
              <span className={styles.meetingInfo}>
                {meeting.cr4cc_trackheld} • {new Date(meeting.cr4cc_meetingdate).toLocaleDateString()}
              </span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className={styles.searchView}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Search Results for "{searchTerm}"
        </h2>
        <div className={styles.summary}>
          <span className={styles.count}>{totalResults} total results</span>
          <button onClick={onClearSearch} className={styles.clearSearchButton}>
            Clear Search
          </button>
        </div>
      </div>

      <div className={styles.results}>
        {searchResults.meetings.length > 0 && (
          <div className={styles.resultSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>📅</span>
              <h3 className={styles.sectionTitle}>
                Meetings ({searchResults.meetings.length})
              </h3>
            </div>
            <DataGrid
              data={searchResults.meetings}
              columns={meetingColumns}
              theme="meeting"
              density="compact"
              onRowClick={onMeetingClick}
              pageSize={5}
              pagination={searchResults.meetings.length > 5}
              hoverable
              striped
            />
          </div>
        )}

        {searchResults.races.length > 0 && (
          <div className={styles.resultSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🏁</span>
              <h3 className={styles.sectionTitle}>
                Races ({searchResults.races.length})
              </h3>
            </div>
            <DataGrid
              data={searchResults.races}
              columns={raceColumns}
              theme="race"
              density="compact"
              onRowClick={onRaceClick}
              pageSize={5}
              pagination={searchResults.races.length > 5}
              hoverable
              striped
            />
          </div>
        )}

        {searchResults.contestants.length > 0 && (
          <div className={styles.resultSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🐕</span>
              <h3 className={styles.sectionTitle}>
                Contestants ({searchResults.contestants.length})
              </h3>
            </div>
            <DataGrid
              data={searchResults.contestants}
              columns={contestantColumns}
              theme="contestant"
              density="compact"
              onRowClick={onContestantClick}
              pageSize={5}
              pagination={searchResults.contestants.length > 5}
              hoverable
              striped
            />
          </div>
        )}
      </div>
    </div>
  );
};