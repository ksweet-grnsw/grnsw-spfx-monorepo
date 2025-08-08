import { WebPartContext } from '@microsoft/sp-webpart-base';
import { BaseDataverseService } from './BaseDataverseService';
import { 
  ICra5eInjurydata, 
  ICreateInjuryData, 
  IInjuryStatistics,
  IInjurySearchFilters,
  InjuryStateCode
} from '../models/ICra5eInjuryData';

export class Cra5eInjuryDataService extends BaseDataverseService<ICra5eInjurydata> {
  protected tableName = 'cra5e_injurydatas'; // Plural form for Dataverse API

  constructor(context: WebPartContext) {
    super(context);
  }

  /**
   * Get all active injuries
   */
  public async getActiveInjuries(): Promise<ICra5eInjurydata[]> {
    return this.getAll({
      filter: `statecode eq ${InjuryStateCode.Active}`,
      orderBy: 'cra5e_racedate desc',
      select: [
        'cra5e_injurydataid',
        'cra5e_injuryreport',
        'cra5e_racedate',
        'cra5e_greyhoundname',
        'cra5e_microchip',
        'cra5e_doggender',
        'cra5e_ageofdog',
        'cra5e_trackname',
        'cra5e_injurycategory',
        'cra5e_injurystate',
        'cra5e_determinedserious',
        'cra5e_failedtofinish',
        'cra5e_standdowndays'
      ]
    });
  }

  /**
   * Get injuries for a specific track
   */
  public async getInjuriesByTrack(trackName: string): Promise<ICra5eInjurydata[]> {
    return this.getAll({
      filter: `cra5e_trackname eq '${trackName}'`,
      orderBy: 'cra5e_racedate desc'
    });
  }

  /**
   * Get injuries by date range
   */
  public async getInjuriesByDateRange(startDate: Date, endDate: Date): Promise<ICra5eInjurydata[]> {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    
    return this.getAll({
      filter: `cra5e_racedate ge ${start} and cra5e_racedate le ${end}`,
      orderBy: 'cra5e_racedate desc'
    });
  }

  /**
   * Get serious injuries
   */
  public async getSeriousInjuries(): Promise<ICra5eInjurydata[]> {
    return this.getAll({
      filter: `cra5e_determinedserious eq 'Yes' or cra5e_determinedserious eq 'TRUE'`,
      orderBy: 'cra5e_racedate desc'
    });
  }

  /**
   * Get euthanasia records
   * Uses Injury State field (primary) with Stand Down Days as validation
   */
  public async getEuthanasiaRecords(): Promise<ICra5eInjurydata[]> {
    // Primary check is injury state = 'Euthanised'
    // Secondary check is empty/zero stand down days with determinedserious = Yes
    return this.getAll({
      filter: `cra5e_injurystate eq 'Euthanised'`,
      orderBy: 'cra5e_racedate desc'
    });
  }

  /**
   * Get injuries where dog failed to finish
   */
  public async getFailedToFinishInjuries(): Promise<ICra5eInjurydata[]> {
    return this.getAll({
      filter: `cra5e_failedtofinish eq 'Yes' or cra5e_failedtofinish eq 'TRUE'`,
      orderBy: 'cra5e_racedate desc'
    });
  }

  /**
   * Get injuries by microchip
   */
  public async getInjuriesByMicrochip(microchip: number): Promise<ICra5eInjurydata[]> {
    return this.getAll({
      filter: `cra5e_microchip eq ${microchip}`,
      orderBy: 'cra5e_racedate desc'
    });
  }

  /**
   * Get injuries by greyhound name
   */
  public async getInjuriesByGreyhoundName(name: string): Promise<ICra5eInjurydata[]> {
    return this.getAll({
      filter: `contains(cra5e_greyhoundname, '${name}')`,
      orderBy: 'cra5e_racedate desc'
    });
  }

  /**
   * Search injuries with filters
   */
  public async searchInjuries(filters: IInjurySearchFilters): Promise<ICra5eInjurydata[]> {
    const filterConditions: string[] = [];
    
    if (filters.trackName) {
      filterConditions.push(`cra5e_trackname eq '${filters.trackName}'`);
    }
    
    if (filters.injuryCategory) {
      filterConditions.push(`cra5e_injurycategory eq '${filters.injuryCategory}'`);
    }
    
    if (filters.injuryState) {
      filterConditions.push(`cra5e_injurystate eq '${filters.injuryState}'`);
    }
    
    if (filters.determinedSerious) {
      filterConditions.push(`cra5e_determinedserious eq '${filters.determinedSerious}'`);
    }
    
    if (filters.startDate) {
      filterConditions.push(`cra5e_racedate ge ${filters.startDate}`);
    }
    
    if (filters.endDate) {
      filterConditions.push(`cra5e_racedate le ${filters.endDate}`);
    }
    
    if (filters.microchip) {
      filterConditions.push(`cra5e_microchip eq ${filters.microchip}`);
    }
    
    const filter = filterConditions.length > 0 ? filterConditions.join(' and ') : undefined;
    
    return this.getAll({
      filter,
      orderBy: 'cra5e_racedate desc'
    });
  }

