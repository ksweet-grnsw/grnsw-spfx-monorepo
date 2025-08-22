import { ReactNode } from 'react';

/**
 * Column definition for DataGrid
 */
export interface IDataGridColumn<T = any> {
  key: string;
  name: string;
  fieldName?: string;
  minWidth?: number;
  maxWidth?: number;
  isResizable?: boolean;
  isSorted?: boolean;
  isSortedDescending?: boolean;
  isFiltered?: boolean;
  isGrouped?: boolean;
  isMultiline?: boolean;
  onRender?: (item: T, index?: number, column?: IDataGridColumn<T>) => ReactNode;
  onColumnClick?: (ev?: React.MouseEvent<HTMLElement>, column?: IDataGridColumn<T>) => void;
  className?: string;
  headerClassName?: string;
  isPadded?: boolean;
  columnActionsMode?: number;
  data?: any;
}

/**
 * Selection mode for DataGrid
 */
export enum SelectionMode {
  none = 0,
  single = 1,
  multiple = 2
}

/**
 * DataGrid component props
 */
export interface IDataGridProps<T = any> {
  /** Data items to display */
  items: T[];
  
  /** Column definitions */
  columns: IDataGridColumn<T>[];
  
  /** Enable compact mode */
  compact?: boolean;
  
  /** Selection mode */
  selectionMode?: SelectionMode;
  
  /** Selected items */
  selection?: T[];
  
  /** Callback when selection changes */
  onSelectionChanged?: (selection: T[]) => void;
  
  /** Enable sorting */
  enableSorting?: boolean;
  
  /** Callback when sorting changes */
  onSort?: (column: IDataGridColumn<T>, isSortedDescending: boolean) => void;
  
  /** Enable filtering */
  enableFiltering?: boolean;
  
  /** Enable grouping */
  enableGrouping?: boolean;
  
  /** Group by field */
  groupBy?: string;
  
  /** Enable pagination */
  enablePagination?: boolean;
  
  /** Items per page */
  pageSize?: number;
  
  /** Current page */
  currentPage?: number;
  
  /** Total items (for server-side pagination) */
  totalItems?: number;
  
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  
  /** Enable virtual scrolling */
  enableVirtualization?: boolean;
  
  /** Row height for virtualization */
  rowHeight?: number;
  
  /** Container height for virtualization */
  containerHeight?: number;
  
  /** Show loading state */
  isLoading?: boolean;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Error message */
  errorMessage?: string;
  
  /** Enable row actions */
  enableRowActions?: boolean;
  
  /** Row actions renderer */
  onRenderRowActions?: (item: T) => ReactNode;
  
  /** Row click handler */
  onRowClick?: (item: T, index: number) => void;
  
  /** Row double click handler */
  onRowDoubleClick?: (item: T, index: number) => void;
  
  /** Custom row className */
  getRowClassName?: (item: T, index: number) => string;
  
  /** Enable export */
  enableExport?: boolean;
  
  /** Export filename */
  exportFilename?: string;
  
  /** Theme */
  theme?: 'light' | 'dark';
  
  /** Custom className */
  className?: string;
  
  /** Aria label */
  ariaLabel?: string;
}