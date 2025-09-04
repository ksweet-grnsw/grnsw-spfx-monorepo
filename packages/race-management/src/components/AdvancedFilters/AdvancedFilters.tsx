import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import styles from './AdvancedFilters.module.scss';
import { StatusBadge } from '../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';

export interface FilterChip {
  id: string;
  label: string;
  value: any;
  category: string;
  color?: 'info' | 'success' | 'warning' | 'error' | 'neutral';
}

export interface DatePreset {
  label: string;
  getValue: () => { from: Date; to: Date };
}

export interface AdvancedFiltersProps {
  // Date filters
  dateFrom?: Date;
  dateTo?: Date;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  
  // Track filter
  selectedTracks: string[];
  availableTracks: string[];
  onTracksChange: (tracks: string[]) => void;
  
  // Authority filter
  selectedAuthorities: string[];
  availableAuthorities: string[];
  onAuthoritiesChange: (authorities: string[]) => void;
  
  // Status filter
  selectedStatuses: string[];
  availableStatuses: string[];
  onStatusesChange: (statuses: string[]) => void;
  
  // Meeting type filter
  selectedTypes: string[];
  availableTypes: string[];
  onTypesChange: (types: string[]) => void;
  
  // Additional options
  showCancelled: boolean;
  onShowCancelledChange: (show: boolean) => void;
  
  showInjuryData: boolean;
  onShowInjuryDataChange: (show: boolean) => void;
  
  // UI options
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onClearAll: () => void;
  theme?: 'neutral' | 'meeting' | 'race' | 'contestant';
}

/**
 * Advanced filtering component following SOLID principles
 * Provides comprehensive filtering with date presets, multi-select, and filter chips
 */
