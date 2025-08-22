/**
 * Meeting Store
 * Manages race meeting state across the application
 */

import { Store } from './Store';

/**
 * Meeting state interface
 */
export interface IMeetingState {
  // Data
  meetings: any[];
  selectedMeeting: any | null;
  
  // UI State
  view: 'calendar' | 'list' | 'grid';
  filters: {
    authority: string[];
    track: string[];
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
    status: string[];
  };
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  error: Error | null;
  validationErrors: Record<string, string>;
  
  // Cache
  lastFetch: number;
  cacheValid: boolean;
}

/**
 * Meeting Store implementation
 */
export class MeetingStore extends Store<IMeetingState> {
  constructor() {
    super({
      name: 'MeetingStore',
      persist: true,
      storageKey: 'meeting_store',
      initialState: {
        meetings: [],
        selectedMeeting: null,
        view: 'calendar',
        filters: {
          authority: [],
          track: [],
          dateRange: {
            start: null,
            end: null
          },
          status: []
        },
        sorting: {
          field: 'date',
          direction: 'asc'
        },
        pagination: {
          page: 1,
          pageSize: 50,
          total: 0
        },
        isLoading: false,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        error: null,
        validationErrors: {},
        lastFetch: 0,
        cacheValid: false
      },
      validator: (state) => {
        // Validate state
        return (
          state.pagination.page > 0 &&
          state.pagination.pageSize > 0 &&
          ['calendar', 'list', 'grid'].includes(state.view)
        );
      }
    });
  }

  // Actions
  
  /**
   * Set meetings data
   */
  public setMeetings(meetings: any[]): void {
    this.setState({
      meetings,
      lastFetch: Date.now(),
      cacheValid: true,
      isLoading: false,
      error: null
    });
  }

  /**
   * Select a meeting
   */
  public selectMeeting(meeting: any | null): void {
    this.setState({ selectedMeeting: meeting });
  }

  /**
   * Update filters
   */
  public setFilters(filters: Partial<IMeetingState['filters']>): void {
    this.setState(state => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 } // Reset to first page
    }));
  }

  /**
   * Clear filters
   */
  public clearFilters(): void {
    this.setState({
      filters: {
        authority: [],
        track: [],
        dateRange: { start: null, end: null },
        status: []
      },
      pagination: { ...this.getState().pagination, page: 1 }
    });
  }

  /**
   * Set view mode
   */
  public setView(view: IMeetingState['view']): void {
    this.setState({ view });
  }

  /**
   * Set sorting
   */
  public setSorting(field: string, direction?: 'asc' | 'desc'): void {
    const currentSorting = this.getState().sorting;
    this.setState({
      sorting: {
        field,
        direction: direction || (
          currentSorting.field === field 
            ? currentSorting.direction === 'asc' ? 'desc' : 'asc'
            : 'asc'
        )
      }
    });
  }

  /**
   * Set pagination
   */
  public setPagination(pagination: Partial<IMeetingState['pagination']>): void {
    this.setState(state => ({
      pagination: { ...state.pagination, ...pagination }
    }));
  }

  /**
   * Set loading state
   */
  public setLoading(type: 'loading' | 'creating' | 'updating' | 'deleting', value: boolean): void {
    const key = type === 'loading' ? 'isLoading' : `is${type.charAt(0).toUpperCase()}${type.slice(1)}`;
    this.setState({ [key]: value } as any);
  }

  /**
   * Set error
   */
  public setError(error: Error | null): void {
    this.setState({ error });
  }

  /**
   * Set validation errors
   */
  public setValidationErrors(errors: Record<string, string>): void {
    this.setState({ validationErrors: errors });
  }

  /**
   * Clear validation error
   */
  public clearValidationError(field: string): void {
    const { [field]: _, ...rest } = this.getState().validationErrors;
    this.setState({ validationErrors: rest });
  }

  /**
   * Add meeting optimistically
   */
  public addMeetingOptimistic(meeting: any): void {
    const meetings = [...this.getState().meetings, meeting];
    this.setState({ meetings });
  }

  /**
   * Update meeting optimistically
   */
  public updateMeetingOptimistic(id: string, updates: any): void {
    const meetings = this.getState().meetings.map(m => 
      m.id === id ? { ...m, ...updates } : m
    );
    this.setState({ meetings });
  }

  /**
   * Remove meeting optimistically
   */
  public removeMeetingOptimistic(id: string): void {
    const meetings = this.getState().meetings.filter(m => m.id !== id);
    this.setState({ meetings });
  }

  /**
   * Invalidate cache
   */
  public invalidateCache(): void {
    this.setState({ cacheValid: false });
  }

  /**
   * Get filtered and sorted meetings
   */
  public getProcessedMeetings(): any[] {
    const state = this.getState();
    let processed = [...state.meetings];
    
    // Apply filters
    const { authority, track, dateRange, status } = state.filters;
    
    if (authority.length > 0) {
      processed = processed.filter(m => authority.includes(m.authority));
    }
    
    if (track.length > 0) {
      processed = processed.filter(m => track.includes(m.track));
    }
    
    if (status.length > 0) {
      processed = processed.filter(m => status.includes(m.status));
    }
    
    if (dateRange.start) {
      processed = processed.filter(m => new Date(m.date) >= dateRange.start!);
    }
    
    if (dateRange.end) {
      processed = processed.filter(m => new Date(m.date) <= dateRange.end!);
    }
    
    // Apply sorting
    const { field, direction } = state.sorting;
    processed.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return processed;
  }

  /**
   * Get paginated meetings
   */
  public getPaginatedMeetings(): { data: any[]; total: number } {
    const processed = this.getProcessedMeetings();
    const { page, pageSize } = this.getState().pagination;
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return {
      data: processed.slice(start, end),
      total: processed.length
    };
  }
}

// Singleton instance
let meetingStoreInstance: MeetingStore | null = null;

/**
 * Get meeting store instance
 */
export function getMeetingStore(): MeetingStore {
  if (!meetingStoreInstance) {
    meetingStoreInstance = new MeetingStore();
  }
  return meetingStoreInstance;
}