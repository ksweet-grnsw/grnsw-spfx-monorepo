import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface ITemperatureProps {
  selectedTrack: string;
  defaultView: 'stats' | 'chart';
  defaultPeriod: 'today' | 'week' | 'month';
  defaultChartType: 'line' | 'bar';
  displayMode: 'full' | 'compact';
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
}