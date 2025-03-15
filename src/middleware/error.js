const mongoose = require('mongoose');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');

/**
 * Convert various error types to ApiError
 */
const errorConverter = (err, req, res, next) => {
  let error = err;
  
  if (!(error instanceof ApiError)) {
    const statusCode = 
      error.statusCode || 
      (error instanceof mongoose.Error ? 400 : 500);
    
    const message = error.message || 'Something went wrong';
    
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  next(error);
};

/**
 * Handle and respond with error
 */
const errorHandler = (err, req, res, next) => {
  const { statusCode, message } = err;
  
  // Set response status
  res.status(statusCode);
  
  // Prepare response
  const response = {
    status: 'error',
    statusCode,
    message,
  };
  
  // Add stack trace in development environment
  if (config.env === 'development') {
    response.stack = err.stack;
  }
  
  // Log error
  if (statusCode >= 500) {
    logger.error(err);
  } else {
    logger.warn(err);
  }
  
  // Send response
  res.json(response);
};

module.exports = {
  errorConverter,
  errorHandler,
}; 