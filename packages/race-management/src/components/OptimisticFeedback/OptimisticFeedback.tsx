import * as React from 'react';
import styles from './OptimisticFeedback.module.scss';

export interface OptimisticFeedbackProps {
  isPending: boolean;
  isRollingBack: boolean;
  error: string | null;
  successMessage?: string;
  pendingMessage?: string;
  errorMessage?: string;
  rollbackMessage?: string;
  position?: 'top' | 'bottom' | 'inline';
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const OptimisticFeedback: React.FC<OptimisticFeedbackProps> = ({
  isPending,
  isRollingBack,
  error,
  successMessage = 'Changes saved successfully',
  pendingMessage = 'Saving changes...',
  errorMessage = 'Failed to save changes',
  rollbackMessage = 'Reverting changes...',
  position = 'top',
  autoHide = true,
  autoHideDelay = 3000
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [currentState, setCurrentState] = React.useState<'idle' | 'pending' | 'success' | 'error' | 'rollback'>('idle');
  const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    // Clear existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    if (isPending) {
      setCurrentState('pending');
      setIsVisible(true);
    } else if (isRollingBack) {
      setCurrentState('rollback');
      setIsVisible(true);
    } else if (error) {
      setCurrentState('error');
      setIsVisible(true);
      
      if (autoHide && !isRollingBack) {
        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, autoHideDelay);
      }
    } else if (currentState === 'pending') {
      // Transition from pending to success
      setCurrentState('success');
      
      if (autoHide) {
        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
          setCurrentState('idle');
        }, autoHideDelay);
      }
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isPending, isRollingBack, error, autoHide, autoHideDelay, currentState]);

  if (!isVisible) {
    return null;
  }

  const getMessage = () => {
    switch (currentState) {
      case 'pending':
        return pendingMessage;
      case 'success':
        return successMessage;
      case 'error':
        return error || errorMessage;
      case 'rollback':
        return rollbackMessage;
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (currentState) {
      case 'pending':
        return <div className={styles.spinner} />;
      case 'success':
        return <span className={styles.icon}>✓</span>;
      case 'error':
        return <span className={styles.icon}>✕</span>;
      case 'rollback':
        return <div className={styles.spinner} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`
        ${styles.optimisticFeedback}
        ${styles[currentState]}
        ${styles[position]}
        ${isVisible ? styles.visible : styles.hidden}
      `}
      role="status"
      aria-live="polite"
    >
      <div className={styles.content}>
        {getIcon()}
        <span className={styles.message}>{getMessage()}</span>
      </div>
      {currentState === 'pending' && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
      )}
    </div>
  );
};

/**
 * Inline feedback component for form fields or small updates
 */
export const InlineOptimisticFeedback: React.FC<{
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}> = ({ isPending, isSuccess, isError }) => {
  if (isPending) {
    return (
      <span className={styles.inlineFeedback}>
        <span className={styles.inlineSpinner} />
      </span>
    );
  }
  
  if (isSuccess) {
    return (
      <span className={`${styles.inlineFeedback} ${styles.success}`}>
        ✓
      </span>
    );
  }
  
  if (isError) {
    return (
      <span className={`${styles.inlineFeedback} ${styles.error}`}>
        ✕
      </span>
    );
  }
  
  return null;
};