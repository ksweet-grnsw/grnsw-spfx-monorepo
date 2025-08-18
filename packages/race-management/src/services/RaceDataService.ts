import { HttpClient, HttpClientResponse, IHttpClientOptions, AadHttpClient } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  IMeeting,
  IRace,
  IContestant,
  IGreyhound,
  IHealthCheck,
  IMeetingFilters,
  IRaceFilters,
  IContestantFilters,
  ISearchResults,
  IDataverseResponse,
  IDataverseError
} from '../models/IRaceData';
import { dataverseConfig } from './SharedAuthService';
import { cacheService } from './CacheService';

export class RaceDataService {
  private httpClient: HttpClient;
  private context: WebPartContext | null = null;
  private aadClient: AadHttpClient | null = null;
  private injuryAadClient: AadHttpClient | null = null;
  private dataverseUrl: string;
  private readonly injuryDataverseUrl = 'https://orgfc8a11f1.crm6.dynamics.com';
  private readonly apiVersion = 'v9.1';

  constructor(httpClient: HttpClient, dataverseUrl?: string, context?: WebPartContext) {
    this.httpClient = httpClient;
    this.context = context || null;
    // Use provided URL or fall back to configured URL
    this.dataverseUrl = dataverseUrl || dataverseConfig.apiUrl;
    
    // Log the configuration for debugging
    console.log('RaceDataService initialized with:', {
      dataverseUrl: this.dataverseUrl,
      hasContext: !!this.context,
      hasHttpClient: !!this.httpClient
    });
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

  // Get AAD client for Injury Data environment
  private async getInjuryAadClient(): Promise<AadHttpClient> {
    if (!this.injuryAadClient && this.context) {
      this.injuryAadClient = await this.context.aadHttpClientFactory.getClient(this.injuryDataverseUrl);
    }
    if (!this.injuryAadClient) {
      throw new Error('Injury AAD client not available. Please ensure context is provided.');
    }
    return this.injuryAadClient;
  }

  // HTTP request helper using AAD authentication
  private async makeRequest<T>(url: string, useInjuryEnvironment: boolean = false): Promise<T> {
    try {
      // Use AAD client if available, otherwise use HttpClient
      if (this.context) {
        const aadClient = useInjuryEnvironment ? await this.getInjuryAadClient() : await this.getAadClient();
        const response = await aadClient.get(url, AadHttpClient.configurations.v1);
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorText = await response.text();
            if (errorText) {
              const error: IDataverseError = JSON.parse(errorText);
              errorMessage = error.error?.message || errorMessage;
            }
          } catch {
            // If we can't parse the error, use the default message
          }
          throw new Error(errorMessage);
        }
        
        const responseText = await response.text();
        if (!responseText) {
          // Return empty array for collection endpoints
          if (url.includes('$') || url.includes('?')) {
            return { value: [] } as unknown as T;
          }
          return {} as T;
        }
        
        try {
          return JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response:', responseText);
          throw new Error('Invalid JSON response from server');
        }
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
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorText = await response.text();
            if (errorText) {
              const error: IDataverseError = JSON.parse(errorText);
              errorMessage = error.error?.message || errorMessage;
            }
          } catch {
            // If we can't parse the error, use the default message
          }
          throw new Error(errorMessage);
        }
        
        const responseText = await response.text();
        if (!responseText) {
          // Return empty array for collection endpoints
          if (url.includes('$') || url.includes('?')) {
            return { value: [] } as unknown as T;
          }
          return {} as T;
        }
        
        try {
          return JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response:', responseText);
          throw new Error('Invalid JSON response from server');
        }
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
    // Create a cache key based on filters
    const cacheKey = `meetings_${JSON.stringify(filters || {})}`;
    
    // Try to get from cache with stale-while-revalidate
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        const filterParts: string[] = [];
        
