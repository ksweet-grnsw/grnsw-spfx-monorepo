import * as React from 'react';
import styles from './PrintView.module.scss';
import { IMeeting, IRace, IContestant } from '../../models/IRaceData';

export interface PrintViewProps {
  data: any[];
  type: 'meetings' | 'races' | 'contestants' | 'custom';
  title?: string;
  subtitle?: string;
  columns?: Array<{
    key: string;
    label: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    format?: (value: any) => string;
  }>;
  groupBy?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showPageNumbers?: boolean;
  orientation?: 'portrait' | 'landscape';
  onPrint?: () => void;
  onClose?: () => void;
}

/**
 * Print-friendly view component following SOLID principles
 */
export const PrintView: React.FC<PrintViewProps> = ({
  data,
  type,
  title,
  subtitle,
  columns,
  groupBy,
  showHeader = true,
  showFooter = true,
  showPageNumbers = true,
  orientation = 'portrait',
  onPrint,
  onClose
}) => {
  const printRef = React.useRef<HTMLDivElement>(null);

  // Auto-generate columns based on type if not provided
  const printColumns = React.useMemo(() => {
    if (columns) return columns;
    
    switch (type) {
      case 'meetings':
        return [
          { key: 'cr4cc_trackname', label: 'Track', width: '20%' },
          { key: 'cr4cc_meetingdate', label: 'Date', width: '15%', format: formatDate },
          { key: 'cr4cc_timeslot', label: 'Time Slot', width: '15%' },
          { key: 'cr4cc_authority', label: 'Authority', width: '15%' },
          { key: 'cr4cc_type', label: 'Type', width: '15%' },
          { key: 'raceCount', label: 'Races', width: '10%', align: 'center' as const },
          { key: 'cr4cc_status', label: 'Status', width: '10%' }
        ];
      
      case 'races':
        return [
          { key: 'cr616_racenumber', label: 'Race #', width: '10%', align: 'center' as const },
          { key: 'cr616_racename', label: 'Name', width: '25%' },
          { key: 'cr616_distance', label: 'Distance', width: '15%', format: (v: number) => `${v}m` },
          { key: 'cr616_racegrading', label: 'Grade', width: '15%' },
          { key: 'cr616_starttime', label: 'Start Time', width: '15%', format: formatTime },
          { key: 'cr616_numberofcontestants', label: 'Field', width: '10%', align: 'center' as const },
          { key: 'cr616_prize1', label: 'Prize', width: '10%', format: formatCurrency }
        ];
      
      case 'contestants':
        return [
          { key: 'cr616_rugnumber', label: 'Box', width: '8%', align: 'center' as const },
          { key: 'cr616_greyhoundname', label: 'Greyhound', width: '20%' },
          { key: 'cr616_trainername', label: 'Trainer', width: '18%' },
          { key: 'cr616_placement', label: 'Place', width: '10%', align: 'center' as const },
          { key: 'cr616_margin', label: 'Margin', width: '12%', format: formatMargin },
          { key: 'cr616_finishtime', label: 'Time', width: '12%', format: formatTime },
          { key: 'cr616_weight', label: 'Weight', width: '10%', format: (v: number) => `${v}kg` },
          { key: 'cr616_prizemoney', label: 'Prize', width: '10%', format: formatCurrency }
        ];
      
      default:
        return Object.keys(data[0] || {}).map(key => ({
          key,
          label: key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
          width: 'auto'
        }));
    }
  }, [type, columns, data]);

  // Group data if groupBy is specified
  const groupedData = React.useMemo(() => {
    if (!groupBy || !data.length) return { '': data };
    
    return data.reduce((groups, item) => {
      const groupKey = item[groupBy] || 'Other';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, any[]>);
  }, [data, groupBy]);

  // Handle print
  const handlePrint = React.useCallback(() => {
    if (onPrint) onPrint();
    window.print();
  }, [onPrint]);

  // Format helpers
  function formatDate(value: string | Date): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function formatTime(value: string | Date): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatCurrency(value: number): string {
    if (!value) return '-';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(value);
  }

  function formatMargin(value: number): string {
    if (!value) return '-';
    return value.toFixed(2);
  }

  return (
    <div className={`${styles.printView} ${styles[orientation]}`}>
      {/* Print Controls (hidden in print) */}
      <div className={styles.printControls}>
        <button onClick={handlePrint} className={styles.printButton}>
          🖨️ Print
        </button>
        <button onClick={onClose} className={styles.closeButton}>
          ✕ Close
        </button>
      </div>

      {/* Print Content */}
      <div ref={printRef} className={styles.printContent}>
        {showHeader && (
          <div className={styles.printHeader}>
            <div className={styles.logo}>GRNSW</div>
            <div className={styles.headerText}>
              {title && <h1>{title}</h1>}
              {subtitle && <p>{subtitle}</p>}
              <p className={styles.printDate}>
                Printed: {new Date().toLocaleString('en-AU')}
              </p>
            </div>
          </div>
        )}

        {/* Data Tables */}
        {Object.entries(groupedData).map(([groupName, groupData]) => (
          <div key={groupName} className={styles.printGroup}>
            {groupBy && groupName && (
              <h2 className={styles.groupTitle}>{groupName}</h2>
            )}
            
            <table className={styles.printTable}>
              <thead>
                <tr>
                  {printColumns.map(col => (
                    <th
                      key={col.key}
                      style={{ 
                        width: col.width,
                        textAlign: col.align || 'left'
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? styles.evenRow : ''}>
                    {printColumns.map(col => (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align || 'left' }}
                      >
                        {col.format 
                          ? col.format(item[col.key])
                          : item[col.key] || '-'
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {showFooter && (
          <div className={styles.printFooter}>
            <div className={styles.footerContent}>
              <p>© {new Date().getFullYear()} Greyhound Racing NSW</p>
              <p>Total Records: {data.length}</p>
              {showPageNumbers && (
                <p className={styles.pageNumber}>Page <span className={styles.currentPage}></span></p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Hook to open print preview
 */
export const usePrintPreview = () => {
  const [isPrintOpen, setIsPrintOpen] = React.useState(false);
  const [printData, setPrintData] = React.useState<any>(null);

  const openPrintPreview = React.useCallback((data: any, options?: Partial<PrintViewProps>) => {
    setPrintData({ data, ...options });
    setIsPrintOpen(true);
  }, []);

  const closePrintPreview = React.useCallback(() => {
    setIsPrintOpen(false);
    setPrintData(null);
  }, []);

  return {
    isPrintOpen,
    printData,
    openPrintPreview,
    closePrintPreview
  };
};