import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { IMeeting, IMeetingFilters } from '../../../../models/IRaceData';
import { DataGrid, DataGridColumn } from '../../../../enterprise-ui/components/DataDisplay/DataGrid';
import { StatusBadge } from '../../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import { FilterPanel } from '../../../../enterprise-ui/components/Forms/FilterPanel/FilterPanel';
import styles from './MeetingsView.module.scss';

export interface IMeetingsViewProps {
  meetings: IMeeting[];
  loading: boolean;
  error: string;
  onMeetingClick: (meeting: IMeeting) => void;
  onFiltersChange: (filters: IMeetingFilters) => void;
  onRefresh: () => void;
  pageSize: number;
  showFilters: boolean;
  theme?: 'neutral' | 'meeting' | 'race' | 'contestant';
}

export const MeetingsView: React.FC<IMeetingsViewProps> = ({
  meetings,
  loading,
  error,
  onMeetingClick,
  onFiltersChange,
  onRefresh,
  pageSize,
  showFilters,
  theme = 'meeting'
}) => {
  // Filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Track list (all 18 GRNSW tracks)
  const tracks = [
    'Broken Hill', 'Bulli', 'Casino', 'Dapto', 'Dubbo',
    'Gosford', 'Goulburn', 'Grafton', 'Gunnedah', 'Lithgow',
    'Maitland', 'Nowra', 'Richmond', 'Taree', 'Temora',
    'The Gardens', 'Wagga Wagga', 'Wentworth Park'
  ];

  // Authority list
  const authorities = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

  // Meeting status options
  const statusOptions = ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed'];

  // Apply filters
  const applyFilters = useCallback(() => {
    const filters: IMeetingFilters = {
      dateFrom,
      dateTo,
      track: selectedTrack,
      authority: selectedAuthority,
      status: selectedStatus
    };
    onFiltersChange(filters);
  }, [dateFrom, dateTo, selectedTrack, selectedAuthority, selectedStatus, onFiltersChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedTrack('');
    setSelectedAuthority('');
    setSelectedStatus('');
    onFiltersChange({});
  }, [onFiltersChange]);

  // Quick date filters
  const setQuickDateFilter = useCallback((option: 'today' | 'week' | 'month' | 'year') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (option) {
      case 'today':
        setDateFrom(today);
        setDateTo(today);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        setDateFrom(weekStart);
        setDateTo(weekEnd);
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setDateFrom(monthStart);
        setDateTo(monthEnd);
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        setDateFrom(yearStart);
        setDateTo(yearEnd);
        break;
    }
  }, []);

  // Column definitions
  const columns: DataGridColumn<IMeeting>[] = [
    {
      key: 'cr4cc_meetingdate',
      label: 'Date',
      sortable: true,
      width: '120px',
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div className={styles.dateCell}>
            <div className={styles.date}>{date.toLocaleDateString()}</div>
            <div className={styles.day}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
          </div>
        );
      }
    },
    {
      key: 'cr4cc_trackname',
      label: 'Track',
      sortable: true,
      width: '150px',
      render: (value: string) => (
        <div className={styles.trackCell}>
          <span className={styles.trackIcon}>📍</span>
          <span>{value}</span>
        </div>
      )
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
      width: '100px',
      render: (value: string) => {
        const icon = value?.toLowerCase() === 'night' ? '🌙' : '☀️';
        return (
          <div className={styles.timeslotCell}>
            <span>{icon}</span>
            <span>{value}</span>
          </div>
        );
      }
    },
    {
      key: 'cr4cc_meetingtype',
      label: 'Type',
      sortable: true,
      width: '100px',
      render: (value: string) => {
        const variant = value === 'TAB' ? 'primary' : 'neutral';
        return <StatusBadge status={value} variant={variant} size="small" />;
      }
    },
    {
      key: 'raceCount',
      label: 'Races',
      sortable: false,
      width: '80px',
      align: 'center',
      render: (value: number, item: IMeeting) => {
        const count = item._cr616_races?.length || 0;
        return (
          <div className={styles.raceCount}>
            <span className={styles.raceIcon}>🏁</span>
            <span>{count}</span>
          </div>
        );
      }
    },
    {
      key: 'cr4cc_status',
      label: 'Status',
      sortable: true,
      width: '120px',
      render: (value: string) => {
        const variant = value === 'Completed' ? 'success' : 
                       value === 'In Progress' ? 'warning' :
                       value === 'Scheduled' ? 'info' :
                       value === 'Cancelled' ? 'error' : 'neutral';
        return <StatusBadge status={value || 'Unknown'} variant={variant} size="small" dot />;
      }
    }
  ];

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!meetings || meetings.length === 0) return null;
    
    const today = new Date();
    const completed = meetings.filter(m => m.cr4cc_status === 'Completed').length;
    const scheduled = meetings.filter(m => m.cr4cc_status === 'Scheduled').length;
    const upcoming = meetings.filter(m => new Date(m.cr4cc_meetingdate) >= today).length;
    
    return {
      total: meetings.length,
      completed,
      scheduled,
      upcoming
    };
  }, [meetings]);

  return (
    <div className={styles.meetingsView}>
      {showFilters && (
        <FilterPanel
          title="Meeting Filters"
          theme={theme}
          showClearAll
          onClearAll={clearFilters}
          className={styles.filterPanel}
          footer={
            <button onClick={applyFilters} className={styles.applyButton}>
              Apply Filters
            </button>
          }
        >
          <div className={styles.quickFilters}>
            <span className={styles.quickLabel}>Quick filters:</span>
            <button onClick={() => setQuickDateFilter('today')} className={styles.quickButton}>
              Today
            </button>
            <button onClick={() => setQuickDateFilter('week')} className={styles.quickButton}>
              This Week
            </button>
            <button onClick={() => setQuickDateFilter('month')} className={styles.quickButton}>
              This Month
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
              {tracks.map(track => (
                <option key={track} value={track}>{track}</option>
              ))}
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
              {authorities.map(auth => (
                <option key={auth} value={auth}>{auth}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.filterInput}
            >
              <option value="">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </FilterPanel>
      )}
      
      <div className={styles.content}>
        {stats && (
          <div className={styles.statsBar}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Total</span>
              <span className={styles.statValue}>{stats.total}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Completed</span>
              <span className={styles.statValue}>{stats.completed}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Scheduled</span>
              <span className={styles.statValue}>{stats.scheduled}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Upcoming</span>
              <span className={styles.statValue}>{stats.upcoming}</span>
            </div>
            <button onClick={onRefresh} className={styles.refreshButton}>
              🔄 Refresh
            </button>
          </div>
        )}
        
        <DataGrid
          data={meetings}
          columns={columns}
          theme="meeting"
          loading={loading}
          error={error}
          onRowClick={onMeetingClick}
          pagination
          pageSize={pageSize}
          sortable
          hoverable
          striped
          emptyStateTitle="No meetings found"
          emptyStateMessage="Try adjusting your filters or search criteria"
          emptyStateIcon="📅"
          onRetry={onRefresh}
        />
      </div>
    </div>
  );
};