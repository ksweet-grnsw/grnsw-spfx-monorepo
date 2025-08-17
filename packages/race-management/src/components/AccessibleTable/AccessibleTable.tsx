import * as React from 'react';
import styles from './AccessibleTable.module.scss';
import { useAnnounce, useRovingTabIndex } from '../../hooks/useAccessibility';

export interface AccessibleTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: T) => React.ReactNode;
  ariaLabel?: (value: any, item: T) => string;
}

export interface AccessibleTableProps<T> {
  data: T[];
  columns: AccessibleTableColumn<T>[];
  caption: string;
  summary?: string;
  selectable?: boolean;
  multiSelect?: boolean;
  onRowSelect?: (item: T) => void;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  currentSort?: { column: keyof T; direction: 'asc' | 'desc' };
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  rowKey: keyof T;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
  describedBy?: string;
}

/**
 * Fully accessible data table component
 * Implements WCAG 2.1 Level AA standards
 */
export function AccessibleTable<T extends Record<string, any>>({
  data,
  columns,
  caption,
  summary,
  selectable = false,
  multiSelect = false,
  onRowSelect,
  onSort,
  currentSort,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  rowKey,
  striped = true,
  hoverable = true,
  compact = false,
  stickyHeader = false,
  describedBy
}: AccessibleTableProps<T>) {
  const announce = useAnnounce();
  const [selectedRows, setSelectedRows] = React.useState<Set<any>>(new Set());
  const [focusedCell, setFocusedCell] = React.useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const tableRef = React.useRef<HTMLTableElement>(null);
  
  // Use roving tabindex for keyboard navigation
  const { getItemProps } = useRovingTabIndex(data);

  // Handle row selection
  const handleRowSelect = React.useCallback((item: T, index: number) => {
    if (!selectable) return;

    const key = item[rowKey];
    const newSelected = new Set(selectedRows);

    if (multiSelect) {
      if (newSelected.has(key)) {
        newSelected.delete(key);
        announce(`Row ${index + 1} deselected`);
      } else {
        newSelected.add(key);
        announce(`Row ${index + 1} selected`);
      }
      setSelectedRows(newSelected);
    } else {
      newSelected.clear();
      newSelected.add(key);
      setSelectedRows(newSelected);
      announce(`Row ${index + 1} selected`);
    }

    if (onRowSelect) {
      onRowSelect(item);
    }
  }, [selectedRows, multiSelect, selectable, rowKey, onRowSelect, announce]);

  // Handle sorting
  const handleSort = React.useCallback((column: keyof T) => {
    if (!onSort) return;

    const newDirection = 
      currentSort?.column === column && currentSort.direction === 'asc' 
        ? 'desc' 
        : 'asc';

    onSort(column, newDirection);
    announce(`Sorted by ${String(column)} ${newDirection === 'asc' ? 'ascending' : 'descending'}`);
  }, [currentSort, onSort, announce]);

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    const { row, col } = focusedCell;
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(data.length - 1, row + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newCol = Math.min(columns.length - 1, col + 1);
        break;
      case 'Home':
        e.preventDefault();
        if (e.ctrlKey) {
          newRow = 0;
          newCol = 0;
        } else {
          newCol = 0;
        }
        break;
      case 'End':
        e.preventDefault();
        if (e.ctrlKey) {
          newRow = data.length - 1;
          newCol = columns.length - 1;
        } else {
          newCol = columns.length - 1;
        }
        break;
      case 'PageUp':
        e.preventDefault();
        newRow = Math.max(0, row - 10);
        break;
      case 'PageDown':
        e.preventDefault();
        newRow = Math.min(data.length - 1, row + 10);
        break;
      case ' ':
      case 'Enter':
        if (selectable && row >= 0) {
          e.preventDefault();
          handleRowSelect(data[row], row);
        }
        break;
    }

    if (newRow !== row || newCol !== col) {
      setFocusedCell({ row: newRow, col: newCol });
      
      // Focus the cell
      const cell = tableRef.current?.querySelector(
        `[data-row="${newRow}"][data-col="${newCol}"]`
      ) as HTMLElement;
      
      if (cell) {
        cell.focus();
      }
    }
  }, [focusedCell, data, columns, selectable, handleRowSelect]);

  // Handle select all
  const handleSelectAll = React.useCallback((checked: boolean) => {
    if (!multiSelect) return;

    if (checked) {
      const allKeys = new Set(data.map(item => item[rowKey]));
      setSelectedRows(allKeys);
      announce(`All ${data.length} rows selected`);
    } else {
      setSelectedRows(new Set());
      announce('All rows deselected');
    }
  }, [data, rowKey, multiSelect, announce]);

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer} role="status" aria-live="polite">
        <div className={styles.spinner} aria-hidden="true" />
        <span className={styles.loadingText}>Loading data...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer} role="alert">
        <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
        <span className={styles.errorText}>{error}</span>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={styles.emptyContainer} role="status">
        <span className={styles.emptyIcon} aria-hidden="true">📭</span>
        <span className={styles.emptyText}>{emptyMessage}</span>
      </div>
    );
  }

  const allSelected = multiSelect && selectedRows.size === data.length;
  const someSelected = multiSelect && selectedRows.size > 0 && selectedRows.size < data.length;

  return (
    <div className={styles.tableContainer}>
      <table
        ref={tableRef}
        className={`
          ${styles.accessibleTable}
          ${striped ? styles.striped : ''}
          ${hoverable ? styles.hoverable : ''}
          ${compact ? styles.compact : ''}
          ${stickyHeader ? styles.stickyHeader : ''}
        `}
        role="table"
        aria-label={caption}
        aria-describedby={describedBy}
        onKeyDown={handleKeyDown}
      >
        <caption className={styles.caption}>
          {caption}
          {summary && <span className={styles.summary}>{summary}</span>}
        </caption>

        <thead>
          <tr role="row">
            {multiSelect && (
              <th scope="col" className={styles.selectColumn}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column, colIndex) => (
              <th
                key={String(column.key)}
                scope="col"
                style={{ width: column.width }}
                className={column.sortable ? styles.sortable : ''}
                aria-sort={
                  currentSort?.column === column.key
                    ? currentSort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                {column.sortable ? (
                  <button
                    className={styles.sortButton}
                    onClick={() => handleSort(column.key)}
                    aria-label={`Sort by ${column.label}`}
                  >
                    {column.label}
                    <span className={styles.sortIcon} aria-hidden="true">
                      {currentSort?.column === column.key ? (
                        currentSort.direction === 'asc' ? '↑' : '↓'
                      ) : '↕'}
                    </span>
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((item, rowIndex) => {
            const key = item[rowKey];
            const isSelected = selectedRows.has(key);

            return (
              <tr
                key={key}
                role="row"
                className={`
                  ${isSelected ? styles.selected : ''}
                  ${rowIndex === focusedCell.row ? styles.focused : ''}
                `}
                aria-selected={selectable ? isSelected : undefined}
                onClick={() => selectable && handleRowSelect(item, rowIndex)}
                {...(selectable ? getItemProps(rowIndex) : {})}
              >
                {multiSelect && (
                  <td className={styles.selectColumn}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleRowSelect(item, rowIndex)}
                      aria-label={`Select row ${rowIndex + 1}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((column, colIndex) => {
                  const value = item[column.key];
                  const content = column.render ? column.render(value, item) : value;
                  const ariaLabel = column.ariaLabel ? column.ariaLabel(value, item) : undefined;

                  return (
                    <td
                      key={String(column.key)}
                      data-row={rowIndex}
                      data-col={colIndex}
                      tabIndex={focusedCell.row === rowIndex && focusedCell.col === colIndex ? 0 : -1}
                      aria-label={ariaLabel}
                    >
                      {content || '-'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Screen reader only summary */}
      <div className={styles.srOnly} role="status" aria-live="polite">
        Table has {data.length} rows and {columns.length} columns.
        {selectedRows.size > 0 && ` ${selectedRows.size} rows selected.`}
      </div>
    </div>
  );
}