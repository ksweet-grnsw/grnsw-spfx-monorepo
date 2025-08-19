import * as React from 'react';
import styles from './RaceMeetings.module.scss';
import type { IRaceMeetingsProps } from './IRaceMeetingsProps';
import { IRaceMeeting, CalendarView, AUTHORITIES } from '../../../models/IRaceMeeting';
import { RaceMeetingService } from '../../../services/RaceMeetingService';
import { 
  Dropdown, 
  IDropdownOption,
  DefaultButton,
  IconButton,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
  MessageBar,
  MessageBarType,
  Panel,
  PanelType
} from '@fluentui/react';

export interface IRaceMeetingsState {
  meetings: IRaceMeeting[];
  loading: boolean;
  error: string | null;
  currentView: CalendarView;
  currentDate: Date;
  selectedAuthorities: string[];
  selectedTrackIds: string[];
  tracks: Array<{trackId: string, trackName: string}>;
  selectedMeeting: IRaceMeeting | null;
  isPanelOpen: boolean;
}

export default class RaceMeetings extends React.Component<IRaceMeetingsProps, IRaceMeetingsState> {
  private raceMeetingService: RaceMeetingService;

  constructor(props: IRaceMeetingsProps) {
    super(props);
    this.state = {
      meetings: [],
      loading: false,
      error: undefined,
      currentView: props.defaultView || 'month',
      currentDate: new Date(),
      selectedAuthorities: props.selectedAuthority ? props.selectedAuthority.split(',').filter(a => a) : [],
      selectedTrackIds: props.selectedTrackId ? props.selectedTrackId.split(',').filter(t => t) : [],
      tracks: [],
      selectedMeeting: undefined,
      isPanelOpen: false
    };
    this.raceMeetingService = new RaceMeetingService(props.context);
  }

  public async componentDidMount(): Promise<void> {
    await this.loadMeetings();
    if (this.state.selectedAuthorities.length > 0) {
      await this.loadTracksByAuthorities(this.state.selectedAuthorities);
    }
  }

  public componentDidUpdate(prevProps: IRaceMeetingsProps): void {
    if (prevProps.selectedAuthority !== this.props.selectedAuthority ||
        prevProps.selectedTrackId !== this.props.selectedTrackId) {
      const newAuthorities = this.props.selectedAuthority ? this.props.selectedAuthority.split(',').filter(a => a) : [];
      const newTrackIds = this.props.selectedTrackId ? this.props.selectedTrackId.split(',').filter(t => t) : [];
      this.setState({
        selectedAuthorities: newAuthorities,
        selectedTrackIds: newTrackIds
      }, () => {
        void this.loadMeetings();
        if (newAuthorities.length > 0) {
          void this.loadTracksByAuthorities(newAuthorities);
        }
      });
    }
  }

