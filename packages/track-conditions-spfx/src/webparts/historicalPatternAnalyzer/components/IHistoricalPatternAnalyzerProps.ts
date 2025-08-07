import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IHistoricalPatternAnalyzerProps {
  refreshInterval: number;
  defaultTimeRange: string;
  defaultTrack: string;
  defaultTracks: string[];
  viewMode: 'compact' | 'standard' | 'detailed';
  enableAlerts: boolean;
  optimalScoreThreshold: number;
  volatilityThreshold: number;
  cacheMinutes: number;
  maxRecords: number;
  debugMode: boolean;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
  onUpdateProperty: (property: string, value: any) => void;
}