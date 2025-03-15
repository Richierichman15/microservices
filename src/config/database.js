const mongoose = require('mongoose');
const config = require('./config');
const logger = require('../utils/logger');
const { database: dbDebug, debugObject } = require('../utils/debug');

// Set mongoose options
mongoose.set('strictQuery', true);

// Debug mongoose operations in development
if (config.env === 'development') {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    dbDebug(`${collectionName}.${method}`, { query, doc });
  });
}

const connectDB = async () => {
  try {
    dbDebug('Attempting to connect to MongoDB...');
    dbDebug(`MongoDB URI: ${config.mongodb.uri.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://***:***@')}`);
    
    const conn = await mongoose.connect(config.mongodb.uri, {
      // Options are no longer needed in mongoose 6+
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    dbDebug(`MongoDB Connected to host: ${conn.connection.host}, database: ${conn.connection.db.databaseName}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    dbDebug('MongoDB connection error:', error);
    
    if (config.env === 'development') {
      logger.warn('Make sure MongoDB is running or update the MONGODB_URI in .env with a valid connection string.');
      dbDebug('Connection troubleshooting tips:');
      dbDebug('1. Check if MongoDB is running');
      dbDebug('2. Verify connection string in .env');
      dbDebug('3. Check network connectivity to database');
      dbDebug('4. Verify authentication credentials');
    }
    
    // In development mode, don't exit - just log the error
    if (config.env !== 'development') {
      process.exit(1);
    }
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
  dbDebug('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
  dbDebug('MongoDB connection error:', err);
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
  dbDebug('MongoDB reconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
  dbDebug('Application termination signal received. Closing MongoDB connection...');
  await mongoose.connection.close();
  logger.info('MongoDB connection closed due to app termination');
  dbDebug('MongoDB connection closed successfully');
  process.exit(0);
});

module.exports = connectDB; 