  /**
   * Create a new injury record
   */
  public async createInjury(injury: ICreateInjuryData): Promise<string> {
    const newInjury: Partial<ICra5eInjurydata> = {
      ...injury,
      statecode: InjuryStateCode.Active,
      statuscode: 1 // Active
    };

    return this.create(newInjury);
  }

  /**
   * Get injury statistics for a date range
   */
  public async getInjuryStatistics(startDate: Date, endDate: Date): Promise<IInjuryStatistics> {
    const injuries = await this.getInjuriesByDateRange(startDate, endDate);
    
    const stats: IInjuryStatistics = {
      totalInjuries: injuries.length,
      injuriesByCategory: {},
      injuriesByTrack: {},
      injuriesByMonth: {},
      seriousInjuriesCount: 0,
      failedToFinishCount: 0,
      averageAge: undefined
    };

    let totalAge = 0;
    let ageCount = 0;

    injuries.forEach(injury => {
      // Count by category
      if (injury.cra5e_injurycategory) {
        stats.injuriesByCategory[injury.cra5e_injurycategory] = 
          (stats.injuriesByCategory[injury.cra5e_injurycategory] || 0) + 1;
      }

      // Count by track
      if (injury.cra5e_trackname) {
        stats.injuriesByTrack[injury.cra5e_trackname] = 
          (stats.injuriesByTrack[injury.cra5e_trackname] || 0) + 1;
      }

      // Count by month
      if (injury.cra5e_racedate) {
        const month = new Date(injury.cra5e_racedate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        stats.injuriesByMonth[month] = (stats.injuriesByMonth[month] || 0) + 1;
      }

      // Count serious injuries
      if (injury.cra5e_determinedserious === 'Yes' || 
          injury.cra5e_determinedserious === 'TRUE') {
        stats.seriousInjuriesCount++;
      }

      // Count failed to finish
      if (injury.cra5e_failedtofinish === 'Yes' || 
          injury.cra5e_failedtofinish === 'TRUE') {
        stats.failedToFinishCount++;
      }

      // Calculate average age
      if (injury.cra5e_ageofdog && typeof injury.cra5e_ageofdog === 'number') {
        totalAge += injury.cra5e_ageofdog;
        ageCount++;
      }
    });

    // Calculate average age
    if (ageCount > 0) {
      stats.averageAge = Math.round((totalAge / ageCount) * 10) / 10; // Round to 1 decimal
    }

    return stats;
  }

  /**
   * Get recent injuries for dashboard
   */
  public async getRecentInjuries(days: number = 7): Promise<ICra5eInjurydata[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.getAll({
      filter: `cra5e_racedate ge ${startDate.toISOString()}`,
      orderBy: 'cra5e_racedate desc',
      top: 20,
      select: [
        'cra5e_injurydataid',
        'cra5e_injuryreport',
        'cra5e_racedate',
        'cra5e_greyhoundname',
        'cra5e_microchip',
        'cra5e_trackname',
        'cra5e_injurycategory',
        'cra5e_injurystate',
        'cra5e_determinedserious',
        'cra5e_failedtofinish',
        'cra5e_standdowndays'
      ]
    });
  }

  /**
   * Get unique injury categories
   */
  public async getInjuryCategories(): Promise<string[]> {
    const injuries = await this.getAll({
      select: ['cra5e_injurycategory'],
      filter: 'cra5e_injurycategory ne null'
    });
    
    const categories = new Set<string>();
    injuries.forEach(injury => {
      if (injury.cra5e_injurycategory) {
        categories.add(injury.cra5e_injurycategory);
      }
    });
    
    return Array.from(categories).sort();
  }

  /**
   * Get unique track names
   */
  public async getTrackNames(): Promise<string[]> {
    const injuries = await this.getAll({
      select: ['cra5e_trackname'],
      filter: 'cra5e_trackname ne null'
    });
    
    const tracks = new Set<string>();
    injuries.forEach(injury => {
      if (injury.cra5e_trackname) {
        tracks.add(injury.cra5e_trackname);
      }
    });
    
    return Array.from(tracks).sort();
  }

  /**
   * Search injuries by greyhound name or microchip
   */
  public async searchGreyhound(searchTerm: string): Promise<ICra5eInjurydata[]> {
    // Check if searchTerm is a number (microchip)
    const isNumber = /^\d+$/.test(searchTerm);
    
    if (isNumber) {
      return this.getAll({
        filter: `cra5e_microchip eq ${searchTerm}`,
        orderBy: 'cra5e_racedate desc'
      });
    } else {
      return this.getAll({
        filter: `contains(cra5e_greyhoundname, '${searchTerm}')`,
        orderBy: 'cra5e_racedate desc'
      });
    }
  }
}