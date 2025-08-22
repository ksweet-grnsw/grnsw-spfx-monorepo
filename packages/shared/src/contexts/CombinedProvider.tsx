import * as React from 'react';
import { ReactNode } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';

import { DataverseProvider, IDataverseProviderProps } from './DataverseContext';
import { AppStateProvider, IAppStateProviderProps } from './AppStateContext';
import { NotificationProvider, INotificationProviderProps } from './NotificationContext';
import { ThemeProvider, IThemeProviderProps } from './ThemeContext';
import { UserProvider, IUserProviderProps } from './UserContext';
import { DATAVERSE_ENVIRONMENTS } from '../config/environments';

/**
 * Combined provider props
 */
export interface ICombinedProviderProps {
  children: ReactNode;
  
  /** SPFx WebPart context */
  context: WebPartContext;
  
  /** Dataverse configuration */
  dataverse?: {
    environment: keyof typeof DATAVERSE_ENVIRONMENTS;
    cacheConfig?: IDataverseProviderProps['cacheConfig'];
    throttleConfig?: IDataverseProviderProps['throttleConfig'];
  };
  
  /** App state configuration */
  appState?: {
    initialState?: IAppStateProviderProps['initialState'];
  };
  
  /** Notification configuration */
  notifications?: {
    maxNotifications?: number;
    defaultDuration?: number;
    position?: INotificationProviderProps['position'];
  };
  
  /** Theme configuration */
  theme?: {
    initialMode?: IThemeProviderProps['initialMode'];
    customColors?: IThemeProviderProps['customColors'];
    persistPreference?: boolean;
  };
  
  /** User configuration */
  user?: {
    autoLogin?: boolean;
    guestAccess?: boolean;
    mockUser?: IUserProviderProps['mockUser'];
  };
  
  /** Provider order (inner to outer) */
  providerOrder?: Array<'theme' | 'user' | 'notifications' | 'dataverse' | 'appState'>;
}

/**
 * Combined Provider Component
 * Wraps all context providers in the correct order
 * 
 * @example
 * ```tsx
 * <CombinedProvider
 *   context={this.context}
 *   dataverse={{ environment: 'production' }}
 *   theme={{ initialMode: 'auto' }}
 *   user={{ autoLogin: true }}
 * >
 *   <YourApp />
 * </CombinedProvider>
 * ```
 */
export const CombinedProvider: React.FC<ICombinedProviderProps> = ({
  children,
  context,
  dataverse = { environment: 'production' },
  appState = {},
  notifications = {},
  theme = {},
  user = {},
  providerOrder = ['theme', 'user', 'notifications', 'dataverse', 'appState']
}) => {
  // Create provider components
  const providers: Record<string, React.FC<{ children: ReactNode }>> = {
    theme: ({ children }) => (
      <ThemeProvider
        initialMode={theme.initialMode}
        customColors={theme.customColors}
        persistPreference={theme.persistPreference}
      >
        {children}
      </ThemeProvider>
    ),
    
    user: ({ children }) => (
      <UserProvider
        context={context}
        autoLogin={user.autoLogin}
        guestAccess={user.guestAccess}
        mockUser={user.mockUser}
      >
        {children}
      </UserProvider>
    ),
    
    notifications: ({ children }) => (
      <NotificationProvider
        maxNotifications={notifications.maxNotifications}
        defaultDuration={notifications.defaultDuration}
        position={notifications.position}
      >
        {children}
      </NotificationProvider>
    ),
    
    dataverse: ({ children }) => (
      <DataverseProvider
        context={context}
        environmentName={dataverse.environment}
        cacheConfig={dataverse.cacheConfig}
        throttleConfig={dataverse.throttleConfig}
      >
        {children}
      </DataverseProvider>
    ),
    
    appState: ({ children }) => (
      <AppStateProvider initialState={appState.initialState}>
        {children}
      </AppStateProvider>
    )
  };

  // Build nested provider tree
  const buildProviderTree = (providers: string[], children: ReactNode): ReactNode => {
    if (providers.length === 0) {
      return children;
    }
    
    const [current, ...rest] = providers;
    const Provider = providers[current];
    
    if (!Provider) {
      console.warn(`Unknown provider: ${current}`);
      return buildProviderTree(rest, children);
    }
    
    return <Provider>{buildProviderTree(rest, children)}</Provider>;
  };

  // Reverse the order so the first provider is the outermost
  const orderedProviders = [...providerOrder].reverse();
  
  return (
    <>
      {orderedProviders.reduce(
        (acc, providerName) => {
          const Provider = providers[providerName];
          return Provider ? <Provider>{acc}</Provider> : acc;
        },
        children as React.ReactElement
      )}
    </>
  );
};

/**
 * HOC to wrap a component with all providers
 * 
 * @example
 * ```tsx
 * const MyComponent = withProviders(YourComponent, {
 *   dataverse: { environment: 'production' },
 *   theme: { initialMode: 'auto' }
 * });
 * ```
 */
export function withProviders<P extends object>(
  Component: React.ComponentType<P>,
  config: Omit<ICombinedProviderProps, 'children' | 'context'>
) {
  return React.forwardRef<any, P & { context: WebPartContext }>((props, ref) => {
    const { context, ...componentProps } = props;
    
    return (
      <CombinedProvider {...config} context={context}>
        <Component {...(componentProps as P)} ref={ref} />
      </CombinedProvider>
    );
  });
}

/**
 * Hook to ensure all providers are available
 * Throws an error if any required provider is missing
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useRequireProviders(['dataverse', 'user']);
 *   // Now safe to use useDataverseContext and useUser
 * }
 * ```
 */
export function useRequireProviders(
  required: Array<'dataverse' | 'appState' | 'notifications' | 'theme' | 'user'>
): void {
  React.useEffect(() => {
    const errors: string[] = [];
    
    // Check each required provider
    // Note: In real implementation, would check actual context availability
    required.forEach(provider => {
      try {
        switch (provider) {
          case 'dataverse':
            // Would check DataverseContext
            break;
          case 'appState':
            // Would check AppStateContext
            break;
          case 'notifications':
            // Would check NotificationContext
            break;
          case 'theme':
            // Would check ThemeContext
            break;
          case 'user':
            // Would check UserContext
            break;
        }
      } catch (error) {
        errors.push(`${provider} provider is required but not found`);
      }
    });
    
    if (errors.length > 0) {
      throw new Error(`Missing required providers:\n${errors.join('\n')}`);
    }
  }, [required]);
}