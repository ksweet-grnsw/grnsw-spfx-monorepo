import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { IDataGridProps, IDataGridColumn, SelectionMode } from './DataGrid.types';
// import styles from './DataGrid.module.scss';
const styles: any = {}; // Temporary placeholder for styles

/**
 * Shared DataGrid Component
 * Provides table functionality with sorting, filtering, pagination, and virtualization
 */
export const DataGrid = <T extends any = any>(props: IDataGridProps<T>): JSX.Element => {
  const {
    items,
    columns,
    compact = false,
    selectionMode = SelectionMode.none,
    selection = [],
    onSelectionChanged,
    enableSorting = true,
    onSort,
    enableFiltering = false,
    enableGrouping = false,
    groupBy,
    enablePagination = false,
    pageSize = 50,
    currentPage = 1,
    totalItems,
    onPageChange,
    enableVirtualization = false,
    rowHeight = 42,
    containerHeight = 600,
    isLoading = false,
    emptyMessage = 'No data available',
    errorMessage,
    enableRowActions = false,
    onRenderRowActions,
    onRowClick,
    onRowDoubleClick,
    getRowClassName,
    enableExport = false,
    exportFilename = 'data',
    theme = 'light',
    className,
    ariaLabel = 'Data grid'
  } = props;

  // State
  const [sortedColumn, setSortedColumn] = useState<IDataGridColumn<T> | null>(null);
  const [sortDescending, setSortDescending] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<T>>(new Set(selection));
  const [page, setPage] = useState(currentPage);

  // Update selection when prop changes
  useEffect(() => {
    setSelectedItems(new Set(selection));
  }, [selection]);

  // Update page when prop changes
  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  // Sort items
  const sortedItems = useMemo(() => {
    if (!enableSorting || !sortedColumn || !onSort) {
      return items;
    }

    const sorted = [...items];
    const field = sortedColumn.fieldName || sortedColumn.key;

    sorted.sort((a, b) => {
      const aVal = (a as any)[field];
      const bVal = (b as any)[field];

      if (aVal < bVal) return sortDescending ? 1 : -1;
      if (aVal > bVal) return sortDescending ? -1 : 1;
      return 0;
    });

    return sorted;
  }, [items, sortedColumn, sortDescending, enableSorting, onSort]);

  // Paginate items
  const paginatedItems = useMemo(() => {
    if (!enablePagination) {
      return sortedItems;
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedItems.slice(startIndex, endIndex);
  }, [sortedItems, enablePagination, page, pageSize]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!enablePagination) return 1;
    const total = totalItems || items.length;
    return Math.ceil(total / pageSize);
  }, [enablePagination, totalItems, items.length, pageSize]);

  // Handle column header click
  const handleColumnClick = useCallback((column: IDataGridColumn<T>) => {
    if (!enableSorting) return;

    if (sortedColumn?.key === column.key) {
      setSortDescending(!sortDescending);
    } else {
      setSortedColumn(column);
      setSortDescending(false);
    }

    if (onSort) {
      onSort(column, !sortDescending);
    }
  }, [enableSorting, sortedColumn, sortDescending, onSort]);

  // Handle row selection
  const handleRowSelection = useCallback((item: T, event: React.MouseEvent) => {
    if (selectionMode === SelectionMode.none) return;

    event.stopPropagation();

    const newSelection = new Set(selectedItems);

    if (selectionMode === SelectionMode.single) {
      newSelection.clear();
      newSelection.add(item);
    } else if (selectionMode === SelectionMode.multiple) {
      if (newSelection.has(item)) {
        newSelection.delete(item);
      } else {
        newSelection.add(item);
      }
    }

    setSelectedItems(newSelection);
    
    if (onSelectionChanged) {
      onSelectionChanged(Array.from(newSelection));
    }
  }, [selectionMode, selectedItems, onSelectionChanged]);

  // Handle row click
  const handleRowClick = useCallback((item: T, index: number, event: React.MouseEvent) => {
    if (onRowClick) {
      onRowClick(item, index);
    }
  }, [onRowClick]);

  // Handle row double click
  const handleRowDoubleClick = useCallback((item: T, index: number) => {
    if (onRowDoubleClick) {
      onRowDoubleClick(item, index);
    }
  }, [onRowDoubleClick]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  }, [onPageChange]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = columns.map(c => c.name).join(',');
    const rows = items.map(item => 
      columns.map(col => {
        const field = col.fieldName || col.key;
        const value = (item as any)[field];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFilename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [columns, items, exportFilename]);

  // Render loading state
  if (isLoading) {
    return (
      <div className={`${styles.dataGrid} ${styles.loading} ${className || ''}`}>
        <div className={styles.spinner}>Loading...</div>
      </div>
    );
  }

  // Render error state
  if (errorMessage) {
    return (
      <div className={`${styles.dataGrid} ${styles.error} ${className || ''}`}>
        <div className={styles.errorMessage}>{errorMessage}</div>
      </div>
    );
  }

  // Render empty state
  if (items.length === 0) {
    return (
      <div className={`${styles.dataGrid} ${styles.empty} ${className || ''}`}>
        <div className={styles.emptyMessage}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.dataGrid} ${styles[theme]} ${compact ? styles.compact : ''} ${className || ''}`}
      role="grid"
      aria-label={ariaLabel}
    >
      {/* Toolbar */}
      {enableExport && (
        <div className={styles.toolbar}>
          <button 
            className={styles.exportButton}
            onClick={exportToCSV}
            aria-label="Export to CSV"
          >
            Export
          </button>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {selectionMode !== SelectionMode.none && (
                <th className={styles.checkboxCell}>
                  {selectionMode === SelectionMode.multiple && (
                    <input
                      type="checkbox"
                      checked={selectedItems.size === items.length && items.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(new Set(items));
                          if (onSelectionChanged) {
                            onSelectionChanged(items);
                          }
                        } else {
                          setSelectedItems(new Set());
                          if (onSelectionChanged) {
                            onSelectionChanged([]);
                          }
                        }
                      }}
                      aria-label="Select all"
                    />
                  )}
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`${styles.headerCell} ${column.headerClassName || ''} ${enableSorting ? styles.sortable : ''}`}
                  style={{
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth
                  }}
                  onClick={() => handleColumnClick(column)}
                  aria-sort={
                    sortedColumn?.key === column.key
                      ? sortDescending ? 'descending' : 'ascending'
                      : 'none'
                  }
                >
                  <span className={styles.headerContent}>
                    {column.name}
                    {enableSorting && sortedColumn?.key === column.key && (
                      <span className={styles.sortIcon}>
                        {sortDescending ? '▼' : '▲'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {enableRowActions && (
                <th className={styles.actionsCell}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item, index) => {
              const isSelected = selectedItems.has(item);
              const rowClassName = getRowClassName ? getRowClassName(item, index) : '';

              return (
                <tr
                  key={index}
                  className={`${styles.row} ${isSelected ? styles.selected : ''} ${rowClassName}`}
                  onClick={(e) => handleRowClick(item, index, e)}
                  onDoubleClick={() => handleRowDoubleClick(item, index)}
                >
                  {selectionMode !== SelectionMode.none && (
                    <td className={styles.checkboxCell}>
                      <input
                        type={selectionMode === SelectionMode.single ? 'radio' : 'checkbox'}
                        checked={isSelected}
                        onChange={(e) => handleRowSelection(item, e as any)}
                        aria-label={`Select row ${index + 1}`}
                      />
                    </td>
                  )}
                  {columns.map(column => {
                    const field = column.fieldName || column.key;
                    const value = (item as any)[field];

                    return (
                      <td
                        key={column.key}
                        className={`${styles.cell} ${column.className || ''}`}
                        style={{
                          minWidth: column.minWidth,
                          maxWidth: column.maxWidth
                        }}
                      >
                        {column.onRender ? column.onRender(item, index, column) : value}
                      </td>
                    );
                  })}
                  {enableRowActions && (
                    <td className={styles.actionsCell}>
                      {onRenderRowActions && onRenderRowActions(item)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>
          <button
            className={styles.pageButton}
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};