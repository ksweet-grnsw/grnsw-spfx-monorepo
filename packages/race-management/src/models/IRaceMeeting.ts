export interface IRaceMeeting {
  cr4cc_racemeetingid?: string;
  cr4cc_name?: string;
  cr4cc_race_date?: Date | string;
  cr4cc_track_id?: string;
  cr4cc_track_name?: string;
  cr4cc_authority?: string; // State/Authority (NSW, VIC, QLD, SA, WA, TAS, ACT, NT, NZ)
  cr4cc_meeting_type?: string; // Day, Night, Twilight
  cr4cc_status?: string; // Scheduled, Completed, Cancelled, Postponed
  cr4cc_race_count?: number;
  cr4cc_first_race_time?: string;
  cr4cc_last_race_time?: string;
  cr4cc_notes?: string;
  createdon?: Date | string;
  modifiedon?: Date | string;
}

export interface IRaceMeetingFilter {
  authorities?: string[];
  trackIds?: string[];
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export interface IAuthority {
  code: string;
  name: string;
  color: string;
}

export const AUTHORITIES: IAuthority[] = [
  { code: 'NSW', name: 'New South Wales', color: '#1E88E5' },
  { code: 'VIC', name: 'Victoria', color: '#43A047' },
  { code: 'QLD', name: 'Queensland', color: '#E53935' },
  { code: 'SA', name: 'South Australia', color: '#FB8C00' },
  { code: 'WA', name: 'Western Australia', color: '#8E24AA' },
  { code: 'TAS', name: 'Tasmania', color: '#00ACC1' },
  { code: 'ACT', name: 'Australian Capital Territory', color: '#3949AB' },
  { code: 'NT', name: 'Northern Territory', color: '#D81B60' },
  { code: 'NZ', name: 'New Zealand', color: '#546E7A' }
];

export type CalendarView = 'day' | 'week' | 'month';