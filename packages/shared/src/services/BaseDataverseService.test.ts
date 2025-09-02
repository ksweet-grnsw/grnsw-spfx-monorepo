import { WebPartContext } from '@microsoft/sp-webpart-base';
import { BaseDataverseService, IDataverseConfig } from './BaseDataverseService';
import { AuthService } from './AuthService';

// Mock the AuthService
jest.mock('./AuthService');

// Concrete implementation for testing
class TestDataverseService extends BaseDataverseService<any> {
  protected tableName = 'test_table';
  
  constructor(context: WebPartContext, config: IDataverseConfig) {
    super(context, config);
  }

  // Expose protected method for testing
  public buildQueryStringTest(options: any): string {
    return this.buildQueryString(options);
  }
}

describe('BaseDataverseService', () => {
  let service: TestDataverseService;
  let mockContext: WebPartContext;
  let mockConfig: IDataverseConfig;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    mockContext = {} as WebPartContext;
    mockConfig = {
      environment: 'https://test.crm.dynamics.com',
      apiVersion: 'v9.1'
    };

    // Setup AuthService mock
    mockAuthService = {
      authenticateToDataverse: jest.fn().mockResolvedValue('mock-token'),
      getHeaders: jest.fn().mockReturnValue(new Headers({
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      }))
    } as any;

    (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

    service = new TestDataverseService(mockContext, mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildQueryString', () => {
    it('should build empty query string for empty options', () => {
      const result = service.buildQueryStringTest({});
      expect(result).toBe('');
    });

    it('should build query string with select', () => {
      const result = service.buildQueryStringTest({
        select: ['field1', 'field2']
      });
      expect(result).toBe('?$select=field1,field2');
    });

    it('should build query string with filter', () => {
      const result = service.buildQueryStringTest({
        filter: "name eq 'test'"
      });
      expect(result).toBe("?$filter=name eq 'test'");
    });

    it('should build query string with multiple options', () => {
      const result = service.buildQueryStringTest({
        select: ['field1', 'field2'],
        filter: "name eq 'test'",
        orderBy: 'createdon desc',
        top: 10
      });
      expect(result).toBe("?$select=field1,field2&$filter=name eq 'test'&$orderby=createdon desc&$top=10");
    });

    it('should build query string with expand', () => {
      const result = service.buildQueryStringTest({
        expand: ['related1', 'related2']
      });
      expect(result).toBe('?$expand=related1,related2');
    });
  });

  describe('getAll', () => {
    beforeEach(() => {
      // Mock fetch globally
      (global as any).fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully fetch all records', async () => {
      const mockResponse = {
        value: [{ id: '1', name: 'Test 1' }, { id: '2', name: 'Test 2' }]
      };

      ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.getAll();

      expect(mockAuthService.authenticateToDataverse).toHaveBeenCalledWith(mockConfig.environment);
      expect(mockAuthService.getHeaders).toHaveBeenCalledWith('mock-token');
      expect((global as any).fetch).toHaveBeenCalledWith(
        'https://test.crm.dynamics.com/api/data/v9.1/test_table',
        {
          method: 'GET',
          headers: expect.any(Headers)
        }
      );
      expect(result).toEqual(mockResponse.value);
    });

    it('should handle fetch errors', async () => {
      ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Resource not found')
      });

      await expect(service.getAll()).rejects.toThrow(
        'Error fetching data from test_table: 404 Not Found - Resource not found'
      );
    });

    it('should handle network errors', async () => {
      ((global as any).fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getAll()).rejects.toThrow('Network error');
    });
  });

  describe('getById', () => {
    beforeEach(() => {
      (global as any).fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully fetch record by ID', async () => {
      const mockRecord = { id: '123', name: 'Test Record' };

      ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecord)
      });

      const result = await service.getById('123');

      expect((global as any).fetch).toHaveBeenCalledWith(
        'https://test.crm.dynamics.com/api/data/v9.1/test_table(123)',
        {
          method: 'GET',
          headers: expect.any(Headers)
        }
      );
      expect(result).toEqual(mockRecord);
    });

    it('should handle record not found', async () => {
      ((global as any).fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(service.getById('999')).rejects.toThrow(
        'Error fetching record 999 from test_table: Not Found'
      );
    });
  });
});