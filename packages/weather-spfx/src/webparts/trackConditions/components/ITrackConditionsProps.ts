import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface ITrackConditionsProps {
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
  selectedTrackId: string;
  selectedTrackName: string;
}