        if (filters?.dateFrom) {
          filterParts.push(`cr4cc_meetingdate ge '${filters.dateFrom.toISOString()}'`);
        }
        if (filters?.dateTo) {
          filterParts.push(`cr4cc_meetingdate le '${filters.dateTo.toISOString()}'`);
        }
        if (filters?.track) {
          // Handle both "Wentworth" and "Wentworth Park" when filtering
          if (filters.track === 'Wentworth Park') {
            filterParts.push(`(cr4cc_trackname eq 'Wentworth Park' or cr4cc_trackname eq 'Wentworth')`);
          } else {
            filterParts.push(`cr4cc_trackname eq '${encodeURIComponent(filters.track)}'`);
          }
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
        
        console.log('Fetching meetings from URL:', url);
        const response = await this.makeRequest<IDataverseResponse<IMeeting>>(url);
        console.log('Meetings response:', response);
        
        // Normalize track names - combine "Wentworth" and "Wentworth Park"
        const meetings = (response.value || []).map(meeting => ({
          ...meeting,
          cr4cc_trackname: meeting.cr4cc_trackname === 'Wentworth' ? 'Wentworth Park' : meeting.cr4cc_trackname
        }));
        console.log(`Returning ${meetings.length} meetings`);
        return meetings;
      },
      {
        storage: 'session',
        staleWhileRevalidate: true
      }
    );
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
    
    const cacheKey = `races_meeting_${meetingId}`;
    
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_raceses?$filter=_cr616_meeting_value eq ${meetingId}&$orderby=cr616_racenumber`;
        const response = await this.makeRequest<IDataverseResponse<IRace>>(url);
        return response.value;
      },
      {
        storage: 'session',
        staleWhileRevalidate: true
      }
    );
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
    
    const cacheKey = `contestants_race_v2_${raceId}`; // Changed cache key to force refresh
    
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        // Explicitly select all fields we need including placement, margin, and weight
        const selectFields = [
          'cr616_contestantsid',
          'cr616_rugnumber',
          'cr616_greyhoundname',
          'cr616_ownername',
          'cr616_trainername',
          'cr616_doggrade',
          'cr616_placement',
          'cr616_margin',
          'cr616_weight',
          'cr616_status',
          'cr616_finishtime',
          'cr616_dayssincelastrace',
          'cr616_totalnumberofwinds',
          'cr616_failedtofinish',
          'cr616_racewithin2days',
          'cr616_prizemoney',
          '_cr616_race_value',
          '_cr616_meeting_value'
        ].join(',');
        
        const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_contestantses?$select=${selectFields}&$filter=_cr616_race_value eq ${raceId}&$orderby=cr616_rugnumber`;
        const response = await this.makeRequest<IDataverseResponse<IContestant>>(url);
        return response.value;
      },
      {
        storage: 'session',
        staleWhileRevalidate: true
      }
    );
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
    
    // Create cache key for search
    const cacheKey = `search_${searchTerm.toLowerCase().trim()}`;
    
    return cacheService.getOrFetch(
      cacheKey,
      async () => {

    // Don't encode the search term for contains - just escape single quotes
    const escapedTerm = searchTerm.trim().replace(/'/g, "''");
    
    // Search meetings - include Salesforce ID search
    const meetingsUrl = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetings?$filter=startswith(cr4cc_trackname,'${escapedTerm}') or contains(cr4cc_salesforceid,'${escapedTerm}')&$top=10`;
    
    // Search races - include Salesforce ID search
    const racesUrl = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_raceses?$filter=startswith(cr616_racename,'${escapedTerm}') or startswith(cr616_racetitle,'${escapedTerm}') or contains(cr616_sfraceid,'${escapedTerm}')&$top=10`;
    
    // Search contestants - include Salesforce ID search
    const contestantsUrl = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_contestantses?$filter=startswith(cr616_greyhoundname,'${escapedTerm}') or startswith(cr616_ownername,'${escapedTerm}') or startswith(cr616_trainername,'${escapedTerm}') or contains(cr616_sfcontestantid,'${escapedTerm}')&$top=10`;
    
    // Search greyhounds in Injury Data environment - include microchip and Salesforce ID
    const greyhoundsUrl = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_greyhounds?$filter=startswith(cra5e_name,'${escapedTerm}') or contains(cra5e_microchip,'${escapedTerm}') or contains(cra5e_sfid,'${escapedTerm}')&$top=10`;
    
    console.log('Search URLs:', {
      meetings: meetingsUrl,
      races: racesUrl,
      contestants: contestantsUrl,
      greyhounds: greyhoundsUrl
    });
    
    try {
      // Fetch all results, handling failures individually
      let meetingsResponse: IDataverseResponse<IMeeting> = { value: [] };
      let racesResponse: IDataverseResponse<IRace> = { value: [] };
      let contestantsResponse: IDataverseResponse<IContestant> = { value: [] };
      let greyhoundsResponse: IDataverseResponse<IGreyhound> = { value: [] };
      
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
      
      try {
        greyhoundsResponse = await this.makeRequest<IDataverseResponse<IGreyhound>>(greyhoundsUrl, true);
      } catch (error) {
        console.error('Greyhounds search failed:', error);
      }
      
      // No mapping needed - cr4cc_trackname is the actual field
      const mappedMeetings = meetingsResponse?.value || [];
      
      // No mapping needed - cr4cc_trackname is the actual field
      const mappedRaces = racesResponse?.value || [];
      
      // No mapping needed - cr4cc_trackname is the actual field
      const mappedContestants = contestantsResponse?.value || [];
      
      // Greyhounds from injury environment
      const mappedGreyhounds = greyhoundsResponse?.value || [];
      
      console.log('Search results:', {
        meetingsCount: mappedMeetings.length,
        racesCount: mappedRaces.length,
        contestantsCount: mappedContestants.length,
        greyhoundsCount: mappedGreyhounds.length
      });
      
      const results: ISearchResults = {
        meetings: mappedMeetings,
        races: mappedRaces,
        contestants: mappedContestants,
        greyhounds: mappedGreyhounds,
        totalResults: mappedMeetings.length + mappedRaces.length + mappedContestants.length + mappedGreyhounds.length
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
      },
      {
        storage: 'session',
        ttl: 10 * 60 * 1000 // 10 minutes for search results
      }
    );
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

  // Greyhound operations (Injury Data environment)
  public async getGreyhoundByName(greyhoundName: string, earBrand?: string): Promise<IGreyhound | null> {
    if (!greyhoundName) return null;
    
    try {
      // Build filter based on name and optionally ear brand
      const filters: string[] = [];
      filters.push(`cra5e_name eq '${encodeURIComponent(greyhoundName)}'`);
      
      if (earBrand) {
        // Check both left and right ear brands
        filters.push(`(cra5e_leftearbrand eq '${encodeURIComponent(earBrand)}' or cra5e_rightearbrand eq '${encodeURIComponent(earBrand)}')`);  
      }
      
      const url = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_greyhounds?$filter=${filters.join(' and ')}&$top=1`;
      const response = await this.makeRequest<IDataverseResponse<IGreyhound>>(url, true);
      
      return response.value.length > 0 ? response.value[0] : null;
    } catch (error) {
      console.error('Error fetching greyhound:', error);
      return null;
    }
  }

  public async getGreyhoundById(greyhoundId: string): Promise<IGreyhound | null> {
    if (!greyhoundId) return null;
    
    try {
      const url = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_greyhounds(${greyhoundId})`;
      return await this.makeRequest<IGreyhound>(url, true);
    } catch (error) {
      console.error('Error fetching greyhound by ID:', error);
      return null;
    }
  }

  public async getGreyhoundBySireOrDam(sireOrDamName: string): Promise<IGreyhound | null> {
    if (!sireOrDamName) return null;
    
    try {
      // Search for a greyhound by exact name match
      const url = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_greyhounds?$filter=cra5e_name eq '${encodeURIComponent(sireOrDamName)}'&$top=1`;
      const response = await this.makeRequest<IDataverseResponse<IGreyhound>>(url, true);
      return response.value.length > 0 ? response.value[0] : null;
    } catch (error) {
      console.error('Error fetching parent greyhound:', error);
      return null;
    }
  }

  // Health Check operations (Injury Data environment)
  public async getHealthChecksForGreyhound(greyhoundId: string): Promise<IHealthCheck[]> {
    if (!greyhoundId) return [];
    
    try {
      // Get health checks for this greyhound, ordered by date
      const url = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$filter=_cra5e_greyhound_value eq ${greyhoundId}&$orderby=cra5e_datechecked desc&$top=50`;
      const response = await this.makeRequest<IDataverseResponse<IHealthCheck>>(url, true);
      return response.value;
    } catch (error) {
      console.error('Error fetching health checks:', error);
      return [];
    }
  }

  public async getLatestHealthCheckForGreyhound(greyhoundId: string, greyhoundName?: string): Promise<IHealthCheck | null> {
    if (!greyhoundId) return null;
    
    try {
      // APPROACH 1: Try lookup field with expand (ideal case)
      console.log(`Trying lookup field approach for greyhound ID: ${greyhoundId}`);
      const url = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$filter=_cra5e_greyhound_value eq ${greyhoundId} and cra5e_injuryclassification ne null&$expand=cra5e_ExaminingVet($select=cra5e_name,fullname)&$orderby=cra5e_datechecked desc&$top=1`;
      const response = await this.makeRequest<IDataverseResponse<any>>(url, true);
      if (response.value.length > 0) {
        console.log(`✅ Found health check via lookup field for: ${greyhoundName || greyhoundId}`);
        const healthCheck = response.value[0];
        // If the examining vet was expanded, use the name
        if (healthCheck.cra5e_ExaminingVet) {
          healthCheck.cra5e_examiningvet = healthCheck.cra5e_ExaminingVet.cra5e_name || 
                                           healthCheck.cra5e_ExaminingVet.fullname || 
                                           healthCheck.cra5e_examiningvet;
        }
        return healthCheck as IHealthCheck;
      }
      console.log(`❌ No results via lookup field for: ${greyhoundName || greyhoundId} - likely lookup field not populated`);
    } catch (error) {
      console.log('❌ Lookup field approach failed:', error.message);
    }

    try {
      // APPROACH 2: Try lookup field without expand
      console.log(`Trying lookup field without expand for: ${greyhoundName || greyhoundId}`);
      const fallbackUrl = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$filter=_cra5e_greyhound_value eq ${greyhoundId} and cra5e_injuryclassification ne null&$orderby=cra5e_datechecked desc&$top=1`;
      const fallbackResponse = await this.makeRequest<IDataverseResponse<IHealthCheck>>(fallbackUrl, true);
      if (fallbackResponse.value.length > 0) {
        console.log(`✅ Found health check via lookup field (no expand) for: ${greyhoundName || greyhoundId}`);
        return fallbackResponse.value[0];
      }
      console.log(`❌ No results via lookup field (no expand) for: ${greyhoundName || greyhoundId} - lookup field not populated`);
    } catch (fallbackError) {
      console.log('❌ Lookup field fallback failed:', fallbackError.message);
    }

    // APPROACH 3: Name matching is not possible
    // The health check table only has a lookup field (cra5e_greyhound) to the greyhound table,
    // not the greyhound name stored directly. Name matching cannot work.
    console.log(`ℹ️  Injury detection summary for ${greyhoundName || greyhoundId}:`);
    console.log(`   - Lookup field exists: cra5e_greyhound`);
    console.log(`   - Lookup field populated: NO (this is the issue)`);
    console.log(`   - Name matching possible: NO (health check table doesn't store greyhound names)`);
    console.log(`   - Solution: Populate the cra5e_greyhound lookup field in health check records`);

    console.log(`❌ No health check found for greyhound: ${greyhoundName || greyhoundId}`);
    return null;
  }

  /**
   * Get injury data for analytics dashboard
   */
  public async getInjuryData(options?: {
    dateFrom?: Date;
    dateTo?: Date;
    track?: string;
    categories?: string[];
  }): Promise<IHealthCheck[]> {
    const cacheKey = `injury_data_${JSON.stringify(options)}`;
    
    // Clear cache for testing
    if (options && Object.keys(options).length === 0) {
      cacheService.clear();
    }
    
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        try {
          console.log('RaceDataService.getInjuryData: Starting fetch with options:', options);
          
          // First, let's test if the table exists and what it's called
          console.log('Testing table names...');
          
          // Try both possible table names
          const tableNames = ['cra5e_heathchecks', 'cra5e_healthchecks'];
          let workingTableName = '';
          
          for (const tableName of tableNames) {
            try {
              const testUrl = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/${tableName}?$top=1`;
              console.log(`Testing table: ${tableName} at ${testUrl}`);
              const testResponse = await this.makeRequest<IDataverseResponse<IHealthCheck>>(testUrl, true);
              console.log(`✅ Table ${tableName} exists! Found ${testResponse.value?.length || 0} records in test`);
              workingTableName = tableName;
              break;
            } catch (testError) {
              console.log(`❌ Table ${tableName} failed:`, testError);
            }
          }
          
          if (!workingTableName) {
            console.error('Could not find health check table with either name!');
            // Try to get any data to see what's available
            try {
              const anyDataUrl = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/`;
              console.log('Trying to get API root:', anyDataUrl);
              const rootResponse = await this.makeRequest<any>(anyDataUrl, true);
              console.log('API root response:', rootResponse);
            } catch (rootError) {
              console.error('Could not access API root:', rootError);
            }
            return [];
          }
          
          // Now build the actual query with the working table name
          let filter = '';
          const filters: string[] = [];
          
          // TEMPORARILY REMOVE ALL FILTERS to see if we can get ANY data
          // We'll filter in memory instead
          console.log('REMOVING ALL API FILTERS - will filter in memory');
          
          // Store filter criteria for in-memory filtering
          const filterCriteria = {
            dateFrom: options?.dateFrom,
            dateTo: options?.dateTo,
            track: options?.track,
            categories: options?.categories
          };
          
          // Build URL - if no filters, don't add filter parameter
          let url = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/${workingTableName}`;
          if (filters.length > 0) {
            filter = filters.join(' and ');
            url += `?$filter=${filter}&$orderby=cra5e_datechecked desc&$top=5000`;
          } else {
            // No filters - just get top 1000 records
            url += `?$orderby=cra5e_datechecked desc&$top=1000`;
          }
          
          console.log('RaceDataService.getInjuryData: Final request URL:', url);
          
          const response = await this.makeRequest<IDataverseResponse<IHealthCheck>>(url, true);
          
          console.log('RaceDataService.getInjuryData: Response received, record count:', response.value?.length || 0);
          if (response.value && response.value.length > 0) {
            console.log('First 3 records:', response.value.slice(0, 3));
            
            // Filter in memory based on criteria
            let filteredRecords = response.value;
            
            // Filter by injury status
            filteredRecords = filteredRecords.filter(r => 
              r.cra5e_injuryclassification || r.cra5e_injured === true
            );
            console.log(`After injury filter: ${filteredRecords.length} records`);
            
            // Filter by date if specified
            if (filterCriteria.dateFrom) {
              filteredRecords = filteredRecords.filter(r => {
                if (!r.cra5e_datechecked) return false;
                const recordDate = new Date(r.cra5e_datechecked);
                return recordDate >= filterCriteria.dateFrom;
              });
              console.log(`After dateFrom filter: ${filteredRecords.length} records`);
            }
            
            if (filterCriteria.dateTo) {
              filteredRecords = filteredRecords.filter(r => {
                if (!r.cra5e_datechecked) return false;
                const recordDate = new Date(r.cra5e_datechecked);
                return recordDate <= filterCriteria.dateTo;
              });
              console.log(`After dateTo filter: ${filteredRecords.length} records`);
            }
            
            // Filter by track if specified
            if (filterCriteria.track && filterCriteria.track !== '') {
              filteredRecords = filteredRecords.filter(r => 
                r.cra5e_trackname === filterCriteria.track
              );
              console.log(`After track filter: ${filteredRecords.length} records`);
            }
            
            // Filter by categories if specified
            if (filterCriteria.categories && filterCriteria.categories.length > 0) {
              filteredRecords = filteredRecords.filter(r => 
                filterCriteria.categories.indexOf(r.cra5e_injuryclassification) !== -1
              );
              console.log(`After categories filter: ${filteredRecords.length} records`);
            }
            
            console.log(`Final filtered count: ${filteredRecords.length} records`);
            return filteredRecords;
          }
          
          return [];
        } catch (error) {
          console.error('RaceDataService.getInjuryData: Error fetching injury data:', error);
          // Try without any filters to see if we can get ANY data
          try {
            console.log('Attempting to get ANY health check data without filters...');
            const anyUrl = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$top=100`;
            const anyResponse = await this.makeRequest<IDataverseResponse<IHealthCheck>>(anyUrl, true);
            console.log('Got data without filters:', anyResponse.value?.length || 0, 'records');
            if (anyResponse.value && anyResponse.value.length > 0) {
              console.log('Sample unfiltered record:', anyResponse.value[0]);
              // Filter the results in memory to get injured records
              const injuredRecords = anyResponse.value.filter(r => 
                r.cra5e_injuryclassification || r.cra5e_injured
              );
              console.log('Records with injuries after filtering in memory:', injuredRecords.length);
              if (injuredRecords.length > 0) {
                console.log('Returning filtered injury records from unfiltered query');
                return injuredRecords;
              }
            }
          } catch (anyError) {
            console.error('Could not get any health check data:', anyError);
          }
          return [];
        }
      },
      { storage: 'session', ttl: 10 * 60 * 1000 } // Cache for 10 minutes
    );
  }
  
  // Sample data for testing when API fails
  private getSampleInjuryData(): IHealthCheck[] {
    const tracks = ['Wentworth Park', 'The Gardens', 'Richmond', 'Gosford', 'Maitland'];
    const categories = ['Cat A', 'Cat B', 'Cat C', 'Cat D', 'Cat E'];
    const sampleData: IHealthCheck[] = [];
    
    // Generate sample data for last 6 months
    const now = new Date();
    for (let i = 0; i < 100; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 180));
      
      sampleData.push({
        cra5e_heathcheckid: `sample-${i}`,
        cra5e_datechecked: date.toISOString(),
        cra5e_injured: true,
        cra5e_injuryclassification: categories[Math.floor(Math.random() * categories.length)],
        cra5e_trackname: tracks[Math.floor(Math.random() * tracks.length)],
        cra5e_standdowndays: Math.floor(Math.random() * 30),
        cra5e_injurytype: 'Sample Injury',
        cra5e_injurynote: 'Sample injury note for testing',
        cra5e_greyhound: `greyhound-${Math.floor(Math.random() * 100)}`
      } as unknown as IHealthCheck);
    }
    
    return sampleData;
  }

  public async getHealthCheckById(healthCheckId: string): Promise<IHealthCheck | null> {
    if (!healthCheckId) return null;
    
    try {
      const url = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks(${healthCheckId})`;
      return await this.makeRequest<IHealthCheck>(url, true);
    } catch (error) {
      console.error('Error fetching health check by ID:', error);
      return null;
    }
  }

  // Check if a greyhound has any injuries
  public async hasInjuries(greyhoundId: string): Promise<boolean> {
    if (!greyhoundId) return false;
    
    try {
      // Check if there are any health checks with injury classifications
      const url = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$filter=_cra5e_greyhound_value eq ${greyhoundId} and cra5e_injuryclassification ne null&$count=true&$top=1`;
      const response = await this.makeRequest<IDataverseResponse<IHealthCheck>>(url, true);
      return response['@odata.count'] ? response['@odata.count'] > 0 : response.value.length > 0;
    } catch (error) {
      console.error('Error checking injuries:', error);
      return false;
    }
  }

  // Get meetings with injuries
  public async getMeetingsWithInjuries(injuryCategories: string[] = ['Cat D', 'Cat E']): Promise<IMeeting[]> {
    try {
      console.log('getMeetingsWithInjuries called with categories:', injuryCategories);
      
      // If no categories selected, return empty array
      if (!injuryCategories || injuryCategories.length === 0) {
        console.log('No injury categories selected, returning empty array');
        return [];
      }
      
      // Build filter for injury categories - don't use cra5e_injured since it's not reliable
      const categoryFilter = `(${injuryCategories.map(cat => `cra5e_injuryclassification eq '${encodeURIComponent(cat)}'`).join(' or ')})`;
      
      // Get all health checks with injuries in the specified categories
      const healthChecksUrl = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$filter=${categoryFilter}&$select=cra5e_trackname,cra5e_datechecked,cra5e_injuryclassification&$top=1000`;
      console.log('Health checks URL:', healthChecksUrl);
      
      const healthChecksResponse = await this.makeRequest<IDataverseResponse<IHealthCheck>>(healthChecksUrl, true);
      
      console.log('Health checks response:', healthChecksResponse);
      
      if (!healthChecksResponse.value || healthChecksResponse.value.length === 0) {
        console.log('No health checks found with injuries');
        return [];
      }
      
      console.log(`Found ${healthChecksResponse.value.length} health checks with injuries`);
      
      // Extract unique track names and dates
      const meetingKeys = new Set<string>();
      const trackDates = new Map<string, Set<string>>();
      
      healthChecksResponse.value.forEach(hc => {
        if (hc.cra5e_trackname && hc.cra5e_datechecked) {
          const date = new Date(hc.cra5e_datechecked);
          const dateStr = date.toISOString().split('T')[0];
          const key = `${hc.cra5e_trackname}_${dateStr}`;
          meetingKeys.add(key);
          
          if (!trackDates.has(hc.cra5e_trackname)) {
            trackDates.set(hc.cra5e_trackname, new Set());
          }
          trackDates.get(hc.cra5e_trackname)!.add(dateStr);
        }
      });
      
      console.log('Unique track/date combinations found:', Array.from(meetingKeys));
      
      // Now fetch meetings that match these track/date combinations
      const meetings: IMeeting[] = [];
      
      for (const [track, dates] of Array.from(trackDates.entries())) {
        for (const dateStr of Array.from(dates)) {
          // Query meetings for this track and date - use date-only filtering
          const startDate = new Date(dateStr + 'T00:00:00.000Z');
          const endDate = new Date(dateStr + 'T23:59:59.999Z');
          
          console.log(`Querying meetings for ${track} on ${dateStr} between ${startDate.toISOString()} and ${endDate.toISOString()}`);
          
          const meetingUrl = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetings?$filter=cr4cc_trackname eq '${encodeURIComponent(track)}' and cr4cc_meetingdate ge '${startDate.toISOString()}' and cr4cc_meetingdate le '${endDate.toISOString()}'`;
          
          try {
            const meetingResponse = await this.makeRequest<IDataverseResponse<IMeeting>>(meetingUrl);
            console.log(`Found ${meetingResponse.value.length} meetings for ${track} on ${dateStr}:`, 
              meetingResponse.value.map(m => ({ 
                id: m.cr4cc_racemeetingid, 
                date: m.cr4cc_meetingdate, 
                timeslot: m.cr4cc_timeslot,
                type: m.cr4cc_type || m.cr4cc_meetingtype,
                authority: m.cr4cc_authority
              })));
            meetings.push(...meetingResponse.value);
          } catch (error) {
            console.error(`Error fetching meetings for ${track} on ${dateStr}:`, error);
          }
        }
      }
      
      // Enhanced deduplication: first by ID, then by track+date+timeslot for logical duplicates
      const uniqueMeetingsById = new Map<string, IMeeting>();
      meetings.forEach(meeting => {
        uniqueMeetingsById.set(meeting.cr4cc_racemeetingid, meeting);
      });
      
      // Second pass: deduplicate by business logic (track + date + timeslot)
      const uniqueMeetingsByLogic = new Map<string, IMeeting>();
      Array.from(uniqueMeetingsById.values()).forEach(meeting => {
        const meetingDate = new Date(meeting.cr4cc_meetingdate);
        const dateStr = meetingDate.toISOString().split('T')[0];
        const logicalKey = `${meeting.cr4cc_trackname}_${dateStr}_${meeting.cr4cc_timeslot || 'unknown'}`;
        
        // Keep the first meeting found for each logical combination
        if (!uniqueMeetingsByLogic.has(logicalKey)) {
          uniqueMeetingsByLogic.set(logicalKey, meeting);
        } else {
          console.log(`⚠️  Logical duplicate detected and removed:`, {
            existing: uniqueMeetingsByLogic.get(logicalKey)?.cr4cc_racemeetingid,
            duplicate: meeting.cr4cc_racemeetingid,
            key: logicalKey
          });
        }
      });
      
      // Convert back to array and sort by date descending
      const deduplicatedMeetings = Array.from(uniqueMeetingsByLogic.values());
      deduplicatedMeetings.sort((a, b) => {
        const dateA = new Date(a.cr4cc_meetingdate);
        const dateB = new Date(b.cr4cc_meetingdate);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log(`📊 Deduplication stats:`);
      console.log(`- Total meetings fetched: ${meetings.length}`);
      console.log(`- Unique by ID: ${uniqueMeetingsById.size}`);
      console.log(`- Unique by logic (track+date+timeslot): ${deduplicatedMeetings.length}`);
      console.log(`- Final meeting IDs:`, deduplicatedMeetings.map(m => m.cr4cc_racemeetingid));
      return deduplicatedMeetings;
    } catch (error) {
      console.error('Error fetching meetings with injuries:', error);
      return [];
    }
  }

  // Get injury summary for a meeting
  public async getInjurySummaryForMeeting(trackName: string, meetingDate: string | Date): Promise<{total: number; byCategory: Record<string, number>}> {
    try {
      const date = new Date(meetingDate);
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Get health checks for this track and date - check for classification instead of injured flag
      const url = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$filter=cra5e_trackname eq '${encodeURIComponent(trackName)}' and cra5e_datechecked ge '${startDate.toISOString()}' and cra5e_datechecked le '${endDate.toISOString()}' and cra5e_injuryclassification ne null&$select=cra5e_injuryclassification`;
      
      const response = await this.makeRequest<IDataverseResponse<IHealthCheck>>(url, true);
      
      const byCategory: Record<string, number> = {};
      response.value.forEach(hc => {
        const category = hc.cra5e_injuryclassification || 'Unknown';
        byCategory[category] = (byCategory[category] || 0) + 1;
      });
      
      return {
        total: response.value.length,
        byCategory
      };
    } catch (error) {
      console.error('Error fetching injury summary:', error);
      return { total: 0, byCategory: {} };
    }
  }

  // Get injuries for a specific race
  public async getInjuriesForRace(trackName: string, raceDate: string | Date, raceNumber: number): Promise<IHealthCheck[]> {
    try {
      const date = new Date(raceDate);
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      const url = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$filter=cra5e_trackname eq '${encodeURIComponent(trackName)}' and cra5e_datechecked ge '${startDate.toISOString()}' and cra5e_datechecked le '${endDate.toISOString()}' and cra5e_racenumber eq ${raceNumber} and cra5e_injuryclassification ne null`;
      
      const response = await this.makeRequest<IDataverseResponse<IHealthCheck>>(url, true);
      return response.value;
    } catch (error) {
      console.error('Error fetching race injuries:', error);
      return [];
    }
  }

  // Test health check data availability and cross-reference with meetings
  public async testHealthCheckData(): Promise<void> {
    try {
      console.log('=== COMPREHENSIVE HEALTH CHECK DATA TEST ===');
      
      // First, check if there's ANY health check data at all
      console.log('\n📊 Test 0 - Checking if ANY health check data exists:');
      const allHealthChecksUrl = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$select=cra5e_heathcheckid,cra5e_injured,cra5e_injuryclassification,cra5e_trackname,cra5e_datechecked&$top=100`;
      console.log('Getting all health checks:', allHealthChecksUrl);
      const allHealthChecks = await this.makeRequest<IDataverseResponse<IHealthCheck>>(allHealthChecksUrl, true);
      console.log(`Total health checks found: ${allHealthChecks.value?.length || 0}`);
      
      if (allHealthChecks.value && allHealthChecks.value.length > 0) {
        // Count injured vs not injured
        let injuredCount = 0;
        let notInjuredCount = 0;
        let nullInjuredCount = 0;
        const injuryClassifications = new Map<string, number>();
        
        allHealthChecks.value.forEach(hc => {
          if (hc.cra5e_injured === true) {
            injuredCount++;
          } else if (hc.cra5e_injured === false) {
            notInjuredCount++;
          } else {
            nullInjuredCount++;
          }
          
          if (hc.cra5e_injuryclassification) {
            injuryClassifications.set(hc.cra5e_injuryclassification, 
              (injuryClassifications.get(hc.cra5e_injuryclassification) || 0) + 1);
          }
        });
        
        console.log(`  - Injured: ${injuredCount}`);
        console.log(`  - Not Injured: ${notInjuredCount}`);
        console.log(`  - Null/Undefined: ${nullInjuredCount}`);
        const classificationObj: Record<string, number> = {};
        injuryClassifications.forEach((value, key) => {
          classificationObj[key] = value;
        });
        console.log(`  - Classifications found:`, classificationObj);
        
        // Show first 5 records for debugging
        console.log('\n  First 5 records for analysis:');
        allHealthChecks.value.slice(0, 5).forEach((hc, i) => {
          console.log(`  ${i + 1}. ID: ${hc.cra5e_heathcheckid}, Injured: ${hc.cra5e_injured}, Classification: ${hc.cra5e_injuryclassification}, Track: ${hc.cra5e_trackname}, Date: ${hc.cra5e_datechecked}`);
        });
      }
      
      // Test 1: Get health checks with injuries and track/date info
      console.log('\n🔍 Test 1 - Getting injured health checks:');
      const injuredWithDetailsUrl = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$filter=cra5e_injured eq true&$select=cra5e_trackname,cra5e_datechecked,cra5e_injuryclassification,cra5e_racenumber,cra5e_injured&$top=20`;
      console.log('Query URL:', injuredWithDetailsUrl);
      const injuredResponse = await this.makeRequest<IDataverseResponse<IHealthCheck>>(injuredWithDetailsUrl, true);
      console.log(`Found ${injuredResponse.value?.length || 0} injured health checks`);
      
      if (injuredResponse.value && injuredResponse.value.length > 0) {
        // Group by track and date
        const trackDateMap = new Map<string, Set<string>>();
        injuredResponse.value.forEach(hc => {
          console.log('Health check:', {
            track: hc.cra5e_trackname,
            date: hc.cra5e_datechecked,
            classification: hc.cra5e_injuryclassification,
            raceNumber: hc.cra5e_racenumber
          });
          
          if (hc.cra5e_trackname && hc.cra5e_datechecked) {
            const date = new Date(hc.cra5e_datechecked).toISOString().split('T')[0];
            const key = `${hc.cra5e_trackname}_${date}`;
            if (!trackDateMap.has(hc.cra5e_trackname)) {
              trackDateMap.set(hc.cra5e_trackname, new Set());
            }
            trackDateMap.get(hc.cra5e_trackname)!.add(date);
          }
        });
        
        console.log('Unique tracks with injuries:', Array.from(trackDateMap.keys()));
        
        // Test 2: Try to find corresponding meetings
        console.log('\nTest 2 - Cross-referencing with meetings:');
        for (const [track, dates] of Array.from(trackDateMap.entries())) {
          console.log(`\nChecking meetings for ${track}:`);
          for (const dateStr of Array.from(dates)) {
            const startDate = new Date(dateStr);
            const endDate = new Date(dateStr);
            endDate.setDate(endDate.getDate() + 1);
            
            const meetingUrl = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetings?$filter=cr4cc_trackname eq '${encodeURIComponent(track)}' and cr4cc_meetingdate ge '${startDate.toISOString()}' and cr4cc_meetingdate lt '${endDate.toISOString()}'&$select=cr4cc_racemeetingid,cr4cc_trackname,cr4cc_meetingdate`;
            
            console.log(`  Checking ${dateStr}:`, meetingUrl);
            try {
              const meetingResponse = await this.makeRequest<IDataverseResponse<IMeeting>>(meetingUrl);
              if (meetingResponse.value && meetingResponse.value.length > 0) {
                console.log(`  ✅ Found ${meetingResponse.value.length} meeting(s) for ${track} on ${dateStr}`);
                meetingResponse.value.forEach(m => {
                  console.log(`     Meeting: ${m.cr4cc_racemeetingid}, Track: ${m.cr4cc_trackname}, Date: ${m.cr4cc_meetingdate}`);
                });
              } else {
                console.log(`  ❌ No meetings found for ${track} on ${dateStr}`);
              }
            } catch (error) {
              console.log(`  ⚠️ Error fetching meeting for ${track} on ${dateStr}:`, error);
            }
          }
        }
      }
      
      // Test 3: Check injury classifications - try different approaches
      console.log('\n🏥 Test 3 - Alternative Injury Detection Methods:');
      
      // Try filtering by classification directly
      console.log('Trying to find records with any injury classification...');
      const anyClassificationUrl = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$filter=cra5e_injuryclassification ne null&$select=cra5e_injuryclassification,cra5e_injured,cra5e_trackname,cra5e_datechecked&$top=50`;
      const anyClassResponse = await this.makeRequest<IDataverseResponse<IHealthCheck>>(anyClassificationUrl, true);
      console.log(`Found ${anyClassResponse.value?.length || 0} records with injury classification`);
      
      if (anyClassResponse.value && anyClassResponse.value.length > 0) {
        const classificationCounts = new Map<string, number>();
        anyClassResponse.value.forEach(hc => {
          const classification = hc.cra5e_injuryclassification || 'Unknown';
          classificationCounts.set(classification, (classificationCounts.get(classification) || 0) + 1);
        });
        const classificationObj: Record<string, number> = {};
        classificationCounts.forEach((value, key) => {
          classificationObj[key] = value;
        });
        console.log('Classification counts:', classificationObj);
        
        // Show some examples
        console.log('\nFirst 5 records with classifications:');
        anyClassResponse.value.slice(0, 5).forEach((hc, i) => {
          console.log(`  ${i + 1}. Classification: ${hc.cra5e_injuryclassification}, Injured: ${hc.cra5e_injured}, Track: ${hc.cra5e_trackname}, Date: ${hc.cra5e_datechecked}`);
        });
      }
      
      // Try searching for specific classifications
      console.log('\nTrying specific classification searches:');
      const categories = ['Cat A', 'Cat B', 'Cat C', 'Cat D', 'Cat E', 'A', 'B', 'C', 'D', 'E'];
      for (const cat of categories) {
        const catUrl = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$filter=cra5e_injuryclassification eq '${cat}'&$top=1`;
        try {
          const catResponse = await this.makeRequest<IDataverseResponse<IHealthCheck>>(catUrl, true);
          if (catResponse.value && catResponse.value.length > 0) {
            console.log(`  ✅ Found records with classification "${cat}"`);
          }
        } catch (error) {
          // Silently skip errors for individual category searches
        }
      }
      
      // Test 4: Check if track names match between systems
      console.log('\nTest 4 - Track Name Validation:');
      const healthCheckTracksUrl = `${this.injuryDataverseUrl}/api/data/${this.apiVersion}/cra5e_heathchecks?$select=cra5e_trackname&$filter=cra5e_trackname ne null&$top=50`;
      const hcTrackResponse = await this.makeRequest<IDataverseResponse<{cra5e_trackname: string}>>(healthCheckTracksUrl, true);
      const hcTracks = new Set<string>();
      hcTrackResponse.value?.forEach(hc => {
        if (hc.cra5e_trackname) hcTracks.add(hc.cra5e_trackname);
      });
      console.log('Unique tracks in health checks:', Array.from(hcTracks));
      
      const meetingTracksUrl = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetings?$select=cr4cc_trackname&$filter=cr4cc_trackname ne null&$top=50`;
      const meetingTrackResponse = await this.makeRequest<IDataverseResponse<{cr4cc_trackname: string}>>(meetingTracksUrl);
      const meetingTracks = new Set<string>();
      meetingTrackResponse.value?.forEach(m => {
        if (m.cr4cc_trackname) meetingTracks.add(m.cr4cc_trackname);
      });
      console.log('Unique tracks in meetings:', Array.from(meetingTracks));
      
      // Check for mismatches
      const hcOnlyTracks = Array.from(hcTracks).filter(t => !meetingTracks.has(t));
      const meetingOnlyTracks = Array.from(meetingTracks).filter(t => !hcTracks.has(t));
      
      if (hcOnlyTracks.length > 0) {
        console.log('⚠️ Tracks in health checks but not meetings:', hcOnlyTracks);
      }
      if (meetingOnlyTracks.length > 0) {
        console.log('⚠️ Tracks in meetings but not health checks:', meetingOnlyTracks);
      }
      
      console.log('=== END COMPREHENSIVE TEST ===');
    } catch (error) {
      console.error('Error in comprehensive test:', error);
    }
  }
}