export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  selectedTracks,
  availableTracks,
  onTracksChange,
  selectedAuthorities,
  availableAuthorities,
  onAuthoritiesChange,
  selectedStatuses,
  availableStatuses,
  onStatusesChange,
  selectedTypes,
  availableTypes,
  onTypesChange,
  showCancelled,
  onShowCancelledChange,
  showInjuryData,
  onShowInjuryDataChange,
  isExpanded,
  onExpandedChange,
  onClearAll,
  theme = 'neutral'
}) => {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Date presets for quick selection
  const datePresets: DatePreset[] = useMemo(() => [
    {
      label: 'Today',
      getValue: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { from: today, to: tomorrow };
      }
    },
    {
      label: 'This Week',
      getValue: () => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return { from: startOfWeek, to: endOfWeek };
      }
    },
    {
      label: 'This Month',
      getValue: () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { from: startOfMonth, to: endOfMonth };
      }
    },
    {
      label: 'Last 7 Days',
      getValue: () => {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return { from: sevenDaysAgo, to: today };
      }
    },
    {
      label: 'Last 30 Days',
      getValue: () => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return { from: thirtyDaysAgo, to: today };
      }
    },
    {
      label: 'Next 7 Days',
      getValue: () => {
        const today = new Date();
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);
        return { from: today, to: sevenDaysFromNow };
      }
    }
  ], []);

  // Apply date preset
  const applyDatePreset = useCallback((preset: DatePreset, presetLabel: string) => {
    const { from, to } = preset.getValue();
    onDateFromChange(from);
    onDateToChange(to);
    setActivePreset(presetLabel);
  }, [onDateFromChange, onDateToChange]);

  // Generate filter chips for active filters
  const filterChips = useMemo((): FilterChip[] => {
    const chips: FilterChip[] = [];

    // Date range chip
    if (dateFrom || dateTo) {
      const fromStr = dateFrom?.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
      const toStr = dateTo?.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
      chips.push({
        id: 'date-range',
        label: `${fromStr || '...'} - ${toStr || '...'}`,
        value: { from: dateFrom, to: dateTo },
        category: 'date',
        color: 'info'
      });
    }

    // Track chips
    selectedTracks.forEach(track => {
      chips.push({
        id: `track-${track}`,
        label: track,
        value: track,
        category: 'track',
        color: 'success'
      });
    });

    // Authority chips
    selectedAuthorities.forEach(authority => {
      chips.push({
        id: `authority-${authority}`,
        label: authority,
        value: authority,
        category: 'authority',
        color: 'warning'
      });
    });

    // Status chips
    selectedStatuses.forEach(status => {
      chips.push({
        id: `status-${status}`,
        label: status,
        value: status,
        category: 'status',
        color: status === 'Cancelled' ? 'error' : 'neutral'
      });
    });

    // Type chips
    selectedTypes.forEach(type => {
      chips.push({
        id: `type-${type}`,
        label: type,
        value: type,
        category: 'type',
        color: 'neutral'
      });
    });

    // Boolean filters
    if (showCancelled) {
      chips.push({
        id: 'show-cancelled',
        label: 'Including Cancelled',
        value: true,
        category: 'option',
        color: 'error'
      });
    }

    if (showInjuryData) {
      chips.push({
        id: 'show-injury',
        label: 'With Injury Data',
        value: true,
        category: 'option',
        color: 'warning'
      });
    }

    return chips;
  }, [dateFrom, dateTo, selectedTracks, selectedAuthorities, selectedStatuses, selectedTypes, showCancelled, showInjuryData]);

  // Remove a filter chip
  const removeChip = useCallback((chip: FilterChip) => {
    switch (chip.category) {
      case 'date':
        onDateFromChange(undefined);
        onDateToChange(undefined);
        setActivePreset(null);
        break;
      case 'track':
        onTracksChange(selectedTracks.filter(t => t !== chip.value));
        break;
      case 'authority':
        onAuthoritiesChange(selectedAuthorities.filter(a => a !== chip.value));
        break;
      case 'status':
        onStatusesChange(selectedStatuses.filter(s => s !== chip.value));
        break;
      case 'type':
        onTypesChange(selectedTypes.filter(t => t !== chip.value));
        break;
      case 'option':
        if (chip.id === 'show-cancelled') onShowCancelledChange(false);
        if (chip.id === 'show-injury') onShowInjuryDataChange(false);
        break;
    }
  }, [selectedTracks, selectedAuthorities, selectedStatuses, selectedTypes, 
      onDateFromChange, onDateToChange, onTracksChange, onAuthoritiesChange, 
      onStatusesChange, onTypesChange, onShowCancelledChange, onShowInjuryDataChange]);

  // Toggle multi-select item
  const toggleMultiSelect = useCallback((
    value: string,
    selected: string[],
    onChange: (values: string[]) => void
  ) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }, []);

  const hasActiveFilters = filterChips.length > 0;

  return (
    <div className={`${styles.advancedFilters} ${(styles as any)[`theme-${theme}`] || ''}`}>
      {/* Filter Header */}
      <div className={styles.filterHeader}>
        <button 
          className={styles.toggleButton}
          onClick={() => onExpandedChange(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <span className={styles.toggleIcon}>{isExpanded ? '▼' : '▶'}</span>
          <span>Filters</span>
          {hasActiveFilters && (
            <span className={styles.activeCount}>{filterChips.length}</span>
          )}
        </button>

        {hasActiveFilters && (
          <button 
            className={styles.clearButton}
            onClick={onClearAll}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Chips */}
      {hasActiveFilters && (
        <div className={styles.filterChips}>
          {filterChips.map(chip => (
            <div key={chip.id} className={styles.filterChip}>
              <StatusBadge 
                status={chip.label} 
                variant={chip.color || 'neutral'} 
                size="small" 
              />
              <button 
                className={styles.chipRemove}
                onClick={() => removeChip(chip)}
                aria-label={`Remove ${chip.label} filter`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className={styles.filterPanel}>
          {/* Date Section */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Date Range</h3>
            
            {/* Date Presets */}
            <div className={styles.datePresets}>
              {datePresets.map(preset => (
                <button
                  key={preset.label}
                  className={`${styles.presetButton} ${
                    activePreset === preset.label ? styles.active : ''
                  }`}
                  onClick={() => applyDatePreset(preset, preset.label)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range */}
            <div className={styles.dateInputs}>
              <div className={styles.inputGroup}>
                <label htmlFor="date-from">From</label>
                <input
                  id="date-from"
                  type="date"
                  value={dateFrom?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    onDateFromChange(e.target.value ? new Date(e.target.value) : undefined);
                    setActivePreset(null);
                  }}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="date-to">To</label>
                <input
                  id="date-to"
                  type="date"
                  value={dateTo?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    onDateToChange(e.target.value ? new Date(e.target.value) : undefined);
                    setActivePreset(null);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Track Section */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Tracks</h3>
            <div className={styles.multiSelect}>
              {availableTracks.map(track => (
                <label key={track} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedTracks.includes(track)}
                    onChange={() => toggleMultiSelect(track, selectedTracks, onTracksChange)}
                  />
                  <span>{track}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Authority Section */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Authorities</h3>
            <div className={styles.multiSelect}>
              {availableAuthorities.map(authority => (
                <label key={authority} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedAuthorities.includes(authority)}
                    onChange={() => toggleMultiSelect(authority, selectedAuthorities, onAuthoritiesChange)}
                  />
                  <span>{authority}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Section */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Status</h3>
            <div className={styles.multiSelect}>
              {availableStatuses.map(status => (
                <label key={status} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleMultiSelect(status, selectedStatuses, onStatusesChange)}
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Type Section */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Meeting Type</h3>
            <div className={styles.multiSelect}>
              {availableTypes.map(type => (
                <label key={type} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleMultiSelect(type, selectedTypes, onTypesChange)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Options</h3>
            <div className={styles.options}>
              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  checked={showCancelled}
                  onChange={(e) => onShowCancelledChange(e.target.checked)}
                />
                <span>Show Cancelled Meetings</span>
              </label>
              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  checked={showInjuryData}
                  onChange={(e) => onShowInjuryDataChange(e.target.checked)}
                />
                <span>Include Injury Data</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};