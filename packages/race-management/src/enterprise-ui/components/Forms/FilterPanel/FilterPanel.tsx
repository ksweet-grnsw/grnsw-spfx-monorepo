import * as React from 'react';
import { useState } from 'react';
import styles from './FilterPanel.module.scss';

export interface FilterPanelProps {
  title?: string;
  children: React.ReactNode;
  theme?: 'neutral' | 'meeting' | 'race' | 'contestant';
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showClearAll?: boolean;
  onClearAll?: () => void;
  className?: string;
  footer?: React.ReactNode;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  title = 'Filters',
  children,
  theme = 'neutral',
  collapsible = true,
  defaultExpanded = true,
  showClearAll = true,
  onClearAll,
  className = '',
  footer
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const handleToggle = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };
  
  return (
    <div className={`${styles.filterPanel} ${(styles as any)[`theme-${theme}`] || ''} ${className}`}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          {collapsible ? (
            <button
              className={styles.toggleButton}
              onClick={handleToggle}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              <span className={styles.toggleIcon}>
                {isExpanded ? '−' : '+'}
              </span>
              <span className={styles.title}>{title}</span>
            </button>
          ) : (
            <h3 className={styles.title}>{title}</h3>
          )}
        </div>
        {showClearAll && onClearAll && isExpanded && (
          <button
            className={styles.clearButton}
            onClick={onClearAll}
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        )}
      </div>
      
      {isExpanded && (
        <>
          <div className={styles.content}>
            {children}
          </div>
          {footer && (
            <div className={styles.footer}>
              {footer}
            </div>
          )}
        </>
      )}
    </div>
  );
};