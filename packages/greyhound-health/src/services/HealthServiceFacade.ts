import { WebPartContext } from '@microsoft/sp-webpart-base';
import { 
  UnifiedLogger,
  UnifiedErrorHandler,
  CacheService,
  ErrorType
} from '@grnsw/shared';
import { SafetyService } from './domain/SafetyService';
import { ICra5eInjuryData } from '../models/ICra5eInjuryData';

/**
 * Safety alert definition
 */
export interface ISafetyAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  track?: string;
  timestamp: Date;
  actionRequired?: string;
}

/**
 * Track safety status
 */
export interface ITrackSafetyStatus {
  track: string;
  safetyScore: number;
  status: 'Safe' | 'Caution' | 'Warning' | 'Critical';
  recentIncidents: number;
  lastIncident?: Date;
  recommendations: string[];
}

/**
 * Safety dashboard data
 */
export interface ISafetyDashboard {
  metrics: {
    todayIncidents: number;
    weekIncidents: number;
    monthIncidents: number;
    criticalCount: number;
    averageRecovery: number;
  };
  trackStatus: ITrackSafetyStatus[];
  recentIncidents: ICra5eInjuryData[];
  alerts: ISafetyAlert[];
  trends: {
    daily: { date: string; count: number }[];
    improving: boolean;
    percentChange: number;
  };
}

/**
 * Greyhound health profile
 */
export interface IGreyhoundHealthProfile {
  name: string;
  injuries: ICra5eInjuryData[];
  riskScore: number;
  status: 'Healthy' | 'Recovering' | 'At Risk' | 'Injured';
  daysInjuryFree: number;
  recommendations: string[];
}

/**
 * Health Service Facade
 * Orchestrates health and safety monitoring services
 */
export class HealthServiceFacade {
  private logger: UnifiedLogger;
  private cache: CacheService;
  private safetyService: SafetyService;
  
  // Track names for monitoring
  private readonly TRACKS = [
    'Wentworth Park', 'The Gardens', 'Richmond', 'Gosford',
    'Maitland', 'Newcastle', 'Bulli', 'Dapto', 'Nowra',
    'Goulburn', 'Wagga Wagga', 'Temora', 'Dubbo', 'Bathurst',
    'Grafton', 'Casino', 'Lismore', 'Taree'
  ];
  
  constructor(private context: WebPartContext) {
    this.logger = UnifiedLogger.getInstance();
    this.cache = new CacheService('health_facade', {
      defaultTTL: 120000, // 2 minutes
      maxSize: 50
    });
    
    this.safetyService = new SafetyService(context);
  }
  
  /**
   * Get comprehensive safety dashboard
   */
  async getSafetyDashboard(): Promise<ISafetyDashboard> {
    const cacheKey = 'safetyDashboard';
    
    try {
      // Check cache
      const cached = this.cache.get<ISafetyDashboard>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Get real-time metrics
      const metrics = await this.safetyService.getRealTimeSafetyMetrics();
      
      // Get trends
      const trends = await this.safetyService.getInjuryTrends(30);
      
      // Calculate month incidents
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthIncidents = trends.daily.reduce((sum, day) => sum + day.count, 0);
      
      // Calculate trend direction
      const firstWeek = trends.daily.slice(0, 7).reduce((sum, d) => sum + d.count, 0);
      const lastWeek = trends.daily.slice(-7).reduce((sum, d) => sum + d.count, 0);
      const improving = lastWeek < firstWeek;
      const percentChange = firstWeek > 0 ? 
        ((lastWeek - firstWeek) / firstWeek) * 100 : 0;
      
      // Get track status for high-risk tracks
      const trackStatusPromises = metrics.topRiskTracks.map(async track => {
        const analysis = await this.safetyService.getTrackSafetyAnalysis(track.track);
        return {
          track: track.track,
          safetyScore: analysis.safetyScore,
          status: this.getStatusFromScore(analysis.safetyScore),
          recentIncidents: analysis.incidents30Days,
          recommendations: analysis.recommendations
        } as ITrackSafetyStatus;
      });
      
      const trackStatus = await Promise.all(trackStatusPromises);
      
      // Generate alerts
      const alerts = this.generateSafetyAlerts(metrics, trackStatus);
      
      const dashboard: ISafetyDashboard = {
        metrics: {
          todayIncidents: metrics.todayIncidents,
          weekIncidents: metrics.weekIncidents,
          monthIncidents,
          criticalCount: metrics.criticalIncidents,
          averageRecovery: trends.averageRecovery
        },
        trackStatus,
        recentIncidents: metrics.recentIncidents,
        alerts,
        trends: {
          daily: trends.daily.map(d => ({ date: d.date, count: d.count })),
          improving,
          percentChange: Math.round(percentChange)
        }
      };
      
      // Cache result
      this.cache.set(cacheKey, dashboard);
      
      return dashboard;
      
    } catch (error) {
      const structured = UnifiedErrorHandler.handleError(
        error,
        'HealthServiceFacade.getSafetyDashboard'
      );
      throw new Error(structured.userMessage);
    }
  }
  
