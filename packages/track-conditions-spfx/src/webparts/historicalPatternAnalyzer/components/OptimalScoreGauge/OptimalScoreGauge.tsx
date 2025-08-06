import * as React from 'react';
import styles from './OptimalScoreGauge.module.scss';
import { IOptimalScore } from '../../../../models/IOptimalScore';

export interface IOptimalScoreGaugeProps {
  score: IOptimalScore;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

const OptimalScoreGauge: React.FC<IOptimalScoreGaugeProps> = ({
  score,
  size = 'medium',
  showDetails = true
}) => {
  const radius = size === 'small' ? 60 : size === 'medium' ? 90 : 120;
  const strokeWidth = size === 'small' ? 8 : size === 'medium' ? 12 : 16;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score.score / 100) * circumference;

  const getGaugeColor = (): string => {
    if (score.score >= 80) return '#28a745';
    if (score.score >= 60) return '#ffc107';
    if (score.score >= 40) return '#fd7e14';
    return '#dc3545';
  };

  const getBackgroundColor = (): string => {
    return '#e0e0e0';
  };

  return (
    <div className={`${styles.optimalScoreGauge} ${styles[size]}`}>
      <div className={styles.gaugeContainer}>
        <svg
          height={radius * 2}
          width={radius * 2}
          className={styles.gauge}
        >
          <circle
            stroke={getBackgroundColor()}
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={getGaugeColor()}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={styles.progress}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
          <text
            x="50%"
            y="50%"
            dy=".3em"
            textAnchor="middle"
            className={styles.scoreText}
          >
            {score.score}
          </text>
          <text
            x="50%"
            y="60%"
            dy=".3em"
            textAnchor="middle"
            className={styles.scoreLabel}
          >
            {score.category}
          </text>
        </svg>
      </div>

      {showDetails && (
        <div className={styles.details}>
          <h4>{score.trackName}</h4>
          <div className={styles.timestamp}>
            {score.timestamp.toLocaleTimeString()}
          </div>
          <div className={styles.factorGrid}>
            {Object.entries(score.factors).map(([key, value]) => {
              if (value === 0) return null;
              return (
                <div key={key} className={styles.factorItem}>
                  <span className={styles.factorName}>{key}:</span>
                  <span className={value < 0 ? styles.negative : styles.positive}>
                    {value > 0 ? '+' : ''}{value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimalScoreGauge;