import { WebPartContext } from '@microsoft/sp-webpart-base';
import { 
  UnifiedLogger,
  UnifiedErrorHandler,
  CacheService,
  ErrorType
} from '@grnsw/shared';
import { MeetingService } from './domain/MeetingService';
import { RaceService } from './domain/RaceService';
import { ContestantService } from './domain/ContestantService';
import { InjuryService, GreyhoundHealthService, HealthCheckService } from './domain/InjuryService';
import { 
  IMeeting, 
  IRace, 
  IContestant,
  ISearchResults,
  IMeetingFilters,
  IRaceFilters,
  IContestantFilters
} from '../models/IRaceData';

/**
 * Complete race data with all related information
 */
export interface ICompleteRaceData {
  meeting: IMeeting;
  races: IRace[];
  contestants: IContestant[];
  statistics: {
    totalRaces: number;
    totalContestants: number;
    totalPrizeMoney: number;
    injuryRisk?: number;
  };
}

/**
 * Enriched contestant data with health information
 */
export interface IEnrichedContestant extends IContestant {
  hasRecentInjury?: boolean;
  injuryDetails?: any;
  performanceStats?: {
    winRate: number;
    placeRate: number;
    recentForm: string;
  };
}

/**
 * Dashboard data for overview displays
 */
export interface IDashboardData {
  todaysMeetings: IMeeting[];
  upcomingRaces: IRace[];
  recentWinners: IContestant[];
  trackStatistics: Map<string, {
    meetings: number;
    races: number;
    injuryRisk: number;
  }>;
  alerts: {
    type: 'warning' | 'error' | 'info';
    message: string;
    data?: any;
  }[];
}

/**
 * Race Management Facade
 * Orchestrates all domain services to provide high-level business operations
 * This is the main entry point for the UI layer
 */
export class RaceManagementFacade {
  private logger: UnifiedLogger;
  private cache: CacheService;
  
  // Domain services
  private meetingService: MeetingService;
  private raceService: RaceService;
  private contestantService: ContestantService;
  private injuryService: InjuryService;
  private greyhoundHealthService: GreyhoundHealthService;
  private healthCheckService: HealthCheckService;
  
  constructor(private context: WebPartContext) {
    // Initialize services
    this.logger = UnifiedLogger.getInstance();
    this.cache = new CacheService('race_management_facade', {
      defaultTTL: 60000, // 1 minute
      maxSize: 50
    });
    
    // Initialize domain services
    this.meetingService = new MeetingService(context);
    this.raceService = new RaceService(context);
    this.contestantService = new ContestantService(context);
    this.injuryService = new InjuryService(context);
    this.greyhoundHealthService = new GreyhoundHealthService(context);
    this.healthCheckService = new HealthCheckService(context);
  }
  
