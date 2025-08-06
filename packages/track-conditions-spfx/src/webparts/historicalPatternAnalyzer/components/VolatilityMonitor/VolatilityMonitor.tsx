import * as React from 'react';
import styles from './VolatilityMonitor.module.scss';
import { IDataverseWeatherData } from '../../../../models/IDataverseWeatherData';
import { CalculationService } from '../../../../services/CalculationService';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export interface IVolatilityMonitorProps {
  historicalData: IDataverseWeatherData[];
  selectedTracks: string[];
  volatilityThreshold: number;
}

interface IVolatilityData {
  timestamp: Date;
  temperature: number;
  wind: number;
  humidity: number;
  volatilityScore: number;
}

const VolatilityMonitor: React.FC<IVolatilityMonitorProps> = ({
  historicalData,
  selectedTracks,
  volatilityThreshold
}) => {
  const [selectedTrack, setSelectedTrack] = React.useState<string>(selectedTracks[0] || '');
  const [timeWindow, setTimeWindow] = React.useState<number>(2); // hours

  const calculateVolatilityData = (): IVolatilityData[] => {
    const trackData = historicalData
      .filter(d => d.cr4cc_track_name === selectedTrack)
      .sort((a, b) => new Date(a.createdon).getTime() - new Date(b.createdon).getTime());

    const volatilityData: IVolatilityData[] = [];
    const windowSize = Math.ceil((timeWindow * 60) / 15); // Assuming 15-minute intervals

    for (let i = windowSize; i < trackData.length; i++) {
      const window = trackData.slice(i - windowSize, i);
      const volatility = CalculationService.calculateVolatility(window);
      
      volatilityData.push({
        timestamp: new Date(trackData[i].createdon),
        temperature: trackData[i].cr4cc_temp_celsius || 0,
        wind: trackData[i].cr4cc_wind_speed_kmh || 0,
        humidity: trackData[i].cr4cc_hum || 0,
        volatilityScore: volatility
      });
    }

    return volatilityData.slice(-48); // Last 48 data points
  };

  const getStabilityStatus = (score: number): { text: string; className: string } => {
    if (score < volatilityThreshold * 0.5) return { text: 'Stable', className: styles.stable };
    if (score < volatilityThreshold) return { text: 'Variable', className: styles.variable };
    return { text: 'Unstable', className: styles.unstable };
  };

  const volatilityData = calculateVolatilityData();
  const currentVolatility = volatilityData[volatilityData.length - 1]?.volatilityScore || 0;
  const stabilityStatus = getStabilityStatus(currentVolatility);

  const chartData: ChartData<'line'> = {
    labels: volatilityData.map(d => d.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: volatilityData.map(d => d.temperature),
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.1,
        yAxisID: 'y'
      },
      {
        label: 'Wind Speed (km/h)',
        data: volatilityData.map(d => d.wind),
        borderColor: '#40e0d0',
        backgroundColor: 'rgba(64, 224, 208, 0.1)',
        tension: 0.1,
        yAxisID: 'y'
      },
      {
        label: 'Humidity (%)',
        data: volatilityData.map(d => d.humidity),
        borderColor: '#0078d4',
        backgroundColor: 'rgba(0, 120, 212, 0.1)',
        tension: 0.1,
        yAxisID: 'y1'
      },
      {
        label: 'Volatility Score',
        data: volatilityData.map(d => d.volatilityScore),
        borderColor: '#6f42c1',
        backgroundColor: 'rgba(111, 66, 193, 0.1)',
        borderWidth: 3,
        tension: 0.1,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1);
              if (context.dataset.label?.includes('Temperature')) label += '°C';
              else if (context.dataset.label?.includes('Wind')) label += ' km/h';
              else if (context.dataset.label?.includes('Humidity')) label += '%';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Temperature / Wind'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Humidity / Volatility'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    }
  };

  return (
    <div className={styles.volatilityMonitor}>
      <div className={styles.header}>
        <h3>Condition Volatility Monitor</h3>
        <div className={styles.controls}>
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
          >
            {selectedTracks.map(track => (
              <option key={track} value={track}>{track}</option>
            ))}
          </select>
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(Number(e.target.value))}
          >
            <option value={1}>1 hour window</option>
            <option value={2}>2 hour window</option>
            <option value={4}>4 hour window</option>
          </select>
        </div>
      </div>

      <div className={styles.statusPanel}>
        <div className={styles.currentStatus}>
          <div className={styles.statusLabel}>Current Stability</div>
          <div className={`${styles.statusValue} ${stabilityStatus.className}`}>
            {stabilityStatus.text}
          </div>
          <div className={styles.volatilityScore}>
            Volatility Score: <strong>{currentVolatility.toFixed(0)}</strong>
          </div>
        </div>

        <div className={styles.indicators}>
          <div className={styles.indicator}>
            <div className={styles.indicatorLabel}>Temperature</div>
            <div className={styles.indicatorBar}>
              <div 
                className={styles.indicatorFill}
                style={{ 
                  width: `${Math.min(100, (Math.abs(volatilityData[volatilityData.length - 1]?.temperature - volatilityData[volatilityData.length - 2]?.temperature) || 0) * 20)}%`,
                  backgroundColor: '#ff6b6b'
                }}
              />
            </div>
          </div>
          <div className={styles.indicator}>
            <div className={styles.indicatorLabel}>Wind</div>
            <div className={styles.indicatorBar}>
              <div 
                className={styles.indicatorFill}
                style={{ 
                  width: `${Math.min(100, (Math.abs(volatilityData[volatilityData.length - 1]?.wind - volatilityData[volatilityData.length - 2]?.wind) || 0) * 10)}%`,
                  backgroundColor: '#40e0d0'
                }}
              />
            </div>
          </div>
          <div className={styles.indicator}>
            <div className={styles.indicatorLabel}>Humidity</div>
            <div className={styles.indicatorBar}>
              <div 
                className={styles.indicatorFill}
                style={{ 
                  width: `${Math.min(100, (Math.abs(volatilityData[volatilityData.length - 1]?.humidity - volatilityData[volatilityData.length - 2]?.humidity) || 0) * 5)}%`,
                  backgroundColor: '#0078d4'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className={styles.alerts}>
        {currentVolatility > volatilityThreshold && (
          <div className={styles.alert}>
            <strong>⚠️ High Volatility Alert:</strong> Weather conditions are changing rapidly. 
            Consider postponing critical decisions until conditions stabilize.
          </div>
        )}
      </div>
    </div>
  );
};

export default VolatilityMonitor;