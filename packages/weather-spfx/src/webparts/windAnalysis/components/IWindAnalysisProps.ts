import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IWindAnalysisProps {
  selectedTrack: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
}