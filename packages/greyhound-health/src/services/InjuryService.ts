import { WebPartContext } from '@microsoft/sp-webpart-base';
import { BaseDataverseService, dataverseConfig, dataverseTables } from '@grnsw/shared';
import { IInjury, InjurySeverity } from '../models/IGreyhoundHealth';

export class InjuryService extends BaseDataverseService<IInjury> {
  protected tableName = dataverseTables.injuries;

  constructor(context: WebPartContext) {
    super(context, dataverseConfig);
  }

  public async getActiveInjuries(): Promise<IInjury[]> {
    return this.getAll({
      filter: `cr4cc_status eq 'Active' or cr4cc_status eq 'In Treatment'`,
      orderBy: 'cr4cc_injury_date desc',
      select: [
        'cr4cc_injuryid',
        '_cr4cc_greyhound_value',
        'cr4cc_injury_date',
        'cr4cc_injury_type',
        'cr4cc_injury_location',
        'cr4cc_severity',
        'cr4cc_track_name',
        'cr4cc_veterinarian',
        'cr4cc_stand_down_period',
        'cr4cc_status'
      ]
    });
  }

  public async getInjuriesByGreyhound(greyhoundId: string): Promise<IInjury[]> {
    return this.getAll({
      filter: `_cr4cc_greyhound_value eq ${greyhoundId}`,
      orderBy: 'cr4cc_injury_date desc'
    });
  }

  public async getInjuriesByDateRange(startDate: Date, endDate: Date): Promise<IInjury[]> {
    return this.getAll({
      filter: `cr4cc_injury_date ge ${startDate.toISOString()} and cr4cc_injury_date le ${endDate.toISOString()}`,
      orderBy: 'cr4cc_injury_date desc'
    });
  }

  public async getInjuriesBySeverity(severity: InjurySeverity): Promise<IInjury[]> {
    return this.getAll({
      filter: `cr4cc_severity eq '${severity}'`,
      orderBy: 'cr4cc_injury_date desc'
    });
  }

  public async getInjuriesByTrack(trackName: string): Promise<IInjury[]> {
    return this.getAll({
      filter: `cr4cc_track_name eq '${trackName}'`,
      orderBy: 'cr4cc_injury_date desc'
    });
  }

  public async getInjuryStatistics(startDate: Date, endDate: Date): Promise<any> {
    const injuries = await this.getInjuriesByDateRange(startDate, endDate);
    
    const stats = {
      total: injuries.length,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
      byTrack: {} as Record<string, number>
    };

    injuries.forEach(injury => {
      // Count by severity
      stats.bySeverity[injury.cr4cc_severity] = (stats.bySeverity[injury.cr4cc_severity] || 0) + 1;
      
      // Count by type
      stats.byType[injury.cr4cc_injury_type] = (stats.byType[injury.cr4cc_injury_type] || 0) + 1;
      
      // Count by location
      stats.byLocation[injury.cr4cc_injury_location] = (stats.byLocation[injury.cr4cc_injury_location] || 0) + 1;
      
      // Count by track
      if (injury.cr4cc_track_name) {
        stats.byTrack[injury.cr4cc_track_name] = (stats.byTrack[injury.cr4cc_track_name] || 0) + 1;
      }
    });

    return stats;
  }
}