import * as React from 'react';
import { useState, useMemo } from 'react';
import { IContestant, IRace, IMeeting } from '../../../../models/IRaceData';
import { DataGrid, DataGridColumn } from '../../../../enterprise-ui/components/DataDisplay/DataGrid';
import { StatusBadge } from '../../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import styles from './ContestantsView.module.scss';

export interface IContestantsViewProps {
  contestants: IContestant[];
  race: IRace;
  meeting?: IMeeting;
  loading: boolean;
  error: string;
  onBack: () => void;
  pageSize: number;
}

export const ContestantsView: React.FC<IContestantsViewProps> = ({
  contestants,
  race,
  meeting,
  loading,
  error,
  onBack,
  pageSize
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [showWinnersOnly, setShowWinnersOnly] = useState<boolean>(false);

  // Filter contestants
  const filteredContestants = useMemo(() => {
    let result = [...contestants];
    
    // Status filter
    if (selectedStatus) {
      result = result.filter(c => c.cr616_status === selectedStatus);
    }
    
    // Winners only filter
    if (showWinnersOnly) {
      result = result.filter(c => c.cr616_placement && c.cr616_placement <= 3);
    }
    
    // Search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(c => 
        c.cr616_greyhoundname?.toLowerCase().includes(search) ||
        c.cr616_ownername?.toLowerCase().includes(search) ||
        c.cr616_trainername?.toLowerCase().includes(search)
      );
    }
    
    return result;
  }, [contestants, selectedStatus, showWinnersOnly, searchText]);

  // Get unique statuses
  const statuses = useMemo(() => {
    const uniqueStatuses = new Set<string>();
    contestants.forEach(contestant => {
      if (contestant.cr616_status) {
        uniqueStatuses.add(contestant.cr616_status);
      }
    });
    return Array.from(uniqueStatuses).sort();
  }, [contestants]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!contestants || contestants.length === 0) return null;
    
    const runners = contestants.filter(c => c.cr616_status === 'Runner').length;
    const scratched = contestants.filter(c => c.cr616_status === 'Scratched').length;
    const finished = contestants.filter(c => c.cr616_placement && c.cr616_placement > 0).length;
    
    const weights = contestants.map(c => c.cr616_weight).filter(w => w) as number[];
    const avgWeight = weights.length > 0
      ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
      : 0;
    
    return {
      total: contestants.length,
      runners,
      scratched,
      finished,
      avgWeight
    };
  }, [contestants]);

  // Format placement
  const formatPlacement = (place: number | undefined): string => {
    if (!place) return '-';
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = place % 100;
    return place + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  // Get placement color
  const getPlacementVariant = (place: number | undefined): any => {
    if (!place) return 'neutral';
    switch (place) {
      case 1: return 'success';
      case 2: return 'info';
      case 3: return 'warning';
      default: return 'neutral';
    }
  };

  // Column definitions
  const columns: DataGridColumn<IContestant>[] = [
    {
      key: 'cr616_rugnumber',
      label: 'Rug',
      sortable: true,
      width: '60px',
      align: 'center',
      render: (value: number) => (
        <div className={styles.rugNumber}>
          <span className={styles.rugBadge}>{value}</span>
        </div>
      )
    },
    {
      key: 'cr616_greyhoundname',
      label: 'Greyhound',
      sortable: true,
      width: '180px',
      render: (value: string, item: IContestant) => (
        <div className={styles.greyhound}>
          <span className={styles.dogIcon}>🐕</span>
          <div className={styles.dogInfo}>
            <span className={styles.dogName}>{value}</span>
            {item.cr616_doggrade && (
              <span className={styles.dogGrade}>{item.cr616_doggrade}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'cr616_ownername',
      label: 'Owner',
      sortable: true,
      width: '150px',
      render: (value: string) => (
        <div className={styles.person}>
          <span className={styles.personIcon}>👤</span>
          <span className={styles.personName}>{value || '-'}</span>
        </div>
      )
    },
    {
      key: 'cr616_trainername',
      label: 'Trainer',
      sortable: true,
      width: '150px',
      render: (value: string) => (
        <div className={styles.person}>
          <span className={styles.personIcon}>🏃</span>
          <span className={styles.personName}>{value || '-'}</span>
        </div>
      )
    },
    {
      key: 'cr616_weight',
      label: 'Weight',
      sortable: true,
      width: '80px',
      align: 'center',
      render: (value: number) => (
        <div className={styles.weight}>
          {value ? (
            <>
              <span className={styles.value}>{value}</span>
              <span className={styles.unit}>kg</span>
            </>
          ) : (
            <span className={styles.noData}>-</span>
          )}
        </div>
      )
    },
    {
      key: 'cr616_placement',
      label: 'Place',
      sortable: true,
      width: '80px',
      align: 'center',
      render: (value: number) => {
        if (!value) return <span className={styles.noData}>-</span>;
        return (
          <StatusBadge 
            status={formatPlacement(value)} 
            variant={getPlacementVariant(value)} 
            size="small"
          />
        );
      }
    },
    {
      key: 'cr616_margin',
      label: 'Margin',
      sortable: true,
      width: '80px',
      align: 'center',
      render: (value: number) => (
        <div className={styles.margin}>
          {value ? (
            <>
              <span className={styles.value}>{value}</span>
              <span className={styles.unit}>L</span>
            </>
          ) : (
            <span className={styles.noData}>-</span>
          )}
        </div>
      )
    },
    {
      key: 'cr616_prizemoney',
      label: 'Prize',
      sortable: true,
      width: '100px',
      align: 'right',
      render: (value: number) => {
        if (!value) return <span className={styles.noData}>-</span>;
        return (
          <div className={styles.prize}>
            <span className={styles.prizeIcon}>💰</span>
            <span className={styles.amount}>
              ${value.toLocaleString()}
            </span>
          </div>
        );
      }
    },
    {
      key: 'cr616_status',
      label: 'Status',
      sortable: true,
      width: '100px',
      render: (value: string) => {
        const variant = value === 'Runner' ? 'success' :
                       value === 'Scratched' ? 'error' :
                       value === 'Reserve' ? 'warning' : 'neutral';
        return <StatusBadge status={value} variant={variant} size="small" dot />;
      }
    }
  ];

  // Render winner podium
  const renderPodium = () => {
    const winners = contestants
      .filter(c => c.cr616_placement && c.cr616_placement <= 3)
      .sort((a, b) => (a.cr616_placement || 999) - (b.cr616_placement || 999));
    
    if (winners.length === 0) return null;
    
    return (
      <div className={styles.podium}>
        <h3 className={styles.podiumTitle}>🏆 Race Results</h3>
        <div className={styles.winners}>
          {winners.map((winner, index) => (
            <div key={winner.cr616_contestantsid} className={`${styles.winner} ${styles[`place${index + 1}`]}`}>
              <div className={styles.placeNumber}>{formatPlacement(winner.cr616_placement)}</div>
              <div className={styles.winnerName}>{winner.cr616_greyhoundname}</div>
              <div className={styles.winnerDetails}>
                <span>Rug {winner.cr616_rugnumber}</span>
                {winner.cr616_margin && <span>{winner.cr616_margin}L</span>}
              </div>
              {winner.cr616_prizemoney && (
                <div className={styles.winnerPrize}>${winner.cr616_prizemoney.toLocaleString()}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.contestantsView}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Races
        </button>
        
        <div className={styles.raceInfo}>
          <h2 className={styles.raceTitle}>
            Race {race.cr616_racenumber}: {race.cr616_racename}
          </h2>
          <div className={styles.raceDetails}>
            <StatusBadge status={`${race.cr616_distance}m`} variant="info" size="small" />
            <StatusBadge status={race.cr616_racegrading} variant="primary" size="small" />
            {race.cr616_starttime && (
              <StatusBadge status={`Start: ${race.cr616_starttime}`} variant="neutral" size="small" />
            )}
          </div>
          {meeting && (
            <div className={styles.meetingContext}>
              <span className={styles.trackIcon}>📍</span>
              <span>{meeting.cr4cc_trackname}</span>
              <span className={styles.separator}>•</span>
              <span>{new Date(meeting.cr4cc_meetingdate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {renderPodium()}

      {stats && (
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>🐕</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>✅</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.runners}</span>
              <span className={styles.statLabel}>Runners</span>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>❌</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.scratched}</span>
              <span className={styles.statLabel}>Scratched</span>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>🏁</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.finished}</span>
              <span className={styles.statLabel}>Finished</span>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>⚖️</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.avgWeight}kg</span>
              <span className={styles.statLabel}>Avg Weight</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="Search greyhound, owner, or trainer..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={showWinnersOnly}
            onChange={(e) => setShowWinnersOnly(e.target.checked)}
          />
          <span>Winners Only</span>
        </label>
        
        <button
          onClick={() => {
            setSearchText('');
            setSelectedStatus('');
            setShowWinnersOnly(false);
          }}
          className={styles.clearButton}
        >
          Clear Filters
        </button>
      </div>

      <DataGrid
        data={filteredContestants}
        columns={columns}
        theme="contestant"
        loading={loading}
        error={error}
        pagination
        pageSize={pageSize}
        sortable
        hoverable
        striped
        emptyStateTitle="No contestants found"
        emptyStateMessage="This race has no contestants registered"
        emptyStateIcon="🐕"
      />
    </div>
  );
};