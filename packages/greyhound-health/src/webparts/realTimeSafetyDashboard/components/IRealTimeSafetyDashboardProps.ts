import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient } from '@microsoft/sp-http';

export interface IRealTimeSafetyDashboardProps {
  description: string;
  injuryTargetPerMonth: number;
  refreshInterval: number;
  defaultTrack: string;
  selectedTrack: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
  httpClient: SPHttpClient;
  webUrl: string;
  onTrackChange: (track: string) => void;
}
