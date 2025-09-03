import { WebPartContext } from '@microsoft/sp-webpart-base';
import { AadHttpClient, AadHttpClientResponse, IHttpClientOptions } from '@microsoft/sp-http';
import { IHound, IHoundFilters, IHoundSearchResults } from '../models/IHound';

const gapDataverseConfig = {
  environment: 'https://orgda56a300.crm6.dynamics.com',
  apiUrl: 'https://orgda56a300.crm6.dynamics.com/api/data/v9.1',
  resourceUrl: 'https://orgda56a300.crm6.dynamics.com',
  apiVersion: 'v9.1'
};

/**
 * Service for interacting with GAP Hounds data in Dataverse
 * Implements SOLID principles with single responsibility for hound data operations
 */
export class HoundService {
  private context: WebPartContext;
  private aadClient: AadHttpClient | undefined;
  private readonly apiUrl = `${gapDataverseConfig.apiUrl}/api/data/${gapDataverseConfig.apiVersion}`;
  private readonly tableName = 'cr0d3_hounds'; // Pluralized form of cr0d3_hound
  
  constructor(context: WebPartContext) {
    this.context = context;
    this.initializeClient();
  }

  /**
   * Initialize the AAD HTTP client
   */
  private async initializeClient(): Promise<void> {
    try {
      this.aadClient = await this.context.aadHttpClientFactory.getClient(gapDataverseConfig.resourceUrl);
    } catch (error) {
      // Failed to initialize AAD client
    }
  }

