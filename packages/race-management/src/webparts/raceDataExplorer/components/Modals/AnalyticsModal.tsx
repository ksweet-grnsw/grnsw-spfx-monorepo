import * as React from 'react';
import { useState, useMemo } from 'react';
import styles from './Modals.module.scss';
import { IMeeting } from '../../../../models/IRaceData';
const logoUrl = require('../../../../assets/images/siteicon.png');

interface IAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetings?: IMeeting[];
}

export const AnalyticsModal: React.FC<IAnalyticsModalProps> = ({ isOpen, onClose, meetings }) => {
  const [selectedMetric, setSelectedMetric] = useState<'meetings' | 'races' | 'prize' | 'participation'>('meetings');

  // Generate demo data until we have enough real data
  const analyticsData = useMemo(() => {
    const hasSufficientData = meetings && meetings.length > 30;
    
    if (hasSufficientData) {
      // Use real data
      const trackStats = meetings.reduce((acc, meeting) => {
        const track = meeting.cr4cc_trackname || 'Unknown';
        if (!acc[track]) {
          acc[track] = { count: 0, races: 0, prize: 0 };
        }
        acc[track].count++;
        return acc;
      }, {} as Record<string, { count: number; races: number; prize: number }>);

      return {
        isDemo: false,
        trackStats,
        totalMeetings: meetings.length,
        totalRaces: meetings.length * 8, // Estimate
        totalPrize: meetings.length * 50000 // Estimate
      };
    } else {
      // Use demo data
      return {
        isDemo: true,
        trackStats: {
          'Wentworth Park': { count: 45, races: 360, prize: 2500000 },
          'Dapto': { count: 38, races: 304, prize: 1800000 },
          'Richmond': { count: 32, races: 256, prize: 1400000 },
          'The Gardens': { count: 28, races: 224, prize: 1200000 },
          'Gosford': { count: 25, races: 200, prize: 1000000 },
          'Bulli': { count: 22, races: 176, prize: 850000 },
          'Casino': { count: 20, races: 160, prize: 750000 },
          'Goulburn': { count: 18, races: 144, prize: 650000 }
        },
        totalMeetings: 228,
        totalRaces: 1824,
        totalPrize: 10150000
      };
    }
  }, [meetings]);

  const getMetricData = () => {
    const tracks = Object.keys(analyticsData.trackStats);
    const data = tracks.map(track => {
      const stats = analyticsData.trackStats[track];
      switch (selectedMetric) {
        case 'meetings':
          return stats.count;
        case 'races':
          return stats.races;
        case 'prize':
          return stats.prize;
        case 'participation':
          return stats.races * 8; // Average 8 dogs per race
        default:
          return stats.count;
      }
    });
    return { tracks, data };
  };

  const { tracks, data } = getMetricData();
  const maxValue = Math.max(...data);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px' }}>
        <div className={styles.modalHeader}>
          <h2>
            <img src={logoUrl} alt="GRNSW" className={styles.headerLogo} />
            Race Analytics
            {analyticsData.isDemo && (
              <span className={styles.demoIndicator}>(Demo Data)</span>
            )}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalBody}>
          {/* Summary Cards */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.cardValue}>{analyticsData.totalMeetings}</div>
              <div className={styles.cardLabel}>Total Meetings</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.cardValue}>{analyticsData.totalRaces}</div>
              <div className={styles.cardLabel}>Total Races</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.cardValue}>
                ${(analyticsData.totalPrize / 1000000).toFixed(1)}M
              </div>
              <div className={styles.cardLabel}>Total Prize Money</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.cardValue}>{(analyticsData.totalRaces * 8).toLocaleString()}</div>
              <div className={styles.cardLabel}>Participants</div>
            </div>
          </div>

          {/* Metric Selector */}
          <div className={styles.metricSelector}>
            <button 
              className={`${styles.metricButton} ${selectedMetric === 'meetings' ? styles.active : ''}`}
              onClick={() => setSelectedMetric('meetings')}
            >
              Meetings
            </button>
            <button 
              className={`${styles.metricButton} ${selectedMetric === 'races' ? styles.active : ''}`}
              onClick={() => setSelectedMetric('races')}
            >
              Races
            </button>
            <button 
              className={`${styles.metricButton} ${selectedMetric === 'prize' ? styles.active : ''}`}
              onClick={() => setSelectedMetric('prize')}
            >
              Prize Money
            </button>
            <button 
              className={`${styles.metricButton} ${selectedMetric === 'participation' ? styles.active : ''}`}
              onClick={() => setSelectedMetric('participation')}
            >
              Participation
            </button>
          </div>

          {/* Bar Chart */}
          <div className={styles.chartContainer}>
            <h3 className={styles.chartTitle}>
              {selectedMetric === 'meetings' && 'Meetings by Track'}
              {selectedMetric === 'races' && 'Races by Track'}
              {selectedMetric === 'prize' && 'Prize Money by Track'}
              {selectedMetric === 'participation' && 'Participation by Track'}
            </h3>
            
            <div className={styles.barChart}>
              {tracks.map((track, index) => {
                const value = data[index];
                const percentage = (value / maxValue) * 100;
                
                return (
                  <div key={track} className={styles.barRow}>
                    <div className={styles.trackLabel}>{track}</div>
                    <div className={styles.barContainer}>
                      <div 
                        className={styles.bar}
                        style={{ 
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, #00426d 0%, #00426d ${percentage}%, #e9ecef ${percentage}%)`
                        }}
                      />
                      <span className={styles.barValue}>
                        {selectedMetric === 'prize' 
                          ? `$${(value / 1000).toFixed(0)}k`
                          : value.toLocaleString()
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insights Section */}
          <div className={styles.insightsSection}>
            <h3>Key Insights</h3>
            <ul className={styles.insightsList}>
              <li>📈 Wentworth Park leads in total meetings and prize money</li>
              <li>🏆 Average of 8 races per meeting across all tracks</li>
              <li>💰 Average prize pool of $44,500 per meeting</li>
              <li>🐕 Over 14,500 greyhound race starts recorded</li>
            </ul>
          </div>

          {analyticsData.isDemo && (
            <div className={styles.demoNotice}>
              <span className={styles.infoIcon}>ℹ️</span>
              <span>This is demo data. Analytics will use real data once 30+ meetings are available.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};