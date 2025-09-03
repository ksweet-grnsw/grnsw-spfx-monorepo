import * as React from 'react';
import { useState } from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { IconButton } from '@fluentui/react/lib/Button';

export interface IFilterPanelProps {
  /** Title of the filter panel */
  title?: string;
  /** Theme color */
  theme?: 'default' | 'health' | 'racing' | 'weather';
  /** Whether the panel can be collapsed */
  collapsible?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Children components (filter controls) */
  children: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** Callback when panel is expanded/collapsed */
  onToggle?: (expanded: boolean) => void;
}

/**
 * FilterPanel component for organizing filter controls
 * Provides a consistent container for dashboard filters
 */
export const FilterPanel: React.FC<IFilterPanelProps> = ({
  title,
  theme = 'default',
  collapsible = false,
  defaultExpanded = true,
  children,
  className = '',
  onToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = (): void => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const getThemeStyles = (): React.CSSProperties => {
    const themes = {
      default: {
        borderColor: '#edebe9',
        headerBackground: '#f3f2f1',
        accentColor: '#0078d4'
      },
      health: {
        borderColor: '#d4f4dd',
        headerBackground: '#f0faf4',
        accentColor: '#0e7c3a'
      },
      racing: {
        borderColor: '#fde7e9',
        headerBackground: '#fef6f7',
        accentColor: '#d13438'
      },
      weather: {
        borderColor: '#e3f2fd',
        headerBackground: '#f5fafe',
        accentColor: '#0078d4'
      }
    };

    const selectedTheme = themes[theme];

    return {
      border: `1px solid ${selectedTheme.borderColor}`,
      borderRadius: '4px',
      marginBottom: '20px',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    };
  };

  const getHeaderStyles = (): React.CSSProperties => {
    const themes = {
      default: '#f3f2f1',
      health: '#f0faf4',
      racing: '#fef6f7',
      weather: '#f5fafe'
    };

    return {
      backgroundColor: themes[theme],
      padding: title ? '12px 16px' : '0',
      borderBottom: title ? '1px solid #edebe9' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: collapsible ? 'pointer' : 'default',
      userSelect: 'none'
    };
  };

  const getContentStyles = (): React.CSSProperties => {
    return {
      padding: '16px',
      display: isExpanded ? 'block' : 'none',
      backgroundColor: '#ffffff',
      transition: 'all 0.3s ease'
    };
  };

  const getTitleStyles = (): React.CSSProperties => {
    return {
      fontSize: '14px',
      fontWeight: 600,
      color: '#323130',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    };
  };

  return (
    <div 
      className={className}
      style={getThemeStyles()}
    >
      {title && (
        <div 
          style={getHeaderStyles()}
          onClick={collapsible ? handleToggle : undefined}
        >
          <div style={getTitleStyles()}>
            {collapsible && (
              <Icon 
                iconName={isExpanded ? 'ChevronDown' : 'ChevronRight'}
                style={{ 
                  fontSize: '12px',
                  transition: 'transform 0.2s ease'
                }}
              />
            )}
            {title}
          </div>
          {collapsible && (
            <IconButton
              iconProps={{ 
                iconName: isExpanded ? 'CalculatorSubtract' : 'CalculatorAddition'
              }}
              title={isExpanded ? 'Collapse' : 'Expand'}
              ariaLabel={isExpanded ? 'Collapse filter panel' : 'Expand filter panel'}
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              styles={{
                root: {
                  height: '24px',
                  width: '24px'
                }
              }}
            />
          )}
        </div>
      )}
      <div style={getContentStyles()}>
        {children}
      </div>
    </div>
  );
};

export default FilterPanel;