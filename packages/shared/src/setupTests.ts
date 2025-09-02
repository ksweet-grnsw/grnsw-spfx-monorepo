// Jest setup file for shared package tests

// Mock console methods that are used frequently in services
global.console = {
  ...console,
  // Comment out console.log during tests unless we want to see them
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch globally for all tests
(global as any).fetch = jest.fn();

// Setup basic Headers mock
(global as any).Headers = class Headers {
  private headers: Record<string, string> = {};

  constructor(init?: Record<string, string>) {
    if (init) {
      Object.assign(this.headers, init);
    }
  }

  append(name: string, value: string): void {
    this.headers[name.toLowerCase()] = value;
  }

  get(name: string): string | null {
    return this.headers[name.toLowerCase()] || null;
  }

  has(name: string): boolean {
    return name.toLowerCase() in this.headers;
  }

  set(name: string, value: string): void {
    this.headers[name.toLowerCase()] = value;
  }
} as any;

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});