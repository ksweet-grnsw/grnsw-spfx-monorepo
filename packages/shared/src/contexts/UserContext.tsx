import * as React from 'react';
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';

/**
 * User role enumeration
 */
export enum UserRole {
  Guest = 'Guest',
  Viewer = 'Viewer',
  Contributor = 'Contributor',
  Editor = 'Editor',
  Admin = 'Admin',
  SuperAdmin = 'SuperAdmin'
}

/**
 * User permissions
 */
export interface IUserPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canExport: boolean;
  canImport: boolean;
  customPermissions: Record<string, boolean>;
}

/**
 * User preferences
 */
export interface IUserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  firstDayOfWeek: number;
  pageSize: number;
  defaultView: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
  };
}

/**
 * User interface
 */
export interface IUser {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  photoUrl?: string;
  
  // Authentication
  isAuthenticated: boolean;
  authProvider: 'aad' | 'adfs' | 'local' | 'guest';
  
  // Roles and permissions
  roles: UserRole[];
  permissions: IUserPermissions;
  groups: string[];
  
  // Preferences
  preferences: IUserPreferences;
  
  // Metadata
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * User context value
 */
export interface IUserContext {
  user: IUser | null;
  isLoading: boolean;
  error: Error | null;
  
  // Authentication methods
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // Permission checks
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllRoles: (roles: UserRole[]) => boolean;
  hasPermission: (permission: keyof IUserPermissions) => boolean;
  hasCustomPermission: (key: string) => boolean;
  
  // Preference management
  updatePreferences: (preferences: Partial<IUserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  
  // User data management
  updateProfile: (profile: Partial<IUser>) => Promise<void>;
  uploadPhoto: (file: File) => Promise<void>;
}

/**
 * User provider props
 */
export interface IUserProviderProps {
  children: ReactNode;
  context?: WebPartContext;
  autoLogin?: boolean;
  guestAccess?: boolean;
  mockUser?: IUser;
}

// Default permissions by role
const rolePermissions: Record<UserRole, IUserPermissions> = {
  [UserRole.Guest]: {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canManageSettings: false,
    canExport: false,
    canImport: false,
    customPermissions: {}
  },
  [UserRole.Viewer]: {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canManageSettings: false,
    canExport: true,
    canImport: false,
    customPermissions: {}
  },
  [UserRole.Contributor]: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManageUsers: false,
    canManageSettings: false,
    canExport: true,
    canImport: false,
    customPermissions: {}
  },
  [UserRole.Editor]: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: false,
    canManageSettings: false,
    canExport: true,
    canImport: true,
    customPermissions: {}
  },
  [UserRole.Admin]: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canManageSettings: true,
    canExport: true,
    canImport: true,
    customPermissions: {}
  },
  [UserRole.SuperAdmin]: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canManageSettings: true,
    canExport: true,
    canImport: true,
    customPermissions: {}
  }
};

// Default preferences
const defaultPreferences: IUserPreferences = {
  language: 'en-US',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  firstDayOfWeek: 0,
  pageSize: 50,
  defaultView: 'dashboard',
  notifications: {
    email: true,
    push: false,
    inApp: true
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReader: false
  }
};

// Create context
const UserContext = createContext<IUserContext | undefined>(undefined);

/**
 * User Provider Component
 * Manages user authentication and profile
 */
