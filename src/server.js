const app = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const { server: serverDebug, debugObject } = require('./utils/debug');

// Handling uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err);
  serverDebug('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

// Start server
serverDebug(`Starting server in ${config.env} mode on port ${config.port}...`);
serverDebug(`Environment variables loaded: %O`, {
  NODE_ENV: config.env,
  PORT: config.port,
  LOG_LEVEL: config.logs.level,
  MOCK_MODE: process.env.MOCK_MODE || 'false'
});

const server = app.listen(config.port, async () => {
  try {
    // Connect to MongoDB (unless in mock mode)
    if (process.env.MOCK_MODE !== 'true') {
      serverDebug('Connecting to MongoDB...');
      await connectDB();
    } else {
      logger.info('MOCK MODE: Skipping MongoDB connection');
      serverDebug('Running in MOCK MODE - MongoDB connection skipped');
    }
    
    logger.info(`Server running in ${config.env} mode on port ${config.port}`);
    serverDebug(`Server successfully started in ${config.env} mode on port ${config.port}`);
    serverDebug(`API available at http://localhost:${config.port}/api`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    serverDebug('Failed to start server:', error);
    process.exit(1);
  }
});

// Handling unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err);
  serverDebug('UNHANDLED REJECTION:', err);
  
  // Graceful shutdown
  server.close(() => {
    process.exit(1);
  });
});

// Gracefully handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  serverDebug('SIGTERM signal received. Shutting down gracefully...');
  server.close(() => {
    logger.info('💥 Process terminated!');
    serverDebug('Server closed successfully');
  });
}); 