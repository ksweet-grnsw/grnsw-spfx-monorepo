import { useMemo } from 'react';
import { DataGridColumn } from '../enterprise-ui/components/DataDisplay/DataGrid/DataGrid.types';
import { IMeeting, IRace, IContestant } from '../models/IRaceData';
import { StatusBadge } from '../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import * as React from 'react';
import { renderRugNumber, renderPlacement } from '../utils/tableConfig/columnHelpers';

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
      render: (value: string) => {
        if (!value) {
          return React.createElement('span', { style: { color: '#666' }}, '-');
        }
        
        const slot = value?.toLowerCase();
        let className = '';
        
        // Determine the class based on timeslot
        if (slot === 'night' || slot === 'evening') {
          className = 'timeslotNight';
        } else if (slot === 'twilight') {
          className = 'timeslotTwilight';
        } else if (slot === 'day' || slot === 'morning') {
          className = 'timeslotDay';
        } else if (slot === 'afternoon') {
          className = 'timeslotAfternoon';
        } else {
          className = 'timeslotDefault';
        }
        
        return React.createElement('span', {
          className: `timeslotPill ${className}`,
          style: {
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'capitalize',
            whiteSpace: 'nowrap',
            backgroundColor: 
              slot === 'night' || slot === 'evening' ? '#1a237e' : // Dark blue
              slot === 'twilight' ? '#9c88ff' : // Lighter purple
              slot === 'day' || slot === 'morning' ? '#fbc02d' : // Yellow
              slot === 'afternoon' ? '#2196f3' : // Sky blue
              '#9e9e9e', // Gray default
            color: 
              slot === 'day' || slot === 'morning' ? '#333' : '#fff'
          }
        }, value);
      }
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
        // Check if this meeting has injury data
        const hasInjuries = (row as any).hasInjuries;
        if (hasInjuries) {
          return React.createElement('span', {
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#dc3545',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              title: 'Injuries reported at this meeting'
            }
          }, '⚠');
        }
        return null;
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
      key: 'cr616_racename',
      label: 'Name',
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
        // Check if this race has injury data
        const hasInjuries = (row as any).hasInjuries;
        if (hasInjuries) {
          return React.createElement('span', {
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#dc3545',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              title: 'Injuries reported in this race'
            }
          }, '⚠');
        }
        return null;
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
      render: (value: number) => value ? `${value}L` : '-'
    },
    {
      key: 'cr616_weight',
      label: 'Weight',
      sortable: true,
      width: '80px',
      render: (value: number) => value ? `${value}kg` : '-'
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
        // Check if this contestant has injury data
        const hasInjuries = (row as any).hasInjuries;
        if (hasInjuries) {
          return React.createElement('span', {
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#dc3545',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              title: 'This contestant was injured'
            }
          }, '🏥');
        }
        return null;
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
  }[]
): DataGridColumn<T>[] {
  return useMemo(() => {
    const actionColumn: DataGridColumn<T> = {
      key: 'actions',
      label: 'Actions',
      width: `${Math.min(180, actions.length * 80)}px`,
      align: 'right',
      render: (_: any, row: T) => {
        const visibleActions = actions.filter(action => 
          !action.isVisible || action.isVisible(row)
        );
        
        return React.createElement('div', {
          style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' }
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
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: '#333',
              transition: 'all 0.2s ease',
              minWidth: '32px',
              height: '32px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }
          }, 
            React.createElement('span', { 
              className: 'actionIcon',
              style: { 
                fontSize: '16px',
                lineHeight: '1'
              }
            }, action.icon)
          )
        ));
      }
    };
    
    return [...columns, actionColumn];
  }, [columns, actions]);
}