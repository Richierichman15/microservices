module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/e2e/**/*.js'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/setup/'],
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setup/jest.setup.js'
  ],
  globalSetup: '<rootDir>/__tests__/setup/globalSetup.js',
  globalTeardown: '<rootDir>/__tests__/setup/globalTeardown.js',
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  // Increase timeout for e2e tests
  testTimeout: 60000
}; 