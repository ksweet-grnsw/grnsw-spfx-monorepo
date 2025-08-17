import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
(globalThis as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
};

// Mock ResizeObserver
(globalThis as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock IndexedDB
const indexedDB = {
  open: jest.fn(() => ({
    onsuccess: jest.fn(),
    onerror: jest.fn(),
    onupgradeneeded: jest.fn(),
    result: {
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          get: jest.fn(() => ({ onsuccess: jest.fn(), onerror: jest.fn() })),
          put: jest.fn(() => ({ onsuccess: jest.fn(), onerror: jest.fn() })),
          delete: jest.fn(() => ({ onsuccess: jest.fn(), onerror: jest.fn() })),
          clear: jest.fn(() => ({ onsuccess: jest.fn(), onerror: jest.fn() })),
          getAll: jest.fn(() => ({ onsuccess: jest.fn(), onerror: jest.fn() }))
        }))
      }))
    }
  }))
};

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: indexedDB
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock console methods to reduce noise in tests
globalThis.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock SharePoint global variables
(globalThis as any).window = {
  ...window,
  location: {
    href: 'https://test.sharepoint.com',
    origin: 'https://test.sharepoint.com',
    pathname: '/',
    search: '',
    hash: ''
  }
};

// Mock fetch
globalThis.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers(),
    status: 200,
    statusText: 'OK'
  } as Response)
);

// Mock SignalR (if used)
(globalThis as any).signalR = {
  HubConnectionBuilder: jest.fn(() => ({
    withUrl: jest.fn().mockReturnThis(),
    withAutomaticReconnect: jest.fn().mockReturnThis(),
    build: jest.fn(() => ({
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
      invoke: jest.fn().mockResolvedValue(undefined)
    }))
  }))
};