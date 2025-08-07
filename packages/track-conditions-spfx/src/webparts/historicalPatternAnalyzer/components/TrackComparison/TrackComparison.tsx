import * as React from 'react';
import styles from './TrackComparison.module.scss';
import { IDataverseWeatherData } from '../../../../models/IDataverseWeatherData';
import { IOptimalScore } from '../../../../models/IOptimalScore';
import { Icon } from '@fluentui/react/lib/Icon';

export interface ITrackComparisonProps {
  tracks: string[];
  currentConditions: Map<string, IDataverseWeatherData>;
  optimalScores: Map<string, IOptimalScore>;
  onTrackSelect: (track: string) => void;
}

const TrackComparison: React.FC<ITrackComparisonProps> = ({
  tracks,
  currentConditions,
  optimalScores,
  onTrackSelect
}) => {
  // Sort tracks by optimal score
  const sortedTracks = [...tracks].sort((a, b) => {
    const scoreA = optimalScores.get(a)?.score || 0;
    const scoreB = optimalScores.get(b)?.score || 0;
    return scoreB - scoreA;
  });

  const getScoreColor = (score: number): string => {
    if (score >= 80) return styles.excellent;
    if (score >= 60) return styles.good;
    if (score >= 40) return styles.fair;
    return styles.poor;
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'improving': return 'TriangleSolidUp12';
      case 'declining': return 'TriangleSolidDown12';
      default: return 'CircleFill';
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'improving': return styles.improving;
      case 'declining': return styles.declining;
      default: return styles.stable;
    }
  };

  return (
    <div className={styles.trackComparison}>
      <h3>Track Conditions Comparison</h3>
      <div className={styles.trackGrid}>
        {sortedTracks.map((track, index) => {
          const conditions = currentConditions.get(track);
          const score = optimalScores.get(track);

          if (!conditions || !score) {
            return (
              <div key={track} className={styles.trackCard}>
                <div className={styles.trackName}>{track}</div>
                <div className={styles.noData}>No data available</div>
              </div>
            );
          }

          return (
            <div
              key={track}
              className={`${styles.trackCard} ${index === 0 ? styles.best : ''}`}
              onClick={() => onTrackSelect(track)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.trackHeader}>
                <div className={styles.trackName}>{track}</div>
                {index === 0 && (
                  <div className={styles.bestBadge}>
                    <Icon iconName="FavoriteStarFill" />
                    Best
                  </div>
                )}
              </div>

              <div className={styles.scoreSection}>
                <div className={`${styles.score} ${getScoreColor(score.score)}`}>
                  {score.score}
                </div>
                <div className={styles.scoreLabel}>Optimal Score</div>
                <div className={`${styles.trend} ${getTrendColor(score.trend)}`}>
                  <Icon iconName={getTrendIcon(score.trend)} />
                  <span>{score.trend}</span>
                </div>
              </div>

              <div className={styles.conditions}>
                <div className={styles.conditionItem}>
                  <Icon iconName="Sunny" />
                  <span>{conditions.cr4cc_temp_celsius?.toFixed(1)}°C</span>
                </div>
                <div className={styles.conditionItem}>
                  <Icon iconName="Duststorm" />
                  <span>{conditions.cr4cc_wind_speed_kmh?.toFixed(1)} km/h</span>
                </div>
                <div className={styles.conditionItem}>
                  <Icon iconName="Precipitation" />
                  <span>{conditions.cr4cc_hum?.toFixed(0)}%</span>
                </div>
                {(conditions.cr4cc_rainfall_last_60_min_mm || 0) > 0 && (
                  <div className={`${styles.conditionItem} ${styles.rain}`}>
                    <Icon iconName="Rain" />
                    <span>{conditions.cr4cc_rainfall_last_60_min_mm?.toFixed(1)}mm</span>
                  </div>
                )}
              </div>

              <div className={styles.factors}>
                <div className={styles.factorBreakdown}>
                  <div className={styles.factorTitle}>Score Adjustments:</div>
                  {Object.entries(score.factors).map(([factor, value]) => {
                    if (value === 0) return null;
                    const factorLabel = factor.charAt(0).toUpperCase() + factor.slice(1);
                    return (
                      <div key={factor} className={styles.factor}>
                        <span className={styles.factorName}>{factorLabel}:</span>
                        <span className={value < 0 ? styles.negative : styles.positive}>
                          {value > 0 ? '+' : ''}{value} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackComparison;