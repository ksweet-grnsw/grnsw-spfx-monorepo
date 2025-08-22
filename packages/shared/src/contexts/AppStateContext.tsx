import * as React from 'react';
import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

/**
 * App state structure
 */
export interface IAppState {
  /** Current view/page */
  currentView: string;
  
  /** Selected items */
  selectedItems: any[];
  
  /** Active filters */
  filters: Record<string, any>;
  
  /** Search query */
  searchQuery: string;
  
  /** UI state */
  ui: {
    sidebarOpen: boolean;
    modalOpen: boolean;
    loading: boolean;
    error: Error | null;
  };
  
  /** User preferences */
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    density: 'compact' | 'normal' | 'comfortable';
    pageSize: number;
    dateFormat: string;
    timeZone: string;
  };
  
  /** Feature flags */
  features: {
    [key: string]: boolean;
  };
  
  /** Custom data */
  data: Record<string, any>;
}

/**
 * App state actions
 */
export type AppStateAction =
  | { type: 'SET_VIEW'; payload: string }
  | { type: 'SET_SELECTED_ITEMS'; payload: any[] }
  | { type: 'ADD_SELECTED_ITEM'; payload: any }
  | { type: 'REMOVE_SELECTED_ITEM'; payload: any }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_FILTERS'; payload: Record<string, any> }
  | { type: 'UPDATE_FILTER'; payload: { key: string; value: any } }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_UI_STATE'; payload: Partial<IAppState['ui']> }
  | { type: 'SET_PREFERENCES'; payload: Partial<IAppState['preferences']> }
  | { type: 'SET_FEATURE_FLAG'; payload: { key: string; enabled: boolean } }
  | { type: 'SET_DATA'; payload: { key: string; value: any } }
  | { type: 'RESET_STATE' };

/**
 * App state context value
 */
export interface IAppStateContext {
  state: IAppState;
  dispatch: React.Dispatch<AppStateAction>;
  
  // Helper methods
  setView: (view: string) => void;
  setSelectedItems: (items: any[]) => void;
  addSelectedItem: (item: any) => void;
  removeSelectedItem: (item: any) => void;
  clearSelection: () => void;
  setFilters: (filters: Record<string, any>) => void;
  updateFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setModalOpen: (open: boolean) => void;
  updatePreferences: (prefs: Partial<IAppState['preferences']>) => void;
  setFeatureFlag: (key: string, enabled: boolean) => void;
  setData: (key: string, value: any) => void;
  resetState: () => void;
}

/**
 * App state provider props
 */
export interface IAppStateProviderProps {
  children: ReactNode;
  initialState?: Partial<IAppState>;
}

// Default state
const defaultState: IAppState = {
  currentView: 'dashboard',
  selectedItems: [],
  filters: {},
  searchQuery: '',
  ui: {
    sidebarOpen: true,
    modalOpen: false,
    loading: false,
    error: null
  },
  preferences: {
    theme: 'light',
    density: 'normal',
    pageSize: 50,
    dateFormat: 'MM/DD/YYYY',
    timeZone: 'local'
  },
  features: {},
  data: {}
};

// Reducer
const appStateReducer = (state: IAppState, action: AppStateAction): IAppState => {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
      
    case 'SET_SELECTED_ITEMS':
      return { ...state, selectedItems: action.payload };
      
    case 'ADD_SELECTED_ITEM':
      return { ...state, selectedItems: [...state.selectedItems, action.payload] };
      
    case 'REMOVE_SELECTED_ITEM':
      return { 
        ...state, 
        selectedItems: state.selectedItems.filter(item => item !== action.payload) 
      };
      
    case 'CLEAR_SELECTION':
      return { ...state, selectedItems: [] };
      
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
      
    case 'UPDATE_FILTER':
      return { 
        ...state, 
        filters: { ...state.filters, [action.payload.key]: action.payload.value }
      };
      
    case 'CLEAR_FILTERS':
      return { ...state, filters: {} };
      
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
      
    case 'SET_UI_STATE':
      return { ...state, ui: { ...state.ui, ...action.payload } };
      
    case 'SET_PREFERENCES':
      return { ...state, preferences: { ...state.preferences, ...action.payload } };
      
    case 'SET_FEATURE_FLAG':
      return { 
        ...state, 
        features: { ...state.features, [action.payload.key]: action.payload.enabled }
      };
      
    case 'SET_DATA':
      return { 
        ...state, 
        data: { ...state.data, [action.payload.key]: action.payload.value }
      };
      
    case 'RESET_STATE':
      return defaultState;
      
    default:
      return state;
  }
};

// Create context
const AppStateContext = createContext<IAppStateContext | undefined>(undefined);

/**
 * App State Provider Component
 * Provides global application state management
 */
export const AppStateProvider: React.FC<IAppStateProviderProps> = ({
  children,
  initialState = {}
}) => {
  // Initialize state with defaults and overrides
  const [state, dispatch] = useReducer(
    appStateReducer,
    { ...defaultState, ...initialState }
  );

  // Helper methods
  const setView = useCallback((view: string) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const setSelectedItems = useCallback((items: any[]) => {
    dispatch({ type: 'SET_SELECTED_ITEMS', payload: items });
  }, []);

  const addSelectedItem = useCallback((item: any) => {
    dispatch({ type: 'ADD_SELECTED_ITEM', payload: item });
  }, []);

  const removeSelectedItem = useCallback((item: any) => {
    dispatch({ type: 'REMOVE_SELECTED_ITEM', payload: item });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const setFilters = useCallback((filters: Record<string, any>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const updateFilter = useCallback((key: string, value: any) => {
    dispatch({ type: 'UPDATE_FILTER', payload: { key, value } });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_UI_STATE', payload: { loading } });
  }, []);

  const setError = useCallback((error: Error | null) => {
    dispatch({ type: 'SET_UI_STATE', payload: { error } });
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_UI_STATE', payload: { sidebarOpen: open } });
  }, []);

  const setModalOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_UI_STATE', payload: { modalOpen: open } });
  }, []);

  const updatePreferences = useCallback((prefs: Partial<IAppState['preferences']>) => {
    dispatch({ type: 'SET_PREFERENCES', payload: prefs });
    
    // Persist preferences to localStorage
    const currentPrefs = { ...state.preferences, ...prefs };
    localStorage.setItem('app_preferences', JSON.stringify(currentPrefs));
  }, [state.preferences]);

  const setFeatureFlag = useCallback((key: string, enabled: boolean) => {
    dispatch({ type: 'SET_FEATURE_FLAG', payload: { key, enabled } });
  }, []);

  const setData = useCallback((key: string, value: any) => {
    dispatch({ type: 'SET_DATA', payload: { key, value } });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Load preferences from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('app_preferences');
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        dispatch({ type: 'SET_PREFERENCES', payload: prefs });
      } catch {
        // Ignore invalid stored preferences
      }
    }
  }, []);

  // Create context value
  const contextValue: IAppStateContext = {
    state,
    dispatch,
    setView,
    setSelectedItems,
    addSelectedItem,
    removeSelectedItem,
    clearSelection,
    setFilters,
    updateFilter,
    clearFilters,
    setSearchQuery,
    setLoading,
    setError,
    setSidebarOpen,
    setModalOpen,
    updatePreferences,
    setFeatureFlag,
    setData,
    resetState
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};

/**
 * Hook to use app state
 */
export const useAppState = (): IAppStateContext => {
  const context = useContext(AppStateContext);
  
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  
  return context;
};