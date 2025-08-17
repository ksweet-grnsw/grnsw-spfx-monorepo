import * as React from 'react';
import styles from './MobileCardView.module.scss';
import { StatusBadge } from '../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';

export interface MobileCardProps {
  title: string;
  subtitle?: string;
  badges?: Array<{
    label: string;
    variant: 'info' | 'success' | 'warning' | 'error' | 'neutral';
  }>;
  details: Array<{
    label: string;
    value: string | React.ReactNode;
  }>;
  actions?: Array<{
    label: string;
    icon?: string;
    onClick: () => void;
  }>;
  onClick?: () => void;
  theme?: 'neutral' | 'meeting' | 'race' | 'contestant';
}

/**
 * Mobile-optimized card view component
 * Provides touch-friendly interface for mobile devices
 */
export const MobileCardView: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  badges,
  details,
  actions,
  onClick,
  theme = 'neutral'
}) => {
  return (
    <div 
      className={`${styles.mobileCard} ${styles[`theme-${theme}`]}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Card Header */}
      <div className={styles.cardHeader}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {badges && badges.length > 0 && (
          <div className={styles.badges}>
            {badges.map((badge, index) => (
              <StatusBadge
                key={index}
                status={badge.label}
                variant={badge.variant}
                size="small"
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className={styles.cardDetails}>
        {details.map((detail, index) => (
          <div key={index} className={styles.detailRow}>
            <span className={styles.detailLabel}>{detail.label}:</span>
            <span className={styles.detailValue}>{detail.value}</span>
          </div>
        ))}
      </div>

      {/* Card Actions */}
      {actions && actions.length > 0 && (
        <div className={styles.cardActions}>
          {actions.map((action, index) => (
            <button
              key={index}
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
            >
              {action.icon && <span className={styles.actionIcon}>{action.icon}</span>}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Click Indicator */}
      {onClick && (
        <div className={styles.clickIndicator}>
          <span>›</span>
        </div>
      )}
    </div>
  );
};

export interface MobileListViewProps {
  items: any[];
  renderCard: (item: any, index: number) => React.ReactNode;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  theme?: 'neutral' | 'meeting' | 'race' | 'contestant';
}

/**
 * Mobile list view with infinite scroll support
 */
export const MobileListView: React.FC<MobileListViewProps> = ({
  items,
  renderCard,
  loading,
  error,
  emptyMessage = 'No items found',
  onLoadMore,
  hasMore,
  theme = 'neutral'
}) => {
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  // Set up infinite scroll
  React.useEffect(() => {
    if (!onLoadMore || !hasMore || loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore, loading]);

  if (loading && items.length === 0) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <span className={styles.errorIcon}>⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📭</span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.mobileListView} ${styles[`theme-${theme}`]}`}>
      <div className={styles.cardList}>
        {items.map((item, index) => (
          <div key={index} className={styles.cardWrapper}>
            {renderCard(item, index)}
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className={styles.loadMoreTrigger}>
          {loading && (
            <div className={styles.loadingMore}>
              <div className={styles.spinner} />
              <span>Loading more...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Hook to detect mobile viewport
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
};

/**
 * Hook for swipe gestures
 */
export const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 50
) => {
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);
  const touchEnd = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, []);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    touchEnd.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, []);

  const handleTouchEnd = React.useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;

    // Check if horizontal swipe is more prominent than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < -threshold && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    touchStart.current = null;
    touchEnd.current = null;
  }, [threshold, onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
};