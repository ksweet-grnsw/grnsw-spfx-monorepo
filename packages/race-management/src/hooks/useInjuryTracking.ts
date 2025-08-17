import { useState, useCallback, useMemo } from 'react';
import { IContestant, IHealthCheck, IGreyhound } from '../models/IRaceData';

export interface InjurySummary {
  total: number;
  byCategory: Record<string, number>;
}

/**
 * Hook to manage injury tracking and summaries
 * Centralizes injury-related logic
 */
export function useInjuryTracking() {
  const [meetingInjurySummaries, setMeetingInjurySummaries] = useState<Map<string, InjurySummary>>(new Map());
  const [raceInjurySummaries, setRaceInjurySummaries] = useState<Map<string, number>>(new Map());
  const [greyhoundInjuries, setGreyhoundInjuries] = useState<Map<string, boolean>>(new Map());
  const [greyhoundHealthChecks, setGreyhoundHealthChecks] = useState<Map<string, IHealthCheck[]>>(new Map());

  // Calculate injury summary for a set of health checks
  const calculateInjurySummary = useCallback((healthChecks: IHealthCheck[]): InjurySummary => {
    const summary: InjurySummary = {
      total: 0,
      byCategory: {}
    };

    healthChecks.forEach(check => {
      if (check.cra5e_injurycategory) {
        summary.total++;
        const category = check.cra5e_injurycategory;
        summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;
      }
    });

    return summary;
  }, []);

  // Update meeting injury summary
  const updateMeetingInjurySummary = useCallback((meetingId: string, healthChecks: IHealthCheck[]) => {
    const summary = calculateInjurySummary(healthChecks);
    setMeetingInjurySummaries(prev => new Map(prev).set(meetingId, summary));
  }, [calculateInjurySummary]);

  // Update race injury count
  const updateRaceInjuryCount = useCallback((raceId: string, count: number) => {
    setRaceInjurySummaries(prev => new Map(prev).set(raceId, count));
  }, []);

  // Mark greyhound as having injury
  const markGreyhoundInjury = useCallback((contestantId: string, hasInjury: boolean) => {
    setGreyhoundInjuries(prev => new Map(prev).set(contestantId, hasInjury));
  }, []);

  // Store health checks for a greyhound
  const setGreyhoundHealthCheckData = useCallback((greyhoundId: string, healthChecks: IHealthCheck[]) => {
    setGreyhoundHealthChecks(prev => new Map(prev).set(greyhoundId, healthChecks));
  }, []);

  // Get injury severity order
  const getInjurySeverityOrder = useCallback((category: string): number => {
    const severityOrder: Record<string, number> = {
      'Cat A': 1,
      'Cat B': 2,
      'Cat C': 3,
      'Cat D': 4,
      'Cat E': 5
    };
    return severityOrder[category] || 999;
  }, []);

  // Sort health checks by severity
  const sortHealthChecksBySeverity = useCallback((healthChecks: IHealthCheck[]): IHealthCheck[] => {
    return [...healthChecks].sort((a, b) => {
      const severityA = getInjurySeverityOrder(a.cra5e_injurycategory || '');
      const severityB = getInjurySeverityOrder(b.cra5e_injurycategory || '');
      return severityA - severityB;
    });
  }, [getInjurySeverityOrder]);

  // Get most severe injury for a greyhound
  const getMostSevereInjury = useCallback((healthChecks: IHealthCheck[]): IHealthCheck | null => {
    if (!healthChecks.length) return null;
    const sorted = sortHealthChecksBySeverity(healthChecks);
    return sorted[0];
  }, [sortHealthChecksBySeverity]);

  // Filter contestants by injury categories
  const filterContestantsByInjury = useCallback((
    contestants: IContestant[],
    selectedCategories: string[],
    greyhoundHealthData: Map<string, IHealthCheck[]>
  ): IContestant[] => {
    if (!selectedCategories.length) return contestants;

    return contestants.filter(contestant => {
      const healthChecks = greyhoundHealthData.get(contestant.cr616_contestantsid);
      if (!healthChecks) return false;

      return healthChecks.some(check => 
        selectedCategories.includes(check.cra5e_injurycategory || '')
      );
    });
  }, []);

  // Get injury statistics
  const getInjuryStats = useMemo(() => {
    const totalMeetingsWithInjuries = Array.from(meetingInjurySummaries.values())
      .filter(summary => summary.total > 0).length;
    
    const totalInjuries = Array.from(meetingInjurySummaries.values())
      .reduce((sum, summary) => sum + summary.total, 0);
    
    const injuriesByCategory: Record<string, number> = {};
    Array.from(meetingInjurySummaries.values()).forEach(summary => {
      Object.entries(summary.byCategory).forEach(([category, count]) => {
        injuriesByCategory[category] = (injuriesByCategory[category] || 0) + count;
      });
    });

    return {
      totalMeetingsWithInjuries,
      totalInjuries,
      injuriesByCategory,
      averageInjuriesPerMeeting: totalMeetingsWithInjuries > 0 
        ? (totalInjuries / totalMeetingsWithInjuries).toFixed(1) 
        : '0'
    };
  }, [meetingInjurySummaries]);

  // Clear all injury data
  const clearInjuryData = useCallback(() => {
    setMeetingInjurySummaries(new Map());
    setRaceInjurySummaries(new Map());
    setGreyhoundInjuries(new Map());
    setGreyhoundHealthChecks(new Map());
  }, []);

  return {
    // State
    meetingInjurySummaries,
    raceInjurySummaries,
    greyhoundInjuries,
    greyhoundHealthChecks,
    
    // Methods
    updateMeetingInjurySummary,
    updateRaceInjuryCount,
    markGreyhoundInjury,
    setGreyhoundHealthCheckData,
    calculateInjurySummary,
    sortHealthChecksBySeverity,
    getMostSevereInjury,
    filterContestantsByInjury,
    clearInjuryData,
    
    // Computed
    injuryStats: getInjuryStats
  };
}