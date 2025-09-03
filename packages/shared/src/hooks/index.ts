/**
 * Shared Custom Hooks Library
 * Reusable React hooks for all SPFx packages
 */

// Data fetching
export { useDataverse } from './useDataverse';
export type { UseDataverseOptions, UseDataverseResult } from './useDataverse';

// State management
export { useOptimisticUpdate } from './useOptimisticUpdate';
export type { UseOptimisticUpdateOptions, UseOptimisticUpdateResult } from './useOptimisticUpdate';

// Loading state management
export { useLoadingState } from './useLoadingState';

// Error handling
export { useErrorHandler } from './useErrorHandler';

// Telemetry
export { useTelemetry } from './useTelemetry';