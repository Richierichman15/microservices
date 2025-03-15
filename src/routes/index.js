const express = require('express');
const userRoutes = require('./user.routes');
const authRoutes = require('./auth.routes');

const router = express.Router();

/**
 * API Routes
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// v1 API routes
router.use('/v1/users', userRoutes);
router.use('/v1/auth', authRoutes);

module.exports = router; 