import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './RaceMeetingsRefactored.module.scss';
import type { IRaceMeetingsProps } from './IRaceMeetingsProps';
import { IRaceMeeting, CalendarView, AUTHORITIES } from '../../../models/IRaceMeeting';
import { RaceMeetingService } from '../../../services/RaceMeetingService';

// Import Enterprise UI Components
import { DataGrid, DataGridColumn } from '../../../enterprise-ui/components/DataDisplay/DataGrid';
import { StatusBadge } from '../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import { FilterPanel } from '../../../enterprise-ui/components/Forms/FilterPanel/FilterPanel';

// Keep minimal Fluent UI for specific needs
import { 
  Dropdown, 
  IDropdownOption,
  IconButton,
  Panel,
  PanelType
} from '@fluentui/react';

const RaceMeetingsRefactored: React.FC<IRaceMeetingsProps> = (props) => {
  const {
    context,
    description,
    selectedAuthority,
    selectedTrackId,
    multiSelect = false,
    multiSelectDelimiter = ',',
    defaultView = 'month',
    isDarkTheme,
    environmentMessage,
    hasTeamsContext,
    userDisplayName
  } = props;

  // Map Dataverse fields to friendly names
  const mapMeeting = (meeting: IRaceMeeting): any => ({
    ...meeting,
    racemeetingdate: meeting.cr4cc_race_date,
    trackname: meeting.cr4cc_track_name,
    authority: meeting.cr4cc_authority,
    meetingtype: meeting.cr4cc_meeting_type,
    timeslot: meeting.cr4cc_meeting_type === 'Night' ? 'Night' : 'Day',
    races: Array(meeting.cr4cc_race_count || 0).fill({}),
    additionalinfo: meeting.cr4cc_notes
  });

  // State management
  const [meetings, setMeetings] = useState<IRaceMeeting[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<CalendarView>(defaultView);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>(
    selectedAuthority ? selectedAuthority.split(multiSelectDelimiter).filter(a => a) : []
  );
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>(
    selectedTrackId ? selectedTrackId.split(multiSelectDelimiter).filter(t => t) : []
  );
  const [tracks, setTracks] = useState<Array<{trackId: string, trackName: string}>>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<IRaceMeeting | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  // Initialize service
  const raceMeetingService = useMemo(() => new RaceMeetingService(context), [context]);

  // Get date range based on current view
  const getDateRange = useCallback((): { startDate: Date; endDate: Date } => {
    const today = new Date(currentDate);
    let startDate: Date;
    let endDate: Date;

    switch (currentView) {
      case 'day':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        break;
      case 'week':
        const firstDayOfWeek = today.getDate() - today.getDay();
        startDate = new Date(today.getFullYear(), today.getMonth(), firstDayOfWeek);
        endDate = new Date(today.getFullYear(), today.getMonth(), firstDayOfWeek + 6, 23, 59, 59);
        break;
      case 'month':
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        break;
    }

    return { startDate, endDate };
  }, [currentDate, currentView]);

  // Load meetings
  const loadMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange();
      
      const meetingsData = await raceMeetingService.getRaceMeetingsByDateRange(
        startDate,
        endDate,
        selectedAuthorities.length > 0 ? selectedAuthorities : undefined,
        selectedTrackIds.length > 0 ? selectedTrackIds : undefined
      );

      setMeetings(meetingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [raceMeetingService, getDateRange, selectedAuthorities, selectedTrackIds]);

  // Load tracks by authorities
  const loadTracksByAuthorities = useCallback(async (authorities: string[]) => {
    try {
      const tracksData = await raceMeetingService.getTracksByAuthorities(authorities);
      setTracks(tracksData);
    } catch (err) {
      console.error('Failed to load tracks:', err);
    }
  }, [raceMeetingService]);

  // Effects
  useEffect(() => {
    void loadMeetings();
  }, [loadMeetings]);

  useEffect(() => {
    if (selectedAuthorities.length > 0) {
      void loadTracksByAuthorities(selectedAuthorities);
    }
  }, [selectedAuthorities, loadTracksByAuthorities]);

  // Handle meeting click
  const handleMeetingClick = useCallback((meeting: IRaceMeeting) => {
    setSelectedMeeting(meeting);
    setIsPanelOpen(true);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSelectedAuthorities([]);
    setSelectedTrackIds([]);
    setTracks([]);
  }, []);

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Define columns for DataGrid
  const columns: DataGridColumn<any>[] = [
    {
      key: 'racemeetingdate',
      label: 'Date',
      sortable: true,
      width: '120px',
      render: (value: Date) => (
        <div className={styles.dateCell}>
          <span className={styles.date}>{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'trackname',
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
      key: 'authority',
      label: 'Authority',
      sortable: true,
      width: '100px',
      render: (value: string) => (
        <StatusBadge 
          status={value} 
          variant="info" 
          size="small" 
        />
      )
    },
    {
      key: 'meetingtype',
      label: 'Type',
      sortable: true,
      width: '100px',
      render: (value: string) => {
        const variant = value === 'TAB' ? 'primary' : 'neutral';
        return <StatusBadge status={value} variant={variant} size="small" />;
      }
    },
    {
      key: 'timeslot',
      label: 'Time',
      sortable: true,
      width: '100px',
      render: (value: string) => (
        <div className={styles.timeslot}>
          <span>{value === 'Night' ? '🌙' : '☀️'}</span>
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'races',
      label: 'Races',
      sortable: false,
      width: '80px',
      align: 'center',
      render: (_value: any, item: any) => (
        <div className={styles.raceCount}>
          <span>🏁</span>
          <span>{item.races?.length || 0}</span>
        </div>
      )
    }
  ];

  // Authority options for dropdown
  const authorityOptions: IDropdownOption[] = AUTHORITIES.map(auth => ({
    key: auth.code,
    text: auth.name
  }));

  // Track options for dropdown
  const trackOptions: IDropdownOption[] = tracks.map(track => ({
    key: track.trackId,
    text: track.trackName
  }));

  // View options
  const viewOptions: IDropdownOption[] = [
    { key: 'day', text: 'Day' },
    { key: 'week', text: 'Week' },
    { key: 'month', text: 'Month' }
  ];

  return (
    <div className={`${styles.raceMeetings} ${hasTeamsContext ? styles.teams : ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Race Meetings Calendar</h2>
        <div className={styles.controls}>
          <div className={styles.navigation}>
            <IconButton
              iconProps={{ iconName: 'ChevronLeft' }}
              title="Previous"
              onClick={() => {
                const newDate = new Date(currentDate);
                if (currentView === 'day') newDate.setDate(newDate.getDate() - 1);
                else if (currentView === 'week') newDate.setDate(newDate.getDate() - 7);
                else newDate.setMonth(newDate.getMonth() - 1);
                setCurrentDate(newDate);
              }}
            />
            <span className={styles.dateDisplay}>
              {currentDate.toLocaleDateString('en-AU', {
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <IconButton
              iconProps={{ iconName: 'ChevronRight' }}
              title="Next"
              onClick={() => {
                const newDate = new Date(currentDate);
                if (currentView === 'day') newDate.setDate(newDate.getDate() + 1);
                else if (currentView === 'week') newDate.setDate(newDate.getDate() + 7);
                else newDate.setMonth(newDate.getMonth() + 1);
                setCurrentDate(newDate);
              }}
            />
          </div>
          <Dropdown
            options={viewOptions}
            selectedKey={currentView}
            onChange={(_event, option) => option && setCurrentView(option.key as CalendarView)}
            styles={{ root: { width: 100 } }}
          />
        </div>
      </div>

      <div className={styles.content}>
        <FilterPanel
          title="Filters"
          theme="meeting"
          showClearAll
          onClearAll={clearFilters}
          className={styles.filterPanel}
        >
          <div className={styles.filterGroup}>
            <label>Authority</label>
            <Dropdown
              placeholder="Select authorities"
              multiSelect={multiSelect}
              options={authorityOptions}
              selectedKeys={selectedAuthorities}
              onChange={(_event, option) => {
                if (option) {
                  if (multiSelect) {
                    const newAuthorities = option.selected
                      ? [...selectedAuthorities, option.key as string]
                      : selectedAuthorities.filter(a => a !== option.key);
                    setSelectedAuthorities(newAuthorities);
                  } else {
                    setSelectedAuthorities([option.key as string]);
                  }
                }
              }}
            />
          </div>
          
          {tracks.length > 0 && (
            <div className={styles.filterGroup}>
              <label>Track</label>
              <Dropdown
                placeholder="Select tracks"
                multiSelect={multiSelect}
                options={trackOptions}
                selectedKeys={selectedTrackIds}
                onChange={(_event, option) => {
                  if (option) {
                    if (multiSelect) {
                      const newTracks = option.selected
                        ? [...selectedTrackIds, option.key as string]
                        : selectedTrackIds.filter(t => t !== option.key);
                      setSelectedTrackIds(newTracks);
                    } else {
                      setSelectedTrackIds([option.key as string]);
                    }
                  }
                }}
              />
            </div>
          )}
        </FilterPanel>

        <div className={styles.dataContainer}>
          <DataGrid
            data={meetings.map(mapMeeting)}
            columns={columns}
            theme="meeting"
            loading={loading}
            error={error || undefined}
            onRowClick={(row: any) => {
              const originalMeeting = meetings.find(m => m.cr4cc_racemeetingid === row.cr4cc_racemeetingid);
              if (originalMeeting) handleMeetingClick(originalMeeting);
            }}
            pagination
            pageSize={25}
            sortable
            hoverable
            striped
            emptyStateTitle="No meetings found"
            emptyStateMessage="Try adjusting your filters or date range"
            emptyStateIcon="📅"
          />
        </div>
      </div>

      {/* Meeting Details Panel */}
      <Panel
        isOpen={isPanelOpen}
        onDismiss={() => setIsPanelOpen(false)}
        type={PanelType.medium}
        headerText={selectedMeeting ? `${selectedMeeting.cr4cc_track_name} - ${formatDate(selectedMeeting.cr4cc_race_date as Date)}` : ''}
      >
        {selectedMeeting && (
          <div className={styles.meetingDetails}>
            <div className={styles.detailRow}>
              <strong>Authority:</strong> 
              <StatusBadge status={selectedMeeting.cr4cc_authority || ''} variant="info" />
            </div>
            <div className={styles.detailRow}>
              <strong>Type:</strong> 
              <StatusBadge status={selectedMeeting.cr4cc_meeting_type || ''} variant="primary" />
            </div>
            <div className={styles.detailRow}>
              <strong>Time:</strong> {selectedMeeting.cr4cc_meeting_type}
            </div>
            <div className={styles.detailRow}>
              <strong>Races:</strong> {selectedMeeting.cr4cc_race_count || 0}
            </div>
            {selectedMeeting.cr4cc_notes && (
              <div className={styles.detailRow}>
                <strong>Additional Info:</strong> {selectedMeeting.cr4cc_notes}
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
};

export default RaceMeetingsRefactored;