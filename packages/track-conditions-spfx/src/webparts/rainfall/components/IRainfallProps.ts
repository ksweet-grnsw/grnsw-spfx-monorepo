import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IRainfallProps {
  selectedTrack: string;
  defaultView: 'stats' | 'chart';
  defaultPeriod: 'today' | 'week' | 'month';
  defaultChartType: 'line' | 'bar';
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
}