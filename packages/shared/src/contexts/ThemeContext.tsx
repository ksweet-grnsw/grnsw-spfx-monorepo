import * as React from 'react';
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ITheme as IFluentTheme, createTheme, Theme } from '@fluentui/react';

/**
 * Custom theme colors
 */
export interface IThemeColors {
  primary: string;
  secondary: string;
  tertiary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgOverlay: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  textInverse: string;
  
  // Border colors
  borderDefault: string;
  borderLight: string;
  borderDark: string;
  
  // Domain-specific colors
  meeting: string;
  race: string;
  contestant: string;
  weather: string;
  health: string;
  financial: string;
}

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Complete theme definition
 */
export interface ITheme {
  mode: ThemeMode;
  colors: IThemeColors;
  fluent: IFluentTheme;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    fontWeight: {
      light: number;
      regular: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

/**
 * Theme context value
 */
export interface IThemeContext {
  theme: ITheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isDark: boolean;
  isLight: boolean;
  isAuto: boolean;
  systemPreference: 'light' | 'dark';
  updateColors: (colors: Partial<IThemeColors>) => void;
  resetTheme: () => void;
}

/**
 * Theme provider props
 */
export interface IThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
  customColors?: Partial<IThemeColors>;
  persistPreference?: boolean;
}

// Light theme colors
const lightColors: IThemeColors = {
  primary: '#0078d4',
  secondary: '#2b88d8',
  tertiary: '#71afe5',
  success: '#107c10',
  warning: '#ff9800',
  error: '#d83b01',
  info: '#00bcd4',
  
  bgPrimary: '#ffffff',
  bgSecondary: '#f3f2f1',
  bgTertiary: '#edebe9',
  bgOverlay: 'rgba(0, 0, 0, 0.4)',
  
  textPrimary: '#323130',
  textSecondary: '#605e5c',
  textDisabled: '#a19f9d',
  textInverse: '#ffffff',
  
  borderDefault: '#edebe9',
  borderLight: '#f3f2f1',
  borderDark: '#a19f9d',
  
  meeting: '#0078d4',
  race: '#107c10',
  contestant: '#ff9800',
  weather: '#004578',
  health: '#00a000',
  financial: '#5c2d91'
};

// Dark theme colors
const darkColors: IThemeColors = {
  primary: '#2b88d8',
  secondary: '#71afe5',
  tertiary: '#c7e0f4',
  success: '#428000',
  warning: '#ffaa44',
  error: '#ff5555',
  info: '#44ddff',
  
  bgPrimary: '#1e1e1e',
  bgSecondary: '#252423',
  bgTertiary: '#323130',
  bgOverlay: 'rgba(255, 255, 255, 0.1)',
  
  textPrimary: '#ffffff',
  textSecondary: '#d2d0ce',
  textDisabled: '#797775',
  textInverse: '#323130',
  
  borderDefault: '#414141',
  borderLight: '#323130',
  borderDark: '#605e5c',
  
  meeting: '#2b88d8',
  race: '#428000',
  contestant: '#ffaa44',
  weather: '#0078d4',
  health: '#00cc00',
  financial: '#8764b8'
};

// Default theme structure
const createAppTheme = (colors: IThemeColors, mode: ThemeMode): ITheme => {
  const fluentTheme = createTheme({
    palette: {
      themePrimary: colors.primary,
      themeLighterAlt: colors.bgSecondary,
      themeLighter: colors.bgTertiary,
      themeLight: colors.tertiary,
      themeTertiary: colors.tertiary,
      themeSecondary: colors.secondary,
      themeDarkAlt: colors.primary,
      themeDark: colors.primary,
      themeDarker: colors.primary,
      neutralLighterAlt: colors.bgSecondary,
      neutralLighter: colors.bgTertiary,
      neutralLight: colors.borderLight,
      neutralQuaternaryAlt: colors.borderDefault,
      neutralQuaternary: colors.borderDefault,
      neutralTertiaryAlt: colors.borderDark,
      neutralTertiary: colors.textDisabled,
      neutralSecondary: colors.textSecondary,
      neutralPrimaryAlt: colors.textPrimary,
      neutralPrimary: colors.textPrimary,
      neutralDark: colors.textPrimary,
      black: mode === 'dark' ? '#ffffff' : '#000000',
      white: colors.bgPrimary
    },
    isInverted: mode === 'dark'
  });

  return {
    mode,
    colors,
    fluent: fluentTheme,
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      xxl: '48px'
    },
    typography: {
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", sans-serif',
      fontSize: {
        xs: '10px',
        sm: '12px',
        md: '14px',
        lg: '16px',
        xl: '20px',
        xxl: '28px'
      },
      fontWeight: {
        light: 300,
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75
      }
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    radius: {
      sm: '2px',
      md: '4px',
      lg: '8px',
      full: '9999px'
    },
    transitions: {
      fast: '150ms ease-in-out',
      normal: '250ms ease-in-out',
      slow: '350ms ease-in-out'
    }
  };
};

// Create context
const ThemeContext = createContext<IThemeContext | undefined>(undefined);

/**
 * Theme Provider Component
 * Manages application theming
 */
export const ThemeProvider: React.FC<IThemeProviderProps> = ({
  children,
  initialMode = 'light',
  customColors = {},
  persistPreference = true
}) => {
  // Detect system preference
  const getSystemPreference = useCallback((): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(getSystemPreference());
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (persistPreference && typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme_mode');
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        return stored;
      }
    }
    return initialMode;
  });

  // Determine effective mode
  const effectiveMode = mode === 'auto' ? systemPreference : mode;
  const isDark = effectiveMode === 'dark';
  const isLight = effectiveMode === 'light';
  const isAuto = mode === 'auto';

  // Create theme with custom colors
  const [theme, setTheme] = useState<ITheme>(() => {
    const baseColors = effectiveMode === 'dark' ? darkColors : lightColors;
    const mergedColors = { ...baseColors, ...customColors };
    return createAppTheme(mergedColors, effectiveMode);
  });

  // Update theme when mode or colors change
  useEffect(() => {
    const baseColors = effectiveMode === 'dark' ? darkColors : lightColors;
    const mergedColors = { ...baseColors, ...customColors };
    setTheme(createAppTheme(mergedColors, effectiveMode));

    // Apply CSS variables to document
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      Object.entries(mergedColors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value);
      });
      root.setAttribute('data-theme', effectiveMode);
    }
  }, [effectiveMode, customColors]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        setSystemPreference(e.matches ? 'dark' : 'light');
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
    }
  }, []);

  // Persist mode preference
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    if (persistPreference && typeof window !== 'undefined') {
      localStorage.setItem('theme_mode', newMode);
    }
  }, [persistPreference]);

  // Toggle between light and dark
  const toggleMode = useCallback(() => {
    setMode(effectiveMode === 'light' ? 'dark' : 'light');
  }, [effectiveMode, setMode]);

  // Update colors
  const updateColors = useCallback((colors: Partial<IThemeColors>) => {
    const baseColors = effectiveMode === 'dark' ? darkColors : lightColors;
    const mergedColors = { ...baseColors, ...customColors, ...colors };
    setTheme(createAppTheme(mergedColors, effectiveMode));
  }, [effectiveMode, customColors]);

  // Reset theme
  const resetTheme = useCallback(() => {
    const baseColors = effectiveMode === 'dark' ? darkColors : lightColors;
    setTheme(createAppTheme(baseColors, effectiveMode));
  }, [effectiveMode]);

  // Create context value
  const contextValue: IThemeContext = {
    theme,
    mode,
    setMode,
    toggleMode,
    isDark,
    isLight,
    isAuto,
    systemPreference,
    updateColors,
    resetTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme
 */
export const useTheme = (): IThemeContext => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};