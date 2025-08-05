import * as React from 'react';
import type { IRaceMeetingsProps } from './IRaceMeetingsProps';
import { IRaceMeeting, CalendarView } from '../../../models/IRaceMeeting';
export interface IRaceMeetingsState {
    meetings: IRaceMeeting[];
    loading: boolean;
    error: string | null;
    currentView: CalendarView;
    currentDate: Date;
    selectedAuthority: string;
    selectedTrackId: string;
    tracks: Array<{
        trackId: string;
        trackName: string;
    }>;
    selectedMeeting: IRaceMeeting | null;
    isPanelOpen: boolean;
}
export default class RaceMeetings extends React.Component<IRaceMeetingsProps, IRaceMeetingsState> {
    private raceMeetingService;
    constructor(props: IRaceMeetingsProps);
    componentDidMount(): void;
    componentDidUpdate(prevProps: IRaceMeetingsProps): void;
    private loadMeetings;
    private loadTracksByAuthority;
    private loadTracksByAuthorities;
    private getDateRange;
    private onViewChange;
    private onNavigate;
    private onAuthorityChange;
    private onTrackChange;
    private onClearFilters;
    private getAuthorityColor;
    private onMeetingClick;
    private onPanelDismiss;
    private renderCalendarHeader;
    private renderDayView;
    private renderWeekView;
    private renderMonthView;
    private renderMeetingPanel;
    render(): React.ReactElement<IRaceMeetingsProps>;
}
//# sourceMappingURL=RaceMeetings.d.ts.map