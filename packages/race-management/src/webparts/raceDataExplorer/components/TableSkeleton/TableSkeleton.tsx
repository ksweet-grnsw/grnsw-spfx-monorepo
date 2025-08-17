import * as React from 'react';
import styles from './TableSkeleton.module.scss';

export interface ITableSkeletonProps {
  rows?: number;
  columns?: number;
  showFilters?: boolean;
}

export const TableSkeleton: React.FC<ITableSkeletonProps> = ({
  rows = 10,
  columns = 8,
  showFilters = true
}) => {
  return (
    <div className={styles.tableSkeleton} style={{ backgroundColor: 'white' }}>
      {/* Filter skeleton */}
      {showFilters && (
        <div className={styles.filterSkeleton} style={{ backgroundColor: '#f9f9f9' }}>
          <div className={styles.filterRow}>
            <div className={styles.shimmer} style={{ width: '150px', height: '32px' }} />
            <div className={styles.shimmer} style={{ width: '150px', height: '32px' }} />
            <div className={styles.shimmer} style={{ width: '200px', height: '32px' }} />
            <div className={styles.shimmer} style={{ width: '100px', height: '32px' }} />
          </div>
        </div>
      )}

      {/* Table header skeleton */}
      <div className={styles.headerSkeleton} style={{ backgroundColor: '#f5f5f5' }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className={styles.headerCell}>
            <div className={styles.shimmer} style={{ width: `${80 + Math.random() * 40}px`, height: '14px' }} />
          </div>
        ))}
      </div>

      {/* Table rows skeleton */}
      <div className={styles.bodySkeleton}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className={styles.rowSkeleton}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className={styles.cellSkeleton}>
                <div 
                  className={styles.shimmer} 
                  style={{ 
                    width: `${60 + Math.random() * 60}px`, 
                    height: '12px',
                    animationDelay: `${(rowIndex * 0.05) + (colIndex * 0.02)}s`
                  }} 
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ cards?: number }> = ({ cards = 3 }) => {
  return (
    <div className={styles.cardSkeletonContainer}>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className={styles.cardSkeleton} style={{ backgroundColor: 'white' }}>
          <div className={styles.cardHeader}>
            <div className={styles.shimmer} style={{ width: '60%', height: '20px' }} />
            <div className={styles.shimmer} style={{ width: '30%', height: '16px' }} />
          </div>
          <div className={styles.cardBody}>
            <div className={styles.shimmer} style={{ width: '100%', height: '14px' }} />
            <div className={styles.shimmer} style={{ width: '80%', height: '14px' }} />
            <div className={styles.shimmer} style={{ width: '90%', height: '14px' }} />
          </div>
          <div className={styles.cardFooter}>
            <div className={styles.shimmer} style={{ width: '40%', height: '16px' }} />
            <div className={styles.shimmer} style={{ width: '40%', height: '16px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className={styles.chartSkeleton} style={{ backgroundColor: 'white' }}>
      <div className={styles.chartHeader}>
        <div className={styles.shimmer} style={{ width: '200px', height: '24px' }} />
      </div>
      <div className={styles.chartBody}>
        <div className={styles.chartBars}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={styles.barContainer}>
              <div 
                className={`${styles.shimmer} ${styles.bar}`} 
                style={{ 
                  height: `${40 + Math.random() * 60}%`,
                  animationDelay: `${index * 0.1}s`
                }} 
              />
              <div className={styles.shimmer} style={{ width: '30px', height: '10px', marginTop: '4px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};