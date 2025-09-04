import { useState, useEffect, useCallback } from 'react';

export interface FilterState {
  dateFrom?: Date;
  dateTo?: Date;
  selectedAuthority?: string;
  selectedTrack?: string;
  selectedDayOfWeek?: number; // 0-6 for Sunday-Saturday
  showInjuryFilter?: boolean;
  selectedInjuryCategories?: string[];
  searchTerm?: string;
  filterVersion?: number; // Track filter version for migrations
}

export interface UseFiltersOptions {
  storageKey?: string;
  defaultFilters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
}

/**
 * Hook to manage filter state with localStorage persistence
 * Centralizes filter logic and reduces duplication
 */
export function useFilters(options: UseFiltersOptions = {}) {
  // Set default filters to Today and NSW authority
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const CURRENT_FILTER_VERSION = 2; // Increment this to force filter reset
  
  const {
    storageKey = 'raceDataExplorerFilters',
    defaultFilters = {
      selectedInjuryCategories: ['Cat D', 'Cat E'],
      selectedAuthority: 'NSW',  // Default to NSW
      dateFrom: today,           // Default to today
      dateTo: today,             // Default to today
      filterVersion: CURRENT_FILTER_VERSION
    },
    onFiltersChange
  } = options;

  // Load saved filters from localStorage
  const loadSavedFilters = useCallback((): FilterState => {
    if (!storageKey) return defaultFilters;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const filters = JSON.parse(saved);
        // Check filter version - if outdated, use new defaults
        if (!filters.filterVersion || filters.filterVersion < CURRENT_FILTER_VERSION) {
          console.log(`Filter version outdated (${filters.filterVersion} < ${CURRENT_FILTER_VERSION}) - using new defaults`);
          localStorage.removeItem(storageKey);
          return defaultFilters;
        }
        // If saved filters exist and are valid, use them (user's preferences)
        // But preserve date parsing
        return {
          ...defaultFilters,
          ...filters,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : defaultFilters.dateFrom,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : defaultFilters.dateTo
        };
      }
    } catch (e) {
      console.error('Failed to load saved filters:', e);
    }
    
    // First time user - return defaults with Today and NSW
    return defaultFilters;
  }, [storageKey, defaultFilters, CURRENT_FILTER_VERSION]);

  // Initialize filter state
  const [filters, setFilters] = useState<FilterState>(() => loadSavedFilters());

  // Save filters to localStorage when they change
  useEffect(() => {
    if (!storageKey) return;
    
    try {
      const filtersToSave = {
        ...filters,
        dateFrom: filters.dateFrom?.toISOString(),
        dateTo: filters.dateTo?.toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(filtersToSave));
    } catch (e) {
      console.error('Failed to save filters:', e);
    }
    
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, storageKey, onFiltersChange]);

  // Update single filter
  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, [defaultFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Get active filter count
  const getActiveFilterCount = useCallback((): number => {
    let count = 0;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.selectedAuthority) count++;
    if (filters.selectedTrack) count++;
    if (filters.selectedDayOfWeek !== undefined) count++;
    if (filters.showInjuryFilter && filters.selectedInjuryCategories?.length) {
      count += filters.selectedInjuryCategories.length;
    }
    if (filters.searchTerm) count++;
    return count;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = useCallback((): boolean => {
    return getActiveFilterCount() > 0;
  }, [getActiveFilterCount]);

  // Apply filters to data
  const applyFilters = useCallback(<T extends Record<string, any>>(
    data: T[],
    filterMap: Partial<Record<keyof FilterState, (item: T, filterValue: any) => boolean>>
  ): T[] => {
    return data.filter(item => {
      // Date from filter
      if (filters.dateFrom && filterMap.dateFrom) {
        if (!filterMap.dateFrom(item, filters.dateFrom)) return false;
      }
      
      // Date to filter
      if (filters.dateTo && filterMap.dateTo) {
        if (!filterMap.dateTo(item, filters.dateTo)) return false;
      }
      
      // Authority filter
      if (filters.selectedAuthority && filterMap.selectedAuthority) {
        if (!filterMap.selectedAuthority(item, filters.selectedAuthority)) return false;
      }
      
      // Track filter
      if (filters.selectedTrack && filterMap.selectedTrack) {
        if (!filterMap.selectedTrack(item, filters.selectedTrack)) return false;
      }
      
      // Search filter
      if (filters.searchTerm && filterMap.searchTerm) {
        if (!filterMap.searchTerm(item, filters.searchTerm)) return false;
      }
      
      // Injury filter (example of complex filter)
      if (filters.showInjuryFilter && filters.selectedInjuryCategories?.length && filterMap.selectedInjuryCategories) {
        if (!filterMap.selectedInjuryCategories(item, filters.selectedInjuryCategories)) return false;
      }
      
      return true;
    });
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilters,
    getActiveFilterCount,
    hasActiveFilters,
    applyFilters,
    
    // Individual filter values for convenience
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    selectedAuthority: filters.selectedAuthority,
    selectedTrack: filters.selectedTrack,
    selectedDayOfWeek: filters.selectedDayOfWeek,
    showInjuryFilter: filters.showInjuryFilter,
    selectedInjuryCategories: filters.selectedInjuryCategories,
    searchTerm: filters.searchTerm,
    
    // Individual setters for convenience
    setDateFrom: (date: Date | undefined) => updateFilter('dateFrom', date),
    setDateTo: (date: Date | undefined) => updateFilter('dateTo', date),
    setSelectedAuthority: (authority: string | undefined) => updateFilter('selectedAuthority', authority),
    setSelectedTrack: (track: string | undefined) => updateFilter('selectedTrack', track),
    setSelectedDayOfWeek: (day: number | undefined) => updateFilter('selectedDayOfWeek', day),
    setShowInjuryFilter: (show: boolean | undefined) => updateFilter('showInjuryFilter', show),
    setSelectedInjuryCategories: (categories: string[] | undefined) => updateFilter('selectedInjuryCategories', categories),
    setSearchTerm: (term: string | undefined) => updateFilter('searchTerm', term)
  };
}

/**
 * Hook for date range presets
 */
export function useDateRangePresets() {
  const getPresets = useCallback(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    return [
      { label: 'Today', dateFrom: today, dateTo: today },
      { label: 'Yesterday', dateFrom: yesterday, dateTo: yesterday },
      { label: 'This Week', dateFrom: thisWeekStart, dateTo: today },
      { label: 'Last Week', dateFrom: lastWeekStart, dateTo: lastWeekEnd },
      { label: 'This Month', dateFrom: thisMonthStart, dateTo: today },
      { label: 'Last Month', dateFrom: lastMonthStart, dateTo: lastMonthEnd },
      { label: 'Last 7 Days', dateFrom: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), dateTo: today },
      { label: 'Last 30 Days', dateFrom: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), dateTo: today }
    ];
  }, []);
  
  return { presets: getPresets() };
}