  private async loadMeetings(): Promise<void> {
    this.setState({ loading: true, error: undefined });

    try {
      const { startDate, endDate } = this.getDateRange();
      
      const meetings = await this.raceMeetingService.getRaceMeetingsByDateRange(
        startDate,
        endDate,
        this.state.selectedAuthorities.length > 0 ? this.state.selectedAuthorities : undefined,
        this.state.selectedTrackIds.length > 0 ? this.state.selectedTrackIds : undefined
      );


      // Filter based on past/future settings
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const filteredMeetings = meetings.filter(meeting => {
        const meetingDate = new Date(meeting.cr4cc_race_date as string);
        meetingDate.setHours(0, 0, 0, 0);
        
        if (meetingDate < now && !this.props.showPastMeetings) {
          return false;
        }
        if (meetingDate >= now && !this.props.showFutureMeetings) {
          return false;
        }
        return true;
      });


      this.setState({ 
        meetings: filteredMeetings,
        loading: false 
      });
    } catch (error) {
      console.error('Error loading meetings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ 
        error: `Failed to load race meetings: ${errorMessage}`,
        loading: false 
      });
    }
  }

  private async loadTracksByAuthority(authority: string): Promise<void> {
    try {
      const tracks = await this.raceMeetingService.getTracksByAuthority(authority);
      this.setState({ tracks });
    } catch (error) {
      console.error('Error loading tracks:', error);
      this.setState({ tracks: [] });
    }
  }

  private async loadTracksByAuthorities(authorities: string[]): Promise<void> {
    try {
      const tracks = await this.raceMeetingService.getTracksByAuthorities(authorities);
      this.setState({ tracks });
    } catch (error) {
      console.error('Error loading tracks:', error);
      this.setState({ tracks: [] });
    }
  }

  private getDateRange(): { startDate: Date; endDate: Date } {
    const { currentView, currentDate } = this.state;
    const startDate = new Date(currentDate.getTime());
    const endDate = new Date(currentDate.getTime());

    switch (currentView) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week': {
        const dayOfWeek = startDate.getDay();
        const diff = startDate.getDate() - dayOfWeek;
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  }

  private onViewChange = (view: CalendarView): void => {
    this.setState({ currentView: view }, () => void this.loadMeetings());
  };


  private onNavigate = (direction: 'prev' | 'next' | 'today'): void => {
    const { currentView, currentDate } = this.state;
    const newDate = new Date(currentDate.getTime());

    if (direction === 'today') {
      this.setState({ currentDate: new Date() }, () => void this.loadMeetings());
      return;
    }

    const increment = direction === 'next' ? 1 : -1;

    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() + increment);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (7 * increment));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + increment);
        break;
    }

    this.setState({ currentDate: newDate }, () => void this.loadMeetings());
  };

  private onAuthorityChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption, index?: number): void => {
    if (!option) return;
    
    const authority = option.key as string;
    const currentAuthorities = [...this.state.selectedAuthorities];
    const existingIndex = currentAuthorities.indexOf(authority);
    
    // Check if option.selected is undefined - if so, use toggle logic
    if (option.selected === undefined) {
      // Toggle logic when selected property is not provided
      if (existingIndex === -1) {
        currentAuthorities.push(authority);
      } else {
        currentAuthorities.splice(existingIndex, 1);
      }
    } else {
      // Use option.selected when available
      if (option.selected && existingIndex === -1) {
        currentAuthorities.push(authority);
      } else if (!option.selected && existingIndex !== -1) {
        currentAuthorities.splice(existingIndex, 1);
      }
    }
    
    this.setState({ 
      selectedAuthorities: currentAuthorities,
      selectedTrackIds: [] // Reset tracks when authorities change
    }, () => {
      void this.loadMeetings();
      if (currentAuthorities.length > 0) {
        void this.loadTracksByAuthorities(currentAuthorities);
      } else {
        this.setState({ tracks: [] });
      }
      // Call the callback to persist the selection
      if (this.props.onUpdateFilters) {
        this.props.onUpdateFilters(currentAuthorities.join(','), '');
      }
    });
  };

  private onTrackChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption, index?: number): void => {
    if (!option) return;
    
    const trackId = option.key as string;
    const currentTrackIds = [...this.state.selectedTrackIds];
    const existingIndex = currentTrackIds.indexOf(trackId);
    
    // Check if option.selected is undefined - if so, use toggle logic
    if (option.selected === undefined) {
      // Toggle logic when selected property is not provided
      if (existingIndex === -1) {
        currentTrackIds.push(trackId);
      } else {
        currentTrackIds.splice(existingIndex, 1);
      }
    } else {
      // Use option.selected when available
      if (option.selected && existingIndex === -1) {
        currentTrackIds.push(trackId);
      } else if (!option.selected && existingIndex !== -1) {
        currentTrackIds.splice(existingIndex, 1);
      }
    }
    
    this.setState({ selectedTrackIds: currentTrackIds }, () => {
      void this.loadMeetings();
      // Call the callback to persist the selection
      if (this.props.onUpdateFilters) {
        this.props.onUpdateFilters(this.state.selectedAuthorities.join(','), currentTrackIds.join(','));
      }
    });
  };

  private onClearFilters = (): void => {
    this.setState({ 
      selectedAuthorities: [],
      selectedTrackIds: [],
      tracks: []
    }, () => {
      void this.loadMeetings();
      // Call the callback to persist the cleared selection
      if (this.props.onUpdateFilters) {
        this.props.onUpdateFilters('', '');
      }
    });
  };

  private getAuthorityColor(authority: string): string {
    for (const auth of AUTHORITIES) {
      if (auth.code === authority) {
        return auth.color;
      }
    }
    return '#666666';
  }

  private onMeetingClick = (meeting: IRaceMeeting): void => {
    this.setState({ 
      selectedMeeting: meeting,
      isPanelOpen: true
    });
  };

  private onPanelDismiss = (): void => {
    this.setState({ 
      selectedMeeting: undefined,
      isPanelOpen: false
    });
  };

  private renderCalendarHeader(): JSX.Element {
    const { currentView, currentDate } = this.state;
    
    const viewOptions: IDropdownOption[] = [
      { key: 'day', text: 'Day' },
      { key: 'week', text: 'Week' },
      { key: 'month', text: 'Month' }
    ];

    const authorityOptions: IDropdownOption[] = AUTHORITIES.map(auth => ({
      key: auth.code,
      text: auth.name
    }));

    const trackOptions: IDropdownOption[] = this.state.tracks.map(track => ({
      key: track.trackId,
      text: track.trackName
    }));

    const dateFormat = currentView === 'month' 
      ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : currentView === 'week'
      ? `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
      <div className={styles.calendarHeader}>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
          <Stack.Item>
            <Stack horizontal tokens={{ childrenGap: 5 }}>
              <IconButton 
                iconProps={{ iconName: 'ChevronLeft' }} 
                title="Previous"
                onClick={() => this.onNavigate('prev')}
              />
              <DefaultButton 
                text="Today"
                onClick={() => this.onNavigate('today')}
              />
              <IconButton 
                iconProps={{ iconName: 'ChevronRight' }} 
                title="Next"
                onClick={() => this.onNavigate('next')}
              />
            </Stack>
          </Stack.Item>
          <Stack.Item grow>
            <Text variant="xLarge" className={styles.dateDisplay}>{dateFormat}</Text>
          </Stack.Item>
          <Stack.Item>
            <Dropdown
              options={viewOptions}
              selectedKey={currentView}
              onChange={(e, option) => option && this.onViewChange(option.key as CalendarView)}
              styles={{ root: { width: 100 } }}
            />
          </Stack.Item>
        </Stack>
        <Stack horizontal tokens={{ childrenGap: 10 }} className={styles.filters}>
          <Stack.Item grow>
            <Dropdown
              placeholder="Filter by Authority"
              options={authorityOptions}
              selectedKeys={this.state.selectedAuthorities}
              onChange={this.onAuthorityChange}
              multiSelect
              multiSelectDelimiter=", "
              styles={{ 
                dropdown: { minWidth: 200 },
                title: { fontSize: 13 }
              }}
            />
          </Stack.Item>
          <Stack.Item grow>
            <Dropdown
              placeholder="Filter by Track"
              options={trackOptions}
              selectedKeys={this.state.selectedTrackIds}
              onChange={this.onTrackChange}
              multiSelect
              multiSelectDelimiter=", "
              disabled={this.state.tracks.length === 0 && this.state.selectedAuthorities.length === 0}
              styles={{ 
                dropdown: { minWidth: 200 },
                title: { fontSize: 13 }
              }}
            />
          </Stack.Item>
          {(this.state.selectedAuthorities.length > 0 || this.state.selectedTrackIds.length > 0) && (
            <Stack.Item>
              <DefaultButton
                text="Clear Filters"
                onClick={this.onClearFilters}
                iconProps={{ iconName: 'Clear' }}
              />
            </Stack.Item>
          )}
        </Stack>
      </div>
    );
  }

  private renderDayView(): JSX.Element {
    const dayMeetings = this.state.meetings;
    
    // If no meetings for the day, show a message
    if (dayMeetings.length === 0) {
      return (
        <div className={styles.dayView}>
          <div className={styles.noMeetings}>
            No race meetings scheduled for this day
          </div>
        </div>
      );
    }

    // If we have meetings but no time data, show them in a list
    const hasTimeData = dayMeetings.some(meeting => meeting.cr4cc_first_race_time);
    
    if (!hasTimeData) {
      return (
        <div className={styles.dayView}>
          <div className={styles.meetingsList}>
            {dayMeetings.map(meeting => (
              <div
                key={meeting.cr4cc_racemeetingid}
                className={styles.meetingCard}
                style={{ borderLeftColor: this.getAuthorityColor(meeting.cr4cc_authority || '') }}
                onClick={() => this.onMeetingClick(meeting)}
              >
                <div className={styles.meetingHeader}>
                  <div className={styles.meetingTitle}>
                    {meeting.cr4cc_track_name || 'Unknown Track'}
                  </div>
                  <div className={styles.meetingAuthority}>
                    {meeting.cr4cc_authority}
                  </div>
                </div>
                <div className={styles.meetingDetails}>
                  {meeting.cr4cc_race_count ? `${meeting.cr4cc_race_count} races` : 'Race count not available'}
                </div>
                {meeting.cr4cc_meeting_type && (
                  <div className={styles.meetingType}>
                    {meeting.cr4cc_meeting_type}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Original time grid view if we have time data
    const hours: number[] = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }

    return (
      <div className={styles.dayView}>
        <div className={styles.timeGrid}>
          {hours.map((hour: number) => (
            <div key={hour} className={styles.hourSlot}>
              <div className={styles.hourLabel}>
                {hour < 10 ? '0' + hour : hour}:00
              </div>
              <div className={styles.hourContent}>
                {dayMeetings
                  .filter(meeting => {
                    if (!meeting.cr4cc_first_race_time) return false;
                    try {
                      const meetingHour = new Date(meeting.cr4cc_first_race_time).getHours();
                      return meetingHour === hour;
                    } catch {
                      return false;
                    }
                  })
                  .map(meeting => (
                    <div
                      key={meeting.cr4cc_racemeetingid}
                      className={styles.meeting}
                      style={{ backgroundColor: this.getAuthorityColor(meeting.cr4cc_authority || '') }}
                      onClick={() => this.onMeetingClick(meeting)}
                    >
                      <div className={styles.meetingTime}>
                        {meeting.cr4cc_first_race_time}
                      </div>
                      <div className={styles.meetingTitle}>
                        {meeting.cr4cc_track_name}
                      </div>
                      <div className={styles.meetingDetails}>
                        {meeting.cr4cc_race_count} races
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  private renderWeekView(): JSX.Element {
    const { startDate } = this.getDateRange();
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate.getTime());
      date.setDate(startDate.getDate() + i);
      weekDays.push(date);
    }

    return (
      <div className={styles.weekView}>
        <div className={styles.weekGrid}>
          {weekDays.map((day: Date) => {
            const dayMeetings = this.state.meetings.filter(meeting => {
              const meetingDate = new Date(meeting.cr4cc_race_date as string);
              return meetingDate.toDateString() === day.toDateString();
            });

            return (
              <div key={day.toISOString()} className={styles.dayColumn}>
                <div className={styles.dayHeader}>
                  <div className={styles.dayName}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={styles.dayNumber}>
                    {day.getDate()}
                  </div>
                </div>
                <div className={styles.dayContent}>
                  {dayMeetings.map(meeting => (
                    <div
                      key={meeting.cr4cc_racemeetingid}
                      className={styles.meeting}
                      style={{ backgroundColor: this.getAuthorityColor(meeting.cr4cc_authority || '') }}
                      onClick={() => this.onMeetingClick(meeting)}
                    >
                      <div className={styles.meetingTime}>
                        {meeting.cr4cc_first_race_time}
                      </div>
                      <div className={styles.meetingTitle}>
                        {meeting.cr4cc_track_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  private renderMonthView(): JSX.Element {
    const { currentDate } = this.state;
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay.getTime());
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const weeks = [];
    const currentWeek = new Date(startDate.getTime());
    
    while (currentWeek <= lastDay || currentWeek.getDay() !== 0) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(currentWeek.getTime()));
        currentWeek.setDate(currentWeek.getDate() + 1);
      }
      weeks.push(week);
    }

    return (
      <div className={styles.monthView}>
        <div className={styles.weekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className={styles.weekDay}>{day}</div>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className={styles.week}>
            {week.map(day => {
              const dayMeetings = this.state.meetings.filter(meeting => {
                const meetingDate = new Date(meeting.cr4cc_race_date as string);
                return meetingDate.toDateString() === day.toDateString();
              });
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <div
                  key={day.toISOString()}
                  className={`${styles.day} ${!isCurrentMonth ? styles.otherMonth : ''} ${isToday ? styles.today : ''}`}
                >
                  <div className={styles.dayNumber}>{day.getDate()}</div>
                  <div className={styles.meetings}>
                    {dayMeetings.map((meeting, index) => (
                      <div
                        key={meeting.cr4cc_racemeetingid}
                        className={styles.meetingRectangle}
                        style={{ backgroundColor: this.getAuthorityColor(meeting.cr4cc_authority || '') }}
                        onClick={() => this.onMeetingClick(meeting)}
                        title={`${meeting.cr4cc_track_name} - ${meeting.cr4cc_first_race_time || 'Time TBD'}`}
                      >
                        <span className={styles.trackName}>{meeting.cr4cc_track_name || 'Unknown Track'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  private renderMeetingPanel(): JSX.Element | null {
    const { selectedMeeting, isPanelOpen } = this.state;
    
    if (!selectedMeeting) return null;

    let authority = null;
    for (const auth of AUTHORITIES) {
      if (auth.code === selectedMeeting.cr4cc_authority) {
        authority = auth;
        break;
      }
    }

    return (
      <Panel
        isOpen={isPanelOpen}
        onDismiss={this.onPanelDismiss}
        type={PanelType.medium}
        headerText={selectedMeeting.cr4cc_track_name}
        closeButtonAriaLabel="Close"
      >
        <div className={styles.meetingDetails}>
          <Stack tokens={{ childrenGap: 15 }}>
            <Stack.Item>
              <Text variant="large" block>
                {new Date(selectedMeeting.cr4cc_race_date as string).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </Stack.Item>
            
            {authority && (
              <Stack.Item>
                <div 
                  className={styles.authorityBadge}
                  style={{ backgroundColor: authority.color }}
                >
                  {authority.name}
                </div>
              </Stack.Item>
            )}

            <Stack.Item>
              <Text variant="medium" block>
                <strong>Meeting Type:</strong> {selectedMeeting.cr4cc_meeting_type || 'Not specified'}
              </Text>
            </Stack.Item>

            <Stack.Item>
              <Text variant="medium" block>
                <strong>Status:</strong> {selectedMeeting.cr4cc_status || 'Scheduled'}
              </Text>
            </Stack.Item>

            <Stack.Item>
              <Text variant="medium" block>
                <strong>Number of Races:</strong> {selectedMeeting.cr4cc_race_count || 'TBD'}
              </Text>
            </Stack.Item>

            <Stack.Item>
              <Text variant="medium" block>
                <strong>First Race:</strong> {selectedMeeting.cr4cc_first_race_time || 'TBD'}
              </Text>
            </Stack.Item>

            <Stack.Item>
              <Text variant="medium" block>
                <strong>Last Race:</strong> {selectedMeeting.cr4cc_last_race_time || 'TBD'}
              </Text>
            </Stack.Item>

            {selectedMeeting.cr4cc_notes && (
              <Stack.Item>
                <Text variant="medium" block>
                  <strong>Notes:</strong><br />
                  {selectedMeeting.cr4cc_notes}
                </Text>
              </Stack.Item>
            )}
          </Stack>
        </div>
      </Panel>
    );
  }

  public render(): React.ReactElement<IRaceMeetingsProps> {
    const { hasTeamsContext } = this.props;
    const { loading, error, currentView } = this.state;

    return (
      <div className={`${styles.raceMeetings} ${hasTeamsContext ? styles.teams : ''}`}>
        {this.renderCalendarHeader()}
        
        {error && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            {error}
          </MessageBar>
        )}

        {loading ? (
          <div className={styles.loading}>
            <Spinner size={SpinnerSize.large} label="Loading race meetings..." />
          </div>
        ) : (
          <div className={styles.calendarContent}>
            {currentView === 'day' && this.renderDayView()}
            {currentView === 'week' && this.renderWeekView()}
            {currentView === 'month' && this.renderMonthView()}
          </div>
        )}

        <div className={styles.legend}>
          <Text variant="medium">Authority Colors:</Text>
          <div className={styles.legendItems}>
            {AUTHORITIES.map(auth => (
              <div key={auth.code} className={styles.legendItem}>
                <div 
                  className={styles.legendColor}
                  style={{ backgroundColor: auth.color }}
                />
                <span>{auth.code}</span>
              </div>
            ))}
          </div>
        </div>

        {this.renderMeetingPanel()}
      </div>
    );
  }
}