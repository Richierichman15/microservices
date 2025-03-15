const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Create a new user
 * @public
 */
exports.createUser = async (req, res, next) => {
  try {
    // Check if user with same email already exists
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
 * Get all users
 * @public
 */
exports.getUsers = async (req, res, next) => {
  try {
    // Build query with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    // Send response
    res.status(200).json({
      status: 'success',
      results: users.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @public
 */
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * @public
 */
exports.updateUser = async (req, res, next) => {
  try {
    // Don't allow password updates through this route
    if (req.body.password) {
      delete req.body.password;
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @public
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
}; 