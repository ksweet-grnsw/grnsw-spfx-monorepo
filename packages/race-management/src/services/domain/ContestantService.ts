import { WebPartContext } from '@microsoft/sp-webpart-base';
import { 
  UnifiedBaseDataverseService,
  DATAVERSE_ENVIRONMENTS,
  IODataQuery,
  IDataverseResponse
} from '@grnsw/shared';
import { IContestant, IContestantFilters } from '../../models/IRaceData';

/**
 * Domain service for Contestants
 * Handles all business logic related to race contestants
 */
export class ContestantService extends UnifiedBaseDataverseService<IContestant> {
  protected tableName = 'contestants';
  
  protected getTableName(): string {
    return this.environment.tables.contestants;
  }
  
  constructor(context: WebPartContext) {
    super(context, DATAVERSE_ENVIRONMENTS.racing, {
      enableCaching: true,
      cacheTTL: 30000, // 30 seconds
      enableThrottling: true,
      requestsPerSecond: 100
    });
  }
  
  /**
   * Get contestants for a specific race
   */
  async getContestantsByRace(raceId: string): Promise<IContestant[]> {
    const response = await this.getList({
      filter: `_cr616_race_value eq ${raceId}`,
      orderBy: 'cr616_rugnumber asc',
      select: [
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
        'cr616_prizemoney',
        '_cr616_race_value',
        '_cr616_meeting_value'
      ]
    });
    
    return response.value;
  }
  
  /**
   * Get contestants for a meeting
   */
  async getContestantsByMeeting(meetingId: string): Promise<IContestant[]> {
    const response = await this.getList({
      filter: `_cr616_meeting_value eq ${meetingId}`,
      orderBy: 'cr616_racenumber asc, cr616_rugnumber asc'
    });
    
    return response.value;
  }
  
  /**
   * Get contestants with filters
   */
  async getContestantsWithFilters(filters: IContestantFilters): Promise<IDataverseResponse<IContestant>> {
    const query: IODataQuery = {
      orderBy: 'cr616_placement asc',
      top: filters.pageSize || 50
    };
    
    // Build filter conditions
    const filterConditions: string[] = [];
    
    if (filters.raceId) {
      filterConditions.push(`_cr616_race_value eq ${filters.raceId}`);
    }
    
    if (filters.meetingId) {
      filterConditions.push(`_cr616_meeting_value eq ${filters.meetingId}`);
    }
    
    if (filters.greyhoundName) {
      filterConditions.push(`contains(cr616_greyhoundname, '${filters.greyhoundName}')`);
    }
    
    if (filters.trainerName) {
      filterConditions.push(`contains(cr616_trainername, '${filters.trainerName}')`);
    }
    
    if (filters.placement) {
      filterConditions.push(`cr616_placement eq ${filters.placement}`);
    }
    
    if (filters.onlyWinners) {
      filterConditions.push(`cr616_placement eq 1`);
    }
    
    if (filterConditions.length > 0) {
      query.filter = filterConditions.join(' and ');
    }
    
    return this.getList(query);
  }
  
  /**
   * Get contestant performance history
   */
  async getContestantHistory(greyhoundName: string, limit: number = 20): Promise<IContestant[]> {
    const response = await this.getList({
      filter: `cr616_greyhoundname eq '${greyhoundName}'`,
      orderBy: 'cr616_meetingdate desc',
      top: limit
    });
    
    return response.value;
  }
  
  /**
   * Get winners by trainer
   */
  async getWinnersByTrainer(trainerName: string, days: number = 30): Promise<IContestant[]> {
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);
    
    const response = await this.getList({
      filter: `cr616_trainername eq '${trainerName}' and cr616_placement eq 1 and cr616_meetingdate ge ${dateFilter.toISOString()}`,
      orderBy: 'cr616_meetingdate desc'
    });
    
