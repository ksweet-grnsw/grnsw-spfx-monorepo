import * as React from 'react';

/**
 * Props for LoadingSpinner component
 */
export interface ILoadingSpinnerProps {
  /** Size of the spinner in pixels */
  size?: number;
  /** Color of the spinner */
  color?: string;
  /** Whether to show loading text */
  showText?: boolean;
  /** Custom loading text */
  text?: string;
  /** Whether to center the spinner */
  center?: boolean;
  /** Custom className for styling */
  className?: string;
}

/**
 * Customizable loading spinner component with smooth animations
 * Provides consistent loading indicators across the application
 * 
 * @example
 * ```typescript
 * // Basic spinner
 * <LoadingSpinner />
 * 
 * // Large centered spinner with text
 * <LoadingSpinner 
 *   size={48} 
 *   showText={true} 
 *   text="Loading dashboard..." 
 *   center={true}
 * />
 * 
 * // Custom colored spinner
 * <LoadingSpinner color="#007acc" size={24} />
 * ```
 */
export const LoadingSpinner: React.FC<ILoadingSpinnerProps> = ({
  size = 32,
  color = '#0078d4',
  showText = false,
  text = 'Loading...',
  center = false,
  className = ''
}) => {
  const spinnerStyle: React.CSSProperties = {
    width: size,
    height: size,
    border: `${Math.max(2, size / 16)}px solid transparent`,
    borderTop: `${Math.max(2, size / 16)}px solid ${color}`,
    borderRadius: '50%',
    animation: 'grnsw-spin 1s linear infinite'
  };

  const containerStyle: React.CSSProperties = {
    display: center ? 'flex' : 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    ...(center && {
      justifyContent: 'center',
      width: '100%',
      padding: '20px'
    })
  };

  return (
    <>
      {/* Inject keyframe animation styles */}
      <style>
        {`
          @keyframes grnsw-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .grnsw-loading-fade-in {
            animation: grnsw-fade-in 0.3s ease-in;
          }
          
          @keyframes grnsw-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
      
      <div 
        className={`grnsw-loading-fade-in ${className}`}
        style={containerStyle}
        role="status"
        aria-live="polite"
        aria-label={showText ? text : 'Loading'}
      >
        <div style={spinnerStyle} />
        {showText && (
          <span 
            style={{ 
              fontSize: '14px', 
              color: '#666', 
              fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' 
            }}
          >
            {text}
          </span>
        )}
      </div>
    </>
  );
};

/**
 * Props for LoadingOverlay component
 */
export interface ILoadingOverlayProps extends ILoadingSpinnerProps {
  /** Whether the overlay is visible */
  isLoading: boolean;
  /** Background color of the overlay */
  backgroundColor?: string;
  /** Opacity of the overlay background */
  backgroundOpacity?: number;
  /** Children to render behind the overlay */
  children: React.ReactNode;
  /** Minimum time to show loading (prevents flashing) */
  minLoadingTime?: number;
}

/**
 * Loading overlay component that covers content while loading
 * Prevents interaction and provides visual loading feedback
 * 
 * @example
 * ```typescript
 * <LoadingOverlay isLoading={isLoadingData} text="Loading injury data...">
 *   <InjuryDataGrid data={data} />
 * </LoadingOverlay>
 * ```
 */
export const LoadingOverlay: React.FC<ILoadingOverlayProps> = ({
  isLoading,
  backgroundColor = '#ffffff',
  backgroundOpacity = 0.8,
  minLoadingTime = 300,
  children,
  ...spinnerProps
}) => {
  const [showLoading, setShowLoading] = React.useState(isLoading);
  const [loadingStartTime, setLoadingStartTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      setLoadingStartTime(Date.now());
      setShowLoading(true);
    } else if (loadingStartTime) {
      const elapsed = Date.now() - loadingStartTime;
      const remaining = Math.max(0, minLoadingTime - elapsed);
      
      setTimeout(() => {
        setShowLoading(false);
        setLoadingStartTime(null);
      }, remaining);
    } else {
      setShowLoading(false);
    }
  }, [isLoading, loadingStartTime, minLoadingTime]);

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: backgroundColor,
    opacity: backgroundOpacity,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    transition: 'opacity 0.2s ease-in-out'
  };

  return (
    <div style={{ position: 'relative' }}>
      {children}
      {showLoading && (
        <div style={overlayStyle}>
          <LoadingSpinner {...spinnerProps} center={true} />
        </div>
      )}
    </div>
  );
};

/**
 * Props for ProgressBar component
 */
export interface IProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Height of the progress bar */
  height?: number;
  /** Color of the progress fill */
  color?: string;
  /** Background color of the progress bar */
  backgroundColor?: string;
  /** Whether to show percentage text */
  showPercentage?: boolean;
  /** Whether to animate the progress */
  animated?: boolean;
  /** Custom className for styling */
  className?: string;
}

/**
 * Progress bar component for showing loading progress
 * Useful for multi-step operations or file uploads
 * 
 * @example
 * ```typescript
 * <ProgressBar 
 *   progress={loadingProgress} 
 *   showPercentage={true}
 *   animated={true}
 *   color="#28a745"
 * />
 * ```
 */
export const ProgressBar: React.FC<IProgressBarProps> = ({
  progress,
  height = 8,
  color = '#0078d4',
  backgroundColor = '#e5e5e5',
  showPercentage = false,
  animated = true,
  className = ''
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height,
    backgroundColor,
    borderRadius: height / 2,
    overflow: 'hidden',
    position: 'relative'
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    width: `${clampedProgress}%`,
    backgroundColor: color,
    transition: animated ? 'width 0.3s ease-in-out' : 'none',
    borderRadius: height / 2
  };

  return (
    <div className={className}>
      {showPercentage && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          <span>Loading...</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div style={containerStyle} role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100}>
        <div style={fillStyle} />
      </div>
    </div>
  );
};