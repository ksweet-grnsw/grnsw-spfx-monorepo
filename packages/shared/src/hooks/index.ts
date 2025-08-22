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

// UI state
export { useDebounce } from './useDebounce';
export { useThrottle } from './useThrottle';
export { useToggle } from './useToggle';
export { useModal } from './useModal';

// Data management
export { useLocalStorage } from './useLocalStorage';
export { useSessionStorage } from './useSessionStorage';
export { usePagination } from './usePagination';
export { useSort } from './useSort';
export { useFilter } from './useFilter';

// Performance
export { useMemoizedCallback } from './useMemoizedCallback';
export { useIntersectionObserver } from './useIntersectionObserver';
export { useVirtualScroll } from './useVirtualScroll';

// Form handling
export { useForm } from './useForm';
export type { UseFormOptions, UseFormResult } from './useForm';

// Error handling
export { useErrorHandler } from './useErrorHandler';
export type { UseErrorHandlerResult } from './useErrorHandler';

// Event handling
export { useEventListener } from './useEventListener';
export { useKeyPress } from './useKeyPress';
export { useClickOutside } from './useClickOutside';

// Browser APIs
export { useClipboard } from './useClipboard';
export { useMediaQuery } from './useMediaQuery';
export { useOnlineStatus } from './useOnlineStatus';