export const UserProvider: React.FC<IUserProviderProps> = ({
  children,
  context,
  autoLogin = true,
  guestAccess = false,
  mockUser
}) => {
  const [user, setUser] = useState<IUser | null>(mockUser || null);
  const [isLoading, setIsLoading] = useState<boolean>(!mockUser);
  const [error, setError] = useState<Error | null>(null);

  // Load user from SharePoint context
  const loadUserFromContext = useCallback(async () => {
    if (!context) {
      if (guestAccess) {
        // Create guest user
        setUser({
          id: 'guest',
          email: 'guest@example.com',
          displayName: 'Guest User',
          isAuthenticated: false,
          authProvider: 'guest',
          roles: [UserRole.Guest],
          permissions: rolePermissions[UserRole.Guest],
          groups: [],
          preferences: defaultPreferences
        });
      }
      return;
    }

    try {
      const spUser = context.pageContext.user;
      const web = context.pageContext.web;
      
      // Get user groups
      const groups: string[] = [];
      // Note: In real implementation, fetch user groups from SharePoint
      
      // Determine roles based on SharePoint permissions
      const roles: UserRole[] = [];
      if (context.pageContext.legacyPageContext?.isSiteAdmin) {
        roles.push(UserRole.Admin);
      } else if (context.pageContext.legacyPageContext?.canEdit) {
        roles.push(UserRole.Editor);
      } else {
        roles.push(UserRole.Viewer);
      }
      
      // Calculate permissions
      const permissions = roles.reduce((acc, role) => {
        const rolePerms = rolePermissions[role];
        return {
          canView: acc.canView || rolePerms.canView,
          canCreate: acc.canCreate || rolePerms.canCreate,
          canEdit: acc.canEdit || rolePerms.canEdit,
          canDelete: acc.canDelete || rolePerms.canDelete,
          canManageUsers: acc.canManageUsers || rolePerms.canManageUsers,
          canManageSettings: acc.canManageSettings || rolePerms.canManageSettings,
          canExport: acc.canExport || rolePerms.canExport,
          canImport: acc.canImport || rolePerms.canImport,
          customPermissions: { ...acc.customPermissions, ...rolePerms.customPermissions }
        };
      }, rolePermissions[UserRole.Guest]);
      
      // Load saved preferences
      let preferences = defaultPreferences;
      try {
        const saved = localStorage.getItem(`user_preferences_${spUser.loginName}`);
        if (saved) {
          preferences = { ...defaultPreferences, ...JSON.parse(saved) };
        }
      } catch {
        // Ignore storage errors
      }
      
      setUser({
        id: spUser.loginName,
        email: spUser.email || spUser.loginName,
        displayName: spUser.displayName,
        isAuthenticated: true,
        authProvider: 'aad',
        roles,
        permissions,
        groups,
        preferences,
        photoUrl: `/_layouts/15/userphoto.aspx?accountname=${spUser.email}&size=L`,
        lastLogin: new Date()
      });
    } catch (err) {
      setError(err as Error);
      if (guestAccess) {
        // Fallback to guest
        setUser({
          id: 'guest',
          email: 'guest@example.com',
          displayName: 'Guest User',
          isAuthenticated: false,
          authProvider: 'guest',
          roles: [UserRole.Guest],
          permissions: rolePermissions[UserRole.Guest],
          groups: [],
          preferences: defaultPreferences
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [context, guestAccess]);

  // Auto-login on mount
  useEffect(() => {
    if (autoLogin && !mockUser) {
      loadUserFromContext().catch(console.error);
    }
  }, [autoLogin, mockUser, loadUserFromContext]);

  // Login
  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await loadUserFromContext();
  }, [loadUserFromContext]);

  // Logout
  const logout = useCallback(async () => {
    setUser(null);
    if (guestAccess) {
      setUser({
        id: 'guest',
        email: 'guest@example.com',
        displayName: 'Guest User',
        isAuthenticated: false,
        authProvider: 'guest',
        roles: [UserRole.Guest],
        permissions: rolePermissions[UserRole.Guest],
        groups: [],
        preferences: defaultPreferences
      });
    }
  }, [guestAccess]);

  // Refresh user data
  const refresh = useCallback(async () => {
    await loadUserFromContext();
  }, [loadUserFromContext]);

  // Role checks
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.roles.includes(role) || false;
  }, [user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return roles.some(role => user?.roles.includes(role)) || false;
  }, [user]);

  const hasAllRoles = useCallback((roles: UserRole[]): boolean => {
    return roles.every(role => user?.roles.includes(role)) || false;
  }, [user]);

  // Permission checks
  const hasPermission = useCallback((permission: keyof IUserPermissions): boolean => {
    if (!user) return false;
    const value = user.permissions[permission];
    return typeof value === 'boolean' ? value : false;
  }, [user]);

  const hasCustomPermission = useCallback((key: string): boolean => {
    return user?.permissions.customPermissions[key] || false;
  }, [user]);

  // Update preferences
  const updatePreferences = useCallback(async (preferences: Partial<IUserPreferences>) => {
    if (!user) return;
    
    const newPreferences = { ...user.preferences, ...preferences };
    setUser({ ...user, preferences: newPreferences });
    
    // Persist to localStorage
    try {
      localStorage.setItem(`user_preferences_${user.id}`, JSON.stringify(newPreferences));
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  // Reset preferences
  const resetPreferences = useCallback(async () => {
    if (!user) return;
    
    setUser({ ...user, preferences: defaultPreferences });
    
    // Remove from localStorage
    try {
      localStorage.removeItem(`user_preferences_${user.id}`);
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  // Update profile
  const updateProfile = useCallback(async (profile: Partial<IUser>) => {
    if (!user) return;
    
    setUser({ ...user, ...profile });
    // In real implementation, save to backend
  }, [user]);

  // Upload photo
  const uploadPhoto = useCallback(async (file: File) => {
    if (!user) return;
    
    // In real implementation, upload to SharePoint
    const photoUrl = URL.createObjectURL(file);
    setUser({ ...user, photoUrl });
  }, [user]);

  // Create context value
  const contextValue: IUserContext = {
    user,
    isLoading,
    error,
    login,
    logout,
    refresh,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasCustomPermission,
    updatePreferences,
    resetPreferences,
    updateProfile,
    uploadPhoto
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Hook to use user context
 */
export const useUser = (): IUserContext => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  return context;
};