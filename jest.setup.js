// Global test setup for Jest

// Mock Next.js environment variables
process.env.NEXT_PUBLIC_TIMEBACK_API_URL = 'http://localhost:8080';
process.env.NODE_ENV = 'test';

// Global test utilities
global.expect.extend({
  toBeValidTimestamp(received) {
    const timestamp = new Date(received);
    const pass = !isNaN(timestamp.getTime());
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid timestamp`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid timestamp`,
        pass: false,
      };
    }
  }
});

// Suppress console output during tests unless explicitly testing logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Only suppress console if not explicitly captured in tests
  if (!global.consoleCaptured) {
    console.log = jest.fn();
    console.error = jest.fn();
  }
});

afterEach(() => {
  if (!global.consoleCaptured) {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  }
});
