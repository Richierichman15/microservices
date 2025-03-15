// Set test environment variables
process.env.NODE_ENV = 'test';

// Increase timeout for tests as database operations might take time
jest.setTimeout(30000);

// Silence console output during tests
if (process.env.DEBUG !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
} 