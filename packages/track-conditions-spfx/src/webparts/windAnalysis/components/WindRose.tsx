import * as React from 'react';
import styles from './WindRose.module.scss';

export interface IWindData {
  direction: string;
  speed: number;
  timestamp: Date;
}

export interface IWindRoseProps {
  data: IWindData[];
  selectedPeriod: 'day' | 'week' | 'month';
  onPeriodChange: (period: 'day' | 'week' | 'month') => void;
  trackName?: string;
}

interface IWindBin {
  min: number;
  max: number;
  color: string;
  label: string;
}

interface IDirectionData {
  direction: string;
  angle: number;
  speedBins: { [key: string]: number };
  total: number;
}

export const WindRose: React.FC<IWindRoseProps> = ({ data, selectedPeriod, onPeriodChange, trackName = 'Track' }) => {
  const getDirectionIndex = (direction: string): number => {
    const dirMap: { [key: string]: number } = {
      'N': 0, 'NNE': 0, 'NE': 1, 'ENE': 1,
      'E': 2, 'ESE': 2, 'SE': 3, 'SSE': 3,
      'S': 4, 'SSW': 4, 'SW': 5, 'WSW': 5,
      'W': 6, 'WNW': 6, 'NW': 7, 'NNW': 7
    };
    return dirMap[direction] ?? -1;
  };

  const createArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number): string => {
    const startAngleRad = (startAngle - 90) * Math.PI / 180;
    const endAngleRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = 150 + innerRadius * Math.cos(startAngleRad);
    const y1 = 150 + innerRadius * Math.sin(startAngleRad);
    const x2 = 150 + outerRadius * Math.cos(startAngleRad);
    const y2 = 150 + outerRadius * Math.sin(startAngleRad);
    const x3 = 150 + outerRadius * Math.cos(endAngleRad);
    const y3 = 150 + outerRadius * Math.sin(endAngleRad);
    const x4 = 150 + innerRadius * Math.cos(endAngleRad);
    const y4 = 150 + innerRadius * Math.sin(endAngleRad);
    
    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1} Z`;
  };
  
  const windBins: IWindBin[] = [
    { min: 0, max: 3, color: '#4CAF50', label: '0-3 km/h' },
    { min: 3, max: 6, color: '#8BC34A', label: '3-6 km/h' },
    { min: 6, max: 10, color: '#2196F3', label: '6-10 km/h' },
    { min: 10, max: 13, color: '#03A9F4', label: '10-13 km/h' },
    { min: 13, max: 16, color: '#FF9800', label: '13-16 km/h' },
    { min: 16, max: 32, color: '#F44336', label: '16-32 km/h' },
    { min: 32, max: 999, color: '#37474F', label: '> 32 km/h' }
  ];

  const directions: IDirectionData[] = [
    { direction: 'N', angle: 0, speedBins: {}, total: 0 },
    { direction: 'NE', angle: 45, speedBins: {}, total: 0 },
    { direction: 'E', angle: 90, speedBins: {}, total: 0 },
    { direction: 'SE', angle: 135, speedBins: {}, total: 0 },
    { direction: 'S', angle: 180, speedBins: {}, total: 0 },
    { direction: 'SW', angle: 225, speedBins: {}, total: 0 },
    { direction: 'W', angle: 270, speedBins: {}, total: 0 },
    { direction: 'NW', angle: 315, speedBins: {}, total: 0 }
  ];

  // Initialize speed bins for each direction
  directions.forEach(dir => {
    windBins.forEach(bin => {
      dir.speedBins[`${bin.min}-${bin.max}`] = 0;
    });
  });

  // Process wind data
  const processedData = React.useMemo(() => {
    const directionsCopy = JSON.parse(JSON.stringify(directions)) as IDirectionData[];
    
    data.forEach(windPoint => {
      // Find closest cardinal direction
      const dirIndex = getDirectionIndex(windPoint.direction);
      if (dirIndex !== -1) {
        directionsCopy[dirIndex].total++;
        
        // Find appropriate speed bin
        for (let i = 0; i < windBins.length; i++) {
          const bin = windBins[i];
          if (windPoint.speed >= bin.min && windPoint.speed < bin.max) {
            directionsCopy[dirIndex].speedBins[`${bin.min}-${bin.max}`]++;
            break;
          }
        }
      }
    });

    return directionsCopy;
  }, [data]);

  // Calculate maximum percentage for scaling
  const maxPercentage = React.useMemo(() => {
    const total = data.length || 1;
    const maxCount = Math.max(...processedData.map(d => d.total));
    return Math.ceil((maxCount / total) * 100 / 5) * 5; // Round up to nearest 5%
  }, [processedData, data.length]);

  const createPath = (direction: IDirectionData, binKey: string, innerRadius: number): string => {
    const total = data.length || 1;
    const binCount = direction.speedBins[binKey];
    let previousBins = 0;
    const keys = Object.keys(direction.speedBins);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const [min] = key.split('-').map(Number);
      const [currentMin] = binKey.split('-').map(Number);
      if (min < currentMin) {
        previousBins += direction.speedBins[key];
      }
    }
    
    // Scale to fit within the 50-pixel radius (from 50 to 100)
    const startRadius = 50 + (previousBins / total) * 50 * (100 / maxPercentage);
    const endRadius = 50 + ((previousBins + binCount) / total) * 50 * (100 / maxPercentage);
    
    // Ensure we don't exceed the outer circle
    const clampedStartRadius = Math.min(startRadius, 100);
    const clampedEndRadius = Math.min(endRadius, 100);
    
    const angleSpread = 22.5; // 45 degrees / 2
    const startAngle = direction.angle - angleSpread;
    const endAngle = direction.angle + angleSpread;
    
    return createArcPath(startAngle, endAngle, clampedStartRadius, clampedEndRadius);
  };

  return (
    <div className={styles.windRose}>
      
      <svg width="300" height="300" viewBox="0 0 300 300" className={styles.svg}>
        {/* Grid circles */}
        <circle cx="150" cy="150" r="100" fill="none" stroke="#e0e0e0" strokeWidth="1" />
        <circle cx="150" cy="150" r="75" fill="none" stroke="#e0e0e0" strokeWidth="1" />
        <circle cx="150" cy="150" r="50" fill="none" stroke="#e0e0e0" strokeWidth="1" />
        
        {/* Grid lines */}
        {[0, 45, 90, 135].map(angle => {
          const angleRad = angle * Math.PI / 180;
          const x1 = 150 + 100 * Math.cos(angleRad);
          const y1 = 150 + 100 * Math.sin(angleRad);
          const x2 = 150 - 100 * Math.cos(angleRad);
          const y2 = 150 - 100 * Math.sin(angleRad);
          return (
            <line
              key={angle}
              x1={x1} y1={y1}
              x2={x2} y2={y2}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Wind data */}
        {processedData.map(direction => {
          const binKeys = Object.keys(direction.speedBins);
          return (
            <g key={direction.direction}>
              {binKeys.map(binKey => {
                const count = direction.speedBins[binKey];
                if (count === 0) return null;
                let binColor = '#999';
                for (let i = 0; i < windBins.length; i++) {
                  if (`${windBins[i].min}-${windBins[i].max}` === binKey) {
                    binColor = windBins[i].color;
                    break;
                  }
                }
                return (
                  <path
                    key={binKey}
                    d={createPath(direction, binKey, 50)}
                    fill={binColor}
                    stroke="white"
                    strokeWidth="0.5"
                  />
                );
              })}
            </g>
          );
        })}
        
        {/* Direction labels */}
        <text x="150" y="35" textAnchor="middle" className={styles.directionLabel}>N</text>
        <text x="235" y="85" textAnchor="middle" className={styles.directionLabel}>NE</text>
        <text x="285" y="155" textAnchor="middle" className={styles.directionLabel}>E</text>
        <text x="235" y="225" textAnchor="middle" className={styles.directionLabel}>SE</text>
        <text x="150" y="275" textAnchor="middle" className={styles.directionLabel}>S</text>
        <text x="65" y="225" textAnchor="middle" className={styles.directionLabel}>SW</text>
        <text x="15" y="155" textAnchor="middle" className={styles.directionLabel}>W</text>
        <text x="65" y="85" textAnchor="middle" className={styles.directionLabel}>NW</text>
        
        {/* Center percentage label */}
        <text x="150" y="120" textAnchor="middle" className={styles.percentageLabel}>
          {maxPercentage}%
        </text>
        
        {/* 0% label */}
        <text x="150" y="155" textAnchor="middle" className={styles.zeroLabel}>
          0%
        </text>
      </svg>
      
      {/* Time period selector */}
      <div className={styles.periodSelector}>
        <button
          className={selectedPeriod === 'day' ? styles.active : ''}
          onClick={() => onPeriodChange('day')}
        >
          Day
        </button>
        <button
          className={selectedPeriod === 'week' ? styles.active : ''}
          onClick={() => onPeriodChange('week')}
        >
          Week
        </button>
        <button
          className={selectedPeriod === 'month' ? styles.active : ''}
          onClick={() => onPeriodChange('month')}
        >
          Month
        </button>
      </div>
      
      {/* Legend */}
      <div className={styles.legend}>
        {windBins.map(bin => (
          <div key={bin.label} className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: bin.color }} />
            <span className={styles.legendLabel}>{bin.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};