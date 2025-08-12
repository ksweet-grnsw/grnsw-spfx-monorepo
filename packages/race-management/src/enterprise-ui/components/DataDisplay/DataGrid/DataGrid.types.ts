// DataGrid Component Types
// ========================

export interface DataGridColumn<T = any> {
  key: keyof T | string;
  label: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataGridProps<T = any> {
  // Data
  data: T[];
  columns: DataGridColumn<T>[];
  loading?: boolean;
  error?: string;
  
  // Display
  theme?: 'neutral' | 'meeting' | 'race' | 'contestant' | 'financial' | 'weather' | 'health';
  density?: 'compact' | 'normal' | 'comfortable';
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  
  // Selection
  selectable?: boolean | 'single' | 'multiple';
  selectedItems?: T[];
  onSelectionChange?: (selectedItems: T[]) => void;
  getRowKey?: (item: T, index: number) => string | number;
  
  // Sorting
  sortable?: boolean;
  defaultSort?: {
    field: keyof T | string;
    direction: 'asc' | 'desc';
  };
  onSort?: (field: keyof T | string, direction: 'asc' | 'desc') => void;
  
  // Pagination
  pagination?: boolean;
  pageSize?: number;
  totalItems?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  
  // Row interactions
  onRowClick?: (item: T, index: number) => void;
  onRowDoubleClick?: (item: T, index: number) => void;
  expandable?: boolean;
  renderExpandedRow?: (item: T, index: number) => React.ReactNode;
  
  // Empty state
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  emptyStateIcon?: React.ReactNode;
  emptyStateAction?: React.ReactNode;
  
  // Loading state
  loadingMessage?: string;
  loadingRows?: number;
  
  // Error state
  errorTitle?: string;
  errorRetryText?: string;
  onRetry?: () => void;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  
  // Styling
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  
  // Advanced features
  virtualScroll?: boolean;
  stickyHeader?: boolean;
  resizableColumns?: boolean;
  reorderableColumns?: boolean;
  
  // Callbacks
  onColumnResize?: (column: DataGridColumn<T>, newWidth: number) => void;
  onColumnReorder?: (columns: DataGridColumn<T>[]) => void;
}

export interface DataGridState<T = any> {
  sortField: keyof T | string | null;
  sortDirection: 'asc' | 'desc' | null;
  selectedItems: Set<string | number>;
  expandedRows: Set<string | number>;
  currentPage: number;
  pageSize: number;
  columnWidths: Map<string, number>;
  columnOrder: string[];
}

export type DataGridTheme = 'neutral' | 'meeting' | 'race' | 'contestant' | 'financial' | 'weather' | 'health';
export type DataGridDensity = 'compact' | 'normal' | 'comfortable';
export type DataGridSelectionMode = boolean | 'single' | 'multiple';