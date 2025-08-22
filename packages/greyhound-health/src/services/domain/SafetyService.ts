import { WebPartContext } from '@microsoft/sp-webpart-base';
import { 
  UnifiedBaseDataverseService,
  DATAVERSE_ENVIRONMENTS,
  IODataQuery,
  IDataverseResponse
} from '@grnsw/shared';
import { ICra5eInjuryData } from '../../models/ICra5eInjuryData';

/**
 * Domain service for Safety and Injury data
 * Handles all business logic related to safety monitoring
 */
export class SafetyService extends UnifiedBaseDataverseService<ICra5eInjuryData> {
  protected tableName = 'injuries';
  
  protected getTableName(): string {
    return this.environment.tables.injuries;
  }
  
  constructor(context: WebPartContext) {
    super(context, DATAVERSE_ENVIRONMENTS.health, {
      enableCaching: true,
      cacheTTL: 120000, // 2 minutes for safety data
      enableThrottling: true,
      requestsPerSecond: 75
    });
  }
  
  /**
   * Get real-time safety metrics
   */
  async getRealTimeSafetyMetrics(): Promise<{
    todayIncidents: number;
    weekIncidents: number;
    criticalIncidents: number;
    topRiskTracks: { track: string; incidents: number; risk: string }[];
    recentIncidents: ICra5eInjuryData[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Fetch data in parallel
    const [todayData, weekData, criticalData, recentData] = await Promise.all([
      this.getList({
        filter: `cra5e_injurydate ge ${today.toISOString()}`,
        top: 100
      }),
      this.getList({
        filter: `cra5e_injurydate ge ${weekAgo.toISOString()}`,
        top: 500
      }),
      this.getList({
        filter: `cra5e_severity eq 'Critical' and cra5e_injurydate ge ${weekAgo.toISOString()}`,
        top: 50
      }),
      this.getList({
        orderBy: 'cra5e_injurydate desc',
        top: 10
      })
    ]);
    
    // Calculate track risk
    const trackIncidents = new Map<string, number>();
    weekData.value.forEach(incident => {
      if (incident.cra5e_track) {
        trackIncidents.set(
          incident.cra5e_track,
          (trackIncidents.get(incident.cra5e_track) || 0) + 1
        );
      }
    });
    
    // Sort tracks by incident count and calculate risk
    const topRiskTracks = Array.from(trackIncidents.entries())
      .map(([track, incidents]) => ({
        track,
        incidents,
        risk: incidents > 10 ? 'High' : incidents > 5 ? 'Medium' : 'Low'
      }))
      .sort((a, b) => b.incidents - a.incidents)
      .slice(0, 5);
    
    return {
      todayIncidents: todayData.value.length,
      weekIncidents: weekData.value.length,
      criticalIncidents: criticalData.value.length,
      topRiskTracks,
      recentIncidents: recentData.value
    };
  }
  
  /**
   * Get injury trends over time
   */
  async getInjuryTrends(days: number = 30): Promise<{
    daily: { date: string; count: number; severity: { [key: string]: number } }[];
    byType: { [type: string]: number };
    bySeverity: { [severity: string]: number };
    byBodyPart: { [part: string]: number };
    averageRecovery: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const injuries = await this.getList({
      filter: `cra5e_injurydate ge ${startDate.toISOString()}`,
      orderBy: 'cra5e_injurydate asc'
    });
    
    // Initialize trend data
    const dailyMap = new Map<string, { count: number; severity: { [key: string]: number } }>();
    const byType: { [type: string]: number } = {};
    const bySeverity: { [severity: string]: number } = {};
    const byBodyPart: { [part: string]: number } = {};
    let totalRecovery = 0;
    let recoveryCount = 0;
    
    injuries.value.forEach(injury => {
      // Daily aggregation
      if (injury.cra5e_injurydate) {
        const dateKey = injury.cra5e_injurydate.split('T')[0];
        
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { count: 0, severity: {} });
        }
        
        const daily = dailyMap.get(dateKey)!;
        daily.count++;
        
        if (injury.cra5e_severity) {
          daily.severity[injury.cra5e_severity] = 
            (daily.severity[injury.cra5e_severity] || 0) + 1;
        }
      }
      
      // Type aggregation
      if (injury.cra5e_injurytype) {
        byType[injury.cra5e_injurytype] = (byType[injury.cra5e_injurytype] || 0) + 1;
      }
      
      // Severity aggregation
      if (injury.cra5e_severity) {
        bySeverity[injury.cra5e_severity] = (bySeverity[injury.cra5e_severity] || 0) + 1;
      }
      
      // Body part aggregation
      if (injury.cra5e_bodypart) {
        byBodyPart[injury.cra5e_bodypart] = (byBodyPart[injury.cra5e_bodypart] || 0) + 1;
      }
      
      // Recovery time
      if (injury.cra5e_recoverydays) {
        totalRecovery += injury.cra5e_recoverydays;
        recoveryCount++;
      }
    });
    
    // Convert daily map to array
    const daily = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate average recovery
    const averageRecovery = recoveryCount > 0 ? totalRecovery / recoveryCount : 0;
    
