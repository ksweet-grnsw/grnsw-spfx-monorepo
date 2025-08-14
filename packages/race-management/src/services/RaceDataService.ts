import { HttpClient, HttpClientResponse, IHttpClientOptions, AadHttpClient } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  IMeeting,
  IRace,
  IContestant,
  IMeetingFilters,
  IRaceFilters,
  IContestantFilters,
  ISearchResults,
  IDataverseResponse,
  IDataverseError
} from '../models/IRaceData';
import { dataverseConfig } from './SharedAuthService';

export class RaceDataService {
  private httpClient: HttpClient;
  private context: WebPartContext | null = null;
  private aadClient: AadHttpClient | null = null;
  private dataverseUrl: string;
  private readonly apiVersion = 'v9.1';

  constructor(httpClient: HttpClient, dataverseUrl?: string, context?: WebPartContext) {
    this.httpClient = httpClient;
    this.context = context || null;
    // Use provided URL or fall back to configured URL
    this.dataverseUrl = dataverseUrl || dataverseConfig.apiUrl;
  }

  // Get AAD client for authenticated requests
  private async getAadClient(): Promise<AadHttpClient> {
    if (!this.aadClient && this.context) {
      this.aadClient = await this.context.aadHttpClientFactory.getClient(dataverseConfig.resourceUrl);
    }
    if (!this.aadClient) {
      throw new Error('AAD client not available. Please ensure context is provided.');
    }
    return this.aadClient;
  }

