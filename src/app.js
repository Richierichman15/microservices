const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const config = require('./config/config');
const { errorConverter, errorHandler } = require('./middleware/error');
const requestDebug = require('./middleware/requestDebug');
const ApiError = require('./utils/ApiError');
const logger = require('./utils/logger');
const { server: serverDebug } = require('./utils/debug');

// Create Express app
const app = express();

// Debug application startup
serverDebug('Initializing Express application...');

// Set security HTTP headers
app.use(helmet());
serverDebug('Helmet middleware installed');

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));
serverDebug('Body parsers installed');

// Enable CORS
app.use(cors({
  origin: config.cors.origins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
serverDebug(`CORS configured with origins: ${config.cors.origins}`);

// Request debugging (development only)
app.use(requestDebug);

// Request logging
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined', {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }));
  serverDebug(`Morgan logging setup in ${config.env} mode`);
}

// Mock mode for demonstration without MongoDB
if (process.env.MOCK_MODE === 'true') {
  logger.info('Running in MOCK MODE - No MongoDB connection required');
  serverDebug('MOCK MODE enabled - MongoDB bypassed');
  
  // Add a mock route for demonstration
  app.post('/api/v1/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    
    // Simple validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email, and password'
      });
    }
    
    // Return mock response
    res.status(201).json({
      status: 'success',
      token: 'mock_jwt_token',
      data: {
        user: {
          _id: 'mock_id_12345',
          name,
          email,
          role: 'user',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
  });
  
  // Mock login
  app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Simple validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }
    
    // Mock successful login
    res.status(200).json({
      status: 'success',
      token: 'mock_jwt_token',
      data: {
        user: {
          _id: 'mock_id_12345',
          name: 'Test User',
          email,
          role: 'user',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
  });
}

// API routes
app.use('/api', routes);
serverDebug('API routes registered');

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, 'Resource not found'));
});

// Convert errors to ApiError
app.use(errorConverter);

// Handle errors
app.use(errorHandler);
serverDebug('Error handling middleware registered');

serverDebug('Express application initialized successfully');

module.exports = app; 