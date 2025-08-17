import { ErrorHandler, ErrorType } from '../../utils/ErrorHandler';

describe('ErrorHandler', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset logging for tests
    ErrorHandler.setLogging(false);
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('handleError', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const result = ErrorHandler.handleError(error, 'API');

      expect(result.message).toBe('Test error');
      expect(result.type).toBe(ErrorType.UnknownError); // Will be UnknownError by default
    });

    it('should handle authentication errors', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const result = ErrorHandler.handleError(error, 'AUTH');

      expect(result.type).toBe(ErrorType.AuthenticationError);
      expect(result.message).toBe('Authentication failed. Please check your credentials.');
    });

    it('should handle network errors', () => {
      const error = { name: 'NetworkError', message: 'Network failed' };
      const result = ErrorHandler.handleError(error, 'NETWORK');

      expect(result.type).toBe(ErrorType.NetworkError);
      expect(result.message).toBe('Network error. Please check your connection.');
    });

    it('should handle validation errors', () => {
      const error = { status: 400, message: 'Bad request' };
      const result = ErrorHandler.handleError(error, 'VALIDATION');

      expect(result.type).toBe(ErrorType.ValidationError);
      expect(result.message).toBe('Invalid request. Please check your input.');
    });

    it('should handle unknown error types', () => {
      const result = ErrorHandler.handleError({ custom: 'error' }, 'UNKNOWN');

      expect(result.type).toBe(ErrorType.UnknownError);
      expect(result.message).toBe('An unknown error occurred');
    });

    it('should include timestamp in error object', () => {
      const error = new Error('Test error');
      const result = ErrorHandler.handleError(error);

      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should log errors when logging is enabled', () => {
      ErrorHandler.setLogging(true);
      const error = new Error('Test error');
      
      ErrorHandler.handleError(error, 'TEST');

      expect(consoleSpy).toHaveBeenCalledWith('[TEST]', expect.objectContaining({
        message: 'Test error',
        type: ErrorType.UnknownError
      }));
    });

    it('should not log errors when logging is disabled', () => {
      ErrorHandler.setLogging(false);
      const error = new Error('Test error');
      
      ErrorHandler.handleError(error, 'TEST');

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});