  // HTTP request helper using AAD authentication
  private async makeRequest<T>(url: string): Promise<T> {
    try {
      // Use AAD client if available, otherwise use HttpClient
      if (this.context) {
        const aadClient = await this.getAadClient();
        const response = await aadClient.get(url, AadHttpClient.configurations.v1);
        
        if (!response.ok) {
          const error: IDataverseError = await response.json();
          throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } else {
        // Fallback to HttpClient (less secure, for testing only)
        const options: IHttpClientOptions = {
          headers: {
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8',
            'Prefer': 'odata.include-annotations="*"'
          }
        };
        
        const response: HttpClientResponse = await this.httpClient.get(url, HttpClient.configurations.v1, options);
        
        if (!response.ok) {
          const error: IDataverseError = await response.json();
          throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      }
    } catch (error) {
      console.error('Dataverse API Error:', {
        url,
        error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Build OData filter query
  private buildFilterQuery(filters: Record<string, any>): string {
    const filterParts: string[] = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          filterParts.push(`${key} eq '${value.toISOString()}'`);
        } else if (typeof value === 'string') {
          filterParts.push(`${key} eq '${encodeURIComponent(value)}'`);
        } else if (typeof value === 'number') {
          filterParts.push(`${key} eq ${value}`);
        }
      }
    });
    
    return filterParts.length > 0 ? `$filter=${filterParts.join(' and ')}` : '';
  }

  // Meeting operations
  public async getMeetings(filters?: IMeetingFilters): Promise<IMeeting[]> {
    const filterParts: string[] = [];
    
    if (filters?.dateFrom) {
      filterParts.push(`cr4cc_meetingdate ge '${filters.dateFrom.toISOString()}'`);
    }
    if (filters?.dateTo) {
      filterParts.push(`cr4cc_meetingdate le '${filters.dateTo.toISOString()}'`);
    }
    if (filters?.track) {
      filterParts.push(`cr4cc_trackname eq '${encodeURIComponent(filters.track)}'`);
    }
    if (filters?.authority) {
      filterParts.push(`cr4cc_authority eq '${encodeURIComponent(filters.authority)}'`);
    }
    if (filters?.status) {
      filterParts.push(`cr4cc_status eq '${encodeURIComponent(filters.status)}'`);
    }
    
    const queryParts: string[] = [];
    if (filterParts.length > 0) {
      queryParts.push(`$filter=${filterParts.join(' and ')}`);
    }
    queryParts.push('$orderby=cr4cc_meetingdate desc');
    
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetings?${queryParts.join('&')}`;
    
    const response = await this.makeRequest<IDataverseResponse<IMeeting>>(url);
    // Map cr4cc_trackheld to cr4cc_trackname for UI compatibility
    // No mapping needed - cr4cc_trackname is the actual field
    const meetings = response.value;
    return meetings;
  }

  public async getMeetingById(meetingId: string): Promise<IMeeting> {
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetings(${meetingId})`;
    const meeting = await this.makeRequest<IMeeting>(url);
    // No mapping needed - cr4cc_trackname is the actual field
    return meeting;
  }

  // Race operations
  public async getRacesForMeeting(meetingId: string): Promise<IRace[]> {
    if (!meetingId) {
      console.warn('getRacesForMeeting called with undefined meetingId');
      return [];
    }
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_raceses?$filter=_cr616_meeting_value eq ${meetingId}&$orderby=cr616_racenumber`;
    const response = await this.makeRequest<IDataverseResponse<IRace>>(url);
    return response.value;
  }

  public async getRaces(filters?: IRaceFilters): Promise<IRace[]> {
    const filterParts: string[] = [];
    
    if (filters?.meetingId) {
      filterParts.push(`_cr616_meeting_value eq ${filters.meetingId}`);
    }
    if (filters?.distance) {
      filterParts.push(`cr616_distance eq ${filters.distance}`);
    }
    if (filters?.grading) {
      filterParts.push(`cr616_racegrading eq '${encodeURIComponent(filters.grading)}'`);
    }
    if (filters?.status) {
      filterParts.push(`cr616_status eq '${encodeURIComponent(filters.status)}'`);
    }
    
    const queryParts: string[] = [];
    if (filterParts.length > 0) {
      queryParts.push(`$filter=${filterParts.join(' and ')}`);
    }
    queryParts.push('$expand=cr616_Meeting($select=cr4cc_meetingdate,cr4cc_trackname)');
    queryParts.push('$orderby=cr616_racenumber');
    
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_raceses?${queryParts.join('&')}`;
    
    const response = await this.makeRequest<IDataverseResponse<IRace>>(url);
    return response.value;
  }

  public async getRaceById(raceId: string): Promise<IRace> {
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_raceses(${raceId})?$expand=cr616_Meeting($select=cr4cc_meetingdate,cr4cc_trackname)`;
    return await this.makeRequest<IRace>(url);
  }

  // Contestant operations
  public async getContestantsForRace(raceId: string): Promise<IContestant[]> {
    if (!raceId) {
      console.warn('getContestantsForRace called with undefined raceId');
      return [];
    }
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_contestantses?$filter=_cr616_race_value eq ${raceId}&$orderby=cr616_rugnumber`;
    const response = await this.makeRequest<IDataverseResponse<IContestant>>(url);
    return response.value;
  }

  public async getContestants(filters?: IContestantFilters): Promise<IContestant[]> {
    const filterParts: string[] = [];
    
    if (filters?.raceId) {
      filterParts.push(`_cr616_race_value eq ${filters.raceId}`);
    }
    if (filters?.greyhoundName) {
      filterParts.push(`contains(cr616_greyhoundname,'${encodeURIComponent(filters.greyhoundName)}')`);
    }
    if (filters?.ownerName) {
      filterParts.push(`contains(cr616_ownername,'${encodeURIComponent(filters.ownerName)}')`);
    }
    if (filters?.trainerName) {
      filterParts.push(`contains(cr616_trainername,'${encodeURIComponent(filters.trainerName)}')`);
    }
    if (filters?.status) {
      filterParts.push(`cr616_status eq '${encodeURIComponent(filters.status)}'`);
    }
    
    const queryParts: string[] = [];
    if (filterParts.length > 0) {
      queryParts.push(`$filter=${filterParts.join(' and ')}`);
    }
    queryParts.push('$expand=cr616_Race($select=cr616_racename,cr616_racenumber;$expand=cr616_Meeting($select=cr4cc_meetingdate,cr4cc_trackname))');
    queryParts.push('$orderby=cr616_rugnumber');
    
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_contestantses?${queryParts.join('&')}`;
    
    const response = await this.makeRequest<IDataverseResponse<IContestant>>(url);
    return response.value;
  }

  public async getContestantById(contestantId: string): Promise<IContestant> {
    const expandQuery = '$expand=cr616_Race($select=cr616_racename,cr616_racenumber;$expand=cr616_Meeting($select=cr4cc_meetingdate,cr4cc_trackname))';
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_contestantses(${contestantId})?${expandQuery}`;
    return await this.makeRequest<IContestant>(url);
  }

  // Global search
  public async searchAll(searchTerm: string): Promise<ISearchResults> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return {
        meetings: [],
        races: [],
        contestants: [],
        totalResults: 0
      };
    }

    // Don't encode the search term for contains - just escape single quotes
    const escapedTerm = searchTerm.trim().replace(/'/g, "''");
    
    // Search meetings - using startswith for better compatibility
    const meetingsUrl = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetings?$filter=startswith(cr4cc_trackname,'${escapedTerm}')&$top=10`;
    
    // Search races - using correct table name cr616_raceses (double plural!)
    // Note: Navigation properties in OData are case-sensitive and don't use underscores in expand
    const racesUrl = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_raceses?$filter=startswith(cr616_racename,'${escapedTerm}') or startswith(cr616_racetitle,'${escapedTerm}')&$top=10`;
    
    // Search contestants - using correct table name cr616_contestantses (double plural!)
    const contestantsUrl = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_contestantses?$filter=startswith(cr616_greyhoundname,'${escapedTerm}') or startswith(cr616_ownername,'${escapedTerm}') or startswith(cr616_trainername,'${escapedTerm}')&$top=10`;
    
    console.log('Search URLs:', {
      meetings: meetingsUrl,
      races: racesUrl,
      contestants: contestantsUrl
    });
    
    try {
      // Fetch all results, handling failures individually
      let meetingsResponse: IDataverseResponse<IMeeting> = { value: [] };
      let racesResponse: IDataverseResponse<IRace> = { value: [] };
      let contestantsResponse: IDataverseResponse<IContestant> = { value: [] };
      
      try {
        meetingsResponse = await this.makeRequest<IDataverseResponse<IMeeting>>(meetingsUrl);
      } catch (error) {
        console.error('Meetings search failed:', error);
      }
      
      try {
        racesResponse = await this.makeRequest<IDataverseResponse<IRace>>(racesUrl);
      } catch (error) {
        console.error('Races search failed:', error);
      }
      
      try {
        contestantsResponse = await this.makeRequest<IDataverseResponse<IContestant>>(contestantsUrl);
      } catch (error) {
        console.error('Contestants search failed:', error);
      }
      
      // No mapping needed - cr4cc_trackname is the actual field
      const mappedMeetings = meetingsResponse?.value || [];
      
      // No mapping needed - cr4cc_trackname is the actual field
      const mappedRaces = racesResponse?.value || [];
      
      // No mapping needed - cr4cc_trackname is the actual field
      const mappedContestants = contestantsResponse?.value || [];
      
      console.log('Search results:', {
        meetingsCount: mappedMeetings.length,
        racesCount: mappedRaces.length,
        contestantsCount: mappedContestants.length
      });
      
      const results: ISearchResults = {
        meetings: mappedMeetings,
        races: mappedRaces,
        contestants: mappedContestants,
        totalResults: mappedMeetings.length + mappedRaces.length + mappedContestants.length
      };
      
      return results;
    } catch (error) {
      console.error('Search error details:', {
        error,
        searchTerm,
        urls: {
          meetings: meetingsUrl,
          races: racesUrl,
          contestants: contestantsUrl
        }
      });
      // Re-throw to let the component handle the error
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Test API connectivity and authentication
  public async testApiConnection(): Promise<{success: boolean; message: string; details?: any}> {
    console.log('=== COMPREHENSIVE API DISCOVERY TEST ===');
    const results: any[] = [];
    
    // Test all possible table name combinations
    const tableTests = [
      // Meetings variations
      { name: 'Meetings (cr4cc_racemeetings)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetings?$top=1` },
      { name: 'Meetings (cr4cc_racemeeting)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeeting?$top=1` },
      { name: 'Meetings (cr4cc_meetings)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_meetings?$top=1` },
      { name: 'Meetings (cr4cc_meeting)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_meeting?$top=1` },
      
      // Races variations with cr616 prefix
      { name: 'Races (cr616_races)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_races?$top=1` },
      { name: 'Races (cr616_race)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_race?$top=1` },
      { name: 'Races (cr616_raceses)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_raceses?$top=1` },
      
      // Races variations with cr4cc prefix
      { name: 'Races (cr4cc_races)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_races?$top=1` },
      { name: 'Races (cr4cc_race)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_race?$top=1` },
      
      // Contestants variations with cr616 prefix
      { name: 'Contestants (cr616_contestants)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_contestants?$top=1` },
      { name: 'Contestants (cr616_contestant)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_contestant?$top=1` },
      { name: 'Contestants (cr616_contestantses)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_contestantses?$top=1` },
      
      // Contestants variations with cr4cc prefix
      { name: 'Contestants (cr4cc_contestants)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_contestants?$top=1` },
      { name: 'Contestants (cr4cc_contestant)', url: `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_contestant?$top=1` }
    ];
    
    console.log('Testing', tableTests.length, 'different table name variations...');
    
    for (const test of tableTests) {
      try {
        const response = await this.makeRequest<any>(test.url);
        console.log(`✅ ${test.name}: SUCCESS`, response);
        
        // If successful, try to get field names
        if (response && response.value && response.value.length > 0) {
          const fields = Object.keys(response.value[0]);
          console.log(`   ✅ WORKING TABLE! Fields found:`, fields);
          
          // Check specifically for track field variations
          const trackFields = fields.filter(f => f.includes('track'));
          if (trackFields.length > 0) {
            console.log(`   📍 Track-related fields:`, trackFields);
          }
          
          results.push({ 
            name: test.name, 
            success: true, 
            url: test.url,
            fields: fields.slice(0, 15), // First 15 fields
            trackFields: trackFields
          });
        } else {
          results.push({ name: test.name, success: true, url: test.url, empty: true });
        }
      } catch (error) {
        console.error(`❌ ${test.name}: FAILED`, error);
        results.push({ 
          name: test.name, 
          success: false, 
          url: test.url, 
          error: error instanceof Error ? error.message : error 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    return {
      success: successCount > 0,
      message: `API test: ${successCount}/${results.length} tests passed. Check console for details.`,
      details: results
    };
  }

  // Get all unique tracks
  public async getTracks(): Promise<string[]> {
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetings?$select=cr4cc_trackname&$filter=cr4cc_trackname ne null&$orderby=cr4cc_trackname`;
    const response = await this.makeRequest<IDataverseResponse<{cr4cc_trackname: string}>>(url);
    
    const tracks = new Set<string>();
    response.value.forEach(item => {
      if (item.cr4cc_trackname) {
        tracks.add(item.cr4cc_trackname);
      }
    });
    
    return Array.from(tracks).sort();
  }

  // Get all unique authorities
  public async getAuthorities(): Promise<string[]> {
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetings?$select=cr4cc_authority&$filter=cr4cc_authority ne null&$orderby=cr4cc_authority`;
    const response = await this.makeRequest<IDataverseResponse<{cr4cc_authority: string}>>(url);
    
    const authorities = new Set<string>();
    response.value.forEach(item => {
      if (item.cr4cc_authority) {
        authorities.add(item.cr4cc_authority);
      }
    });
    
    return Array.from(authorities).sort();
  }
}