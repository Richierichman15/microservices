const express = require('express');
const authController = require('../controllers/auth.controller');
const authValidation = require('../validations/auth.validation');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post(
  '/register',
  validate(authValidation.register),
  authController.register
);

router.post(
  '/login',
  validate(authValidation.login),
  authController.login
);

// Protected routes
router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

router.patch(
  '/profile',
  authenticate,
  validate(authValidation.updateProfile),
  authController.updateProfile
);

module.exports = router; 