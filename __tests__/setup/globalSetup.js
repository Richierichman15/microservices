const { setupDatabase } = require('./mongodb');

module.exports = async () => {
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.JWT_EXPIRATION = '1h';
  
  // Setup in-memory MongoDB for testing
  if (!process.env.SKIP_DB_SETUP) {
    await setupDatabase();
  }
  
  console.log('Global setup complete');
}; 