export interface IRaceMeeting {
    cr4cc_racemeetingid?: string;
    cr4cc_name?: string;
    cr4cc_race_date?: Date | string;
    cr4cc_track_id?: string;
    cr4cc_track_name?: string;
    cr4cc_authority?: string;
    cr4cc_meeting_type?: string;
    cr4cc_status?: string;
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
export declare const AUTHORITIES: IAuthority[];
export type CalendarView = 'day' | 'week' | 'month';
//# sourceMappingURL=IRaceMeeting.d.ts.map