    return {
      daily,
      byType,
      bySeverity,
      byBodyPart,
      averageRecovery: Math.round(averageRecovery)
    };
  }
  
  /**
   * Get track safety analysis
   */
  async getTrackSafetyAnalysis(trackName: string): Promise<{
    safetyScore: number; // 0-100 (100 = safest)
    incidents30Days: number;
    incidents90Days: number;
    commonInjuries: { type: string; count: number }[];
    riskFactors: string[];
    recommendations: string[];
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Fetch incident data
    const [recent, quarter] = await Promise.all([
      this.getList({
        filter: `cra5e_track eq '${trackName}' and cra5e_injurydate ge ${thirtyDaysAgo.toISOString()}`
      }),
      this.getList({
        filter: `cra5e_track eq '${trackName}' and cra5e_injurydate ge ${ninetyDaysAgo.toISOString()}`
      })
    ]);
    
    // Calculate common injuries
    const injuryTypes = new Map<string, number>();
    let severityScore = 0;
    
    quarter.value.forEach(injury => {
      if (injury.cra5e_injurytype) {
        injuryTypes.set(
          injury.cra5e_injurytype,
          (injuryTypes.get(injury.cra5e_injurytype) || 0) + 1
        );
      }
      
      // Add to severity score
      switch (injury.cra5e_severity) {
        case 'Critical':
          severityScore += 10;
          break;
        case 'Severe':
          severityScore += 5;
          break;
        case 'Moderate':
          severityScore += 2;
          break;
        case 'Minor':
          severityScore += 1;
          break;
      }
    });
    
    // Convert to sorted array
    const commonInjuries = Array.from(injuryTypes.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate safety score (inverse of risk)
    const incidentRate = recent.value.length / 30; // Per day
    const severityAvg = quarter.value.length > 0 ? severityScore / quarter.value.length : 0;
    
    // Safety score calculation (100 = safest)
    let safetyScore = 100;
    safetyScore -= Math.min(50, incidentRate * 20); // Up to 50 points for incident rate
    safetyScore -= Math.min(30, severityAvg * 3); // Up to 30 points for severity
    safetyScore -= Math.min(20, (quarter.value.length - recent.value.length) * 2); // Trend penalty
    
    safetyScore = Math.max(0, Math.round(safetyScore));
    
    // Identify risk factors
    const riskFactors: string[] = [];
    
    if (incidentRate > 1) {
      riskFactors.push('High incident frequency');
    }
    
    if (severityAvg > 3) {
      riskFactors.push('High severity injuries common');
    }
    
    const muscleInjuries = commonInjuries.find(i => i.type?.includes('Muscle'));
    if (muscleInjuries && muscleInjuries.count > 5) {
      riskFactors.push('Frequent muscle injuries - track surface may need inspection');
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (safetyScore < 50) {
      recommendations.push('Immediate track inspection recommended');
    }
    
    if (safetyScore < 70) {
      recommendations.push('Review track maintenance schedule');
      recommendations.push('Consider additional safety measures');
    }
    
    if (incidentRate > 0.5) {
      recommendations.push('Increase pre-race track inspections');
    }
    
    if (commonInjuries[0]?.count > 10) {
      recommendations.push(`Investigate cause of frequent ${commonInjuries[0].type} injuries`);
    }
    
    return {
      safetyScore,
      incidents30Days: recent.value.length,
      incidents90Days: quarter.value.length,
      commonInjuries,
      riskFactors,
      recommendations
    };
  }
  
  /**
   * Get greyhound injury history
   */
  async getGreyhoundInjuryHistory(greyhoundName: string): Promise<{
    injuries: ICra5eInjuryData[];
    totalInjuries: number;
    daysInjuryFree: number;
    riskProfile: 'Low' | 'Medium' | 'High';
    commonInjuryType?: string;
  }> {
    const injuries = await this.getList({
      filter: `cra5e_greyhoundname eq '${greyhoundName}'`,
      orderBy: 'cra5e_injurydate desc'
    });
    
    // Calculate days injury free
    let daysInjuryFree = 0;
    if (injuries.value.length > 0 && injuries.value[0].cra5e_injurydate) {
      const lastInjury = new Date(injuries.value[0].cra5e_injurydate);
      daysInjuryFree = Math.floor((Date.now() - lastInjury.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    // Determine risk profile
    let riskProfile: 'Low' | 'Medium' | 'High' = 'Low';
    if (injuries.value.length > 5) {
      riskProfile = 'High';
    } else if (injuries.value.length > 2) {
      riskProfile = 'Medium';
    }
    
    // Find most common injury type
    const injuryTypes = new Map<string, number>();
    injuries.value.forEach(injury => {
      if (injury.cra5e_injurytype) {
        injuryTypes.set(
          injury.cra5e_injurytype,
          (injuryTypes.get(injury.cra5e_injurytype) || 0) + 1
        );
      }
    });
    
    const commonType = Array.from(injuryTypes.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      injuries: injuries.value,
      totalInjuries: injuries.value.length,
      daysInjuryFree,
      riskProfile,
      commonInjuryType: commonType?.[0]
    };
  }
  
  /**
   * Report new injury
   */
  async reportInjury(injuryData: Partial<ICra5eInjuryData>): Promise<ICra5eInjuryData> {
    // Set default values
    const data: Partial<ICra5eInjuryData> = {
      ...injuryData,
      cra5e_injurydate: injuryData.cra5e_injurydate || new Date().toISOString(),
      cra5e_status: 'Active',
      cra5e_recovered: false
    };
    
    // Clear relevant caches
    this.cache.invalidatePattern(/^getList/);
    
    return this.create(data);
  }
  
  /**
   * Update injury recovery status
   */
  async updateRecoveryStatus(
    injuryId: string,
    recovered: boolean,
    recoveryDays?: number,
    notes?: string
  ): Promise<ICra5eInjuryData> {
    const updateData: Partial<ICra5eInjuryData> = {
      cra5e_recovered: recovered,
      cra5e_status: recovered ? 'Recovered' : 'Active'
    };
    
    if (recoveryDays !== undefined) {
      updateData.cra5e_recoverydays = recoveryDays;
    }
    
    if (notes) {
      updateData.cra5e_notes = notes;
    }
    
    if (recovered) {
      updateData.cra5e_recoverydate = new Date().toISOString();
    }
    
    return this.update(injuryId, updateData);
  }
}