import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface ISafetyDashboardProps {
  context: WebPartContext;
  description: string;
  injuryTargetPerMonth: number;
  refreshInterval: number;
  defaultTrack: string;
  selectedTrack?: string;
  onTrackChange?: (track: string) => void;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
}