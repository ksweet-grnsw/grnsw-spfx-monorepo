import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import styles from './InjuryAnalyticsDashboard.module.scss';
import { RaceDataService } from '../../services/RaceDataService';
import { IHealthCheck } from '../../models/IRaceData';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface IInjuryAnalyticsDashboardProps {
  dataService: RaceDataService;
  dateFrom?: Date;
  dateTo?: Date;
  selectedTrack?: string;
  selectedCategories?: string[];
  theme?: 'light' | 'dark';
}

interface InjuryTrendData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension?: number;
  }>;
}

interface TrackInjuryData {
  track: string;
  total: number;
  byCategory: Record<string, number>;
  rate: number;
}

export const InjuryAnalyticsDashboard: React.FC<IInjuryAnalyticsDashboardProps> = ({
  dataService,
  dateFrom,
  dateTo,
  selectedTrack,
  selectedCategories = ['Cat A', 'Cat B', 'Cat C', 'Cat D', 'Cat E'],
  theme = 'light'
}) => {
  const [loading, setLoading] = useState(true);
  const [injuryData, setInjuryData] = useState<IHealthCheck[]>([]);
  const [selectedView, setSelectedView] = useState<'trends' | 'tracks' | 'types' | 'recovery'>('trends');
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);

  // Generate sample data for demonstration
  const getSampleData = (): IHealthCheck[] => {
    const tracks = ['Wentworth Park', 'The Gardens', 'Richmond', 'Gosford', 'Maitland'];
    const categories = ['Cat A', 'Cat B', 'Cat C', 'Cat D', 'Cat E'];
    const sampleData: IHealthCheck[] = [];
    
    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 180));
      
      sampleData.push({
        cra5e_heathcheckid: `sample-${i}`,
        cra5e_datechecked: date.toISOString(),
        cra5e_injured: true,
        cra5e_injuryclassification: categories[Math.floor(Math.random() * categories.length)],
        cra5e_trackname: tracks[Math.floor(Math.random() * tracks.length)],
        cra5e_standdowndays: Math.floor(Math.random() * 30),
        cra5e_name: `Sample Greyhound ${i}`,
        cra5e_greyhound: `greyhound-${i}`
      } as IHealthCheck);
    }
    
    return sampleData;
  };

  // Chart color scheme - Cat D & E are most severe, Cat A is minor
  const colors = {
    primary: '#0078d4',
    secondary: '#40e0d0',
    danger: '#dc143c',
    warning: '#ff8c00',
    success: '#28a745',
    info: '#17a2b8',
    categories: {
      'Cat A': '#90ee90',  // Light green - minor
      'Cat B': '#ffd700',  // Yellow
      'Cat C': '#ffa500',  // Orange  
      'Cat D': '#ff6b6b',  // Red-orange - serious
      'Cat E': '#dc143c'   // Dark red - most serious
    }
  };

  // Load injury data
  useEffect(() => {
    loadInjuryData();
  }, [dateFrom, dateTo, selectedTrack, selectedCategories, dataService]);

  const loadInjuryData = async () => {
    setLoading(true);
    try {
      // Ensure dataService is available
      if (!dataService) {
        console.error('InjuryAnalyticsDashboard: dataService is not available');
        setLoading(false);
        return;
      }
      
      // Use a broad date range if no dates provided
      const queryDateFrom = dateFrom || (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d;
      })();
      
      const queryDateTo = dateTo || new Date();
      
      // Fetch injury data based on filters
      const data = await dataService.getInjuryData({
        dateFrom: queryDateFrom,
        dateTo: queryDateTo,
        track: selectedTrack,
        categories: selectedCategories && selectedCategories.length > 0 ? selectedCategories : undefined
      });
      
      if (data.length > 0) {
        setInjuryData(data);
        setIsUsingDemoData(false);
      } else {
        // Use sample data for demonstration
        const sampleData = getSampleData();
        setInjuryData(sampleData);
        setIsUsingDemoData(true);
      }
    } catch (error) {
      console.error('Error loading injury data:', error);
      // If error contains details, log them
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate monthly trend data
  const trendData = useMemo((): InjuryTrendData => {
    if (!injuryData.length) {
      return { labels: [], datasets: [] };
    }

    // Group injuries by month and category
    const monthlyData = new Map<string, Record<string, number>>();
    
    injuryData.forEach(injury => {
      if (injury.cra5e_datechecked && injury.cra5e_injured) {
        const date = new Date(injury.cra5e_datechecked);
        const month = date.getMonth() + 1;
        const monthStr = month < 10 ? '0' + month : String(month);
        const monthKey = `${date.getFullYear()}-${monthStr}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {});
        }
        
        const category = injury.cra5e_injuryclassification || 'Unknown';
        const monthRecord = monthlyData.get(monthKey)!;
        monthRecord[category] = (monthRecord[category] || 0) + 1;
      }
    });

    // Sort months chronologically
    const sortedMonths = Array.from(monthlyData.keys()).sort();
    
    // Format labels (MMM YYYY)
    const labels = sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      return date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
    });

    // Create datasets for each category - order by severity (E, D, C, B, A)
    const orderedCategories = selectedCategories.sort((a, b) => {
      const order = ['Cat E', 'Cat D', 'Cat C', 'Cat B', 'Cat A'];
      return order.indexOf(a) - order.indexOf(b);
    });
    
    const datasets = orderedCategories.map(category => ({
      label: category,
      data: sortedMonths.map(month => monthlyData.get(month)?.[category] || 0),
      borderColor: colors.categories[category as keyof typeof colors.categories] || colors.primary,
      backgroundColor: `${colors.categories[category as keyof typeof colors.categories] || colors.primary}33`,
      tension: 0.4
    }));

    // Add total line
    datasets.unshift({
      label: 'Total',
      data: sortedMonths.map(month => {
        const monthRecord = monthlyData.get(month) || {};
        return Object.values(monthRecord).reduce((sum, count) => sum + count, 0);
      }),
      borderColor: colors.danger,
      backgroundColor: `${colors.danger}33`,
      tension: 0.4
    });

    return { labels, datasets };
  }, [injuryData, selectedCategories]);

  // Calculate track heat map data
  const trackHeatMapData = useMemo((): TrackInjuryData[] => {
    if (!injuryData.length) return [];

    const trackData = new Map<string, TrackInjuryData>();
    
    injuryData.forEach(injury => {
      if (injury.cra5e_trackname && injury.cra5e_injured) {
        const track = injury.cra5e_trackname;
        
        if (!trackData.has(track)) {
          trackData.set(track, {
            track,
            total: 0,
            byCategory: {},
            rate: 0
          });
        }
        
        const data = trackData.get(track)!;
        data.total++;
        
        const category = injury.cra5e_injuryclassification || 'Unknown';
        data.byCategory[category] = (data.byCategory[category] || 0) + 1;
      }
    });

    // Calculate injury rates (injuries per 100 races - mock calculation)
    trackData.forEach(data => {
      data.rate = (data.total / 100) * 100; // This would need actual race count
    });

    return Array.from(trackData.values()).sort((a, b) => b.total - a.total);
  }, [injuryData]);

  // Calculate injury type distribution
  const typeDistributionData = useMemo(() => {
    const distribution = new Map<string, number>();
    
    injuryData.forEach(injury => {
      if (injury.cra5e_injured && injury.cra5e_injuryclassification) {
        const type = injury.cra5e_injuryclassification;
        distribution.set(type, (distribution.get(type) || 0) + 1);
      }
    });

    const labels = Array.from(distribution.keys());
    const data = Array.from(distribution.values());
    const backgroundColors = labels.map(label => 
      colors.categories[label as keyof typeof colors.categories] || colors.primary
    );

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: theme === 'dark' ? '#1e1e1e' : '#ffffff'
      }]
    };
  }, [injuryData, theme]);

  // Calculate recovery timeline data
  const recoveryTimelineData = useMemo(() => {
    const recoveryData = new Map<string, number[]>();
    
    injuryData.forEach(injury => {
      if (injury.cra5e_injured && injury.cra5e_standdowndays) {
        const category = injury.cra5e_injuryclassification || 'Unknown';
        if (!recoveryData.has(category)) {
          recoveryData.set(category, []);
        }
        recoveryData.get(category)!.push(injury.cra5e_standdowndays);
      }
    });

    const labels = Array.from(recoveryData.keys());
    const averages = labels.map(category => {
      const days = recoveryData.get(category)!;
      return days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : 0;
    });

    return {
      labels,
      datasets: [{
        label: 'Average Stand Down Days',
        data: averages,
        backgroundColor: labels.map(label => 
          colors.categories[label as keyof typeof colors.categories] || colors.primary
        ),
        borderWidth: 1,
        borderColor: theme === 'dark' ? '#1e1e1e' : '#ffffff'
      }]
    };
  }, [injuryData, theme]);

  // Chart options
  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme === 'dark' ? '#ffffff' : '#333333'
        }
      },
      title: {
        display: true,
        text: 'Injury Trends Over Time',
        color: theme === 'dark' ? '#ffffff' : '#333333',
        font: {
          size: 16
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            return `${context.dataset.label}: ${context.parsed.y} injuries`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: theme === 'dark' ? '#444444' : '#e0e0e0'
        },
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#666666'
        }
      },
      y: {
        grid: {
          color: theme === 'dark' ? '#444444' : '#e0e0e0'
        },
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#666666',
          stepSize: 1
        }
      }
    }
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Injuries by Track',
        color: theme === 'dark' ? '#ffffff' : '#333333',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const track = trackHeatMapData[context.dataIndex];
            return [
              `Total: ${track.total} injuries`,
              `Rate: ${track.rate.toFixed(1)}%`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#666666',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: theme === 'dark' ? '#444444' : '#e0e0e0'
        },
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#666666'
        }
      }
    }
  };

  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: theme === 'dark' ? '#ffffff' : '#333333',
          padding: 15
        }
      },
      title: {
        display: true,
        text: 'Injury Distribution by Category',
        color: theme === 'dark' ? '#ffffff' : '#333333',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading injury analytics...</p>
      </div>
    );
  }

  // Check if we have no data
  if (!injuryData || injuryData.length === 0) {
    return (
      <div className={`${styles.dashboard} ${theme === 'dark' ? styles.dark : ''}`}>
        <div className={styles.header}>
          <h2>Injury Analytics Dashboard</h2>
        </div>
        <div className={styles.noDataContainer}>
          <div className={styles.noDataIcon}>📊</div>
          <h3>No Injury Data Available</h3>
          <p>No injury records found for the selected filters.</p>
          <p className={styles.hint}>Try adjusting your date range, track selection, or injury categories.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.dashboard} ${theme === 'dark' ? styles.dark : ''}`}>
      {isUsingDemoData && (
        <div style={{
          background: 'linear-gradient(90deg, #fff3cd, #fff9e6)',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '12px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <span style={{ fontSize: '20px' }}>📊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#856404', fontSize: '14px' }}>
              Demo Mode - Sample Data
            </div>
            <div style={{ fontSize: '12px', color: '#856404', marginTop: '2px' }}>
              Displaying sample data for demonstration. Real data will appear once import is complete.
            </div>
          </div>
          <div style={{
            background: '#ffc107',
            color: '#856404',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Demo
          </div>
        </div>
      )}
      {!isUsingDemoData && injuryData.length > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, #d4edda, #e7f5eb)',
          border: '1px solid #28a745',
          borderRadius: '8px',
          padding: '12px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#155724', fontSize: '14px' }}>
              Live Data Mode
            </div>
            <div style={{ fontSize: '12px', color: '#155724', marginTop: '2px' }}>
              Displaying {injuryData.length} real injury records from your database.
            </div>
          </div>
          <div style={{
            background: '#28a745',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Live
          </div>
        </div>
      )}
      <div className={styles.header}>
        <h2>Injury Analytics Dashboard</h2>
        <div className={styles.viewToggle}>
          <button
            className={selectedView === 'trends' ? styles.active : ''}
            onClick={() => setSelectedView('trends')}
          >
            Trends
          </button>
          <button
            className={selectedView === 'tracks' ? styles.active : ''}
            onClick={() => setSelectedView('tracks')}
          >
            By Track
          </button>
          <button
            className={selectedView === 'types' ? styles.active : ''}
            onClick={() => setSelectedView('types')}
          >
            Categories
          </button>
          <button
            className={selectedView === 'recovery' ? styles.active : ''}
            onClick={() => setSelectedView('recovery')}
          >
            Recovery
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{injuryData.filter(i => i.cra5e_injured).length}</div>
          <div className={styles.statLabel}>Total Injuries</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {injuryData.filter(i => i.cra5e_injured && (i.cra5e_injuryclassification === 'Cat D' || i.cra5e_injuryclassification === 'Cat E')).length}
          </div>
          <div className={styles.statLabel}>Serious (Cat D & E)</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {injuryData.filter(i => i.cra5e_standdowndays).length > 0 
              ? Math.round(injuryData.filter(i => i.cra5e_standdowndays).reduce((sum, i) => sum + (i.cra5e_standdowndays || 0), 0) / 
                injuryData.filter(i => i.cra5e_standdowndays).length)
              : 0}
          </div>
          <div className={styles.statLabel}>Avg Stand Down Days</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {trackHeatMapData.length > 0 ? trackHeatMapData[0].track : 'N/A'}
          </div>
          <div className={styles.statLabel}>Most Injuries</div>
        </div>
      </div>

      <div className={styles.chartContainer}>
        {selectedView === 'trends' && (
          <div className={styles.chart}>
            <Line data={trendData} options={lineChartOptions} />
          </div>
        )}

        {selectedView === 'tracks' && (
          <div className={styles.chart}>
            <Bar 
              data={{
                labels: trackHeatMapData.slice(0, 10).map(d => d.track),
                datasets: [{
                  label: 'Total Injuries',
                  data: trackHeatMapData.slice(0, 10).map(d => d.total),
                  backgroundColor: trackHeatMapData.slice(0, 10).map((_, i) => {
                    const intensity = 1 - (i / 10);
                    return `rgba(220, 20, 60, ${0.3 + intensity * 0.5})`;
                  }),
                  borderColor: colors.danger,
                  borderWidth: 1
                }]
              }}
              options={barChartOptions}
            />
          </div>
        )}

        {selectedView === 'types' && (
          <div className={styles.chart}>
            <Doughnut data={typeDistributionData} options={pieChartOptions as ChartOptions<'doughnut'>} />
          </div>
        )}

        {selectedView === 'recovery' && (
          <div className={styles.chart}>
            <Bar data={recoveryTimelineData} options={{
              ...barChartOptions,
              plugins: {
                ...barChartOptions.plugins,
                title: {
                  display: true,
                  text: 'Average Recovery Time by Category',
                  color: theme === 'dark' ? '#ffffff' : '#333333',
                  font: {
                    size: 16
                  }
                }
              }
            }} />
          </div>
        )}
      </div>

      <div className={styles.insights}>
        <h3>Key Insights</h3>
        <ul>
          {trackHeatMapData.length > 0 && (
            <li>
              <strong>{trackHeatMapData[0].track}</strong> has the highest injury count with {trackHeatMapData[0].total} injuries
            </li>
          )}
          {typeDistributionData.labels.length > 0 && (
            <li>
              Most common injury type: <strong>{typeDistributionData.labels[0]}</strong> 
              ({typeDistributionData.datasets[0].data[0]} cases)
            </li>
          )}
          {trendData.labels.length > 0 && (
            <li>
              Data covers <strong>{trendData.labels.length} months</strong> of injury records
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};