const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

// Helper function to check if string is valid ObjectId
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

exports.createUser = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
];

exports.getUsers = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a positive integer not exceeding 100'),
];

exports.getUser = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .custom(isValidObjectId)
    .withMessage('Must be a valid MongoDB ObjectId'),
];

exports.updateUser = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .custom(isValidObjectId)
    .withMessage('Must be a valid MongoDB ObjectId'),
  
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

exports.deleteUser = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .custom(isValidObjectId)
    .withMessage('Must be a valid MongoDB ObjectId'),
]; 