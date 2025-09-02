import * as React from 'react';
import { SkeletonLoader, SkeletonCard, SkeletonChart, SkeletonTable } from './SkeletonLoader';

/**
 * Props for DashboardSkeleton component
 */
export interface IDashboardSkeletonProps {
  /** Type of dashboard to simulate */
  type?: 'safety' | 'race' | 'weather' | 'health';
  /** Whether to show header section */
  showHeader?: boolean;
  /** Whether to show statistics cards */
  showStats?: boolean;
  /** Number of statistics cards to show */
  statsCount?: number;
  /** Whether to show charts section */
  showCharts?: boolean;
  /** Number of charts to show */
  chartsCount?: number;
  /** Whether to show data table */
  showTable?: boolean;
  /** Whether to animate the skeleton */
  animated?: boolean;
  /** Custom className for styling */
  className?: string;
}

/**
 * Comprehensive dashboard skeleton component
 * Provides realistic loading placeholders for different dashboard types
 * 
 * @example
 * ```typescript
 * // Safety dashboard skeleton
 * <DashboardSkeleton 
 *   type="safety"
 *   showStats={true}
 *   showCharts={true}
 *   showTable={true}
 * />
 * ```
 */
export const DashboardSkeleton: React.FC<IDashboardSkeletonProps> = ({
  type = 'safety',
  showHeader = true,
  showStats = true,
  statsCount = 4,
  showCharts = true,
  chartsCount = 3,
  showTable = true,
  animated = true,
  className = ''
}) => {
  const containerStyle: React.CSSProperties = {
    width: '100%',
    padding: '20px',
    backgroundColor: '#f8f9fa'
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '32px'
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gap: '16px',
    marginBottom: '24px'
  };

  const statsGridStyle: React.CSSProperties = {
    ...gridStyle,
    gridTemplateColumns: `repeat(auto-fit, minmax(250px, 1fr))`
  };

  const chartsGridStyle: React.CSSProperties = {
    ...gridStyle,
    gridTemplateColumns: chartsCount === 1 ? '1fr' : 
                        chartsCount === 2 ? 'repeat(2, 1fr)' : 
                        'repeat(auto-fit, minmax(300px, 1fr))'
  };

  const getDashboardTitle = () => {
    switch (type) {
      case 'safety': return 'Safety Dashboard';
      case 'race': return 'Race Management';
      case 'weather': return 'Weather Conditions';
      case 'health': return 'Greyhound Health';
      default: return 'Dashboard';
    }
  };

  const getChartTypes = (): Array<'bar' | 'line' | 'pie' | 'doughnut'> => {
    switch (type) {
      case 'safety':
        return ['bar', 'pie', 'line'];
      case 'race':
        return ['bar', 'line', 'doughnut'];
      case 'weather':
        return ['line', 'bar', 'line'];
      case 'health':
        return ['pie', 'bar', 'line'];
      default:
        return ['bar', 'pie', 'line'];
    }
  };

  const getStatTitles = () => {
    switch (type) {
      case 'safety':
        return ['Monthly Injuries', 'YTD Fatalities', 'High Risk Tracks', 'Safety Score'];
      case 'race':
        return ['Today\'s Races', 'Active Tracks', 'Total Runners', 'Weather Alerts'];
      case 'weather':
        return ['Current Temp', 'Humidity', 'Wind Speed', 'Rain Chance'];
      case 'health':
        return ['Health Checks', 'Treatments', 'Vaccinations', 'Alerts'];
      default:
        return ['Metric 1', 'Metric 2', 'Metric 3', 'Metric 4'];
    }
  };

  const chartTypes = getChartTypes();
  const statTitles = getStatTitles();

  return (
    <div className={className} style={containerStyle} role="status" aria-label={`Loading ${getDashboardTitle()}`}>
      {showHeader && (
        <div style={sectionStyle}>
          {/* Dashboard Title */}
          <SkeletonLoader
            width="300px"
            height="36px"
            animated={animated}
          />
          
          {/* Subtitle/Description */}
          <div style={{ marginTop: '8px' }}>
            <SkeletonLoader
              width="500px"
              height="16px"
              animated={animated}
            />
          </div>

          {/* Controls/Filters */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginTop: '20px',
            alignItems: 'center'
          }}>
            <SkeletonLoader width="120px" height="32px" borderRadius="4px" animated={animated} />
            <SkeletonLoader width="100px" height="32px" borderRadius="4px" animated={animated} />
            <SkeletonLoader width="80px" height="32px" borderRadius="4px" animated={animated} />
          </div>
        </div>
      )}

      {showStats && (
        <div style={sectionStyle}>
          {/* Section Title */}
          <SkeletonLoader
            width="200px"
            height="24px"
            animated={animated}
          />
          
          <div style={{ marginTop: '16px' }}>
            <div style={statsGridStyle}>
              {Array.from({ length: Math.min(statsCount, statTitles.length) }, (_, i) => (
                <div
                  key={i}
                  style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e1e1e1'
                  }}
                >
                  {/* Stat Title */}
                  <SkeletonLoader
                    width="80%"
                    height="16px"
                    animated={animated}
                  />
                  
                  {/* Stat Value */}
                  <div style={{ marginTop: '12px' }}>
                    <SkeletonLoader
                      width="60%"
                      height="32px"
                      animated={animated}
                    />
                  </div>
                  
                  {/* Stat Trend */}
                  <div style={{ marginTop: '8px' }}>
                    <SkeletonLoader
                      width="40%"
                      height="14px"
                      animated={animated}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCharts && (
        <div style={sectionStyle}>
          {/* Section Title */}
          <SkeletonLoader
            width="180px"
            height="24px"
            animated={animated}
          />
          
          <div style={{ marginTop: '16px' }}>
            <div style={chartsGridStyle}>
              {Array.from({ length: Math.min(chartsCount, chartTypes.length) }, (_, i) => (
                <div key={i}>
                  {/* Chart Title */}
                  <div style={{ marginBottom: '12px' }}>
                    <SkeletonLoader
                      width="70%"
                      height="20px"
                      animated={animated}
                    />
                  </div>
                  
                  {/* Chart */}
                  <SkeletonChart
                    type={chartTypes[i]}
                    width="100%"
                    height="300px"
                    animated={animated}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTable && (
        <div style={sectionStyle}>
          {/* Section Title */}
          <SkeletonLoader
            width="160px"
            height="24px"
            animated={animated}
          />
          
          {/* Table Controls */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            marginBottom: '12px'
          }}>
            <SkeletonLoader width="200px" height="32px" borderRadius="4px" animated={animated} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <SkeletonLoader width="60px" height="32px" borderRadius="4px" animated={animated} />
              <SkeletonLoader width="60px" height="32px" borderRadius="4px" animated={animated} />
            </div>
          </div>
          
          {/* Data Table */}
          <SkeletonTable
            rows={8}
            columns={type === 'safety' ? 6 : 5}
            showHeader={true}
            animated={animated}
          />
          
          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px'
          }}>
            <SkeletonLoader width="120px" height="16px" animated={animated} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <SkeletonLoader width="32px" height="32px" borderRadius="4px" animated={animated} />
              <SkeletonLoader width="32px" height="32px" borderRadius="4px" animated={animated} />
              <SkeletonLoader width="32px" height="32px" borderRadius="4px" animated={animated} />
            </div>
          </div>
        </div>
      )}

      {/* Footer/Status */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '20px',
        borderTop: '1px solid #e1e1e1'
      }}>
        <SkeletonLoader width="150px" height="14px" animated={animated} />
        <SkeletonLoader width="100px" height="14px" animated={animated} />
      </div>
    </div>
  );
};

/**
 * Props for SimpleLoadingState component
 */
export interface ISimpleLoadingStateProps {
  /** Loading message */
  message?: string;
  /** Whether to show spinner */
  showSpinner?: boolean;
  /** Whether to show progress bar */
  showProgress?: boolean;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Custom className for styling */
  className?: string;
}

/**
 * Simple loading state component for quick implementations
 * Provides basic loading feedback without complex skeleton layouts
 * 
 * @example
 * ```typescript
 * <SimpleLoadingState 
 *   message="Loading dashboard data..."
 *   showProgress={true}
 *   progress={45}
 * />
 * ```
 */
export const SimpleLoadingState: React.FC<ISimpleLoadingStateProps> = ({
  message = 'Loading...',
  showSpinner = true,
  showProgress = false,
  progress = 0,
  className = ''
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    color: '#666',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  };

  return (
    <div className={className} style={containerStyle} role="status" aria-label={message}>
      {showSpinner && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #0078d4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
        </div>
      )}
      
      <div style={{ fontSize: '16px', marginBottom: showProgress ? '16px' : '0' }}>
        {message}
      </div>
      
      {showProgress && (
        <div style={{ width: '200px' }}>
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#e5e5e5',
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                height: '100%',
                backgroundColor: '#0078d4',
                transition: 'width 0.3s ease-in-out'
              }}
            />
          </div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>
            {Math.round(progress)}%
          </div>
        </div>
      )}
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};