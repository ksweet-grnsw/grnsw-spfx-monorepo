import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IRainfallProps {
  selectedTrack: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
}