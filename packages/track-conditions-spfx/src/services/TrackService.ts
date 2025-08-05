import { WebPartContext } from '@microsoft/sp-webpart-base';
import { AuthService } from './AuthService';
import { dataverseConfig } from '../config/apiConfig';
import { Logger } from '../utils/Logger';

export interface ITrack {
  trackId: string;
  trackName: string;
}

export class TrackService {
  private authService: AuthService;
  private static trackCache: ITrack[] | null = null;

  constructor(context: WebPartContext) {
    this.authService = new AuthService(context);
  }

  public async getAvailableTracks(): Promise<ITrack[]> {
    // Return cached tracks if available
    if (TrackService.trackCache) {
      return TrackService.trackCache;
    }

    try {
      const accessToken = await this.authService.authenticateToDataverse();
      const headers = this.authService.getHeaders(accessToken);
      
      // Query to get distinct track names and IDs
      const url = `${dataverseConfig.environment}/api/data/${dataverseConfig.apiVersion}/${dataverseConfig.tableName}?$select=cr4cc_track_name,cr4cc_station_id&$filter=cr4cc_track_name ne null&$orderby=cr4cc_track_name`;

      console.log('Fetching tracks from:', url);
      console.log('Headers:', headers);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error fetching tracks: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const tracks: ITrack[] = data.value
        .map((item: any) => ({
          trackId: item.cr4cc_station_id,
          trackName: item.cr4cc_track_name
        }))
        .filter((track: ITrack) => track.trackName && track.trackId);

      // Remove duplicates
      const trackMap = new Map(tracks.map(track => [track.trackName, track]));
      const uniqueTracks: ITrack[] = [];
      trackMap.forEach(track => uniqueTracks.push(track));

      Logger.info(`Found ${uniqueTracks.length} unique tracks`, 'TrackService');
      
      // Cache the results
      TrackService.trackCache = uniqueTracks;
      
      return uniqueTracks;
    } catch (error) {
      console.error('Error in getAvailableTracks:', error);
      throw error;
    }
  }

  public static clearCache(): void {
    TrackService.trackCache = null;
  }
}