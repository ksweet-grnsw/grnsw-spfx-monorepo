/**
 * Shared Context Providers
 * Global state management for all SPFx packages
 */

// Dataverse Context
export { DataverseProvider, useDataverseContext } from './DataverseContext';
export type { IDataverseContext, IDataverseProviderProps } from './DataverseContext';

// App State Context
export { AppStateProvider, useAppState } from './AppStateContext';
export type { IAppState, IAppStateContext, IAppStateProviderProps } from './AppStateContext';

// Notification Context
export { NotificationProvider, useNotifications } from './NotificationContext';
export type { 
  INotification, 
  NotificationType, 
  INotificationContext, 
  INotificationProviderProps 
} from './NotificationContext';

// Theme Context
export { ThemeProvider, useTheme } from './ThemeContext';
export type { ITheme, IThemeContext, IThemeProviderProps } from './ThemeContext';

// User Context
export { UserProvider, useUser } from './UserContext';
export type { IUser, IUserContext, IUserProviderProps } from './UserContext';

// Combined Provider
export { CombinedProvider } from './CombinedProvider';
export type { ICombinedProviderProps } from './CombinedProvider';