import * as React from 'react';
import { getTimeslotStyles } from '../../utils/timeslotHelpers';

export interface TimeslotPillProps {
  /** The timeslot value to display */
  timeslot: string | undefined | null;
  /** Additional CSS class name */
  className?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Custom style overrides */
  style?: React.CSSProperties;
}

/**
 * Reusable TimeslotPill component for consistent timeslot display
 * Follows Single Responsibility Principle - only handles timeslot rendering
 */
export const TimeslotPill: React.FC<TimeslotPillProps> = ({
  timeslot,
  className = '',
  size = 'medium',
  style = {}
}) => {
  // Handle empty/null timeslots
  if (!timeslot) {
    return <span style={{ color: '#666', fontSize: '12px' }}>-</span>;
  }

  // Get styling from centralized utility
  const timeslotStyles = getTimeslotStyles(timeslot);
  
  // Size-based styling
  const sizeStyles = {
    small: {
      padding: '1px 6px',
      fontSize: '10px',
      borderRadius: '8px'
    },
    medium: {
      padding: '2px 10px',
      fontSize: '12px',
      borderRadius: '12px'
    },
    large: {
      padding: '4px 14px',
      fontSize: '14px',
      borderRadius: '16px'
    }
  };

  // Combine all styles
  const combinedStyles: React.CSSProperties = {
    display: 'inline-block',
    fontWeight: '600',
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
    backgroundColor: timeslotStyles.backgroundColor,
    color: timeslotStyles.color,
    ...sizeStyles[size],
    ...style
  };

  return (
    <span
      className={className}
      style={combinedStyles}
      title={`Timeslot: ${timeslot}`}
    >
      {timeslot}
    </span>
  );
};