  /**
   * Get complete data for a race meeting
   * Orchestrates multiple services to gather all related data
   */
  async getCompleteMeetingData(meetingId: string): Promise<ICompleteRaceData> {
    const cacheKey = CacheService.createKey('completeMeeting', meetingId);
    
    try {
      // Check cache first
      const cached = this.cache.get<ICompleteRaceData>(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit for complete meeting data', { meetingId });
        return cached;
      }
      
      // Fetch data in parallel for performance
      const [meeting, races, contestants] = await Promise.all([
        this.meetingService.getById(meetingId),
        this.raceService.getRacesByMeeting(meetingId),
        this.contestantService.getContestantsByMeeting(meetingId)
      ]);
      
      if (!meeting) {
        throw UnifiedErrorHandler.createError(
          ErrorType.NOT_FOUND_ERROR,
          `Meeting ${meetingId} not found`
        );
      }
      
      // Calculate statistics
      const statistics = {
        totalRaces: races.length,
        totalContestants: contestants.length,
        totalPrizeMoney: races.reduce((sum, race) => 
          sum + (race.cr616_prize1 || 0) + (race.cr616_prize2 || 0) + 
          (race.cr616_prize3 || 0) + (race.cr616_prize4 || 0), 0
        ),
        injuryRisk: 0
      };
      
      // Get injury risk if track is available
      if (meeting.cr4cc_trackname) {
        try {
          const riskData = await this.injuryService.getTrackRiskScore(meeting.cr4cc_trackname);
          statistics.injuryRisk = riskData.riskScore;
        } catch (error) {
          this.logger.warn('Failed to get injury risk score', { error, track: meeting.cr4cc_trackname });
        }
      }
      
      const result: ICompleteRaceData = {
        meeting,
        races,
        contestants,
        statistics
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      this.logger.info('Retrieved complete meeting data', { 
        meetingId, 
        races: races.length, 
        contestants: contestants.length 
      });
      
      return result;
      
    } catch (error) {
      const structured = UnifiedErrorHandler.handleError(
        error,
        'RaceManagementFacade.getCompleteMeetingData'
      );
      throw new Error(structured.userMessage);
    }
  }
  
  /**
   * Get enriched contestant data with health and performance info
   */
  async getEnrichedContestant(contestantId: string): Promise<IEnrichedContestant> {
    try {
      const contestant = await this.contestantService.getById(contestantId);
      
      if (!contestant) {
        throw UnifiedErrorHandler.createError(
          ErrorType.NOT_FOUND_ERROR,
          `Contestant ${contestantId} not found`
        );
      }
      
      const enriched: IEnrichedContestant = { ...contestant };
      
      // Fetch additional data in parallel
      const [hasInjury, stats] = await Promise.all([
        this.injuryService.hasRecentInjury(contestant.cr616_greyhoundname || ''),
        this.contestantService.getContestantStats(contestant.cr616_greyhoundname || '')
      ]);
      
      enriched.hasRecentInjury = hasInjury;
      enriched.performanceStats = {
        winRate: stats.winRate,
        placeRate: stats.placeRate,
        recentForm: stats.recentForm
      };
      
      // Get injury details if there's a recent injury
      if (hasInjury && contestant.cr616_greyhoundname) {
        const injuries = await this.injuryService.getInjuriesByGreyhound(contestant.cr616_greyhoundname);
        if (injuries.length > 0) {
          enriched.injuryDetails = injuries[0];
        }
      }
      
      return enriched;
      
    } catch (error) {
      const structured = UnifiedErrorHandler.handleError(
        error,
        'RaceManagementFacade.getEnrichedContestant'
      );
      throw new Error(structured.userMessage);
    }
  }
  
  /**
   * Get dashboard data for overview displays
   */
  async getDashboardData(): Promise<IDashboardData> {
    const cacheKey = 'dashboardData';
    
    try {
      // Check cache first
      const cached = this.cache.get<IDashboardData>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Fetch all data in parallel
      const [
        todaysMeetings,
        upcomingRaces,
        recentWinners,
        allTracks
      ] = await Promise.all([
        this.meetingService.getTodaysMeetings(),
        this.raceService.getUpcomingRaces(24),
        this.contestantService.getContestantsWithFilters({ 
          onlyWinners: true, 
          pageSize: 10 
        }).then(r => r.value),
        this.meetingService.getMeetingStatistics()
      ]);
      
      // Build track statistics
      const trackStatistics = new Map<string, any>();
      for (const [track, meetingCount] of Object.entries(allTracks.byTrack)) {
        const [raceStats, injuryRisk] = await Promise.all([
          this.raceService.getRaceStatsByMeeting(track),
          this.injuryService.getTrackRiskScore(track)
        ]);
        
        trackStatistics.set(track, {
          meetings: meetingCount,
          races: raceStats.totalRaces,
          injuryRisk: injuryRisk.riskScore
        });
      }
      
      // Generate alerts
      const alerts: any[] = [];
      
      // Check for high injury risk tracks
      trackStatistics.forEach((stats, track) => {
        if (stats.injuryRisk > 75) {
          alerts.push({
            type: 'error',
            message: `High injury risk at ${track} (Risk Score: ${stats.injuryRisk})`,
            data: { track, riskScore: stats.injuryRisk }
          });
        } else if (stats.injuryRisk > 50) {
          alerts.push({
            type: 'warning',
            message: `Elevated injury risk at ${track} (Risk Score: ${stats.injuryRisk})`,
            data: { track, riskScore: stats.injuryRisk }
          });
        }
      });
      
      // Check for cancelled meetings
      const cancelledToday = todaysMeetings.filter(m => m.cr4cc_cancelled);
      if (cancelledToday.length > 0) {
        alerts.push({
          type: 'warning',
          message: `${cancelledToday.length} meeting(s) cancelled today`,
          data: { meetings: cancelledToday }
        });
      }
      
      const dashboard: IDashboardData = {
        todaysMeetings,
        upcomingRaces,
        recentWinners,
        trackStatistics,
        alerts
      };
      
      // Cache for 1 minute
      this.cache.set(cacheKey, dashboard, 60000);
      
      return dashboard;
      
    } catch (error) {
      const structured = UnifiedErrorHandler.handleError(
        error,
        'RaceManagementFacade.getDashboardData'
      );
      throw new Error(structured.userMessage);
    }
  }
  
  /**
   * Search across all entities
   */
  async searchAll(searchText: string): Promise<ISearchResults> {
    if (!searchText || searchText.length < 2) {
      return { meetings: [], races: [], contestants: [] };
    }
    
    try {
      // Search in parallel
      const [meetings, contestants] = await Promise.all([
        this.meetingService.searchMeetings(searchText),
        this.contestantService.getContestantsWithFilters({
          greyhoundName: searchText,
          pageSize: 20
        }).then(r => r.value)
      ]);
      
      // Races don't have a direct search, so we'll get races from found meetings
      let races: IRace[] = [];
      if (meetings.length > 0) {
        const racePromises = meetings.slice(0, 3).map(m => 
          this.raceService.getRacesByMeeting(m.cr4cc_racemeetingid || '')
        );
        const raceResults = await Promise.all(racePromises);
        races = raceResults.flat().slice(0, 20);
      }
      
      return {
        meetings: meetings.slice(0, 10),
        races: races.slice(0, 10),
        contestants: contestants.slice(0, 10)
      };
      
    } catch (error) {
      this.logger.error('Search failed', { searchText, error });
      return { meetings: [], races: [], contestants: [] };
    }
  }
  
  /**
   * Get filtered meetings
   */
  async getFilteredMeetings(filters: IMeetingFilters) {
    return this.meetingService.getMeetingsWithFilters(filters);
  }
  
  /**
   * Get filtered races
   */
  async getFilteredRaces(filters: IRaceFilters) {
    return this.raceService.getRacesWithFilters(filters);
  }
  
  /**
   * Get filtered contestants
   */
  async getFilteredContestants(filters: IContestantFilters) {
    return this.contestantService.getContestantsWithFilters(filters);
  }
  
  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.cache.clear();
    this.meetingService.clearCache();
    this.raceService.clearCache();
    this.contestantService.clearCache();
    this.injuryService.clearCache();
    this.logger.info('All caches cleared');
  }
  
  /**
   * Get service statistics
   */
  getServiceStatistics() {
    return {
      facade: this.cache.getStats(),
      meetings: this.meetingService.getCacheStats(),
      races: this.raceService.getCacheStats(),
      contestants: this.contestantService.getCacheStats(),
      injuries: this.injuryService.getCacheStats()
    };
  }
}