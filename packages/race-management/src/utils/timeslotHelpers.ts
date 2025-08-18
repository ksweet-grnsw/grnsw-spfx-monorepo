/**
 * Utility functions for timeslot styling and rendering
 * Single source of truth for timeslot colors and styles
 */

export interface TimeslotStyle {
  backgroundColor: string;
  color: string;
  className?: string;
}

/**
 * Get the color styling for a given timeslot
 * @param timeslot - The timeslot value (e.g., "Morning", "Night", etc.)
 * @returns TimeslotStyle object with backgroundColor and color
 */
export const getTimeslotStyles = (timeslot: string | undefined | null): TimeslotStyle => {
  if (!timeslot) {
    return {
      backgroundColor: '#9e9e9e', // Gray default
      color: 'white',
      className: 'timeslotDefault'
    };
  }
  
  const slot = timeslot.toLowerCase().trim();
  
  // Single source of truth for timeslot color mapping
  const timeslotColorMap: Record<string, TimeslotStyle> = {
    'night': {
      backgroundColor: '#1a237e', // Deep blue
      color: 'white',
      className: 'timeslotNight'
    },
    'evening': {
      backgroundColor: '#1a237e', // Deep blue (same as night)
      color: 'white',
      className: 'timeslotNight'
    },
    'twilight': {
      backgroundColor: '#6a4c93', // Purple
      color: 'white',
      className: 'timeslotTwilight'
    },
    'day': {
      backgroundColor: '#fbc02d', // Bright yellow
      color: '#333',
      className: 'timeslotDay'
    },
    'morning': {
      backgroundColor: '#fbc02d', // Bright yellow (same as day)
      color: '#333',
      className: 'timeslotDay'
    },
    'afternoon': {
      backgroundColor: '#2196f3', // Sky blue
      color: 'white',
      className: 'timeslotAfternoon'
    }
  };
  
  return timeslotColorMap[slot] || {
    backgroundColor: '#9e9e9e', // Gray default
    color: 'white',
    className: 'timeslotDefault'
  };
};

/**
 * Get the variant for StatusBadge component based on timeslot
 * @param timeslot - The timeslot value
 * @returns StatusBadge variant string
 */
export const getTimeslotVariant = (timeslot: string | undefined | null): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' => {
  if (!timeslot) return 'neutral';
  
  const slot = timeslot.toLowerCase().trim();
  
  // Map timeslots to semantic variants
  const variantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'> = {
    'morning': 'warning',  // Orange-ish
    'day': 'warning',      // Orange-ish
    'afternoon': 'info',   // Blue
    'evening': 'primary',  // Dark blue
    'night': 'primary',    // Dark blue
    'twilight': 'neutral'  // Purple (neutral as closest match)
  };
  
  return variantMap[slot] || 'neutral';
};