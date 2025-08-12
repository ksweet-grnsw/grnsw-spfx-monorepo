import * as React from 'react';
import { useState, useMemo } from 'react';
import { IRace, IMeeting } from '../../../../models/IRaceData';
import { DataGrid, DataGridColumn } from '../../../../enterprise-ui/components/DataDisplay/DataGrid';
import { StatusBadge } from '../../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import styles from './RacesView.module.scss';

export interface IRacesViewProps {
  races: IRace[];
  meeting: IMeeting;
  loading: boolean;
  error: string;
  onRaceClick: (race: IRace) => void;
  onBack: () => void;
  pageSize: number;
}

export const RacesView: React.FC<IRacesViewProps> = ({
  races,
  meeting,
  loading,
  error,
  onRaceClick,
  onBack,
  pageSize
}) => {
  const [selectedGrading, setSelectedGrading] = useState<string>('');
  const [minDistance, setMinDistance] = useState<number | undefined>();
  const [maxDistance, setMaxDistance] = useState<number | undefined>();

  // Filter races
  const filteredRaces = useMemo(() => {
    let result = [...races];
    
    if (selectedGrading) {
      result = result.filter(r => r.cr616_racegrading === selectedGrading);
    }
    
    if (minDistance !== undefined) {
      result = result.filter(r => r.cr616_distance >= minDistance);
    }
    
    if (maxDistance !== undefined) {
      result = result.filter(r => r.cr616_distance <= maxDistance);
    }
    
    return result;
  }, [races, selectedGrading, minDistance, maxDistance]);

  // Get unique gradings
  const gradings = useMemo(() => {
    const uniqueGradings = new Set<string>();
    races.forEach(race => {
      if (race.cr616_racegrading) {
        uniqueGradings.add(race.cr616_racegrading);
      }
    });
    return Array.from(uniqueGradings).sort();
  }, [races]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!filteredRaces || filteredRaces.length === 0) return null;
    
    const totalPrize = filteredRaces.reduce((sum, race) => {
      return sum + (race.cr616_prize1 || 0) + (race.cr616_prize2 || 0) + (race.cr616_prize3 || 0);
    }, 0);
    
    const totalContestants = filteredRaces.reduce((sum, race) => {
      return sum + (race.cr616_noofcontestants || 0);
    }, 0);
    
    const distances = filteredRaces.map(r => r.cr616_distance).filter(d => d);
    const avgDistance = distances.length > 0 
      ? Math.round(distances.reduce((a, b) => a + b, 0) / distances.length)
      : 0;
    
    return {
      totalRaces: filteredRaces.length,
      totalPrize,
      totalContestants,
      avgDistance
    };
  }, [filteredRaces]);

  // Format currency
  const formatCurrency = (value: number | undefined): string => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format time
  const formatTime = (time: string | undefined): string => {
    if (!time) return '-';
    // Assuming time is in HH:mm format
    return time;
  };

  // Column definitions
  const columns: DataGridColumn<IRace>[] = [
    {
      key: 'cr616_racenumber',
      label: 'Race',
      sortable: true,
      width: '80px',
      align: 'center',
      render: (value: number) => (
        <div className={styles.raceNumber}>
          <span className={styles.raceIcon}>🏁</span>
          <span className={styles.number}>{value}</span>
        </div>
      )
    },
    {
      key: 'cr616_racename',
      label: 'Race Name',
      sortable: true,
      width: '200px',
      render: (value: string) => (
        <div className={styles.raceName}>
          <span className={styles.primary}>{value}</span>
        </div>
      )
    },
    {
      key: 'cr616_racetitle',
      label: 'Title/Sponsor',
      sortable: true,
      width: '200px',
      render: (value: string) => (
        <div className={styles.raceTitle}>
          {value || <span className={styles.noTitle}>-</span>}
        </div>
      )
    },
    {
      key: 'cr616_distance',
      label: 'Distance',
      sortable: true,
      width: '100px',
      align: 'center',
      render: (value: number) => (
        <div className={styles.distance}>
          <span className={styles.value}>{value}</span>
          <span className={styles.unit}>m</span>
        </div>
      )
    },
    {
      key: 'cr616_racegrading',
      label: 'Grade',
      sortable: true,
      width: '120px',
      render: (value: string) => {
        let variant: any = 'neutral';
        if (value?.includes('Maiden')) variant = 'info';
        else if (value?.includes('Grade 5')) variant = 'success';
        else if (value?.includes('Free For All')) variant = 'primary';
        
        return <StatusBadge status={value || 'Unknown'} variant={variant} size="small" />;
      }
    },
    {
      key: 'cr616_starttime',
      label: 'Start Time',
      sortable: true,
      width: '100px',
      align: 'center',
      render: (value: string) => (
        <div className={styles.startTime}>
          <span className={styles.timeIcon}>⏰</span>
          <span>{formatTime(value)}</span>
        </div>
      )
    },
    {
      key: 'cr616_noofcontestants',
      label: 'Field',
      sortable: true,
      width: '80px',
      align: 'center',
      render: (value: number) => (
        <div className={styles.contestants}>
          <span className={styles.dogIcon}>🐕</span>
          <span className={styles.count}>{value || 0}</span>
        </div>
      )
    },
    {
      key: 'cr616_prize1',
      label: 'Prize Pool',
      sortable: true,
      width: '120px',
      align: 'right',
      render: (value: number, item: IRace) => {
        const total = (item.cr616_prize1 || 0) + (item.cr616_prize2 || 0) + (item.cr616_prize3 || 0);
        return (
          <div className={styles.prizePool}>
            <span className={styles.prizeIcon}>💰</span>
            <span className={styles.amount}>{formatCurrency(total)}</span>
          </div>
        );
      }
    },
    {
      key: 'cr616_status',
      label: 'Status',
      sortable: true,
      width: '120px',
      render: (value: string) => {
        const status = value || 'Scheduled';
        const variant = status === 'Results Final' ? 'success' :
                       status === 'In Progress' ? 'warning' :
                       status === 'Abandoned' ? 'error' : 'info';
        return <StatusBadge status={status} variant={variant} size="small" dot />;
      }
    }
  ];

  return (
    <div className={styles.racesView}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Meetings
        </button>
        
        <div className={styles.meetingInfo}>
          <h2 className={styles.meetingTitle}>
            {meeting.cr4cc_trackheld} - {new Date(meeting.cr4cc_meetingdate).toLocaleDateString()}
          </h2>
          <div className={styles.meetingDetails}>
            <StatusBadge status={meeting.cr4cc_authority} variant="info" size="small" />
            <StatusBadge status={meeting.cr4cc_timeslot} variant="neutral" size="small" />
            <StatusBadge status={meeting.cr4cc_meetingtype} variant="primary" size="small" />
          </div>
        </div>
      </div>

      {stats && (
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>🏁</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.totalRaces}</span>
              <span className={styles.statLabel}>Races</span>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>💰</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{formatCurrency(stats.totalPrize)}</span>
              <span className={styles.statLabel}>Total Prize</span>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>🐕</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.totalContestants}</span>
              <span className={styles.statLabel}>Contestants</span>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>📏</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.avgDistance}m</span>
              <span className={styles.statLabel}>Avg Distance</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="grading">Grade Filter</label>
          <select
            id="grading"
            value={selectedGrading}
            onChange={(e) => setSelectedGrading(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Grades</option>
            {gradings.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="minDistance">Min Distance (m)</label>
          <input
            id="minDistance"
            type="number"
            value={minDistance || ''}
            onChange={(e) => setMinDistance(e.target.value ? Number(e.target.value) : undefined)}
            className={styles.filterInput}
            placeholder="e.g. 300"
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="maxDistance">Max Distance (m)</label>
          <input
            id="maxDistance"
            type="number"
            value={maxDistance || ''}
            onChange={(e) => setMaxDistance(e.target.value ? Number(e.target.value) : undefined)}
            className={styles.filterInput}
            placeholder="e.g. 700"
          />
        </div>
        
        <button
          onClick={() => {
            setSelectedGrading('');
            setMinDistance(undefined);
            setMaxDistance(undefined);
          }}
          className={styles.clearButton}
        >
          Clear Filters
        </button>
      </div>

      <DataGrid
        data={filteredRaces}
        columns={columns}
        theme="race"
        loading={loading}
        error={error}
        onRowClick={onRaceClick}
        pagination
        pageSize={pageSize}
        sortable
        hoverable
        striped
        emptyStateTitle="No races found"
        emptyStateMessage="This meeting has no races scheduled"
        emptyStateIcon="🏁"
      />
    </div>
  );
};