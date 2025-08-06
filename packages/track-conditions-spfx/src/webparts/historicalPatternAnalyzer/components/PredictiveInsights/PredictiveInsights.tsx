import * as React from 'react';
import styles from './PredictiveInsights.module.scss';
import { IDataverseWeatherData } from '../../../../models/IDataverseWeatherData';
import { IPrediction } from '../../../../models/IPrediction';
import { Icon } from '@fluentui/react/lib/Icon';

export interface IPredictiveInsightsProps {
  predictions: IPrediction[];
  currentConditions: Map<string, IDataverseWeatherData>;
  historicalData: IDataverseWeatherData[];
}

const PredictiveInsights: React.FC<IPredictiveInsightsProps> = ({
  predictions,
  currentConditions,
  historicalData
}) => {
  const getPredictionIcon = (type: string): string => {
    switch (type) {
      case 'optimal_window': return 'Clock';
      case 'condition_forecast': return 'PartlyCloudyDay';
      case 'recovery_time': return 'Rain';
      case 'delay_likelihood': return 'Warning';
      default: return 'Info';
    }
  };

  const getPredictionColor = (confidence: number): string => {
    if (confidence >= 80) return styles.highConfidence;
    if (confidence >= 60) return styles.mediumConfidence;
    return styles.lowConfidence;
  };

  const formatPredictionValue = (prediction: IPrediction): string => {
    if (prediction.type === 'recovery_time') {
      return `${prediction.prediction.value} ${prediction.prediction.unit}`;
    }
    if (prediction.type === 'optimal_window') {
      return prediction.prediction.value.toString();
    }
    return `${prediction.prediction.value} ${prediction.prediction.unit}`;
  };

  const getSimilarDays = (trackName: string): Array<{date: Date; score: number}> => {
    const currentData = currentConditions.get(trackName);
    if (!currentData) return [];

    const trackHistory = historicalData.filter(d => d.cr4cc_track_name === trackName);
    const similarDays: Array<{data: IDataverseWeatherData; similarity: number}> = [];

    trackHistory.forEach(historical => {
      const tempDiff = Math.abs((historical.cr4cc_temp_celsius || 0) - (currentData.cr4cc_temp_celsius || 0));
      const windDiff = Math.abs((historical.cr4cc_wind_speed_kmh || 0) - (currentData.cr4cc_wind_speed_kmh || 0));
      const humDiff = Math.abs((historical.cr4cc_hum || 0) - (currentData.cr4cc_hum || 0));
      
      const similarity = 100 - (tempDiff * 2 + windDiff + humDiff / 2);
      
      if (similarity > 80) {
        similarDays.push({ data: historical, similarity });
      }
    });

    return similarDays
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(item => ({
        date: new Date(item.data.createdon),
        score: Math.round(item.similarity)
      }));
  };

  const groupedPredictions = predictions.reduce((acc, pred) => {
    if (!acc[pred.trackName]) {
      acc[pred.trackName] = [];
    }
    acc[pred.trackName].push(pred);
    return acc;
  }, {} as Record<string, IPrediction[]>);

  return (
    <div className={styles.predictiveInsights}>
      <h3>Predictive Insights</h3>
      
      <div className={styles.predictionsGrid}>
        {Object.entries(groupedPredictions).map(([trackName, trackPredictions]) => (
          <div key={trackName} className={styles.trackSection}>
            <h4>{trackName}</h4>
            
            <div className={styles.predictions}>
              {trackPredictions.map((prediction, index) => (
                <div key={index} className={styles.predictionCard}>
                  <div className={styles.predictionHeader}>
                    <Icon iconName={getPredictionIcon(prediction.type)} />
                    <span className={styles.predictionType}>
                      {prediction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  
                  <div className={styles.predictionValue}>
                    {formatPredictionValue(prediction)}
                  </div>
                  
                  <div className={`${styles.confidenceSection} ${getPredictionColor(prediction.prediction.confidence)}`}>
                    <span className={styles.confidenceLabel}>Confidence:</span>
                    <div className={styles.confidenceBar}>
                      <div 
                        className={styles.confidenceFill}
                        style={{ width: `${prediction.prediction.confidence}%` }}
                      />
                    </div>
                    <span className={styles.confidenceValue}>
                      {prediction.prediction.confidence}%
                    </span>
                  </div>
                  
                  <div className={styles.basedOn}>
                    <Icon iconName="Info" />
                    {prediction.basedOn}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.similarDays}>
              <h5>Similar Historical Days</h5>
              {getSimilarDays(trackName).length > 0 ? (
                <div className={styles.daysList}>
                  {getSimilarDays(trackName).map((day, index) => (
                    <div key={index} className={styles.similarDay}>
                      <span className={styles.date}>
                        {day.date.toLocaleDateString([], { 
                          month: 'short', 
                          day: 'numeric',
                          year: day.date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </span>
                      <span className={styles.similarity}>{day.score}% match</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noData}>No similar days found in recent history</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {predictions.length === 0 && (
        <div className={styles.noData}>
          No predictions available. More data needed for accurate predictions.
        </div>
      )}
    </div>
  );
};

export default PredictiveInsights;