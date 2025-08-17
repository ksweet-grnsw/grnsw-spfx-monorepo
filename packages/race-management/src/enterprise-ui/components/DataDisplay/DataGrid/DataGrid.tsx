import * as React from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { DataGridProps, DataGridState, DataGridColumn } from './DataGrid.types';
import styles from './DataGrid.module.scss';

export const DataGrid = <T extends Record<string, any>>({
  data = [],
  columns = [],
  loading = false,
  error = '',
  
  theme = 'neutral',
  density = 'normal',
  striped = false,
  bordered = true,
  hoverable = true,
  
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getRowKey,
  
  sortable = true,
  defaultSort,
  onSort,
  
  pagination = false,
  pageSize: initialPageSize = 25,
  totalItems,
  currentPage: controlledPage,
  onPageChange,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  
  onRowClick,
  onRowDoubleClick,
  expandable = false,
  renderExpandedRow,
  
  emptyStateTitle = 'No data available',
  emptyStateMessage = 'There are no items to display.',
  emptyStateIcon,
  emptyStateAction,
  
  loadingMessage = 'Loading data...',
  loadingRows = 5,
  
  errorTitle = 'Error loading data',
  errorRetryText = 'Try again',
  onRetry,
  
  ariaLabel,
  ariaDescribedBy,
  
  className = '',
  tableClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  
  stickyHeader = false,
  virtualScroll = false,
  resizableColumns = false,
  reorderableColumns = false,
  
  onColumnResize,
  onColumnReorder
}: DataGridProps<T>): JSX.Element => {
  // State management
  const [state, setState] = useState<DataGridState<T>>({
    sortField: defaultSort?.field || null,
    sortDirection: defaultSort?.direction || null,
    selectedItems: new Set(selectedItems?.map((item, index) => getRowKey?.(item, index) || index)),
    expandedRows: new Set<string | number>(),
    currentPage: controlledPage || 1,
    pageSize: initialPageSize,
    columnWidths: new Map(),
    columnOrder: columns.map(col => String(col.key))
  });

  // Get unique row key
  const getItemKey = useCallback((item: T, index: number): string | number => {
    if (getRowKey) {
      return getRowKey(item, index);
    }
    return item.id || item.key || index;
  }, [getRowKey]);

  // Handle sorting
  const handleSort = useCallback((column: DataGridColumn<T>) => {
    if (!column.sortable || !sortable) return;

    const field = column.key;
    let direction: 'asc' | 'desc' = 'asc';

    if (state.sortField === field) {
      direction = state.sortDirection === 'asc' ? 'desc' : 'asc';
    }

    setState(prev => ({
      ...prev,
      sortField: field,
      sortDirection: direction
    }));

    if (onSort) {
      onSort(field, direction);
    }
  }, [state.sortField, state.sortDirection, sortable, onSort]);

  // Handle row selection
  const handleRowSelection = useCallback((item: T, index: number) => {
    if (!selectable) return;

    const key = getItemKey(item, index);
    const newSelectedItems = new Set(state.selectedItems);

    if (selectable === 'single') {
      newSelectedItems.clear();
      newSelectedItems.add(key);
    } else {
      if (newSelectedItems.has(key)) {
        newSelectedItems.delete(key);
      } else {
        newSelectedItems.add(key);
      }
    }

    setState(prev => ({
      ...prev,
      selectedItems: newSelectedItems
    }));

    if (onSelectionChange) {
      const selectedData = data.filter((item, idx) => 
        newSelectedItems.has(getItemKey(item, idx))
      );
      onSelectionChange(selectedData);
    }
  }, [selectable, state.selectedItems, data, getItemKey, onSelectionChange]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!selectable || selectable === 'single') return;

    const allKeys = data.map((item, index) => getItemKey(item, index));
    const newSelectedItems = state.selectedItems.size === allKeys.length
      ? new Set<string | number>()
      : new Set(allKeys);

    setState(prev => ({
      ...prev,
      selectedItems: newSelectedItems
    }));

    if (onSelectionChange) {
      const selectedData = newSelectedItems.size > 0 ? [...data] : [];
      onSelectionChange(selectedData);
    }
  }, [selectable, data, state.selectedItems, getItemKey, onSelectionChange]);

  // Handle row expansion
  const handleRowExpansion = useCallback((item: T, index: number) => {
    if (!expandable) return;

    const key = getItemKey(item, index);
    const newExpandedRows = new Set(state.expandedRows);

    if (newExpandedRows.has(key)) {
      newExpandedRows.delete(key);
    } else {
      newExpandedRows.add(key);
    }

    setState(prev => ({
      ...prev,
      expandedRows: newExpandedRows
    }));
  }, [expandable, state.expandedRows, getItemKey]);

  // Process data for display
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply sorting
    if (state.sortField && state.sortDirection) {
      result.sort((a, b) => {
        const aValue = a[state.sortField as keyof T];
        const bValue = b[state.sortField as keyof T];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return state.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // Apply pagination
    if (pagination) {
      const startIndex = (state.currentPage - 1) * state.pageSize;
      const endIndex = startIndex + state.pageSize;
      result = result.slice(startIndex, endIndex);
    }

    return result;
  }, [data, state.sortField, state.sortDirection, pagination, state.currentPage, state.pageSize]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const total = totalItems || data.length;
    const totalPages = Math.ceil(total / state.pageSize);
    const startItem = (state.currentPage - 1) * state.pageSize + 1;
    const endItem = Math.min(state.currentPage * state.pageSize, total);

    return {
      total,
      totalPages,
      startItem,
      endItem,
      hasNext: state.currentPage < totalPages,
      hasPrev: state.currentPage > 1
    };
  }, [data.length, totalItems, state.currentPage, state.pageSize]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
    if (onPageChange) {
      onPageChange(page);
    }
  }, [onPageChange]);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setState(prev => ({ 
      ...prev, 
      pageSize: newPageSize,
      currentPage: 1 
    }));
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  }, [onPageSizeChange]);

  // Render loading state
  if (loading) {
    return (
      <div className={`${styles.dataGrid} ${styles[`theme-${theme}`]} ${className}`}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`${styles.dataGrid} ${styles[`theme-${theme}`]} ${className}`}>
        <div className={styles.errorState}>
          <h3>{errorTitle}</h3>
          <p>{error}</p>
          {onRetry && (
            <button onClick={onRetry} className={styles.retryButton}>
              {errorRetryText}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <div className={`${styles.dataGrid} ${styles[`theme-${theme}`]} ${className}`}>
        <div className={styles.emptyState}>
          {emptyStateIcon && <div className={styles.emptyIcon}>{emptyStateIcon}</div>}
          <h3>{emptyStateTitle}</h3>
          <p>{emptyStateMessage}</p>
          {emptyStateAction && <div className={styles.emptyAction}>{emptyStateAction}</div>}
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div 
      className={`
        ${styles.dataGrid} 
        ${styles[`theme-${theme}`]} 
        ${styles[`density-${density}`]}
        ${striped ? styles.striped : ''}
        ${bordered ? styles.bordered : ''}
        ${hoverable ? styles.hoverable : ''}
        ${stickyHeader ? styles.stickyHeader : ''}
        ${className}
      `}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <div className={styles.tableWrapper}>
        <table className={`${styles.table} ${tableClassName}`}>
          <thead className={`${styles.header} ${headerClassName}`}>
            <tr>
              {selectable && selectable !== 'single' && (
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={state.selectedItems.size === data.length}
                    onChange={handleSelectAll}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Select all rows"
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = state.selectedItems.size > 0 && state.selectedItems.size < data.length;
                      }
                    }}
                  />
                </th>
              )}
              {expandable && <th className={styles.expandCell}></th>}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`
                    ${styles.headerCell}
                    ${column.sortable && sortable ? styles.sortable : ''}
                    ${state.sortField === column.key ? styles.sorted : ''}
                    ${column.headerClassName || ''}
                  `}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                    textAlign: column.align
                  }}
                  onClick={() => handleSort(column)}
                >
                  <div className={styles.headerContent}>
                    <span>{column.label}</span>
                    {column.sortable && sortable && (
                      <span className={styles.sortIcon}>
                        {state.sortField === column.key && (
                          state.sortDirection === 'asc' ? '↑' : '↓'
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${styles.body} ${bodyClassName}`}>
            {processedData.map((item, index) => {
              const key = getItemKey(item, index);
              const isSelected = state.selectedItems.has(key);
              const isExpanded = state.expandedRows.has(key);

              return (
                <React.Fragment key={key}>
                  <tr
                    className={`
                      ${styles.row}
                      ${isSelected ? styles.selected : ''}
                      ${onRowClick ? styles.clickable : ''}
                    `}
                    onClick={() => onRowClick?.(item, index)}
                    onDoubleClick={() => onRowDoubleClick?.(item, index)}
                  >
                    {selectable && (
                      <td 
                        className={styles.checkboxCell}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type={selectable === 'single' ? 'radio' : 'checkbox'}
                          checked={isSelected}
                          onChange={() => handleRowSelection(item, index)}
                          aria-label={`Select row ${index + 1}`}
                        />
                      </td>
                    )}
                    {expandable && (
                      <td className={styles.expandCell}>
                        <button
                          className={styles.expandButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowExpansion(item, index);
                          }}
                          aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`${styles.cell} ${column.cellClassName || ''}`}
                        style={{ textAlign: column.align }}
                      >
                        {column.render
                          ? column.render(item[column.key as keyof T], item, index)
                          : item[column.key as keyof T]}
                      </td>
                    ))}
                  </tr>
                  {expandable && isExpanded && renderExpandedRow && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={columns.length + (selectable ? 1 : 0) + 1}>
                        <div className={styles.expandedContent}>
                          {renderExpandedRow(item, index)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className={`${styles.footer} ${footerClassName}`}>
          <div className={styles.paginationInfo}>
            Showing {paginationInfo.startItem} to {paginationInfo.endItem} of {paginationInfo.total} entries
          </div>
          <div className={styles.paginationControls}>
            <select
              value={state.pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className={styles.pageSizeSelect}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
            <button
              onClick={() => handlePageChange(state.currentPage - 1)}
              disabled={!paginationInfo.hasPrev}
              className={styles.pageButton}
            >
              Previous
            </button>
            <span className={styles.pageNumbers}>
              Page {state.currentPage} of {paginationInfo.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(state.currentPage + 1)}
              disabled={!paginationInfo.hasNext}
              className={styles.pageButton}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};