import { useMemo } from 'react';
import { DataGridColumn } from '../enterprise-ui/components/DataDisplay/DataGrid/DataGrid.types';
import { IMeeting, IRace, IContestant } from '../models/IRaceData';
import { StatusBadge } from '../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import * as React from 'react';
import { renderRugNumber, renderPlacement } from '../utils/tableConfig/columnHelpers';
import { InjuryIndicator } from '../components/InjuryIndicator';
import { TimeslotPill } from '../components/TimeslotPill';

/**
 * Hook to manage table column definitions
 * Centralizes all column configurations to reduce duplication
 */
export function useTableColumns() {
  
  const meetingColumns = useMemo((): DataGridColumn<IMeeting>[] => [
    {
      key: 'cr4cc_meetingdate',
      label: 'Date',
      sortable: true,
      width: '120px',
      render: (value: string) => {
        const date = new Date(value);
        return date.toLocaleDateString('en-AU', { 
          weekday: 'short', 
          day: '2-digit', 
          month: 'short' 
        });
      }
    },
    {
      key: 'cr4cc_trackname',
      label: 'Track',
      sortable: true,
      width: '180px'
    },
    {
      key: 'cr4cc_authority',
      label: 'Authority',
      sortable: true,
      width: '100px',
      render: (value: string) => (
        React.createElement(StatusBadge, {
          status: value,
          variant: 'info',
          size: 'small'
        })
      )
    },
    {
      key: 'cr4cc_timeslot',
      label: 'Timeslot',
      sortable: true,
      width: '120px',
      render: (value: string) => React.createElement(TimeslotPill, {
        timeslot: value,
        size: 'medium'
      })
    },
    {
      key: 'cr4cc_type',
      label: 'Type',
      sortable: true,
      width: '100px',
      render: (value: string) => value || 'Race'
    },
    {
      key: 'injuryStatus',
      label: 'Injuries',
      sortable: false,
      width: '80px',
      align: 'center',
      render: (value: any, row: IMeeting) => {
        const hasInjuries = (row as any).hasInjuries;
        return React.createElement(InjuryIndicator, {
          hasInjury: hasInjuries,
          size: 'medium',
          inline: false,
          tooltip: 'Injuries reported at this meeting'
        });
      }
    }
  ], []);

  const raceColumns = useMemo((): DataGridColumn<IRace>[] => [
    {
      key: 'cr616_racenumber',
      label: 'Race #',
      sortable: true,
      width: '80px'
    },
    {
      key: 'cr616_racetitle',
      label: 'Title',
      sortable: true,
      width: '200px'
    },
    {
      key: 'cr616_racegrading',
      label: 'Grade',
      sortable: true,
      width: '100px'
    },
    {
      key: 'cr616_distance',
      label: 'Distance',
      sortable: true,
      width: '100px',
      render: (value: number) => value ? `${value}m` : '-'
    },
    {
      key: 'cr616_starttime',
      label: 'Time',
      sortable: true,
      width: '100px',
      render: (value: string) => {
        if (!value) return '-';
        const time = new Date(value);
        return time.toLocaleTimeString('en-AU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    },
    {
      key: 'cr616_numberofcontestants',
      label: 'Field',
      sortable: true,
      width: '80px',
      align: 'center'
    },
    {
      key: 'cr616_prize1',
      label: 'Prize (1st)',
      sortable: true,
      width: '100px',
      render: (value: number) => value ? `$${value.toLocaleString()}` : '-'
    },
    {
      key: 'injuryStatus',
      label: 'Injuries',
      sortable: false,
      width: '80px',
      align: 'center',
      render: (value: any, row: IRace) => {
        const hasInjuries = (row as any).hasInjuries;
        return React.createElement(InjuryIndicator, {
          hasInjury: hasInjuries,
          size: 'medium',
          inline: false,
          tooltip: 'Injuries reported in this race'
        });
      }
    }
  ], []);

  const contestantColumns = useMemo((): DataGridColumn<IContestant>[] => [
    {
      key: 'cr616_rugnumber',
      label: 'Rug',
      sortable: true,
      width: '60px',
      align: 'center',
      render: renderRugNumber
    },
    {
      key: 'cr616_greyhoundname',
      label: 'Greyhound',
      sortable: true,
      width: '180px'
    },
    {
      key: 'cr616_ownername',
      label: 'Owner',
      sortable: true,
      width: '150px'
    },
    {
      key: 'cr616_trainername',
      label: 'Trainer',
      sortable: true,
      width: '150px'
    },
    {
      key: 'cr616_doggrade',
      label: 'Grade',
      sortable: true,
      width: '80px'
    },
    {
      key: 'cr616_placement',
      label: 'Place',
      sortable: true,
      width: '80px',
      align: 'center',
      render: renderPlacement
    },
    {
      key: 'cr616_margin',
      label: 'Margin',
      sortable: true,
      width: '80px',
      render: (value: any) => value !== null && value !== undefined ? `${value}L` : '-'
    },
    {
      key: 'cr616_weight',
      label: 'Weight',
      sortable: true,
      width: '80px',
      render: (value: any) => value !== null && value !== undefined ? `${value}kg` : '-'
    },
    {
      key: 'cr616_status',
      label: 'Status',
      sortable: true,
      width: '100px',
      render: (value: string) => {
        const variant = value === 'Runner' ? 'success' : 
                       value === 'Scratched' ? 'error' : 'neutral';
        return React.createElement(StatusBadge, {
          status: value,
          variant: variant,
          size: 'small'
        });
      }
    },
    {
      key: 'injuryStatus',
      label: 'Injured',
      sortable: false,
      width: '80px',
      align: 'center',
      render: (value: any, row: IContestant) => {
        const hasInjuries = (row as any).hasInjuries;
        return React.createElement(InjuryIndicator, {
          hasInjury: hasInjuries,
          size: 'medium',
          inline: false,
          tooltip: 'This greyhound was injured'
        });
      }
    }
  ], []);

  return {
    meetingColumns,
    raceColumns,
    contestantColumns
  };
}

/**
 * Hook to add action columns to table definitions
 */
export function useActionColumns<T>(
  columns: DataGridColumn<T>[],
  actions: {
    label: string;
    icon: string;
    onClick: (item: T) => void;
    isVisible?: (item: T) => boolean;
  }[],
  density?: 'compact' | 'normal' | 'comfortable'
): DataGridColumn<T>[] {
  return useMemo(() => {
    // Adjust sizes based on density
    const isCompact = density === 'compact';
    const buttonSize = '36px';  // Keep consistent button size
    const iconSize = '21px';     // Keep consistent icon size
    const padding = '6px';
    const gap = '4px';
    const borderRadius = '6px';
    
    const actionColumn: DataGridColumn<T> = {
      key: 'actions',
      label: 'Actions',
      width: `${Math.max(80, Math.min(120, actions.length * 40))}px`,  // Consistent width
      align: 'right',
      render: (_: any, row: T) => {
        const visibleActions = actions.filter(action => 
          !action.isVisible || action.isVisible(row)
        );
        
        return React.createElement('div', {
          style: { display: 'flex', gap: gap, justifyContent: 'flex-end' }
        }, visibleActions.map((action, index) => 
          React.createElement('button', {
            key: index,
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              action.onClick(row);
            },
            className: 'modernActionButton',
            title: action.label,
            style: {
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              cursor: 'pointer',
              padding: padding,
              borderRadius: borderRadius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isCompact ? '12px' : '14px',
              color: '#495057',
              transition: 'all 0.2s ease',
              minWidth: buttonSize,
              height: buttonSize,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            },
            onMouseEnter: (e: any) => {
              e.currentTarget.style.background = '#e9ecef';
              e.currentTarget.style.color = '#00426d';  // Dark blue on hover
              e.currentTarget.style.borderColor = '#dee2e6';
              // Also update SVG icon color if present
              const img = e.currentTarget.querySelector('img.actionIcon');
              if (img) {
                img.style.filter = 'brightness(0) saturate(100%) invert(20%) sepia(100%) saturate(2000%) hue-rotate(195deg) brightness(95%) contrast(100%)';
              }
            },
            onMouseLeave: (e: any) => {
              e.currentTarget.style.background = '#f8f9fa';
              e.currentTarget.style.color = '#495057';
              e.currentTarget.style.borderColor = '#e9ecef';
              // Also revert SVG icon color if present
              const img = e.currentTarget.querySelector('img.actionIcon');
              if (img) {
                img.style.filter = 'brightness(0) saturate(100%) invert(31%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(95%)';
              }
            }
          }, 
            typeof action.icon === 'string' && action.icon.startsWith('<svg') ? 
              // If icon is SVG string, render it with dangerouslySetInnerHTML
              React.createElement('span', {
                className: 'actionIcon',
                style: {
                  width: iconSize,
                  height: iconSize,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                },
                dangerouslySetInnerHTML: { __html: action.icon }
              }) :
            typeof action.icon === 'string' && (action.icon.endsWith('.svg') || action.icon.endsWith('.png') || action.icon.includes('data:image')) ?
              // If icon is image URL or data URL, render as img
              React.createElement('img', {
                src: action.icon,
                className: 'actionIcon',
                alt: action.label,
                style: {
                  // Drill down icons should be 60% of icon size
                  width: action.icon.includes('down-arrow') ? '14px' : '24px',
                  height: action.icon.includes('down-arrow') ? '14px' : '24px',
                  display: 'inline-block',
                  // Only apply filter to SVG icons, not PNG
                  filter: action.icon.endsWith('.svg') ? 
                    'brightness(0) saturate(100%) invert(31%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(95%)' : 
                    'none',
                  transition: 'filter 0.2s ease'
                },
                onMouseEnter: (e: any) => {
                  // Only apply hover filter to SVG icons
                  if (action.icon.endsWith('.svg')) {
                    e.currentTarget.style.filter = 'brightness(0) saturate(100%) invert(20%) sepia(100%) saturate(2000%) hue-rotate(195deg) brightness(95%) contrast(100%)';
                  }
                },
                onMouseLeave: (e: any) => {
                  // Only revert filter for SVG icons
                  if (action.icon.endsWith('.svg')) {
                    e.currentTarget.style.filter = 'brightness(0) saturate(100%) invert(31%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(95%)';
                  }
                }
              }) :
              // Otherwise render as text (for Unicode characters)
              React.createElement('span', { 
                className: 'actionIcon',
                style: { 
                  fontSize: iconSize,
                  lineHeight: '1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }
              }, action.icon)
          )
        ));
      }
    };
    
    return [...columns, actionColumn];
  }, [columns, actions]);
}