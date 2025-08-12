/**
 * Component safety utilities to ensure smooth migration
 */

/**
 * Checks if Enterprise UI components are available
 */
export const checkEnterpriseUIAvailability = (): boolean => {
  try {
    // Check if the enterprise-ui module can be resolved
    require.resolve('../enterprise-ui/components');
    return true;
  } catch {
    console.warn('Enterprise UI components not available, using fallback');
    return false;
  }
};

/**
 * Safe import wrapper that provides fallback for missing modules
 */
export const safeImport = async <T>(
  primaryPath: string,
  fallbackPath: string
): Promise<T> => {
  try {
    const module = await import(primaryPath);
    return module;
  } catch (error) {
    console.warn(`Failed to import ${primaryPath}, using fallback ${fallbackPath}`);
    const fallbackModule = await import(fallbackPath);
    return fallbackModule;
  }
};

/**
 * Version compatibility checker
 */
export const isCompatibleVersion = (): boolean => {
  try {
    const packageJson = require('../../package.json');
    const version = packageJson.version;
    // Check if version is 1.1.0 or higher (when Enterprise UI was added)
    const [major, minor] = version.split('.').map(Number);
    return major > 1 || (major === 1 && minor >= 1);
  } catch {
    return false;
  }
};

/**
 * Feature flags for gradual rollout
 */
export const FeatureFlags = {
  USE_ENTERPRISE_UI: process.env.REACT_APP_USE_ENTERPRISE_UI !== 'false',
  USE_NEW_STYLING: process.env.REACT_APP_USE_NEW_STYLING !== 'false',
  ENABLE_FALLBACKS: process.env.REACT_APP_ENABLE_FALLBACKS !== 'false'
};

/**
 * Component error boundary state interface
 */
export interface IErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}