    return response.value;
  }
  
  /**
   * Get contestant statistics
   */
  async getContestantStats(greyhoundName: string): Promise<{
    totalRaces: number;
    wins: number;
    places: number;
    winRate: number;
    placeRate: number;
    averageMargin: number;
    totalPrizeMoney: number;
    recentForm: string;
  }> {
    const history = await this.getContestantHistory(greyhoundName, 100);
    
    const stats = {
      totalRaces: history.length,
      wins: 0,
      places: 0,
      winRate: 0,
      placeRate: 0,
      averageMargin: 0,
      totalPrizeMoney: 0,
      recentForm: ''
    };
    
    let totalMargin = 0;
    let marginCount = 0;
    const recentResults: number[] = [];
    
    history.forEach((race, index) => {
      // Count wins and places
      if (race.cr616_placement === 1) {
        stats.wins++;
      }
      if (race.cr616_placement && race.cr616_placement <= 3) {
        stats.places++;
      }
      
      // Sum prize money
      stats.totalPrizeMoney += race.cr616_prizemoney || 0;
      
      // Calculate average margin
      if (race.cr616_margin) {
        totalMargin += race.cr616_margin;
        marginCount++;
      }
      
      // Track recent form (last 5 races)
      if (index < 5 && race.cr616_placement) {
        recentResults.push(race.cr616_placement);
      }
    });
    
    // Calculate rates
    if (stats.totalRaces > 0) {
      stats.winRate = (stats.wins / stats.totalRaces) * 100;
      stats.placeRate = (stats.places / stats.totalRaces) * 100;
    }
    
    // Calculate average margin
    if (marginCount > 0) {
      stats.averageMargin = totalMargin / marginCount;
    }
    
    // Format recent form (e.g., "1-3-2-4-1")
    stats.recentForm = recentResults.join('-');
    
    return stats;
  }
  
  /**
   * Get top performers by track
   */
  async getTopPerformersByTrack(trackName: string, limit: number = 10): Promise<{
    greyhound: string;
    trainer: string;
    wins: number;
    races: number;
    winRate: number;
  }[]> {
    const response = await this.getList({
      filter: `cr616_trackheld eq '${trackName}' and cr616_placement eq 1`,
      orderBy: 'cr616_meetingdate desc',
      top: 500 // Get more to calculate stats
    });
    
    // Aggregate by greyhound
    const performerMap = new Map<string, {
      trainer: string;
      wins: number;
      races: Set<string>;
    }>();
    
    response.value.forEach(contestant => {
      const key = contestant.cr616_greyhoundname;
      if (!key) return;
      
      if (!performerMap.has(key)) {
        performerMap.set(key, {
          trainer: contestant.cr616_trainername || 'Unknown',
          wins: 0,
          races: new Set()
        });
      }
      
      const performer = performerMap.get(key)!;
      performer.wins++;
      if (contestant.cr616_contestantsid) {
        performer.races.add(contestant.cr616_contestantsid);
      }
    });
    
    // Convert to array and calculate win rate
    const performers = Array.from(performerMap.entries())
      .map(([greyhound, data]) => ({
        greyhound,
        trainer: data.trainer,
        wins: data.wins,
        races: data.races.size,
        winRate: (data.wins / data.races.size) * 100
      }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, limit);
    
    return performers;
  }
  
  /**
   * Check for failed to finish
   */
  async getFailedToFinish(days: number = 7): Promise<IContestant[]> {
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);
    
    const response = await this.getList({
      filter: `cr616_failedtofinish eq true and cr616_meetingdate ge ${dateFilter.toISOString()}`,
      orderBy: 'cr616_meetingdate desc'
    });
    
    return response.value;
  }
  
  /**
   * Update contestant result
   */
  async updateContestantResult(
    contestantId: string, 
    placement: number, 
    finishTime?: number,
    margin?: number
  ): Promise<IContestant> {
    const updateData: Partial<IContestant> = {
      cr616_placement: placement
    };
    
    if (finishTime !== undefined) {
      updateData.cr616_finishtime = finishTime;
    }
    
    if (margin !== undefined) {
      updateData.cr616_margin = margin;
    }
    
    return this.update(contestantId, updateData);
  }
}