import * as React from 'react';
import styles from './PatternHeatmap.module.scss';
import { IDataverseWeatherData } from '../../../../models/IDataverseWeatherData';
import { CalculationService } from '../../../../services/CalculationService';
import { Dropdown, IDropdownOption } from '@fluentui/react';

export interface IPatternHeatmapProps {
  historicalData: IDataverseWeatherData[];
  selectedTracks: string[];
  timeRange: string;
}

interface IHeatmapData {
  hour: number;
  day: number;
  score: number;
  count: number;
}

const PatternHeatmap: React.FC<IPatternHeatmapProps> = ({
  historicalData,
  selectedTracks,
  timeRange
}) => {
  const [selectedTrack, setSelectedTrack] = React.useState<string>(selectedTracks[0] || '');
  const [viewType, setViewType] = React.useState<'hourly' | 'daily'>('hourly');

  const generateHeatmapData = (): IHeatmapData[] => {
    const trackData = historicalData.filter(d => d.cr4cc_track_name === selectedTrack);
    const heatmapMap = new Map<string, { totalScore: number; count: number }>();

    trackData.forEach(data => {
      const date = new Date(data.createdon);
      const hour = date.getHours();
      const day = date.getDay();
      const score = CalculationService.calculateOptimalScore(data).score;

      const key = viewType === 'hourly' ? `${hour}-${day}` : `${day}`;
      
      if (!heatmapMap.has(key)) {
        heatmapMap.set(key, { totalScore: 0, count: 0 });
      }

      const current = heatmapMap.get(key)!;
      current.totalScore += score;
      current.count += 1;
    });

    const heatmapData: IHeatmapData[] = [];

    if (viewType === 'hourly') {
      for (let hour = 0; hour < 24; hour++) {
        for (let day = 0; day < 7; day++) {
          const key = `${hour}-${day}`;
          const data = heatmapMap.get(key);
          heatmapData.push({
            hour,
            day,
            score: data ? Math.round(data.totalScore / data.count) : 0,
            count: data ? data.count : 0
          });
        }
      }
    } else {
      for (let day = 0; day < 7; day++) {
        const key = `${day}`;
        const data = heatmapMap.get(key);
        heatmapData.push({
          hour: 0,
          day,
          score: data ? Math.round(data.totalScore / data.count) : 0,
          count: data ? data.count : 0
        });
      }
    }

    return heatmapData;
  };

  const getColorForScore = (score: number): string => {
    if (score === 0) return '#f0f0f0';
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#90ee90';
    if (score >= 40) return '#ffd700';
    if (score >= 20) return '#ff8c00';
    return '#dc3545';
  };

  const getDayName = (day: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day];
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12am';
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return '12pm';
    return `${hour - 12}pm`;
  };

  const heatmapData = generateHeatmapData();
  
  const trackOptions: IDropdownOption[] = selectedTracks.map(track => ({
    key: track,
    text: track
  }));

  const viewOptions: IDropdownOption[] = [
    { key: 'hourly', text: 'Hourly Pattern' },
    { key: 'daily', text: 'Daily Average' }
  ];

  return (
    <div className={styles.patternHeatmap}>
      <div className={styles.header}>
        <h3>Historical Patterns</h3>
        <div className={styles.controls}>
          <Dropdown
            options={trackOptions}
            selectedKey={selectedTrack}
            onChange={(_, option) => option && setSelectedTrack(option.key as string)}
            styles={{ root: { minWidth: 120 } }}
          />
          <Dropdown
            options={viewOptions}
            selectedKey={viewType}
            onChange={(_, option) => option && setViewType(option.key as 'hourly' | 'daily')}
            styles={{ root: { minWidth: 120 } }}
          />
        </div>
      </div>

      {viewType === 'hourly' ? (
        <div className={styles.heatmapContainer}>
          <div className={styles.hourLabels}>
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className={styles.hourLabel}>
                {formatHour(i)}
              </div>
            ))}
          </div>
          <div className={styles.dayColumns}>
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <div key={day} className={styles.dayColumn}>
                <div className={styles.dayLabel}>{getDayName(day)}</div>
                {heatmapData
                  .filter(d => d.day === day)
                  .map(cell => (
                    <div
                      key={`${cell.hour}-${cell.day}`}
                      className={styles.cell}
                      style={{ backgroundColor: getColorForScore(cell.score) }}
                      title={`${getDayName(day)} ${formatHour(cell.hour)}: Score ${cell.score} (${cell.count} samples)`}
                    >
                      {cell.count > 0 && cell.score}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.dailyView}>
          {heatmapData.map(cell => (
            <div key={cell.day} className={styles.dayBar}>
              <div className={styles.dayName}>{getDayName(cell.day)}</div>
              <div className={styles.barContainer}>
                <div
                  className={styles.bar}
                  style={{
                    width: `${cell.score}%`,
                    backgroundColor: getColorForScore(cell.score)
                  }}
                >
                  <span className={styles.score}>{cell.score}</span>
                </div>
              </div>
              <div className={styles.samples}>{cell.count} samples</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.legend}>
        <span className={styles.legendTitle}>Score:</span>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#dc3545' }} />
          <span>0-20 (Poor)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#ff8c00' }} />
          <span>20-40 (Fair)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#ffd700' }} />
          <span>40-60 (Good)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#90ee90' }} />
          <span>60-80 (Very Good)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#28a745' }} />
          <span>80-100 (Excellent)</span>
        </div>
      </div>
    </div>
  );
};

export default PatternHeatmap;