import { WebPartContext } from '@microsoft/sp-webpart-base';
import { 
  UnifiedBaseDataverseService,
  DATAVERSE_ENVIRONMENTS,
  IODataQuery,
  IDataverseResponse
} from '@grnsw/shared';
import { IInjury, IGreyhound, IHealthCheck } from '../../models/IRaceData';

/**
 * Domain service for Injury and Health data
 * Connects to the health Dataverse environment
 */
export class InjuryService extends UnifiedBaseDataverseService<IInjury> {
  protected tableName = 'injuries';
  
  protected getTableName(): string {
    return this.environment.tables.injuries;
  }
  
  constructor(context: WebPartContext) {
    // Note: This service connects to the HEALTH environment, not racing
    super(context, DATAVERSE_ENVIRONMENTS.health, {
      enableCaching: true,
      cacheTTL: 120000, // 2 minutes for injury data
      enableThrottling: true,
      requestsPerSecond: 75 // Lower rate limit for health environment
    });
  }
  
  /**
   * Get recent injuries
   */
  async getRecentInjuries(days: number = 30): Promise<IInjury[]> {
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);
    
    const response = await this.getList({
      filter: `cra5e_injurydate ge ${dateFilter.toISOString()}`,
      orderBy: 'cra5e_injurydate desc',
      top: 100
    });
    
    return response.value;
  }
  
  /**
   * Get injuries by greyhound
   */
  async getInjuriesByGreyhound(greyhoundName: string): Promise<IInjury[]> {
    const response = await this.getList({
      filter: `cra5e_greyhoundname eq '${greyhoundName}'`,
      orderBy: 'cra5e_injurydate desc'
    });
    
    return response.value;
  }
  
  /**
   * Get injuries by track
   */
  async getInjuriesByTrack(trackName: string, days: number = 90): Promise<IInjury[]> {
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);
    
    const response = await this.getList({
      filter: `cra5e_track eq '${trackName}' and cra5e_injurydate ge ${dateFilter.toISOString()}`,
      orderBy: 'cra5e_injurydate desc'
    });
    
    return response.value;
  }
  
  /**
   * Get injury statistics by track
   */
  async getInjuryStatsByTrack(trackName: string): Promise<{
    totalInjuries: number;
    severityBreakdown: { [severity: string]: number };
    typeBreakdown: { [type: string]: number };
    monthlyTrend: { [month: string]: number };
    averageRecoveryDays: number;
  }> {
    const injuries = await this.getInjuriesByTrack(trackName, 365); // Get 1 year of data
    
    const stats = {
      totalInjuries: injuries.length,
      severityBreakdown: {} as { [severity: string]: number },
      typeBreakdown: {} as { [type: string]: number },
      monthlyTrend: {} as { [month: string]: number },
      averageRecoveryDays: 0
    };
    
    let totalRecoveryDays = 0;
    let recoveryCount = 0;
    
    injuries.forEach(injury => {
      // Count by severity
      if (injury.cra5e_severity) {
        stats.severityBreakdown[injury.cra5e_severity] = 
          (stats.severityBreakdown[injury.cra5e_severity] || 0) + 1;
      }
      
      // Count by type
      if (injury.cra5e_injurytype) {
        stats.typeBreakdown[injury.cra5e_injurytype] = 
          (stats.typeBreakdown[injury.cra5e_injurytype] || 0) + 1;
      }
      
      // Monthly trend
      if (injury.cra5e_injurydate) {
        const date = new Date(injury.cra5e_injurydate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        stats.monthlyTrend[monthKey] = (stats.monthlyTrend[monthKey] || 0) + 1;
      }
      
      // Calculate recovery days
      if (injury.cra5e_recoverydays) {
        totalRecoveryDays += injury.cra5e_recoverydays;
        recoveryCount++;
      }
    });
    
    // Calculate average recovery
    if (recoveryCount > 0) {
      stats.averageRecoveryDays = totalRecoveryDays / recoveryCount;
    }
    
    return stats;
  }
  
  /**
   * Get active injuries (not yet recovered)
   */
  async getActiveInjuries(): Promise<IInjury[]> {
    const response = await this.getList({
      filter: `cra5e_status eq 'Active' or cra5e_recovered eq false`,
      orderBy: 'cra5e_injurydate desc'
    });
    
    return response.value;
  }
  
  /**
   * Check if greyhound has recent injury
   */
  async hasRecentInjury(greyhoundName: string, days: number = 30): Promise<boolean> {
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);
    
    const response = await this.getList({
      filter: `cra5e_greyhoundname eq '${greyhoundName}' and cra5e_injurydate ge ${dateFilter.toISOString()}`,
      top: 1
    });
    
    return response.value.length > 0;
  }
  
  /**
   * Get injury risk score for a track
   */
  async getTrackRiskScore(trackName: string): Promise<{
    riskScore: number; // 0-100
    factors: {
      recentInjuryRate: number;
      severityScore: number;
      recoveryTimeScore: number;
    };
    recommendation: string;
  }> {
    const injuries = await this.getInjuriesByTrack(trackName, 90);
    
    // Calculate recent injury rate (injuries per month)
    const injuryRate = (injuries.length / 3); // 3 months
    
    // Calculate severity score
    let severityTotal = 0;
    injuries.forEach(injury => {
      switch (injury.cra5e_severity?.toLowerCase()) {
        case 'critical':
        case 'severe':
          severityTotal += 3;
          break;
        case 'moderate':
          severityTotal += 2;
          break;
        case 'minor':
          severityTotal += 1;
          break;
      }
    });
    const severityScore = injuries.length > 0 ? (severityTotal / injuries.length) : 0;
    
    // Calculate recovery time score
    let totalRecovery = 0;
    let recoveryCount = 0;
    injuries.forEach(injury => {
      if (injury.cra5e_recoverydays) {
        totalRecovery += injury.cra5e_recoverydays;
        recoveryCount++;
      }
    });
    const avgRecovery = recoveryCount > 0 ? (totalRecovery / recoveryCount) : 0;
    const recoveryScore = Math.min(avgRecovery / 30, 3); // Normalize to 0-3 scale
    
    // Calculate overall risk score (0-100)
    const riskScore = Math.min(
      100,
      (injuryRate * 10) + (severityScore * 20) + (recoveryScore * 10)
    );
    
    // Generate recommendation
    let recommendation = '';
    if (riskScore < 25) {
      recommendation = 'Low risk - Normal racing conditions';
    } else if (riskScore < 50) {
      recommendation = 'Moderate risk - Monitor track conditions closely';
    } else if (riskScore < 75) {
      recommendation = 'High risk - Consider additional safety measures';
    } else {
      recommendation = 'Very high risk - Immediate track inspection recommended';
    }
    
    return {
      riskScore: Math.round(riskScore),
      factors: {
        recentInjuryRate: injuryRate,
        severityScore,
        recoveryTimeScore: recoveryScore
      },
      recommendation
    };
  }
}

