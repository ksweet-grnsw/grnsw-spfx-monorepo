import { WebPartContext } from '@microsoft/sp-webpart-base';
import { CalendarView } from '../../../models/IRaceMeeting';

export interface IRaceMeetingsProps {
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
  defaultView: CalendarView;
  selectedAuthority: string;
  selectedTrackId: string;
  showPastMeetings: boolean;
  showFutureMeetings: boolean;
  description?: string;
  multiSelect?: boolean;
  multiSelectDelimiter?: string;
  onUpdateFilters?: (authority: string, trackId: string) => void;
}