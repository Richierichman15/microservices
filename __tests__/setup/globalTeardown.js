const { teardownDatabase } = require('./mongodb');

module.exports = async () => {
  // Tear down in-memory MongoDB
  if (!process.env.SKIP_DB_SETUP) {
    await teardownDatabase();
  }
  
  console.log('Global teardown complete');
}; 