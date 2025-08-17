import * as React from 'react';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { DataGridProps, DataGridColumn } from './DataGrid.types';
import styles from './VirtualDataGrid.module.scss';

interface VirtualScrollState {
  scrollTop: number;
  startIndex: number;
  endIndex: number;
  visibleItems: number;
}

export const VirtualDataGrid = <T extends Record<string, any>>({
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
  
  onRowClick,
  onRowDoubleClick,
  
  emptyStateTitle = 'No data available',
  emptyStateMessage = 'There are no items to display.',
  emptyStateIcon,
  emptyStateAction,
  
  loadingMessage = 'Loading data...',
  
  errorTitle = 'Error loading data',
  errorRetryText = 'Try again',
  onRetry,
  
  ariaLabel,
  ariaDescribedBy,
  
  className = '',
  tableClassName = '',
  headerClassName = '',
  bodyClassName = '',
  
  stickyHeader = true
}: DataGridProps<T>): JSX.Element => {
  // Virtual scrolling configuration
  const ROW_HEIGHT = density === 'compact' ? 32 : density === 'comfortable' ? 48 : 40;
  const OVERSCAN = 5; // Number of rows to render outside viewport
  const VIEWPORT_HEIGHT = 600; // Default viewport height
  
  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>();
  
  // State management
  const [sortField, setSortField] = useState<keyof T | string | null>(defaultSort?.field || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(defaultSort?.direction || null);
  const [selectedItemsSet, setSelectedItemsSet] = useState<Set<string | number>>(
    new Set(selectedItems?.map((item, index) => getRowKey?.(item, index) || index))
  );
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Virtual scroll state
  const [virtualState, setVirtualState] = useState<VirtualScrollState>({
    scrollTop: 0,
    startIndex: 0,
    endIndex: Math.min(Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2, data.length),
    visibleItems: Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT)
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
    
    if (sortField === field) {
      direction = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    setSortField(field);
    setSortDirection(direction);
    
    if (onSort) {
      onSort(field, direction);
    }
  }, [sortField, sortDirection, sortable, onSort]);
  
  // Handle row selection
  const handleRowSelection = useCallback((item: T, index: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    if (!selectable) return;
    
    const key = getItemKey(item, index);
    const newSelectedItems = new Set(selectedItemsSet);
    
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
    
    setSelectedItemsSet(newSelectedItems);
    
    if (onSelectionChange) {
      const selectedData = data.filter((item, idx) => 
        newSelectedItems.has(getItemKey(item, idx))
      );
      onSelectionChange(selectedData);
    }
  }, [selectable, selectedItemsSet, data, getItemKey, onSelectionChange]);
  
  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!selectable || selectable === 'single') return;
    
    const allKeys = data.map((item, index) => getItemKey(item, index));
    const newSelectedItems = selectedItemsSet.size === allKeys.length
      ? new Set<string | number>()
      : new Set(allKeys);
    
    setSelectedItemsSet(newSelectedItems);
    
    if (onSelectionChange) {
      const selectedData = newSelectedItems.size > 0 ? [...data] : [];
      onSelectionChange(selectedData);
    }
  }, [selectable, data, selectedItemsSet, getItemKey, onSelectionChange]);
  
  // Process and sort data
  const processedData = useMemo(() => {
    let result = [...data];
    
    // Apply sorting
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        const aValue = a[sortField as keyof T];
        const bValue = b[sortField as keyof T];
        
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return result;
  }, [data, sortField, sortDirection]);
  
  // Calculate virtual window
  const calculateVirtualWindow = useCallback((scrollTop: number, containerHeight: number) => {
    const visibleItems = Math.ceil(containerHeight / ROW_HEIGHT);
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const endIndex = Math.min(
      processedData.length,
      Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN
    );
    
    return {
      scrollTop,
      startIndex,
      endIndex,
      visibleItems
    };
  }, [processedData.length, ROW_HEIGHT]);
  
  // Handle scroll with debouncing
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const containerHeight = target.clientHeight;
    
    // Immediate update for virtual window
    const newState = calculateVirtualWindow(scrollTop, containerHeight);
    setVirtualState(newState);
    
    // Debounced scrolling indicator
    const now = Date.now();
    if (now - lastScrollTime.current > 150) {
      setIsScrolling(true);
    }
    lastScrollTime.current = now;
    
    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    // Set scrolling to false after scroll ends
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [calculateVirtualWindow]);
  
  // Initialize viewport dimensions
  useEffect(() => {
    if (scrollContainerRef.current) {
      const containerHeight = scrollContainerRef.current.clientHeight || VIEWPORT_HEIGHT;
      const newState = calculateVirtualWindow(0, containerHeight);
      setVirtualState(newState);
    }
  }, [calculateVirtualWindow, processedData.length]);
  
  // Get visible data slice
  const visibleData = useMemo(() => {
    return processedData.slice(virtualState.startIndex, virtualState.endIndex);
  }, [processedData, virtualState.startIndex, virtualState.endIndex]);
  
  // Calculate total height for scrollbar
  const totalHeight = processedData.length * ROW_HEIGHT;
  
  // Render loading state
  if (loading) {
    return (
      <div className={`${styles.virtualDataGrid} ${styles[`theme-${theme}`]} ${className}`}>
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
      <div className={`${styles.virtualDataGrid} ${styles[`theme-${theme}`]} ${className}`}>
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
      <div className={`${styles.virtualDataGrid} ${styles[`theme-${theme}`]} ${className}`}>
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
        ${styles.virtualDataGrid} 
        ${styles[`theme-${theme}`]} 
        ${styles[`density-${density}`]}
        ${striped ? styles.striped : ''}
        ${bordered ? styles.bordered : ''}
        ${hoverable ? styles.hoverable : ''}
        ${isScrolling ? styles.scrolling : ''}
        ${className}
      `}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {/* Performance indicator */}
      {data.length > 1000 && (
        <div className={styles.performanceIndicator}>
          <span className={styles.badge}>Virtual Scrolling Active</span>
          <span className={styles.info}>
            Rendering {virtualState.endIndex - virtualState.startIndex} of {data.length} rows
          </span>
        </div>
      )}
      
      {/* Sticky header */}
      {stickyHeader && (
        <div className={`${styles.headerWrapper} ${headerClassName}`}>
          <table className={styles.headerTable}>
            <thead>
              <tr>
                {selectable && selectable !== 'single' && (
                  <th className={styles.checkboxCell} style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedItemsSet.size === data.length && data.length > 0}
                      onChange={handleSelectAll}
                      aria-label="Select all rows"
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = selectedItemsSet.size > 0 && selectedItemsSet.size < data.length;
                        }
                      }}
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`
                      ${column.sortable && sortable ? styles.sortable : ''}
                      ${sortField === column.key ? styles.sorted : ''}
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
                          {sortField === column.key ? (
                            sortDirection === 'asc' ? '↑' : '↓'
                          ) : (
                            <span className={styles.sortPlaceholder}>⇅</span>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
      )}
      
      {/* Virtual scroll container */}
      <div 
        ref={scrollContainerRef}
        className={styles.scrollContainer}
        onScroll={handleScroll}
        style={{ height: `${VIEWPORT_HEIGHT}px` }}
      >
        {/* Total height spacer for proper scrollbar */}
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          {/* Viewport with visible rows */}
          <div 
            ref={viewportRef}
            className={styles.viewport}
            style={{
              transform: `translateY(${virtualState.startIndex * ROW_HEIGHT}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            <table className={`${styles.table} ${tableClassName}`}>
              <tbody className={`${styles.body} ${bodyClassName}`}>
                {visibleData.map((item, visibleIndex) => {
                  const actualIndex = virtualState.startIndex + visibleIndex;
                  const key = getItemKey(item, actualIndex);
                  const isSelected = selectedItemsSet.has(key);
                  
                  return (
                    <tr
                      key={key}
                      className={`
                        ${styles.row}
                        ${isSelected ? styles.selected : ''}
                        ${onRowClick ? styles.clickable : ''}
                        ${actualIndex % 2 === 1 && striped ? styles.striped : ''}
                      `}
                      style={{ height: `${ROW_HEIGHT}px` }}
                      onClick={() => onRowClick?.(item, actualIndex)}
                      onDoubleClick={() => onRowDoubleClick?.(item, actualIndex)}
                    >
                      {selectable && (
                        <td 
                          className={styles.checkboxCell}
                          style={{ width: '40px' }}
                          onClick={(e) => handleRowSelection(item, actualIndex, e)}
                        >
                          <input
                            type={selectable === 'single' ? 'radio' : 'checkbox'}
                            checked={isSelected}
                            onChange={() => {}}
                            aria-label={`Select row ${actualIndex + 1}`}
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className={`
                            ${styles.cell}
                            ${column.cellClassName || ''}
                          `}
                          style={{
                            width: column.width,
                            minWidth: column.minWidth,
                            maxWidth: column.maxWidth,
                            textAlign: column.align
                          }}
                        >
                          {column.render 
                            ? column.render(item[column.key as keyof T], item, actualIndex)
                            : item[column.key as keyof T]
                          }
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Footer with row count */}
      <div className={styles.footer}>
        <div className={styles.rowInfo}>
          Showing {virtualState.startIndex + 1}-{Math.min(virtualState.endIndex, data.length)} of {data.length} rows
          {selectedItemsSet.size > 0 && (
            <span className={styles.selectionInfo}>
              • {selectedItemsSet.size} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Export types
export type { DataGridColumn, DataGridProps } from './DataGrid.types';