import { WebPartContext } from '@microsoft/sp-webpart-base';
import { 
  UnifiedBaseDataverseService,
  DATAVERSE_ENVIRONMENTS,
  IODataQuery,
  IDataverseResponse
} from '@grnsw/shared';
import { IRace, IRaceFilters } from '../../models/IRaceData';

/**
 * Domain service for Races
 * Handles all business logic related to individual races
 */
export class RaceService extends UnifiedBaseDataverseService<IRace> {
  protected tableName = 'races';
  
  protected getTableName(): string {
    return this.environment.tables.races;
  }
  
  constructor(context: WebPartContext) {
    super(context, DATAVERSE_ENVIRONMENTS.racing, {
      enableCaching: true,
      cacheTTL: 30000, // 30 seconds for race data (more dynamic)
      enableThrottling: true,
      requestsPerSecond: 100
    });
  }
  
  /**
   * Get races for a specific meeting
   */
  async getRacesByMeeting(meetingId: string): Promise<IRace[]> {
    const response = await this.getList({
      filter: `_cr616_meeting_value eq ${meetingId}`,
      orderBy: 'cr616_racenumber asc',
      select: [
        'cr616_racesid',
        'cr616_racenumber',
        'cr616_racename',
        'cr616_racetitle',
        'cr616_distance',
        'cr616_racegrading',
        'cr616_starttime',
        'cr616_numberofcontestants',
        'cr616_racedate',
        'cr616_prize1',
        'cr616_prize2',
        'cr616_prize3',
        'cr616_prize4',
        'cr616_status',
        'cr616_firstsectionaltime',
        'cr616_secondsectiontime',
        '_cr616_meeting_value'
      ]
    });
    
    return response.value;
  }
  
  /**
   * Get races with filters
   */
  async getRacesWithFilters(filters: IRaceFilters): Promise<IDataverseResponse<IRace>> {
    const query: IODataQuery = {
      orderBy: 'cr616_racedate desc, cr616_racenumber asc',
      top: filters.pageSize || 50
    };
    
    // Build filter conditions
    const filterConditions: string[] = [];
    
    if (filters.meetingId) {
      filterConditions.push(`_cr616_meeting_value eq ${filters.meetingId}`);
    }
    
    if (filters.grading) {
      filterConditions.push(`cr616_racegrading eq '${filters.grading}'`);
    }
    
    if (filters.minDistance) {
      filterConditions.push(`cr616_distance ge ${filters.minDistance}`);
    }
    
    if (filters.maxDistance) {
      filterConditions.push(`cr616_distance le ${filters.maxDistance}`);
    }
    
    if (filters.status) {
      filterConditions.push(`cr616_status eq '${filters.status}'`);
    }
    
    if (filterConditions.length > 0) {
      query.filter = filterConditions.join(' and ');
    }
    
    return this.getList(query);
  }
  
  /**
   * Get races by grading
   */
  async getRacesByGrading(grading: string, limit: number = 50): Promise<IRace[]> {
    const response = await this.getList({
      filter: `cr616_racegrading eq '${grading}'`,
      orderBy: 'cr616_racedate desc',
      top: limit
    });
    
    return response.value;
  }
  
  /**
   * Get high-value races (based on prize money)
   */
  async getHighValueRaces(minPrize: number = 10000): Promise<IRace[]> {
    const response = await this.getList({
      filter: `cr616_prize1 ge ${minPrize}`,
      orderBy: 'cr616_prize1 desc',
      top: 100
    });
    
    return response.value;
  }
  
  /**
   * Get race statistics for a meeting
   */
  async getRaceStatsByMeeting(meetingId: string): Promise<{
    totalRaces: number;
    totalContestants: number;
    totalPrizeMoney: number;
    averageDistance: number;
    gradeDistribution: { [grade: string]: number };
  }> {
    const races = await this.getRacesByMeeting(meetingId);
    
    const stats = {
      totalRaces: races.length,
      totalContestants: 0,
      totalPrizeMoney: 0,
      averageDistance: 0,
      gradeDistribution: {} as { [grade: string]: number }
    };
    
    let totalDistance = 0;
    
    races.forEach(race => {
      // Sum contestants
      stats.totalContestants += race.cr616_numberofcontestants || 0;
      
      // Sum prize money
      stats.totalPrizeMoney += (race.cr616_prize1 || 0) + 
                               (race.cr616_prize2 || 0) + 
                               (race.cr616_prize3 || 0) + 
                               (race.cr616_prize4 || 0);
      
      // Sum distance
      totalDistance += race.cr616_distance || 0;
      
      // Count grades
      if (race.cr616_racegrading) {
        stats.gradeDistribution[race.cr616_racegrading] = 
          (stats.gradeDistribution[race.cr616_racegrading] || 0) + 1;
      }
    });
    
    // Calculate average distance
    if (races.length > 0) {
      stats.averageDistance = totalDistance / races.length;
    }
    
    return stats;
  }
  
  /**
   * Get upcoming races
   */
  async getUpcomingRaces(hours: number = 24): Promise<IRace[]> {
    const now = new Date();
    const future = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    
    const response = await this.getList({
      filter: `cr616_starttime ge ${now.toISOString()} and cr616_starttime le ${future.toISOString()}`,
      orderBy: 'cr616_starttime asc',
      top: 100
    });
    
    return response.value;
  }
  
  /**
   * Update race status
   */
  async updateRaceStatus(raceId: string, status: string, comment?: string): Promise<IRace> {
    const updateData: Partial<IRace> = {
      cr616_status: status
    };
    
    if (comment) {
      updateData.cr616_stewardracecomment = comment;
    }
    
    return this.update(raceId, updateData);
  }
  
  /**
   * Get races with sectional times
   */
  async getRacesWithSectionals(meetingId?: string): Promise<IRace[]> {
    let filter = 'cr616_firstsectionaltime ne null';
    
    if (meetingId) {
      filter = `${filter} and _cr616_meeting_value eq ${meetingId}`;
    }
    
    const response = await this.getList({
      filter,
      orderBy: 'cr616_racedate desc',
      top: 100
    });
    
    return response.value;
  }
}