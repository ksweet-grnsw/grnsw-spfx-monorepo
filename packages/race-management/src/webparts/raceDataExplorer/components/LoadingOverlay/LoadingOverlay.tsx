import * as React from 'react';
import styles from './LoadingOverlay.module.scss';

export interface ILoadingOverlayProps {
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  progress?: number;
  type?: 'spinner' | 'dots' | 'pulse';
  fullScreen?: boolean;
}

export const LoadingOverlay: React.FC<ILoadingOverlayProps> = ({
  message = 'Loading...',
  subMessage,
  showProgress = false,
  progress = 0,
  type = 'spinner',
  fullScreen = false
}) => {
  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return (
          <div className={styles.dots}>
            <div className={styles.dot} />
            <div className={styles.dot} />
            <div className={styles.dot} />
          </div>
        );
      case 'pulse':
        return (
          <div className={styles.pulse}>
            <div className={styles.pulseRing} />
            <div className={styles.pulseRing} />
          </div>
        );
      default:
        return <div className={styles.spinner} />;
    }
  };

  return (
    <div 
      className={`${styles.loadingOverlay} ${fullScreen ? styles.fullScreen : ''}`}
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
    >
      <div className={styles.loadingContent} style={{ backgroundColor: 'white' }}>
        {renderLoader()}
        <div className={styles.loadingText}>
          <div className={styles.message}>{message}</div>
          {subMessage && <div className={styles.subMessage}>{subMessage}</div>}
        </div>
        {showProgress && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className={styles.progressText}>{Math.round(progress)}%</div>
          </div>
        )}
      </div>
    </div>
  );
};

export const InlineLoader: React.FC<{ text?: string }> = ({ text = 'Loading' }) => {
  return (
    <div className={styles.inlineLoader}>
      <div className={styles.miniSpinner} />
      <span>{text}</span>
    </div>
  );
};

export const DataRefreshIndicator: React.FC<{ lastRefresh?: Date }> = ({ lastRefresh }) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (lastRefresh) {
      setIsRefreshing(true);
      const timer = setTimeout(() => setIsRefreshing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastRefresh]);

  return (
    <div className={`${styles.refreshIndicator} ${isRefreshing ? styles.refreshing : ''}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" className={styles.refreshIcon}>
        <path d="M13.65 2.35A8 8 0 1 0 16 8h-1.5A6.5 6.5 0 1 1 8 1.5V0l4 3-4 3V4.5A4.5 4.5 0 1 0 12.5 8H14a6 6 0 1 1-1.35-5.65z" />
      </svg>
      {lastRefresh && (
        <span className={styles.refreshText}>
          Last updated: {lastRefresh.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};