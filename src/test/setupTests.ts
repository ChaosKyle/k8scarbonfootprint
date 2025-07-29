import '@testing-library/jest-dom';

// Mock Grafana runtime
jest.mock('@grafana/runtime', () => ({
  config: {
    theme2: {
      colors: {
        primary: {
          main: '#1f60c4',
        },
        secondary: {
          main: '#6e9fff',
        },
      },
    },
  },
  getBackendSrv: () => ({
    datasourceRequest: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }),
  locationService: {
    push: jest.fn(),
    replace: jest.fn(),
    getSearchObject: jest.fn(() => ({})),
  },
}));

// Mock @grafana/data
jest.mock('@grafana/data', () => ({
  ...jest.requireActual('@grafana/data'),
  getBackendSrv: jest.fn(),
}));

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

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

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Uncomment to suppress console logs during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};