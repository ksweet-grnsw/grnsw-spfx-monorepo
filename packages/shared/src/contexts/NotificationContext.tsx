import * as React from 'react';
import { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';

/**
 * Notification types
 */
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

/**
 * Notification interface
 */
export interface INotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // milliseconds, 0 = persistent
  dismissible?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
  metadata?: Record<string, any>;
  timestamp: number;
}

/**
 * Notification state
 */
interface INotificationState {
  notifications: INotification[];
  history: INotification[];
  maxNotifications: number;
  maxHistorySize: number;
  defaultDuration: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

/**
 * Notification actions
 */
type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: INotification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'CLEAR_TYPE'; payload: NotificationType }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Pick<INotificationState, 'maxNotifications' | 'defaultDuration' | 'position'>> };

/**
 * Notification context value
 */
export interface INotificationContext {
  notifications: INotification[];
  history: INotification[];
  
  // Core methods
  notify: (notification: Omit<INotification, 'id' | 'timestamp'>) => string;
  success: (title: string, message?: string, options?: Partial<INotification>) => string;
  info: (title: string, message?: string, options?: Partial<INotification>) => string;
  warning: (title: string, message?: string, options?: Partial<INotification>) => string;
  error: (title: string, message?: string, options?: Partial<INotification>) => string;
  
  // Management methods
  dismiss: (id: string) => void;
  dismissAll: () => void;
  dismissByType: (type: NotificationType) => void;
  
  // Settings
  updateSettings: (settings: Partial<Pick<INotificationState, 'maxNotifications' | 'defaultDuration' | 'position'>>) => void;
  position: INotificationState['position'];
}

/**
 * Notification provider props
 */
export interface INotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  maxHistorySize?: number;
  defaultDuration?: number;
  position?: INotificationState['position'];
}

// Default state
const defaultState: INotificationState = {
  notifications: [],
  history: [],
  maxNotifications: 5,
  maxHistorySize: 50,
  defaultDuration: 5000,
  position: 'top-right'
};

// Reducer
const notificationReducer = (state: INotificationState, action: NotificationAction): INotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotifications = [action.payload, ...state.notifications];
      const activeNotifications = newNotifications.slice(0, state.maxNotifications);
      const newHistory = [action.payload, ...state.history].slice(0, state.maxHistorySize);
      
      return {
        ...state,
        notifications: activeNotifications,
        history: newHistory
      };
    }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: []
      };
    
    case 'CLEAR_TYPE':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.type !== action.payload)
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        ...action.payload
      };
    
    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext<INotificationContext | undefined>(undefined);

/**
 * Notification Provider Component
 * Manages application-wide notifications
 */
export const NotificationProvider: React.FC<INotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  maxHistorySize = 50,
  defaultDuration = 5000,
  position = 'top-right'
}) => {
  // Initialize state
  const [state, dispatch] = useReducer(notificationReducer, {
    ...defaultState,
    maxNotifications,
    maxHistorySize,
    defaultDuration,
    position
  });

  // Generate unique ID
  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Core notify method
  const notify = useCallback((notification: Omit<INotification, 'id' | 'timestamp'>): string => {
    const id = generateId();
    const fullNotification: INotification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration !== undefined ? notification.duration : state.defaultDuration,
      dismissible: notification.dismissible !== undefined ? notification.dismissible : true
    };
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification });
    
    // Auto-dismiss if duration is set
    if (fullNotification.duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
      }, fullNotification.duration);
    }
    
    return id;
  }, [generateId, state.defaultDuration]);

  // Convenience methods
  const success = useCallback((title: string, message?: string, options?: Partial<INotification>): string => {
    return notify({ ...options, type: 'success', title, message });
  }, [notify]);

  const info = useCallback((title: string, message?: string, options?: Partial<INotification>): string => {
    return notify({ ...options, type: 'info', title, message });
  }, [notify]);

  const warning = useCallback((title: string, message?: string, options?: Partial<INotification>): string => {
    return notify({ ...options, type: 'warning', title, message });
  }, [notify]);

  const error = useCallback((title: string, message?: string, options?: Partial<INotification>): string => {
    return notify({ ...options, type: 'error', title, message });
  }, [notify]);

  // Management methods
  const dismiss = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const dismissAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const dismissByType = useCallback((type: NotificationType) => {
    dispatch({ type: 'CLEAR_TYPE', payload: type });
  }, []);

  const updateSettings = useCallback((settings: Partial<Pick<INotificationState, 'maxNotifications' | 'defaultDuration' | 'position'>>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  // Persist history to localStorage
  useEffect(() => {
    if (state.history.length > 0) {
      try {
        localStorage.setItem('notification_history', JSON.stringify(state.history));
      } catch {
        // Ignore storage errors
      }
    }
  }, [state.history]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('notification_history');
      if (stored) {
        const history = JSON.parse(stored) as INotification[];
        // Don't restore active notifications, just history
        if (history.length > 0) {
          history.forEach(notification => {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { ...notification, id: generateId() } });
            dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
          });
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [generateId]);

  // Create context value
  const contextValue: INotificationContext = {
    notifications: state.notifications,
    history: state.history,
    notify,
    success,
    info,
    warning,
    error,
    dismiss,
    dismissAll,
    dismissByType,
    updateSettings,
    position: state.position
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook to use notifications
 */
export const useNotifications = (): INotificationContext => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};