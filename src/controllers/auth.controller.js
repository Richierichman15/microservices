const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Register a new user
 * @public
 */
exports.register = async (req, res, next) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return next(new ApiError(409, 'Email already in use'));
    }

    // Create new user
    const user = new User(req.body);
    await user.save();

    // Generate token
    const token = user.generateToken();

    // Send response
    res.status(201).json({
      status: 'success',
      token,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login with email and password
 * @public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return next(new ApiError(400, 'Please provide email and password'));
    }

    // Find user by email and select password
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new ApiError(401, 'Your account has been deactivated'));
    }

    // Generate token
    const token = user.generateToken();

    // Send response
    res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @private
 */
exports.getProfile = async (req, res, next) => {
  try {
    // User is already attached to req by auth middleware
    res.status(200).json({
      status: 'success',
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * @private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Don't allow password updates through this route
    if (req.body.password) {
      delete req.body.password;
    }

    // Don't allow role updates through this route
    if (req.body.role) {
      delete req.body.role;
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}; 