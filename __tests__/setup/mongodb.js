const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup MongoDB Memory Server
const setupDatabase = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set the MongoDB URI to the in-memory database
  process.env.MONGODB_URI = mongoUri;
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
  
  console.log(`MongoDB Memory Server running at ${mongoUri}`);
};

// Tear down MongoDB Memory Server
const teardownDatabase = async () => {
  if (mongoose.connection) {
    await mongoose.connection.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('MongoDB Memory Server stopped');
};

// Clear all collections in MongoDB
const clearDatabase = async () => {
  if (!mongoose.connection) {
    return;
  }
  
  const collections = await mongoose.connection.db.collections();
  
  for (const collection of collections) {
    await collection.deleteMany({});
  }
  
  console.log('All collections cleared');
};

module.exports = {
  setupDatabase,
  teardownDatabase,
  clearDatabase
}; 