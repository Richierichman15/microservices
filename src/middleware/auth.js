const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');

/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    // 1) Check if token exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new ApiError(401, 'You are not logged in. Please log in to get access.')
      );
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

    // 3) Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(
        new ApiError(401, 'The user belonging to this token no longer exists.')
      );
    }

    // 4) Check if user is active
    if (!user.isActive) {
      return next(
        new ApiError(401, 'This user account has been deactivated.')
      );
    }

    // 5) Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(401, 'Not authorized to access this resource.'));
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ApiError(401, 'You must be logged in to access this resource.')
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'You do not have permission to perform this action.')
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
}; 