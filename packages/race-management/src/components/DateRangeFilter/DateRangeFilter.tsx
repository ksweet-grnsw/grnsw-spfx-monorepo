import * as React from 'react';
import { useMemo, useState, useCallback } from 'react';
import styles from './DateRangeFilter.module.scss';

export interface DateRangePreset {
  label: string;
  dateFrom: Date;
  dateTo: Date;
}

export interface DateRangeFilterProps {
  onDateRangeChange: (dateFrom: Date | undefined, dateTo: Date | undefined) => void;
  onDayOfWeekChange?: (dayOfWeek: number | undefined) => void;
  currentDateFrom?: Date;
  currentDateTo?: Date;
  currentDayOfWeek?: number;
  className?: string;
  showCustomPresets?: boolean;
}

/**
 * Reusable date range filter component with preset buttons
 * Following DRY and separation of concerns principles
 */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onDateRangeChange,
  onDayOfWeekChange,
  currentDateFrom,
  currentDateTo,
  currentDayOfWeek,
  className,
  showCustomPresets = true
}) => {
  
  // Generate date range presets
  const presets = useMemo((): DateRangePreset[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Calculate week range (7 days from today)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Calculate 30 days range
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const basePresets: DateRangePreset[] = [
      { 
        label: 'Today', 
        dateFrom: today, 
        dateTo: endOfToday 
      },
      { 
        label: 'Week', 
        dateFrom: weekAgo, 
        dateTo: endOfToday 
      },
      { 
        label: '30 Days', 
        dateFrom: thirtyDaysAgo, 
        dateTo: endOfToday 
      }
    ];
    
    if (showCustomPresets) {
      // Add more presets if needed
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      basePresets.push({
        label: 'Yesterday',
        dateFrom: yesterday,
        dateTo: yesterday
      });
    }
    
    return basePresets;
  }, [showCustomPresets]);
  
  // Check if a preset is currently active
  const isPresetActive = (preset: DateRangePreset): boolean => {
    if (!currentDateFrom || !currentDateTo) return false;
    
    const presetFromTime = preset.dateFrom.getTime();
    const presetToTime = preset.dateTo.getTime();
    const currentFromTime = new Date(currentDateFrom).setHours(0, 0, 0, 0);
    const currentToTime = new Date(currentDateTo).setHours(23, 59, 59, 999);
    
    return Math.abs(presetFromTime - currentFromTime) < 86400000 && // Within a day
           Math.abs(presetToTime - currentToTime) < 86400000;
  };
  
  // Handle preset button click
  const handlePresetClick = (preset: DateRangePreset): void => {
    if (isPresetActive(preset)) {
      // If already active, clear the filter
      onDateRangeChange(undefined, undefined);
    } else {
      // Apply the preset
      onDateRangeChange(preset.dateFrom, preset.dateTo);
    }
  };
  
  // Handle day of week selection
  const handleDayOfWeekChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedDay = event.target.value;
    
    if (selectedDay === '') {
      // Clear day of week filter
      if (onDayOfWeekChange) {
        onDayOfWeekChange(undefined);
      }
      return;
    }
    
    const dayNumber = parseInt(selectedDay, 10);
    
    // Call the day of week change handler if provided
    if (onDayOfWeekChange) {
      onDayOfWeekChange(dayNumber);
    }
  };
  
  return (
    <div className={`${styles.dateRangeFilter} ${className || ''}`}>
      <div className={styles.presetButtons}>
        <span className={styles.presetLabel}>Quick filters:</span>
        {presets.slice(0, 3).map((preset) => (
          <button
            key={preset.label}
            className={`${styles.presetButton} ${isPresetActive(preset) ? styles.active : ''}`}
            onClick={() => handlePresetClick(preset)}
            title={`Filter by ${preset.label.toLowerCase()}`}
            aria-pressed={isPresetActive(preset)}
          >
            {preset.label}
          </button>
        ))}
        <select 
          className={styles.dayOfWeekSelect}
          value={currentDayOfWeek !== undefined ? currentDayOfWeek.toString() : ''}
          onChange={handleDayOfWeekChange}
          title="Filter by day of week"
        >
          <option value="">Day of Week</option>
          <option value="0">Sunday</option>
          <option value="1">Monday</option>
          <option value="2">Tuesday</option>
          <option value="3">Wednesday</option>
          <option value="4">Thursday</option>
          <option value="5">Friday</option>
          <option value="6">Saturday</option>
        </select>
      </div>
    </div>
  );
};

export default DateRangeFilter;