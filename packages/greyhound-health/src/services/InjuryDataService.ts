import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IInjuryDataRecord {
  cra5e_injurydataid?: string;
  cra5e_greyhoundname?: string;
  cra5e_racedate?: string;
  cra5e_trackname?: string;
  cra5e_injurycategory?: string;  // was injurytype
  cra5e_runstage?: string;         // was injurylocation
  cra5e_determinedserious?: boolean; // was fatality (fixed typo)
  cra5e_standdowndays?: number;     // was severity
  cra5e_runbox?: number;           // starting box number
  cra5e_racenumber?: number;       // race number
  cra5e_injurystate?: string;      // new field
  cra5e_placement?: string;        // new field
}

export class InjuryDataService {
  private context: WebPartContext;
  private environment = "https://orgfc8a11f1.crm6.dynamics.com";
  private apiVersion = "v9.2";
  private tableName = "cra5e_injurydatas";

  constructor(context: WebPartContext) {
    this.context = context;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const tokenProvider = await this.context.aadTokenProviderFactory.getTokenProvider();
    const accessToken = await tokenProvider.getToken(this.environment);
    
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json'
    };
  }

  public async getInjuryData(filter?: string): Promise<IInjuryDataRecord[]> {
    console.log('getInjuryData called with filter:', filter);
    try {
      const headers = await this.getHeaders();
      let url = `${this.environment}/api/data/${this.apiVersion}/${this.tableName}`;
      
      const queryParts: string[] = [];
      if (filter) queryParts.push(`$filter=${filter}`);
      queryParts.push('$select=cra5e_injurydataid,cra5e_greyhoundname,cra5e_racedate,cra5e_trackname,cra5e_injurycategory,cra5e_runstage,cra5e_determinedserious,cra5e_standdowndays,cra5e_runbox,cra5e_racenumber,cra5e_injurystate,cra5e_placement');
      queryParts.push('$top=500'); // Get more records for better analysis
      
      if (queryParts.length > 0) {
        url += `?${queryParts.join('&')}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: url
        });
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error: any) {
      console.error('Error fetching injury data:', {
        message: error.message,
        stack: error.stack,
        environment: this.environment,
        tableName: this.tableName
      });
      throw error;
    }
  }

  public async getMonthlyInjuryCount(trackName?: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = startOfMonth.toISOString();
    
    let filter = `cra5e_racedate ge ${startDate}`;
    if (trackName) {
      filter += ` and cra5e_trackname eq '${trackName}'`;
    }

    const injuries = await this.getInjuryData(filter);
    return injuries.length;
  }

  public async getYearToDateFatalities(trackName?: string): Promise<number> {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startDate = startOfYear.toISOString();
    
    // Updated to use injury state field for accurate euthanasia count
    let filter = `cra5e_racedate ge ${startDate} and cra5e_injurystate eq 'Euthanised'`;
    if (trackName) {
      filter += ` and cra5e_trackname eq '${trackName}'`;
    }

    const fatalities = await this.getInjuryData(filter);
    return fatalities.length;
  }

  public async getTrackRiskScores(): Promise<Map<string, number>> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = thirtyDaysAgo.toISOString();
    
    const filter = `cra5e_racedate ge ${startDate}`;
    const injuries = await this.getInjuryData(filter);
    
    const trackCounts = new Map<string, number>();
    injuries.forEach(injury => {
      if (injury.cra5e_trackname) {
        const count = trackCounts.get(injury.cra5e_trackname) || 0;
        trackCounts.set(injury.cra5e_trackname, count + 1);
      }
    });

    return trackCounts;
  }

  public async getDaysSinceLastSeriousInjury(trackName?: string): Promise<number> {
    let filter = `cra5e_severity eq 'Catastrophic' or cra5e_severity eq 'Major'`;
    if (trackName) {
      filter += ` and cra5e_trackname eq '${trackName}'`;
    }
    filter += '&$orderby=cra5e_racedate desc&$top=1';

    const injuries = await this.getInjuryData(filter);
    if (injuries.length === 0) {
      return 999; // No serious injuries recorded
    }

    const lastInjuryDate = new Date(injuries[0].cra5e_racedate || '');
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastInjuryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
}