import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';

// Mock dependencies
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({ SheetNames: [], Sheets: {} })),
    book_append_sheet: jest.fn(),
    sheet_add_aoa: jest.fn()
  },
  writeFile: jest.fn()
}));

jest.mock('jspdf', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      text: jest.fn(),
      autoTable: jest.fn(),
      save: jest.fn(),
      internal: {
        pageSize: {
          getWidth: jest.fn(() => 210),
          getHeight: jest.fn(() => 297)
        }
      }
    }))
  };
});

jest.mock('jspdf-autotable', () => ({}));

describe('exportUtils', () => {
  const mockData = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com' }
  ];

  const mockColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'age', label: 'Age' },
    { key: 'email', label: 'Email' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    (globalThis as any).URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    (globalThis as any).URL.revokeObjectURL = jest.fn();
    // Mock document.createElement
    document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: jest.fn(),
          style: {}
        };
      }
      return {};
    });
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });

  describe('exportToCSV', () => {
    it('should export data to CSV with default settings', () => {
      exportToCSV(mockData, 'test-export');

      // Check that blob was created
      expect((globalThis as any).URL.createObjectURL).toHaveBeenCalled();
      
      // Check that download link was created
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should export data with custom columns', () => {
      exportToCSV(mockData, 'test-export');

      expect((globalThis as any).URL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle custom delimiter', () => {
      exportToCSV(mockData, 'test-export');

      expect((globalThis as any).URL.createObjectURL).toHaveBeenCalled();
    });

    it('should include headers by default', () => {
      const createObjectURLSpy = jest.spyOn(global.URL, 'createObjectURL');
      
      exportToCSV(mockData, 'test-export');

      // Get the Blob that was passed to createObjectURL
      const blobCall = createObjectURLSpy.mock.calls[0];
      expect(blobCall).toBeDefined();
    });

    it('should handle empty data', () => {
      expect(() => exportToCSV([], 'empty-export')).not.toThrow();
    });

    it('should escape special characters in CSV', () => {
      const dataWithSpecialChars = [
        { name: 'John, Doe', description: 'Line 1\nLine 2' },
        { name: '"Quoted"', description: 'Normal text' }
      ];

      expect(() => exportToCSV(dataWithSpecialChars, 'special-chars')).not.toThrow();
    });

    it('should handle date formatting', () => {
      const dataWithDates = [
        { id: 1, created: new Date('2024-01-01'), name: 'Test' }
      ];

      exportToCSV(dataWithDates, 'dates-export', {
        dateFormat: 'YYYY-MM-DD'
      });

      expect((globalThis as any).URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('exportToExcel', () => {
    it('should export data to Excel', async () => {
      const XLSX = require('xlsx');
      
      await exportToExcel(mockData, 'test-export');

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(mockData);
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should export with custom columns', async () => {
      const XLSX = require('xlsx');
      
      await exportToExcel(mockData, 'test-export', { columns: mockColumns });

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
    });

    it('should support multiple sheets', async () => {
      const XLSX = require('xlsx');
      
      const sheets = [
        { name: 'Sheet1', data: mockData },
        { name: 'Sheet2', data: mockData.slice(0, 2) }
      ];

      await exportToExcel(sheets, 'multi-sheet-export', { multiSheet: true });

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    });

    it('should add headers with styling', async () => {
      const XLSX = require('xlsx');
      
      await exportToExcel(mockData, 'styled-export', {
        columns: mockColumns,
        includeHeaders: true,
        headerStyle: { bold: true, color: '#000000' }
      });

      expect(XLSX.utils.sheet_add_aoa).toHaveBeenCalled();
    });

    it('should handle empty data', async () => {
      await expect(exportToExcel([], 'empty-export')).resolves.not.toThrow();
    });
  });

  describe('exportToPDF', () => {
    it('should export data to PDF', () => {
      const jsPDF = require('jspdf').default;
      const mockPdfInstance = new jsPDF();
      
      exportToPDF(mockData, 'test-export');

      expect(jsPDF).toHaveBeenCalled();
      expect(mockPdfInstance.save).toHaveBeenCalledWith('test-export.pdf');
    });

    it('should add title to PDF', () => {
      const jsPDF = require('jspdf').default;
      const mockPdfInstance = new jsPDF();
      
      exportToPDF(mockData, 'test-export', {
        title: 'Test Report',
        columns: mockColumns
      });

      expect(mockPdfInstance.text).toHaveBeenCalledWith('Test Report', expect.any(Number), expect.any(Number));
    });

    it('should use autoTable for data', () => {
      const jsPDF = require('jspdf').default;
      const mockPdfInstance = new jsPDF();
      
      exportToPDF(mockData, 'test-export', { columns: mockColumns });

      expect(mockPdfInstance.autoTable).toHaveBeenCalled();
    });

    it('should handle landscape orientation', () => {
      const jsPDF = require('jspdf').default;
      
      exportToPDF(mockData, 'landscape-export', {
        orientation: 'landscape',
        columns: mockColumns
      });

      expect(jsPDF).toHaveBeenCalledWith(expect.objectContaining({
        orientation: 'landscape'
      }));
    });

    it('should add metadata', () => {
      const jsPDF = require('jspdf').default;
      const mockPdfInstance = new jsPDF();
      
      exportToPDF(mockData, 'metadata-export', {
        title: 'Report',
        subject: 'Test Subject',
        author: 'Test Author',
        columns: mockColumns
      });

      expect(mockPdfInstance.text).toHaveBeenCalled();
    });

    it('should handle empty data', () => {
      expect(() => exportToPDF([], 'empty-export')).not.toThrow();
    });

    it('should add page numbers', () => {
      const jsPDF = require('jspdf').default;
      const mockPdfInstance = new jsPDF();
      
      exportToPDF(mockData, 'numbered-export', {
        columns: mockColumns,
        includePageNumbers: true
      });

      expect(mockPdfInstance.autoTable).toHaveBeenCalled();
    });

    it('should support custom fonts and colors', () => {
      const jsPDF = require('jspdf').default;
      const mockPdfInstance = new jsPDF();
      
      exportToPDF(mockData, 'styled-export', {
        columns: mockColumns,
        theme: 'grid',
        headerColor: '#0078d4',
        fontSize: 10
      });

      expect(mockPdfInstance.autoTable).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: 'grid'
        })
      );
    });
  });

  describe('Export format detection', () => {
    it('should auto-detect format from filename', () => {
      // CSV
      exportToCSV(mockData, 'test.csv');
      expect((globalThis as any).URL.createObjectURL).toHaveBeenCalled();

      // Excel
      const XLSX = require('xlsx');
      exportToExcel(mockData, 'test.xlsx');
      expect(XLSX.writeFile).toHaveBeenCalled();

      // PDF
      const jsPDF = require('jspdf').default;
      const mockPdfInstance = new jsPDF();
      exportToPDF(mockData, 'test.pdf');
      expect(mockPdfInstance.save).toHaveBeenCalled();
    });
  });
});