  /**
   * Get detailed track safety analysis
   */
  async getTrackSafety(trackName: string): Promise<ITrackSafetyStatus & {
    analysis: any;
    historicalTrend: { month: string; incidents: number; score: number }[];
  }> {
    const cacheKey = CacheService.createKey('trackSafety', trackName);
    
    try {
      // Check cache
      const cached = this.cache.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Get comprehensive analysis
      const analysis = await this.safetyService.getTrackSafetyAnalysis(trackName);
      
      // Get historical trend (last 6 months)
      const historicalTrend: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - i - 1);
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() - i);
        
        // This would need actual implementation
        const monthName = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        historicalTrend.push({
          month: monthName,
          incidents: Math.floor(Math.random() * 20), // Placeholder
          score: 70 + Math.floor(Math.random() * 30) // Placeholder
        });
      }
      
      const result = {
        track: trackName,
        safetyScore: analysis.safetyScore,
        status: this.getStatusFromScore(analysis.safetyScore),
        recentIncidents: analysis.incidents30Days,
        recommendations: analysis.recommendations,
        analysis,
        historicalTrend
      };
      
      // Cache result
      this.cache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      const structured = UnifiedErrorHandler.handleError(
        error,
        'HealthServiceFacade.getTrackSafety'
      );
      throw new Error(structured.userMessage);
    }
  }
  
  /**
   * Get greyhound health profile
   */
  async getGreyhoundHealth(greyhoundName: string): Promise<IGreyhoundHealthProfile> {
    const cacheKey = CacheService.createKey('greyhoundHealth', greyhoundName);
    
    try {
      // Check cache
      const cached = this.cache.get<IGreyhoundHealthProfile>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Get injury history
      const history = await this.safetyService.getGreyhoundInjuryHistory(greyhoundName);
      
      // Calculate risk score
      let riskScore = 0;
      
      // Factor in injury count
      riskScore += Math.min(50, history.totalInjuries * 10);
      
      // Factor in recency
      if (history.daysInjuryFree < 30) {
        riskScore += 30;
      } else if (history.daysInjuryFree < 90) {
        riskScore += 10;
      }
      
      // Factor in injury types
      if (history.commonInjuryType?.includes('Muscle')) {
        riskScore += 20;
      }
      
      // Determine status
      let status: IGreyhoundHealthProfile['status'] = 'Healthy';
      if (history.daysInjuryFree < 14) {
        status = 'Recovering';
      } else if (riskScore > 70) {
        status = 'At Risk';
      } else if (history.injuries.some(i => !i.cra5e_recovered)) {
        status = 'Injured';
      }
      
      // Generate recommendations
      const recommendations: string[] = [];
      
      if (status === 'Recovering') {
        recommendations.push('Continue recovery protocol');
        recommendations.push('Monitor closely during training');
      }
      
      if (history.totalInjuries > 3) {
        recommendations.push('Consider comprehensive health assessment');
      }
      
      if (history.commonInjuryType) {
        recommendations.push(`Focus on preventing ${history.commonInjuryType} injuries`);
      }
      
      const profile: IGreyhoundHealthProfile = {
        name: greyhoundName,
        injuries: history.injuries,
        riskScore: Math.min(100, riskScore),
        status,
        daysInjuryFree: history.daysInjuryFree,
        recommendations
      };
      
      // Cache result
      this.cache.set(cacheKey, profile);
      
      return profile;
      
    } catch (error) {
      const structured = UnifiedErrorHandler.handleError(
        error,
        'HealthServiceFacade.getGreyhoundHealth'
      );
      throw new Error(structured.userMessage);
    }
  }
  
  /**
   * Report new injury
   */
  async reportInjury(injury: {
    greyhoundName: string;
    track: string;
    injuryType: string;
    severity: string;
    bodyPart?: string;
    description?: string;
  }): Promise<boolean> {
    try {
      const injuryData: Partial<ICra5eInjuryData> = {
        cra5e_greyhoundname: injury.greyhoundName,
        cra5e_track: injury.track,
        cra5e_injurytype: injury.injuryType,
        cra5e_severity: injury.severity,
        cra5e_bodypart: injury.bodyPart,
        cra5e_description: injury.description
      };
      
      await this.safetyService.reportInjury(injuryData);
      
      // Clear relevant caches
      this.cache.invalidatePattern(/^safetyDashboard/);
      this.cache.invalidatePattern(new RegExp(`greyhoundHealth:${injury.greyhoundName}`));
      this.cache.invalidatePattern(new RegExp(`trackSafety:${injury.track}`));
      
      this.logger.info('Injury reported', injury);
      
      return true;
      
    } catch (error) {
      const structured = UnifiedErrorHandler.handleError(
        error,
        'HealthServiceFacade.reportInjury'
      );
      throw new Error(structured.userMessage);
    }
  }
  
  /**
   * Get safety status from score
   */
  private getStatusFromScore(score: number): ITrackSafetyStatus['status'] {
    if (score >= 80) return 'Safe';
    if (score >= 60) return 'Caution';
    if (score >= 40) return 'Warning';
    return 'Critical';
  }
  
  /**
   * Generate safety alerts based on current data
   */
  private generateSafetyAlerts(
    metrics: any,
    trackStatus: ITrackSafetyStatus[]
  ): ISafetyAlert[] {
    const alerts: ISafetyAlert[] = [];
    
    // Critical track alerts
    trackStatus.forEach(track => {
      if (track.status === 'Critical') {
        alerts.push({
          id: `track-critical-${track.track}`,
          type: 'critical',
          title: `Critical Safety Alert - ${track.track}`,
          message: `Track safety score is critically low (${track.safetyScore}). Immediate inspection required.`,
          track: track.track,
          timestamp: new Date(),
          actionRequired: 'Conduct immediate track safety inspection'
        });
      } else if (track.status === 'Warning') {
        alerts.push({
          id: `track-warning-${track.track}`,
          type: 'warning',
          title: `Safety Warning - ${track.track}`,
          message: `Elevated injury risk detected. ${track.recentIncidents} incidents in the last 30 days.`,
          track: track.track,
          timestamp: new Date()
        });
      }
    });
    
    // Critical incident alert
    if (metrics.criticalIncidents > 0) {
      alerts.push({
        id: 'critical-incidents',
        type: 'critical',
        title: 'Critical Injuries Reported',
        message: `${metrics.criticalIncidents} critical injuries reported this week. Review safety protocols.`,
        timestamp: new Date(),
        actionRequired: 'Review and update safety protocols'
      });
    }
    
    // High incident rate alert
    if (metrics.todayIncidents > 5) {
      alerts.push({
        id: 'high-rate-today',
        type: 'warning',
        title: 'High Incident Rate Today',
        message: `${metrics.todayIncidents} incidents reported today. Monitor closely.`,
        timestamp: new Date()
      });
    }
    
    return alerts;
  }
  
  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.cache.clear();
    this.safetyService.clearCache();
    this.logger.info('Health service caches cleared');
  }
  
  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      facade: this.cache.getStats(),
      safety: this.safetyService.getCacheStats()
    };
  }
}