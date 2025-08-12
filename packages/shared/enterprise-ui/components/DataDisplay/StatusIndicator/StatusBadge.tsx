import * as React from 'react';
import styles from './StatusBadge.module.scss';

export interface StatusBadgeProps {
  status: string | number;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  className?: string;
  dot?: boolean;
  outline?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'neutral',
  size = 'medium',
  icon,
  className = '',
  dot = false,
  outline = false
}) => {
  return (
    <span 
      className={`
        ${styles.statusBadge} 
        ${styles[`variant-${variant}`]} 
        ${styles[`size-${size}`]}
        ${outline ? styles.outline : ''}
        ${className}
      `}
    >
      {dot && <span className={styles.dot} />}
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>{status}</span>
    </span>
  );
};