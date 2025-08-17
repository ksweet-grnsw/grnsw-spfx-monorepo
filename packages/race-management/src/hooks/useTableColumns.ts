import { useMemo } from 'react';
import { DataGridColumn } from '../enterprise-ui/components/DataDisplay/DataGrid/DataGrid.types';
import { IMeeting, IRace, IContestant } from '../models/IRaceData';
import { StatusBadge } from '../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import * as React from 'react';

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
        const getTimeslotColor = (timeslot: string): 'info' | 'warning' | 'neutral' => {
          const slot = timeslot?.toLowerCase();
          if (slot === 'morning' || slot === 'day') return 'info';
          if (slot === 'afternoon' || slot === 'twilight') return 'warning';
          return 'neutral';
        };
        
        return value ? (
          React.createElement(StatusBadge, {
            status: value,
            variant: getTimeslotColor(value),
            size: 'small'
          })
        ) : React.createElement('span', { style: { color: '#666' }}, '-');
      }
    },
    {
      key: 'cr4cc_type',
      label: 'Type',
      sortable: true,
      width: '100px',
      render: (value: string) => value || 'Race'
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
    }
  ], []);

  const contestantColumns = useMemo((): DataGridColumn<IContestant>[] => [
    {
      key: 'cr616_rugnumber',
      label: 'Rug',
      sortable: true,
      width: '60px',
      align: 'center',
      render: (value: number) => {
        const rugColors = {
          1: '#FF0000', // Red
          2: '#0000FF', // Blue
          3: '#FFFFFF', // White
          4: '#000000', // Black
          5: '#FFA500', // Orange
          6: '#FFD700', // Gold/Yellow
          7: '#FFC0CB', // Pink
          8: '#00FF00'  // Green
        };
        
        return React.createElement('span', {
          style: {
            display: 'inline-block',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: rugColors[value] || '#ccc',
            color: [3, 6, 7].includes(value) ? '#000' : '#fff',
            textAlign: 'center',
            lineHeight: '24px',
            fontWeight: 'bold',
            fontSize: '12px',
            border: value === 3 ? '1px solid #ccc' : 'none'
          }
        }, value);
      }
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
      render: (value: number) => {
        if (!value) return '-';
        
        const medalColors = {
          1: { bg: '#FFD700', color: '#000' }, // Gold
          2: { bg: '#C0C0C0', color: '#000' }, // Silver
          3: { bg: '#CD7F32', color: '#fff' }  // Bronze
        };
        
        if (value <= 3) {
          const style = medalColors[value];
          return React.createElement('span', {
            style: {
              display: 'inline-block',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: style.bg,
              color: style.color,
              textAlign: 'center',
              lineHeight: '28px',
              fontWeight: 'bold',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }
          }, value);
        }
        
        return value;
      }
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
      width: `${Math.min(150, actions.length * 60)}px`,
      align: 'right',
      render: (_: any, row: T) => {
        const visibleActions = actions.filter(action => 
          !action.isVisible || action.isVisible(row)
        );
        
        return React.createElement('div', {
          style: { display: 'flex', gap: '4px', justifyContent: 'flex-end' }
        }, visibleActions.map((action, index) => 
          React.createElement('button', {
            key: index,
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              action.onClick(row);
            },
            className: 'modernActionButton',
            title: action.label
          }, [
            React.createElement('span', { 
              key: 'icon',
              className: 'actionIcon' 
            }, action.icon),
            React.createElement('span', { 
              key: 'label',
              className: 'actionLabel' 
            }, action.label.split(' ')[0])
          ])
        ));
      }
    };
    
    return [...columns, actionColumn];
  }, [columns, actions]);
}