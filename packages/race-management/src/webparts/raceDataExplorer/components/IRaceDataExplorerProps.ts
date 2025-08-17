import { HttpClient } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IRaceDataExplorerProps {
  dataverseUrl: string;
  defaultView: 'meetings' | 'races' | 'contestants';
  pageSize: number;
  showFilters: boolean;
  showSearch: boolean;
  theme: 'neutral' | 'meeting' | 'race' | 'contestant';
  tableDensity: 'compact' | 'normal' | 'comfortable';
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  httpClient: HttpClient;
  context: WebPartContext;
}