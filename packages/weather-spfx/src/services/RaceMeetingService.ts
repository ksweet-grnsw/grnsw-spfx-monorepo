import { WebPartContext } from '@microsoft/sp-webpart-base';
import { AuthService } from './AuthService';
import { dataverseConfig } from '../config/apiConfig';
import { Logger } from '../utils/Logger';
import { ErrorHandler } from '../utils/ErrorHandler';
import { IRaceMeeting, IRaceMeetingFilter } from '../models/IRaceMeeting';

export class RaceMeetingService {
  private authService: AuthService;
  private tableName = 'cr4cc_racemeetings'; // Dataverse table name (plural)
  private fieldMappings: any = null; // Cache field mappings

  constructor(context: WebPartContext) {
    this.authService = new AuthService(context);
  }

  // Discover field names dynamically
  private async discoverFields(): Promise<void> {
    if (this.fieldMappings) return; // Already discovered

    try {
      const accessToken = await this.authService.authenticateToDataverse();
      const headers = this.authService.getHeaders(accessToken);
      
      // First, try to get entity metadata to see all fields
      const metadataUrl = `${dataverseConfig.environment}/api/data/${dataverseConfig.apiVersion}/EntityDefinitions(LogicalName='cr4cc_racemeeting')/Attributes?$select=LogicalName,DisplayName,AttributeType`;
      
      console.log('Fetching entity metadata from:', metadataUrl);
      
      const metadataResponse = await fetch(metadataUrl, {
        method: 'GET',
        headers: headers
      });

      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        console.log('Available fields in cr4cc_racemeeting:', metadata.value.map((f: any) => f.LogicalName));
        
        // Map the fields based on what we find
        this.fieldMappings = {
          dateField: this.findFieldByPattern(metadata.value, ['date', 'meetingdate', 'racedate']),
          authorityField: this.findFieldByPattern(metadata.value, ['authority']),
          trackIdField: this.findFieldByPattern(metadata.value, ['track_id', 'trackid', 'track']),
          trackNameField: this.findFieldByPattern(metadata.value, ['track_name', 'trackname', 'track']),
          statusField: this.findFieldByPattern(metadata.value, ['status'])
        };
        
        console.log('Field mappings discovered:', this.fieldMappings);
      } else {
        // Fallback: try to get a sample record to see its structure
        const sampleUrl = `${dataverseConfig.environment}/api/data/${dataverseConfig.apiVersion}/${this.tableName}?$top=1`;
        const sampleResponse = await fetch(sampleUrl, {
          method: 'GET',
          headers: headers
        });
        
        if (sampleResponse.ok) {
          const sampleData = await sampleResponse.json();
          if (sampleData.value && sampleData.value.length > 0) {
            const sampleRecord = sampleData.value[0];
            const fields = Object.keys(sampleRecord);
            console.log('Sample record fields:', fields);
            
            // Try to map fields based on the sample
            this.fieldMappings = {
              dateField: this.findInArray(fields, function(f: string) { return f.indexOf('date') !== -1 || f.indexOf('Date') !== -1; }),
              authorityField: this.findInArray(fields, function(f: string) { return f.indexOf('authority') !== -1 || f.indexOf('Authority') !== -1; }),
              trackIdField: this.findInArray(fields, function(f: string) { return f.indexOf('track') !== -1 && (f.indexOf('id') !== -1 || f.indexOf('Id') !== -1); }),
              trackNameField: this.findInArray(fields, function(f: string) { return f.indexOf('track') !== -1 && (f.indexOf('name') !== -1 || f.indexOf('Name') !== -1); }),
              statusField: this.findInArray(fields, function(f: string) { return f.indexOf('status') !== -1 || f.indexOf('Status') !== -1; })
            };
            
            console.log('Field mappings from sample:', this.fieldMappings);
          }
        }
      }
      
      // If we still don't have mappings, use defaults
      if (!this.fieldMappings) {
        console.warn('Could not discover field mappings, using defaults');
        this.fieldMappings = {
          dateField: 'cr4cc_race_date',
          authorityField: 'cr4cc_authority',
          trackIdField: 'cr4cc_track_id',
          trackNameField: 'cr4cc_track_name',
          statusField: 'cr4cc_status'
        };
      }
    } catch (error) {
      console.error('Error discovering fields:', error);
      // Use defaults on error
      this.fieldMappings = {
        dateField: 'cr4cc_race_date',
        authorityField: 'cr4cc_authority',
        trackIdField: 'cr4cc_track_id',
        trackNameField: 'cr4cc_track_name',
        statusField: 'cr4cc_status'
      };
    }
  }

  private findFieldByPattern(fields: any[], patterns: string[]): string | undefined {
    for (var i = 0; i < patterns.length; i++) {
      var pattern = patterns[i];
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        if (field.LogicalName.toLowerCase().indexOf(pattern.toLowerCase()) !== -1) {
          return field.LogicalName;
        }
      }
    }
    return undefined;
  }

  private findInArray<T>(arr: T[], predicate: (item: T) => boolean): T | undefined {
    for (var i = 0; i < arr.length; i++) {
      if (predicate(arr[i])) {
        return arr[i];
      }
    }
    return undefined;
  }

  public async getRaceMeetings(filter?: IRaceMeetingFilter): Promise<IRaceMeeting[]> {
    try {
      // Ensure we have field mappings
      await this.discoverFields();
      
      const accessToken = await this.authService.authenticateToDataverse();
      const headers = this.authService.getHeaders(accessToken);
      
      // Build OData query with discovered field names
      let query = '';
      if (this.fieldMappings.dateField) {
        query = `$orderby=${this.fieldMappings.dateField} asc`;
      }
      
      const filters: string[] = [];
      
      if (filter) {
        if (filter.authorities && filter.authorities.length > 0 && this.fieldMappings.authorityField) {
          if (filter.authorities.length === 1) {
            filters.push(`${this.fieldMappings.authorityField} eq '${filter.authorities[0]}'`);
          } else {
            const authorityFilters = filter.authorities.map(auth => `${this.fieldMappings.authorityField} eq '${auth}'`);
            filters.push(`(${authorityFilters.join(' or ')})`);
          }
        }
        if (filter.trackIds && filter.trackIds.length > 0 && this.fieldMappings.trackIdField) {
          if (filter.trackIds.length === 1) {
            filters.push(`${this.fieldMappings.trackIdField} eq '${filter.trackIds[0]}'`);
          } else {
            const trackFilters = filter.trackIds.map(trackId => `${this.fieldMappings.trackIdField} eq '${trackId}'`);
            filters.push(`(${trackFilters.join(' or ')})`);
          }
        }
        if (filter.startDate && this.fieldMappings.dateField) {
          const startDateStr = filter.startDate.toISOString().split('T')[0];
          filters.push(`${this.fieldMappings.dateField} ge ${startDateStr}`);
        }
        if (filter.endDate && this.fieldMappings.dateField) {
          const endDateStr = filter.endDate.toISOString().split('T')[0];
          filters.push(`${this.fieldMappings.dateField} le ${endDateStr}`);
        }
        if (filter.status && this.fieldMappings.statusField) {
          filters.push(`${this.fieldMappings.statusField} eq '${filter.status}'`);
        }
      }
      
      if (filters.length > 0) {
        query = `$filter=${filters.join(' and ')}&${query}`;
      }
      
      const url = `${dataverseConfig.environment}/api/data/${dataverseConfig.apiVersion}/${this.tableName}?${query}`;
      
      Logger.info(`Fetching race meetings from: ${url}`, 'RaceMeetingService');
      console.log('Dataverse URL:', url);
      console.log('Headers:', headers);
      
      // Retry logic for rate limiting
      let retries = 3;
      let response: Response;
      
      while (retries > 0) {
        response = await fetch(url, {
          method: 'GET',
          headers: headers
        });

        console.log('Response status:', response.status);
        
        // Check for rate limiting (429) or service unavailable (503)
        if (response.status === 429 || response.status === 503) {
          retries--;
          if (retries > 0) {
            console.log(`Rate limited or service unavailable. Retrying in 2 seconds... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        
        break;
      }
      
      if (!response!.ok) {
        const errorText = await response!.text();
        console.error('Dataverse error response:', errorText);
        
        // Check for specific error types
        if (response!.status === 429) {
          throw new Error('API rate limit exceeded. Please try again in a few moments.');
        } else if (response!.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again later.');
        }
        
        throw new Error(`Error fetching race meetings: ${response!.status} ${response!.statusText} - ${errorText}`);
      }

      const data = await response!.json();
      const rawMeetings = data.value || [];
      
      // Map the raw data to our expected format
      const meetings: IRaceMeeting[] = rawMeetings.map((meeting: any) => {
        const mapped: any = {
          racemeetingid: meeting.cr4cc_racemeetingid || meeting.racemeetingid || '',
          // Use discovered field names or fallback to raw data
          cr4cc_race_date: meeting[this.fieldMappings.dateField] || meeting.cr4cc_race_date || meeting.racedate || '',
          cr4cc_authority: meeting[this.fieldMappings.authorityField] || meeting.cr4cc_authority || meeting.authority || '',
          cr4cc_track_id: meeting[this.fieldMappings.trackIdField] || meeting.cr4cc_track_id || meeting.trackid || '',
          cr4cc_track_name: meeting[this.fieldMappings.trackNameField] || meeting.cr4cc_track_name || meeting.trackname || '',
          cr4cc_status: meeting[this.fieldMappings.statusField] || meeting.cr4cc_status || meeting.status || 'Active'
        };
        
        // Copy any additional fields
        Object.keys(meeting).forEach(key => {
          if (!mapped[key]) {
            mapped[key] = meeting[key];
          }
        });
        
        return mapped;
      });
      
      Logger.info(`Retrieved ${meetings.length} race meetings`, 'RaceMeetingService');
      
      return meetings;
    } catch (error) {
      const handledError = ErrorHandler.handleError(error, 'RaceMeetingService.getRaceMeetings');
      throw handledError;
    }
  }

  public async getAllTracks(): Promise<Array<{trackId: string, trackName: string}>> {
    try {
      // Ensure we have field mappings
      await this.discoverFields();
      
      const accessToken = await this.authService.authenticateToDataverse();
      const headers = this.authService.getHeaders(accessToken);
      
      // Get all distinct tracks using discovered field names
      let query = '';
      if (this.fieldMappings.trackIdField && this.fieldMappings.trackNameField) {
        query = `$select=${this.fieldMappings.trackIdField},${this.fieldMappings.trackNameField}`;
        if (this.fieldMappings.trackNameField) {
          query += `&$orderby=${this.fieldMappings.trackNameField}`;
        }
      }
      const url = `${dataverseConfig.environment}/api/data/${dataverseConfig.apiVersion}/${this.tableName}?${query}`;
      
      // Retry logic for rate limiting
      let retries = 3;
      let response: Response;
      
      while (retries > 0) {
        response = await fetch(url, {
          method: 'GET',
          headers: headers
        });
        
        if (response.status === 429 || response.status === 503) {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        
        break;
      }

      if (!response!.ok) {
        throw new Error(`Error fetching tracks: ${response!.status} ${response!.statusText}`);
      }

      const data = await response!.json();
      const meetings = data.value || [];
      
      // Extract unique tracks using discovered field names
      const trackMap = new Map<string, string>();
      meetings.forEach((meeting: any) => {
        const trackId = meeting[this.fieldMappings.trackIdField] || meeting.cr4cc_track_id || meeting.trackid;
        const trackName = meeting[this.fieldMappings.trackNameField] || meeting.cr4cc_track_name || meeting.trackname;
        if (trackId && trackName) {
          trackMap.set(trackId, trackName);
        }
      });
      
      const tracks: Array<{trackId: string, trackName: string}> = [];
      trackMap.forEach((trackName, trackId) => {
        tracks.push({ trackId, trackName });
      });
      
      return tracks.sort((a, b) => a.trackName.localeCompare(b.trackName));
    } catch (error) {
      const handledError = ErrorHandler.handleError(error, 'RaceMeetingService.getAllTracks');
      throw handledError;
    }
  }

  public async getTracksByAuthority(authority: string): Promise<Array<{trackId: string, trackName: string}>> {
    try {
      // Ensure we have field mappings
      await this.discoverFields();
      
      const accessToken = await this.authService.authenticateToDataverse();
      const headers = this.authService.getHeaders(accessToken);
      
      // Get distinct tracks for the authority using discovered field names
      let query = '';
      if (this.fieldMappings.authorityField) {
        query = `$filter=${this.fieldMappings.authorityField} eq '${authority}'`;
      }
      if (this.fieldMappings.trackIdField && this.fieldMappings.trackNameField) {
        query += `&$select=${this.fieldMappings.trackIdField},${this.fieldMappings.trackNameField}`;
        if (this.fieldMappings.trackNameField) {
          query += `&$orderby=${this.fieldMappings.trackNameField}`;
        }
      }
      query += '&$top=1000';
      
      const url = `${dataverseConfig.environment}/api/data/${dataverseConfig.apiVersion}/${this.tableName}?${query}`;
      
      // Retry logic for rate limiting
      let retries = 3;
      let response: Response;
      
      while (retries > 0) {
        response = await fetch(url, {
          method: 'GET',
          headers: headers
        });
        
        if (response.status === 429 || response.status === 503) {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        
        break;
      }

      if (!response!.ok) {
        throw new Error(`Error fetching tracks: ${response!.status} ${response!.statusText}`);
      }

      const data = await response!.json();
      const meetings = data.value || [];
      
      // Extract unique tracks using discovered field names
      const trackMap = new Map<string, string>();
      meetings.forEach((meeting: any) => {
        const trackId = meeting[this.fieldMappings.trackIdField] || meeting.cr4cc_track_id || meeting.trackid;
        const trackName = meeting[this.fieldMappings.trackNameField] || meeting.cr4cc_track_name || meeting.trackname;
        if (trackId && trackName) {
          trackMap.set(trackId, trackName);
        }
      });
      
      const tracks: Array<{trackId: string, trackName: string}> = [];
      trackMap.forEach((trackName, trackId) => {
        tracks.push({ trackId, trackName });
      });
      
      return tracks.sort((a, b) => a.trackName.localeCompare(b.trackName));
    } catch (error) {
      Logger.error(`Error in getTracksByAuthority: ${error}`, 'RaceMeetingService');
      const handledError = ErrorHandler.handleError(error, 'RaceMeetingService.getTracksByAuthority');
      throw handledError;
    }
  }

  public async getTracksByAuthorities(authorities: string[]): Promise<Array<{trackId: string, trackName: string}>> {
    if (authorities.length === 0) {
      return this.getAllTracks();
    }
    
    try {
      // Ensure we have field mappings
      await this.discoverFields();
      
      const accessToken = await this.authService.authenticateToDataverse();
      const headers = this.authService.getHeaders(accessToken);
      
      // Get distinct tracks for the authorities using discovered field names
      let query = '';
      if (this.fieldMappings.authorityField) {
        if (authorities.length === 1) {
          query = `$filter=${this.fieldMappings.authorityField} eq '${authorities[0]}'`;
        } else {
          const authorityFilters = authorities.map(auth => `${this.fieldMappings.authorityField} eq '${auth}'`);
          query = `$filter=(${authorityFilters.join(' or ')})`;
        }
      }
      if (this.fieldMappings.trackIdField && this.fieldMappings.trackNameField) {
        query += `&$select=${this.fieldMappings.trackIdField},${this.fieldMappings.trackNameField}`;
        if (this.fieldMappings.trackNameField) {
          query += `&$orderby=${this.fieldMappings.trackNameField}`;
        }
      }
      query += '&$top=1000';
      
      const url = `${dataverseConfig.environment}/api/data/${dataverseConfig.apiVersion}/${this.tableName}?${query}`;
      
      // Retry logic for rate limiting
      let retries = 3;
      let response: Response;
      
      while (retries > 0) {
        response = await fetch(url, {
          method: 'GET',
          headers: headers
        });
        
        if (response.status === 429 || response.status === 503) {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        
        break;
      }

      if (!response!.ok) {
        throw new Error(`Error fetching tracks: ${response!.status} ${response!.statusText}`);
      }

      const data = await response!.json();
      const meetings = data.value || [];
      
      // Extract unique tracks using discovered field names
      const trackMap = new Map<string, string>();
      meetings.forEach((meeting: any) => {
        const trackId = meeting[this.fieldMappings.trackIdField] || meeting.cr4cc_track_id || meeting.trackid;
        const trackName = meeting[this.fieldMappings.trackNameField] || meeting.cr4cc_track_name || meeting.trackname;
        if (trackId && trackName) {
          trackMap.set(trackId, trackName);
        }
      });
      
      const tracks: Array<{trackId: string, trackName: string}> = [];
      trackMap.forEach((trackName, trackId) => {
        tracks.push({ trackId, trackName });
      });
      
      return tracks.sort((a, b) => a.trackName.localeCompare(b.trackName));
    } catch (error) {
      Logger.error(`Error in getTracksByAuthorities: ${error}`, 'RaceMeetingService');
      const handledError = ErrorHandler.handleError(error, 'RaceMeetingService.getTracksByAuthorities');
      throw handledError;
    }
  }

  public async getRaceMeetingsByDateRange(startDate: Date, endDate: Date, authorities?: string[], trackIds?: string[]): Promise<IRaceMeeting[]> {
    const filter: IRaceMeetingFilter = {
      startDate,
      endDate,
      authorities,
      trackIds
    };
    
    return this.getRaceMeetings(filter);
  }
}