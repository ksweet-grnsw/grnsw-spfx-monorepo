import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface ITemperatureProps {
  selectedTrack: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
}