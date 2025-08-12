import { HttpClient, HttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';
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

export class RaceDataService {
  private httpClient: HttpClient;
  private dataverseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private readonly apiVersion = 'v9.1';

  constructor(httpClient: HttpClient, dataverseUrl: string) {
    this.httpClient = httpClient;
    this.dataverseUrl = dataverseUrl;
  }

  // Token management
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    // In production, this would get the token from Azure AD
    // For now, we'll use a placeholder
    // TODO: Implement proper Azure AD authentication
    this.accessToken = 'placeholder-token';
    this.tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    return this.accessToken;
  }

  // HTTP request helper
  private async makeRequest<T>(url: string): Promise<T> {
    const token = await this.getAccessToken();
    
    const options: IHttpClientOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'Prefer': 'odata.include-annotations="*"'
      }
    };

    try {
      const response: HttpClientResponse = await this.httpClient.get(url, HttpClient.configurations.v1, options);
      
      if (!response.ok) {
        const error: IDataverseError = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Dataverse API Error:', error);
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
      filterParts.push(`cr4cc_trackheld eq '${encodeURIComponent(filters.track)}'`);
    }
    if (filters?.authority) {
      filterParts.push(`cr4cc_authority eq '${encodeURIComponent(filters.authority)}'`);
    }
    if (filters?.status) {
      filterParts.push(`cr4cc_status eq '${encodeURIComponent(filters.status)}'`);
    }
    
    const filterQuery = filterParts.length > 0 ? `$filter=${filterParts.join(' and ')}` : '';
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetingses?${filterQuery}&$orderby=cr4cc_meetingdate desc`;
    
    const response = await this.makeRequest<IDataverseResponse<IMeeting>>(url);
    return response.value;
  }

  public async getMeetingById(meetingId: string): Promise<IMeeting> {
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetingses(${meetingId})`;
    return await this.makeRequest<IMeeting>(url);
  }

  // Race operations
  public async getRacesForMeeting(meetingId: string): Promise<IRace[]> {
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_raceses?$filter=_cr616_meeting_value eq '${meetingId}'&$orderby=cr616_racenumber`;
    const response = await this.makeRequest<IDataverseResponse<IRace>>(url);
    return response.value;
  }

  public async getRaces(filters?: IRaceFilters): Promise<IRace[]> {
    const filterParts: string[] = [];
    
    if (filters?.meetingId) {
      filterParts.push(`_cr616_meeting_value eq '${filters.meetingId}'`);
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
    
    const filterQuery = filterParts.length > 0 ? `$filter=${filterParts.join(' and ')}` : '';
    const expandQuery = '$expand=cr616_Meeting($select=cr4cc_racename,cr4cc_meetingdate,cr4cc_trackheld)';
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_raceses?${filterQuery}&${expandQuery}&$orderby=cr616_racenumber`;
    
    const response = await this.makeRequest<IDataverseResponse<IRace>>(url);
    return response.value;
  }

  public async getRaceById(raceId: string): Promise<IRace> {
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_raceses(${raceId})?$expand=cr616_Meeting($select=cr4cc_racename,cr4cc_meetingdate,cr4cc_trackheld)`;
    return await this.makeRequest<IRace>(url);
  }

  // Contestant operations
  public async getContestantsForRace(raceId: string): Promise<IContestant[]> {
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_contestantses?$filter=_cr616_race_value eq '${raceId}'&$orderby=cr616_rugnumber`;
    const response = await this.makeRequest<IDataverseResponse<IContestant>>(url);
    return response.value;
  }

  public async getContestants(filters?: IContestantFilters): Promise<IContestant[]> {
    const filterParts: string[] = [];
    
    if (filters?.raceId) {
      filterParts.push(`_cr616_race_value eq '${filters.raceId}'`);
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
    
    const filterQuery = filterParts.length > 0 ? `$filter=${filterParts.join(' and ')}` : '';
    const expandQuery = '$expand=cr616_Race($select=cr616_racename,cr616_racenumber;$expand=cr616_Meeting($select=cr4cc_racename,cr4cc_meetingdate,cr4cc_trackheld))';
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_contestantses?${filterQuery}&${expandQuery}&$orderby=cr616_rugnumber`;
    
    const response = await this.makeRequest<IDataverseResponse<IContestant>>(url);
    return response.value;
  }

  public async getContestantById(contestantId: string): Promise<IContestant> {
    const expandQuery = '$expand=cr616_Race($select=cr616_racename,cr616_racenumber;$expand=cr616_Meeting($select=cr4cc_racename,cr4cc_meetingdate,cr4cc_trackheld))';
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

    const encodedTerm = encodeURIComponent(searchTerm);
    
    // Search meetings
    const meetingsUrl = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetingses?$filter=contains(cr4cc_trackheld,'${encodedTerm}') or contains(cr4cc_racename,'${encodedTerm}')&$top=10`;
    
    // Search races
    const racesUrl = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_raceses?$filter=contains(cr616_racename,'${encodedTerm}') or contains(cr616_racetitle,'${encodedTerm}')&$expand=cr616_Meeting($select=cr4cc_racename,cr4cc_meetingdate,cr4cc_trackheld)&$top=10`;
    
    // Search contestants
    const contestantsUrl = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr616_contestantses?$filter=contains(cr616_greyhoundname,'${encodedTerm}') or contains(cr616_ownername,'${encodedTerm}') or contains(cr616_trainername,'${encodedTerm}')&$expand=cr616_Race($select=cr616_racename,cr616_racenumber;$expand=cr616_Meeting($select=cr4cc_racename,cr4cc_meetingdate,cr4cc_trackheld))&$top=10`;
    
    try {
      const [meetingsResponse, racesResponse, contestantsResponse] = await Promise.all([
        this.makeRequest<IDataverseResponse<IMeeting>>(meetingsUrl),
        this.makeRequest<IDataverseResponse<IRace>>(racesUrl),
        this.makeRequest<IDataverseResponse<IContestant>>(contestantsUrl)
      ]);
      
      const results: ISearchResults = {
        meetings: meetingsResponse.value,
        races: racesResponse.value,
        contestants: contestantsResponse.value,
        totalResults: meetingsResponse.value.length + racesResponse.value.length + contestantsResponse.value.length
      };
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return {
        meetings: [],
        races: [],
        contestants: [],
        totalResults: 0
      };
    }
  }

  // Get all unique tracks
  public async getTracks(): Promise<string[]> {
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetingses?$select=cr4cc_trackheld&$filter=cr4cc_trackheld ne null&$orderby=cr4cc_trackheld`;
    const response = await this.makeRequest<IDataverseResponse<{cr4cc_trackheld: string}>>(url);
    
    const tracks = new Set<string>();
    response.value.forEach(item => {
      if (item.cr4cc_trackheld) {
        tracks.add(item.cr4cc_trackheld);
      }
    });
    
    return Array.from(tracks).sort();
  }

  // Get all unique authorities
  public async getAuthorities(): Promise<string[]> {
    const url = `${this.dataverseUrl}/api/data/${this.apiVersion}/cr4cc_racemeetingses?$select=cr4cc_authority&$filter=cr4cc_authority ne null&$orderby=cr4cc_authority`;
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