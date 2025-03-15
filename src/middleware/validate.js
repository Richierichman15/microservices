const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to validate request data using express-validator
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check if there are validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const extractedErrors = errors.array().map(err => ({
      [err.path]: err.msg
    }));

    // Format validation error messages
    const errorMessages = errors
      .array()
      .map(err => `${err.path}: ${err.msg}`)
      .join(', ');

    // Pass to error handler middleware
    return next(new ApiError(400, `Validation error: ${errorMessages}`, true, null));
  };
};

module.exports = validate; 