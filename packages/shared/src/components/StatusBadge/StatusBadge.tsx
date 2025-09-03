import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';

export interface IStatusBadgeProps {
  /** The status text to display */
  status: string;
  /** Visual variant of the badge */
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  /** Size of the badge */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show a dot indicator */
  dot?: boolean;
  /** Optional icon name */
  icon?: string;
  /** Additional CSS class name */
  className?: string;
}

/**
 * StatusBadge component for displaying status indicators
 * Used across dashboards to show status information consistently
 */
export const StatusBadge: React.FC<IStatusBadgeProps> = ({
  status,
  variant = 'neutral',
  size = 'medium',
  dot = false,
  icon,
  className = ''
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      borderRadius: '4px',
      fontWeight: 500,
      transition: 'all 0.2s ease'
    };

    const sizeStyles = {
      small: {
        padding: '2px 8px',
        fontSize: '12px'
      },
      medium: {
        padding: '4px 12px',
        fontSize: '14px'
      },
      large: {
        padding: '6px 16px',
        fontSize: '16px'
      }
    };

    const variantColors = {
      success: {
        backgroundColor: '#d4f4dd',
        color: '#0e7c3a',
        border: '1px solid #0e7c3a20'
      },
      warning: {
        backgroundColor: '#fff4ce',
        color: '#a77d00',
        border: '1px solid #a77d0020'
      },
      error: {
        backgroundColor: '#fde7e9',
        color: '#d13438',
        border: '1px solid #d1343820'
      },
      info: {
        backgroundColor: '#e3f2fd',
        color: '#0078d4',
        border: '1px solid #0078d420'
      },
      neutral: {
        backgroundColor: '#f3f2f1',
        color: '#323130',
        border: '1px solid #32313020'
      }
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantColors[variant]
    };
  };

  const getDotStyles = (): React.CSSProperties => {
    const dotColors = {
      success: '#0e7c3a',
      warning: '#a77d00',
      error: '#d13438',
      info: '#0078d4',
      neutral: '#605e5c'
    };

    return {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: dotColors[variant],
      display: 'inline-block'
    };
  };

  return (
    <span 
      className={className}
      style={getVariantStyles()}
    >
      {dot && <span style={getDotStyles()} />}
      {icon && <Icon iconName={icon} style={{ fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px' }} />}
      {status}
    </span>
  );
};

export default StatusBadge;