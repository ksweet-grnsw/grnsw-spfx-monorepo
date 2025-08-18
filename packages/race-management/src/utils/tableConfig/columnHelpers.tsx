import * as React from 'react';
import { DataGridColumn } from '../../enterprise-ui/components/DataDisplay/DataGrid/DataGrid.types';

/**
 * Helper function to render placement with medal badges
 */
export const renderPlacement = (placement: number | string | null | undefined): React.ReactElement | string => {
  if (!placement) return '-';
  const place = typeof placement === 'string' ? parseInt(placement, 10) : placement;
  
  const medalColors = {
    1: { bg: '#FFD700', color: '#000', shadow: '0 2px 4px rgba(255, 215, 0, 0.4)' }, // Gold
    2: { bg: '#C0C0C0', color: '#000', shadow: '0 2px 4px rgba(192, 192, 192, 0.4)' }, // Silver
    3: { bg: '#CD7F32', color: '#fff', shadow: '0 2px 4px rgba(205, 127, 50, 0.4)' }  // Bronze
  };
  
  if (place <= 3 && medalColors[place]) {
    const style = medalColors[place];
    return React.createElement('span', {
      style: {
        display: 'inline-block',
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        backgroundColor: style.bg,
        color: style.color,
        textAlign: 'center',
        lineHeight: '22px',
        fontWeight: 'bold',
        fontSize: '12px',
        boxShadow: style.shadow
      },
      title: `${place === 1 ? 'First' : place === 2 ? 'Second' : 'Third'} Place`
    }, place);
  }
  
  return String(place);
};

/**
 * Helper function to render rug numbers with appropriate colors
 */
export const renderRugNumber = (value: number): React.ReactElement => {
  const rugColors = {
    1: { bg: '#DC143C', color: '#fff', name: 'Red' },       // Crimson Red
    2: { bg: '#000000', color: '#FF0000', name: 'Black/White Stripes', stripes: true }, // Black and white stripes
    3: { bg: '#FFFFFF', color: '#000', name: 'White' },     // White
    4: { bg: '#0073CF', color: '#fff', name: 'Blue' },      // Blue
    5: { bg: '#FFD700', color: '#000', name: 'Yellow' },    // Yellow/Gold
    6: { bg: '#228B22', color: '#FF0000', name: 'Green' },  // Green with red text
    7: { bg: '#000000', color: '#FFD700', name: 'Black' },  // Black with yellow text
    8: { bg: '#FF69B4', color: '#000', name: 'Pink' },      // Pink
    9: { bg: '#228B22', color: '#000', name: 'Green Stripes', stripes: true }, // Green diagonal stripes
    10: { bg: '#0073CF', color: '#000', name: 'Blue/White/Red', tricolor: true } // Blue, white, red vertical stripes
  };
  
  const rugStyle = rugColors[value] || { bg: '#ccc', color: '#000', name: 'Unknown' };
  
  // Special rendering for rug 2 (black and white stripes)
  if (value === 2) {
    return React.createElement('span', {
      style: {
        display: 'inline-block',
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        background: 'repeating-linear-gradient(0deg, #000 0, #000 7px, #FFF 7px, #FFF 14px)',
        color: '#FF0000',
        textAlign: 'center',
        lineHeight: '28px',
        fontWeight: 'bold',
        fontSize: '14px',
        border: '2px solid #333',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      },
      title: `Rug ${value} - ${rugStyle.name}`
    }, value);
  }
  
  // Special rendering for rug 9 (green diagonal stripes - rotated to 135 degrees)
  if (value === 9) {
    return React.createElement('span', {
      style: {
        display: 'inline-block',
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        background: 'repeating-linear-gradient(135deg, #228B22 0, #228B22 7px, #FFFFFF 7px, #FFFFFF 14px)',
        color: '#000',
        textAlign: 'center',
        lineHeight: '28px',
        fontWeight: 'bold',
        fontSize: '14px',
        border: '2px solid #333',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      },
      title: `Rug ${value} - ${rugStyle.name}`
    }, value);
  }
  
  // Special rendering for rug 10 (blue, white, red vertical stripes)
  if (value === 10) {
    return React.createElement('span', {
      style: {
        display: 'inline-block',
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        background: 'linear-gradient(90deg, #0073CF 0%, #0073CF 33%, #FFFFFF 33%, #FFFFFF 66%, #FF0000 66%, #FF0000 100%)',
        color: '#000',
        textAlign: 'center',
        lineHeight: '28px',
        fontWeight: 'bold',
        fontSize: '14px',
        border: '2px solid #333',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      },
      title: `Rug ${value} - ${rugStyle.name}`
    }, value);
  }
  
  return React.createElement('span', {
    style: {
      display: 'inline-block',
      width: '28px',
      height: '28px',
      borderRadius: '4px',
      backgroundColor: rugStyle.bg,
      color: rugStyle.color,
      textAlign: 'center',
      lineHeight: '28px',
      fontWeight: 'bold',
      fontSize: '14px',
      border: '2px solid #333',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
    },
    title: `Rug ${value} - ${rugStyle.name}`
  }, value);
};

/**
 * Helper function to format currency values
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (!value) return '-';
  return `$${value.toLocaleString('en-AU')}`;
};

/**
 * Helper function to format dates
 */
export const formatDate = (value: string | Date, format: 'short' | 'long' | 'time' = 'short'): string => {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-AU', { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short' 
      });
    case 'long':
      return date.toLocaleDateString('en-AU', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      });
    case 'time':
      return date.toLocaleTimeString('en-AU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    default:
      return date.toLocaleDateString('en-AU');
  }
};

/**
 * Helper function to format distance
 */
export const formatDistance = (value: number | null | undefined): string => {
  if (!value) return '-';
  return `${value}m`;
};

/**
 * Helper function to format weight
 */
export const formatWeight = (value: number | null | undefined): string => {
  if (!value) return '-';
  return `${value}kg`;
};

/**
 * Helper function to format margin
 */
export const formatMargin = (value: number | null | undefined): string => {
  if (!value) return '-';
  return `${value}L`;
};

/**
 * Helper to add row numbers to columns if enabled
 */
export function addRowNumberColumn<T>(
  columns: DataGridColumn<T>[],
  showRowNumbers: boolean = false
): DataGridColumn<T>[] {
  if (!showRowNumbers) return columns;
  
  const rowNumberColumn: DataGridColumn<T> = {
    key: '_rowNumber',
    label: '#',
    width: '50px',
    align: 'center',
    render: (_, __, index) => (index || 0) + 1
  };
  
  return [rowNumberColumn, ...columns];
}

/**
 * Helper to get timeslot variant color
 */
export const getTimeslotVariant = (timeslot: string): 'info' | 'warning' | 'neutral' => {
  const slot = timeslot?.toLowerCase();
  if (slot === 'morning' || slot === 'day') return 'info';
  if (slot === 'afternoon' || slot === 'twilight') return 'warning';
  return 'neutral';
};

/**
 * Helper to get status variant color
 */
export const getStatusVariant = (status: string): 'success' | 'error' | 'warning' | 'neutral' => {
  const statusLower = status?.toLowerCase();
  
  if (statusLower === 'runner' || statusLower === 'active' || statusLower === 'completed') {
    return 'success';
  }
  if (statusLower === 'scratched' || statusLower === 'cancelled' || statusLower === 'failed') {
    return 'error';
  }
  if (statusLower === 'pending' || statusLower === 'delayed') {
    return 'warning';
  }
  
  return 'neutral';
};