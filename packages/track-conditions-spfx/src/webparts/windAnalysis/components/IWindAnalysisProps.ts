import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IWindAnalysisProps {
  selectedTrack: string;
  defaultView: 'current' | 'windRose';
  defaultPeriod: 'today' | 'week' | 'month';
  displayMode: 'full' | 'compact';
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
}