// Export all custom hooks from a single location
export { useModalManager, useMultiModalManager } from './useModalManager';
export { useDataFetching, usePaginatedDataFetching } from './useDataFetching';
export type { DataFetchingState, DataFetchingOptions } from './useDataFetching';
export { useTableColumns, useActionColumns } from './useTableColumns';
export { useFilters, useDateRangePresets } from './useFilters';
export type { FilterState, UseFiltersOptions } from './useFilters';
export { useInjuryTracking } from './useInjuryTracking';
export type { InjurySummary } from './useInjuryTracking';
export { useOptimisticUpdate } from './useOptimisticUpdate';
export type { OptimisticUpdateResult, OptimisticUpdateOptions } from './useOptimisticUpdate';
export { useKeyboardShortcuts, createDataNavigationShortcuts, useVimNavigation } from './useKeyboardShortcuts';
export type { KeyboardShortcut, UseKeyboardShortcutsOptions } from './useKeyboardShortcuts';