/**
 * Service for Greyhound health data
 */
export class GreyhoundHealthService extends UnifiedBaseDataverseService<IGreyhound> {
  protected tableName = 'greyhounds';
  
  protected getTableName(): string {
    return this.environment.tables.greyhounds;
  }
  
  constructor(context: WebPartContext) {
    super(context, DATAVERSE_ENVIRONMENTS.health, {
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes
      enableThrottling: true,
      requestsPerSecond: 75
    });
  }
  
  /**
   * Get greyhound health profile
   */
  async getGreyhoundProfile(greyhoundName: string): Promise<IGreyhound | null> {
    const response = await this.getList({
      filter: `cra5e_name eq '${greyhoundName}'`,
      top: 1
    });
    
    return response.value[0] || null;
  }
  
  /**
   * Get greyhounds with health issues
   */
  async getGreyhoundsWithHealthIssues(): Promise<IGreyhound[]> {
    const response = await this.getList({
      filter: `cra5e_hasactiveinjury eq true or cra5e_healthstatus eq 'Injured'`,
      orderBy: 'cra5e_lastcheckdate desc'
    });
    
    return response.value;
  }
}

/**
 * Service for Health Check data
 */
export class HealthCheckService extends UnifiedBaseDataverseService<IHealthCheck> {
  protected tableName = 'healthChecks';
  
  protected getTableName(): string {
    return this.environment.tables.healthChecks; // Note: misspelled in Dataverse as 'heathchecks'
  }
  
  constructor(context: WebPartContext) {
    super(context, DATAVERSE_ENVIRONMENTS.health, {
      enableCaching: true,
      cacheTTL: 120000, // 2 minutes
      enableThrottling: true,
      requestsPerSecond: 75
    });
  }
  
  /**
   * Get recent health checks for a greyhound
   */
  async getHealthChecks(greyhoundId: string, limit: number = 10): Promise<IHealthCheck[]> {
    const response = await this.getList({
      filter: `_cra5e_greyhound_value eq ${greyhoundId}`,
      orderBy: 'cra5e_checkdate desc',
      top: limit
    });
    
    return response.value;
  }
  
  /**
   * Get failed health checks
   */
  async getFailedHealthChecks(days: number = 7): Promise<IHealthCheck[]> {
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);
    
    const response = await this.getList({
      filter: `cra5e_passed eq false and cra5e_checkdate ge ${dateFilter.toISOString()}`,
      orderBy: 'cra5e_checkdate desc'
    });
    
    return response.value;
  }
}