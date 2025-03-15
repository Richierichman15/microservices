const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');

/**
 * Generate a test JWT token for a user
 * @param {Object} user - User object or ID to generate token for
 * @returns {String} JWT token
 */
const generateTestToken = (user) => {
  const userId = user._id || user;
  
  return jwt.sign(
    {
      id: userId,
      email: user.email || 'test@example.com',
      role: user.role || 'user',
    },
    process.env.JWT_SECRET || 'test_jwt_secret',
    {
      expiresIn: process.env.JWT_EXPIRATION || '1h',
    }
  );
};

/**
 * Get auth header with token for tests
 * @param {Object} user - User object or ID to generate token for
 * @returns {Object} Auth header object
 */
const getAuthHeader = (user) => {
  const token = generateTestToken(user);
  return { Authorization: `Bearer ${token}` };
};

/**
 * Create an authenticated supertest agent
 * @param {Object} request - Supertest request object
 * @param {Object} user - User object or ID
 * @returns {Object} Authenticated supertest agent
 */
const getAuthenticatedAgent = (request, user) => {
  const agent = request.agent;
  const headers = getAuthHeader(user);
  
  return {
    get: (url) => agent.get(url).set(headers),
    post: (url, body) => agent.post(url).set(headers).send(body),
    put: (url, body) => agent.put(url).set(headers).send(body),
    patch: (url, body) => agent.patch(url).set(headers).send(body),
    delete: (url) => agent.delete(url).set(headers)
  };
};

module.exports = {
  generateTestToken,
  getAuthHeader,
  getAuthenticatedAgent
}; 