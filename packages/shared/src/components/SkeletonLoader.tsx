import * as React from 'react';

/**
 * Props for SkeletonLoader component
 */
export interface ISkeletonLoaderProps {
  /** Width of the skeleton (CSS value) */
  width?: string | number;
  /** Height of the skeleton (CSS value) */
  height?: string | number;
  /** Border radius of the skeleton */
  borderRadius?: string | number;
  /** Number of lines to show (for text skeletons) */
  lines?: number;
  /** Gap between lines */
  lineGap?: number;
  /** Whether to animate the skeleton */
  animated?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * Skeleton loader component that shows placeholder content while data is loading
 * Provides a smooth loading experience by showing the expected content structure
 * 
 * @example
 * ```typescript
 * // Single line skeleton
 * <SkeletonLoader width="200px" height="20px" />
 * 
 * // Multi-line text skeleton
 * <SkeletonLoader width="100%" lines={3} />
 * 
 * // Card-like skeleton
 * <SkeletonLoader width="300px" height="200px" borderRadius="8px" />
 * ```
 */
export const SkeletonLoader: React.FC<ISkeletonLoaderProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  lines = 1,
  lineGap = 8,
  animated = true,
  className = '',
  ariaLabel = 'Loading content'
}) => {
  const baseStyle: React.CSSProperties = {
    backgroundColor: '#e2e5e8',
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    display: 'block',
    ...(animated && {
      backgroundImage: 'linear-gradient(90deg, #e2e5e8 0%, #f0f2f3 50%, #e2e5e8 100%)',
      backgroundSize: '200px 100%',
      backgroundRepeat: 'no-repeat',
      animation: 'grnsw-skeleton-loading 1.5s ease-in-out infinite'
    })
  };

  const singleSkeletonStyle: React.CSSProperties = {
    ...baseStyle,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  if (lines === 1) {
    return (
      <>
        {animated && (
          <style>
            {`
              @keyframes grnsw-skeleton-loading {
                0% { background-position: -200px 0; }
                100% { background-position: calc(200px + 100%) 0; }
              }
            `}
          </style>
        )}
        <div
          className={className}
          style={singleSkeletonStyle}
          aria-label={ariaLabel}
          role="status"
        />
      </>
    );
  }

  // Multi-line skeleton
  const lineElements = [];
  for (let i = 0; i < lines; i++) {
    const isLastLine = i === lines - 1;
    const lineWidth = isLastLine ? '75%' : '100%'; // Last line is typically shorter
    
    lineElements.push(
      <div
        key={i}
        style={{
          ...baseStyle,
          width: lineWidth,
          height: typeof height === 'number' ? `${height}px` : height,
          marginBottom: isLastLine ? 0 : `${lineGap}px`
        }}
      />
    );
  }

  return (
    <>
      {animated && (
        <style>
          {`
            @keyframes grnsw-skeleton-loading {
              0% { background-position: -200px 0; }
              100% { background-position: calc(200px + 100%) 0; }
            }
          `}
        </style>
      )}
      <div
        className={className}
        aria-label={`${ariaLabel} - ${lines} lines`}
        role="status"
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
      >
        {lineElements}
      </div>
    </>
  );
};

/**
 * Props for SkeletonCard component
 */
export interface ISkeletonCardProps {
  /** Width of the card */
  width?: string | number;
  /** Height of the card */
  height?: string | number;
  /** Whether to show image placeholder */
  showImage?: boolean;
  /** Image height */
  imageHeight?: string | number;
  /** Whether to show title placeholder */
  showTitle?: boolean;
  /** Number of content lines */
  contentLines?: number;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Whether to animate the skeleton */
  animated?: boolean;
  /** Custom className for styling */
  className?: string;
}

/**
 * Skeleton card component for dashboard cards and content blocks
 * Provides structured loading placeholders for complex UI components
 * 
 * @example
 * ```typescript
 * <SkeletonCard 
 *   width="300px"
 *   showImage={true}
 *   showTitle={true}
 *   contentLines={3}
 *   showActions={true}
 * />
 * ```
 */
export const SkeletonCard: React.FC<ISkeletonCardProps> = ({
  width = '100%',
  height = 'auto',
  showImage = false,
  imageHeight = '160px',
  showTitle = true,
  contentLines = 2,
  showActions = false,
  animated = true,
  className = ''
}) => {
  const cardStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    padding: '16px',
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    backgroundColor: '#ffffff'
  };

  return (
    <div className={className} style={cardStyle} role="status" aria-label="Loading card content">
      {showImage && (
        <SkeletonLoader
          width="100%"
          height={imageHeight}
          borderRadius="4px"
          animated={animated}
        />
      )}
      
      {(showImage || showTitle) && <div style={{ height: '12px' }} />}
      
      {showTitle && (
        <SkeletonLoader
          width="70%"
          height="24px"
          animated={animated}
        />
      )}
      
      {showTitle && contentLines > 0 && <div style={{ height: '12px' }} />}
      
      {contentLines > 0 && (
        <SkeletonLoader
          width="100%"
          height="16px"
          lines={contentLines}
          lineGap={8}
          animated={animated}
        />
      )}
      
      {showActions && (
        <>
          <div style={{ height: '16px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <SkeletonLoader width="80px" height="32px" borderRadius="4px" animated={animated} />
            <SkeletonLoader width="80px" height="32px" borderRadius="4px" animated={animated} />
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Props for SkeletonTable component
 */
export interface ISkeletonTableProps {
  /** Number of rows to show */
  rows?: number;
  /** Number of columns to show */
  columns?: number;
  /** Whether to show table header */
  showHeader?: boolean;
  /** Width of the table */
  width?: string | number;
  /** Height of each row */
  rowHeight?: number;
  /** Whether to animate the skeleton */
  animated?: boolean;
  /** Custom className for styling */
  className?: string;
}

/**
 * Skeleton table component for data grids and lists
 * Shows structured placeholder for tabular data while loading
 * 
 * @example
 * ```typescript
 * <SkeletonTable 
 *   rows={5}
 *   columns={4}
 *   showHeader={true}
 * />
 * ```
 */
export const SkeletonTable: React.FC<ISkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  width = '100%',
  rowHeight = 40,
  animated = true,
  className = ''
}) => {
  const tableStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    borderCollapse: 'collapse',
    border: '1px solid #e1e1e1',
    borderRadius: '4px',
    overflow: 'hidden'
  };

  const cellStyle: React.CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
    height: `${rowHeight}px`
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #e1e1e1'
  };

  return (
    <table className={className} style={tableStyle} role="status" aria-label={`Loading table with ${rows} rows`}>
      {showHeader && (
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, colIndex) => (
              <th key={colIndex} style={headerCellStyle}>
                <SkeletonLoader
                  width={`${60 + Math.random() * 40}%`}
                  height="16px"
                  animated={animated}
                />
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <td key={colIndex} style={cellStyle}>
                <SkeletonLoader
                  width={`${50 + Math.random() * 50}%`}
                  height="16px"
                  animated={animated}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * Props for SkeletonChart component
 */
export interface ISkeletonChartProps {
  /** Type of chart to simulate */
  type?: 'bar' | 'line' | 'pie' | 'doughnut';
  /** Width of the chart */
  width?: string | number;
  /** Height of the chart */
  height?: string | number;
  /** Whether to animate the skeleton */
  animated?: boolean;
  /** Custom className for styling */
  className?: string;
}

/**
 * Skeleton chart component for dashboard charts
 * Shows placeholder for different chart types while data loads
 * 
 * @example
 * ```typescript
 * <SkeletonChart type="bar" width="400px" height="300px" />
 * <SkeletonChart type="pie" width="300px" height="300px" />
 * ```
 */
export const SkeletonChart: React.FC<ISkeletonChartProps> = ({
  type = 'bar',
  width = '100%',
  height = '300px',
  animated = true,
  className = ''
}) => {
  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const renderBarChart = () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'end', gap: '8px' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonLoader
          key={i}
          width="40px"
          height={`${60 + Math.random() * 80}%`}
          animated={animated}
        />
      ))}
    </div>
  );

  const renderPieChart = () => (
    <SkeletonLoader
      width="200px"
      height="200px"
      borderRadius="50%"
      animated={animated}
    />
  );

  const renderLineChart = () => (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <SkeletonLoader
        width="100%"
        height="2px"
        borderRadius="1px"
        animated={animated}
      />
      <div style={{ position: 'absolute', top: '30%', width: '100%' }}>
        <SkeletonLoader
          width="100%"
          height="2px"
          borderRadius="1px"
          animated={animated}
        />
      </div>
      <div style={{ position: 'absolute', top: '60%', width: '100%' }}>
        <SkeletonLoader
          width="100%"
          height="2px"
          borderRadius="1px"
          animated={animated}
        />
      </div>
    </div>
  );

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'pie':
      case 'doughnut':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div 
      className={className} 
      style={containerStyle} 
      role="status" 
      aria-label={`Loading ${type} chart`}
    >
      {renderChart()}
    </div>
  );
};