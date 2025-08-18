import * as React from 'react';
import styles from './InjuryIndicator.module.scss';

export interface InjuryIndicatorProps {
  hasInjury: boolean;
  size?: 'small' | 'medium' | 'large';
  inline?: boolean;
  tooltip?: string;
  className?: string;
}

/**
 * Reusable injury indicator component
 * Following DRY principle - single source for injury indication UI
 */
export const InjuryIndicator: React.FC<InjuryIndicatorProps> = ({
  hasInjury,
  size = 'small',
  inline = true,
  tooltip = 'Injury reported',
  className
}) => {
  if (!hasInjury) {
    return null;
  }

  // Get the health icon SVG
  const healthIcon = require('../../assets/icons/health.svg');

  const sizeMap = {
    small: 14,
    medium: 20,  // 1.25x bigger (16px * 1.25 = 20px)
    large: 25    // Also increased proportionally (20px * 1.25 = 25px)
  };

  const iconSize = sizeMap[size];

  return (
    <span 
      className={`${styles.injuryIndicator} ${inline ? styles.inline : ''} ${className || ''}`}
      title={tooltip}
    >
      <img 
        src={healthIcon}
        alt="Injury"
        className={styles.icon}
        style={{
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          filter: 'brightness(0) saturate(100%) invert(21%) sepia(100%) saturate(3800%) hue-rotate(339deg) brightness(87%) contrast(97%)'  // Red color
        }}
      />
    </span>
  );
};

export default InjuryIndicator;