  /**
   * Search hounds with filters
   * Implements DRY principle by centralizing search logic
   */
  public async searchHounds(filters?: IHoundFilters, pageSize: number = 50, page: number = 1): Promise<IHoundSearchResults> {
    try {
      const filterParts: string[] = [];
      
      // Build OData filter query
      if (filters) {
        // Search text filter (name, microchip, or ear brand)
        if (filters.searchText) {
          const searchTerm = encodeURIComponent(filters.searchText);
          filterParts.push(
            `(contains(cr0d3_racingname,'${searchTerm}') or ` +
            `contains(cr0d3_microchipnumber,'${searchTerm}') or ` +
            `contains(cr0d3_microchipno,'${searchTerm}') or ` +
            `contains(cr0d3_earbrandleft,'${searchTerm}') or ` +
            `contains(cr0d3_earbrandright,'${searchTerm}'))`
          );
        }
        
        // Availability filter - only apply if explicitly set
        if (filters.availabilityStatus !== undefined && filters.availabilityStatus !== '') {
          if (filters.availabilityStatus === 'available') {
            // Not adopted - either null, empty, or not "Adopted"
            filterParts.push(`(cr0d3_available eq null or cr0d3_available eq '' or cr0d3_available ne 'Adopted')`);
          } else {
            filterParts.push(`cr0d3_available eq '${encodeURIComponent(filters.availabilityStatus)}'`);
          }
        }
        // No default filter - show all records unless filtered
        
        // Sex filter
        if (filters.sex) {
          filterParts.push(`cr0d3_sex eq '${encodeURIComponent(filters.sex)}'`);
        }
        
        // Desexed filter
        if (filters.desexed !== undefined) {
          filterParts.push(`cr0d3_desexed eq ${filters.desexed}`);
        }
        
        // C5 vaccine filter
        if (filters.hasC5Vaccine !== undefined) {
          filterParts.push(`cr0d3_c5vaccinegiven eq ${filters.hasC5Vaccine}`);
        }
      }
      // No default filter when no filters provided - show all records
      
      // Build query string
      // Using Dataverse's skiptoken for server-side pagination when available
      let query = `${this.apiUrl}/${this.tableName}?`;
      
      // Add select to optimize data transfer
      query += '$select=cr0d3_houndid,cr0d3_microchipnumber,cr0d3_microchipno,cr0d3_racingname,';
      query += 'cr0d3_sex,cr0d3_colour,cr0d3_whelpingdate,cr0d3_weight,';
      query += 'cr0d3_earbrandleft,cr0d3_earbrandright,cr0d3_desexed,cr0d3_available,';
      query += 'cr0d3_c5vaccinegiven,cr0d3_assessmentdate';
      
      // Add filter if any
      if (filterParts.length > 0) {
        query += `&$filter=${filterParts.join(' and ')}`;
      }
      
      // Add ordering
      query += '&$orderby=cr0d3_racingname asc';
      
      // Add pagination - only $top is supported
      // Fetch all records (or a large number) since we can't use $skip
      // We'll handle pagination client-side
      query += `&$top=5000`; // Fetch up to 5000 records
      
      // Add count
      query += '&$count=true';
      
      // Execute request
      const response = await this.makeRequest(query);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Process results
      const allHounds = this.processHounds(data.value || []);
      
      // Client-side pagination: slice the results to get only the current page
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pageHounds = allHounds.slice(startIndex, endIndex);
      
      return {
        hounds: pageHounds,
        totalCount: data['@odata.count'] || allHounds.length,
        hasMore: endIndex < allHounds.length
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a single hound by ID
   */
  public async getHoundById(houndId: string): Promise<IHound | null> {
    try {
      const query = `${this.apiUrl}/${this.tableName}(${houndId})`;
      const response = await this.makeRequest(query);
      
      if (response.ok) {
        const data = await response.json();
        const hounds = this.processHounds([data]);
        return hounds[0] || null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get available hounds (not adopted)
   */
  public async getAvailableHounds(pageSize: number = 50): Promise<IHoundSearchResults> {
    return this.searchHounds({ availabilityStatus: 'available' }, pageSize);
  }

  /**
   * Process raw hound data from Dataverse
   * Adds computed fields like age and display name
   */
  private processHounds(rawHounds: any[]): IHound[] {
    return rawHounds.map(hound => {
      const processed: IHound = { ...hound };
      
      // Calculate age if whelping date is available
      if (hound.cr0d3_whelpingdate) {
        const birthDate = new Date(hound.cr0d3_whelpingdate);
        const today = new Date();
        const ageInMs = today.getTime() - birthDate.getTime();
        const ageInYears = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365.25));
        processed.age = ageInYears;
      }
      
      // Set display name (prefer racing name, fallback to microchip)
      processed.displayName = hound.cr0d3_racingname || hound.cr0d3_microchipnumber || 'Unknown';
      
      return processed;
    });
  }

  /**
   * Make HTTP request to Dataverse API
   * Handles authentication via Azure AD
   */
  private async makeRequest(url: string): Promise<AadHttpClientResponse> {
    // Ensure client is initialized
    if (!this.aadClient) {
      this.aadClient = await this.context.aadHttpClientFactory.getClient(gapDataverseConfig.resourceUrl);
    }

    const requestHeaders: Headers = new Headers();
    requestHeaders.append('Accept', 'application/json');
    requestHeaders.append('OData-MaxVersion', '4.0');
    requestHeaders.append('OData-Version', '4.0');
    requestHeaders.append('Prefer', 'odata.include-annotations="*"');

    const httpClientOptions: IHttpClientOptions = {
      headers: requestHeaders
    };

    const response = await this.aadClient.get(url, AadHttpClient.configurations.v1, httpClientOptions);
    
    return response;
  }

  /**
   * Get distinct values for filter dropdowns
   */
  public async getFilterOptions(): Promise<{
    colours: string[];
    sexOptions: string[];
  }> {
    try {
      // Get distinct colours
      const colourQuery = `${this.apiUrl}/${this.tableName}?$select=cr0d3_colour&$filter=cr0d3_colour ne null&$apply=groupby((cr0d3_colour))`;
      const colourResponse = await this.makeRequest(colourQuery);
      const colourData = await colourResponse.json();
      
      // Get distinct sex options
      const sexQuery = `${this.apiUrl}/${this.tableName}?$select=cr0d3_sex&$filter=cr0d3_sex ne null&$apply=groupby((cr0d3_sex))`;
      const sexResponse = await this.makeRequest(sexQuery);
      const sexData = await sexResponse.json();
      
      return {
        colours: colourData.value?.map((item: any) => item.cr0d3_colour) || [],
        sexOptions: sexData.value?.map((item: any) => item.cr0d3_sex) || ['Male', 'Female']
      };
    } catch (error) {
      // Return defaults
      return {
        colours: [],
        sexOptions: ['Male', 'Female']
      };
    }
  }
}