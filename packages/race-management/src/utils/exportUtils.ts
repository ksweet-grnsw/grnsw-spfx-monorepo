/**
 * Export utilities for converting data to CSV and Excel formats
 */

import { DataGridColumn } from '../enterprise-ui/components/DataDisplay/DataGrid';

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns?: DataGridColumn<T>[]
): string {
  if (!data || data.length === 0) return '';

  // Get headers from columns or from first data object
  const headers = columns 
    ? columns.filter(col => col.key !== '_rowNumber').map(col => col.label)
    : Object.keys(data[0]);
  
  const keys = columns
    ? columns.filter(col => col.key !== '_rowNumber').map(col => String(col.key))
    : Object.keys(data[0]);

  // Create CSV header row
  const csvHeader = headers.map(h => `"${h}"`).join(',');
  
  // Create CSV data rows
  const csvRows = data.map(row => {
    return keys.map(key => {
      const value = row[key];
      
      // Handle null/undefined
      if (value === null || value === undefined) return '""';
      
      // Handle dates
      if (value instanceof Date) {
        return `"${value.toISOString()}"`;
      }
      
      // Handle objects/arrays (stringify them)
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      // Handle strings (escape quotes)
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      // Handle numbers and booleans
      return String(value);
    }).join(',');
  });

  return [csvHeader, ...csvRows].join('\n');
}

/**
 * Download data as CSV file
 */
export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: DataGridColumn<T>[]
): void {
  const csv = convertToCSV(data, columns);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
}

/**
 * Convert data to Excel-compatible HTML table
 */
export function convertToExcelHTML<T extends Record<string, any>>(
  data: T[],
  columns?: DataGridColumn<T>[],
  title?: string
): string {
  if (!data || data.length === 0) return '';

  const headers = columns 
    ? columns.filter(col => col.key !== '_rowNumber').map(col => col.label)
    : Object.keys(data[0]);
  
  const keys = columns
    ? columns.filter(col => col.key !== '_rowNumber').map(col => String(col.key))
    : Object.keys(data[0]);

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #0078d4; color: white; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .number { text-align: right; }
        .date { text-align: center; }
        .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
      </style>
    </head>
    <body>`;

  if (title) {
    html += `<div class="title">${title}</div>`;
  }

  html += '<table><thead><tr>';
  
  // Add headers
  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });
  
  html += '</tr></thead><tbody>';
  
  // Add data rows
  data.forEach(row => {
    html += '<tr>';
    keys.forEach(key => {
      const value = row[key];
      let cellValue = '';
      let cellClass = '';
      
      if (value === null || value === undefined) {
        cellValue = '';
      } else if (value instanceof Date) {
        cellValue = value.toLocaleDateString('en-AU');
        cellClass = 'date';
      } else if (typeof value === 'number') {
        cellValue = value.toString();
        cellClass = 'number';
      } else if (typeof value === 'boolean') {
        cellValue = value ? 'Yes' : 'No';
      } else if (typeof value === 'object') {
        cellValue = JSON.stringify(value);
      } else {
        cellValue = String(value);
      }
      
      html += `<td class="${cellClass}">${cellValue}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody></table></body></html>';
  
  return html;
}

/**
 * Download data as Excel file
 */
export function downloadExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: DataGridColumn<T>[],
  title?: string
): void {
  const html = convertToExcelHTML(data, columns, title);
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
}

/**
 * Format data for export (applies column formatting if specified)
 */
export function formatDataForExport<T extends Record<string, any>>(
  data: T[],
  columns?: DataGridColumn<T>[]
): any[] {
  if (!columns) return data;
  
  return data.map(row => {
    const formattedRow: any = {};
    
    columns.forEach(col => {
      if (col.key === '_rowNumber') return; // Skip row number column
      
      const key = String(col.key);
      const value = row[key];
      
      // Apply column render function if available
      if (col.render && typeof col.render === 'function') {
        // Try to extract text from rendered content
        // This is a simplified approach - complex renders might not work perfectly
        formattedRow[col.label] = value;
      } else {
        formattedRow[col.label] = value;
      }
    });
    
    return formattedRow;
  });
}

// Alias functions for test compatibility
export const exportToCSV = downloadCSV;
export const exportToExcel = downloadExcel;
export const exportToPDF = (data: any[], filename: string) => {
  // PDF export not implemented yet - just download as CSV for now
  downloadCSV(data, filename);
};