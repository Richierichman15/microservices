const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { testUsers, setupTestUsers } = require('../fixtures/users');
const { clearDatabase } = require('../setup/mongodb');
const { getAuthHeader } = require('../utils/auth');

describe('API End-to-End Tests', () => {
  let adminToken;
  let userToken;
  let userId;

  // Setup database and tokens before all tests
  beforeAll(async () => {
    const users = await setupTestUsers(User);
    
    // Get admin user
    const adminUser = users.find(u => u.role === 'admin');
    adminToken = getAuthHeader(adminUser);
    
    // Get regular user
    const regularUser = users.find(u => u.role === 'user' && u.isActive);
    userToken = getAuthHeader(regularUser);
    userId = regularUser._id.toString();
  });

  // Clean database after all tests
  afterAll(async () => {
    await clearDatabase();
  });

  describe('Authentication Flow', () => {
    test('Register -> Login -> Get Profile -> Update Profile', async () => {
      // Step 1: Register a new user
      const newUser = {
        name: 'E2E Test User',
        email: 'e2etest@example.com',
        password: 'password123'
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body).toHaveProperty('token');
      const token = { Authorization: `Bearer ${registerResponse.body.token}` };

      // Step 2: Login with the new user
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');

      // Step 3: Get user profile
      const profileResponse = await request(app)
        .get('/api/v1/auth/profile')
        .set(token);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.data.user.email).toBe(newUser.email);

      // Step 4: Update user profile
      const updatedName = 'Updated E2E Test User';
      const updateResponse = await request(app)
        .patch('/api/v1/auth/profile')
        .set(token)
        .send({ name: updatedName });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.user.name).toBe(updatedName);
    });
  });

  describe('Admin User Management', () => {
    test('Admin can perform CRUD operations on users', async () => {
      // Step 1: Admin creates a new user
      const newUser = {
        name: 'Admin Created User',
        email: 'adminCreated@example.com',
        password: 'password123',
        role: 'user'
      };

      const createResponse = await request(app)
        .post('/api/v1/users')
        .set(adminToken)
        .send(newUser);

      expect(createResponse.status).toBe(201);
      const createdUserId = createResponse.body.data.user._id;

      // Step 2: Admin gets all users
      const getUsersResponse = await request(app)
        .get('/api/v1/users')
        .set(adminToken);

      expect(getUsersResponse.status).toBe(200);
      expect(getUsersResponse.body.data.users.length).toBeGreaterThan(0);

      // Step 3: Admin gets a specific user
      const getUserResponse = await request(app)
        .get(`/api/v1/users/${createdUserId}`)
        .set(adminToken);

      expect(getUserResponse.status).toBe(200);
      expect(getUserResponse.body.data.user._id).toBe(createdUserId);

      // Step 4: Admin updates a user
      const updateUserResponse = await request(app)
        .patch(`/api/v1/users/${createdUserId}`)
        .set(adminToken)
        .send({ name: 'Updated Admin Created User' });

      expect(updateUserResponse.status).toBe(200);
      expect(updateUserResponse.body.data.user.name).toBe('Updated Admin Created User');

      // Step 5: Admin deletes a user
      const deleteUserResponse = await request(app)
        .delete(`/api/v1/users/${createdUserId}`)
        .set(adminToken);

      expect(deleteUserResponse.status).toBe(204);

      // Verify user is deleted
      const verifyDeletedResponse = await request(app)
        .get(`/api/v1/users/${createdUserId}`)
        .set(adminToken);

      expect(verifyDeletedResponse.status).toBe(404);
    });

    test('Regular user cannot access admin routes', async () => {
      // Try to get all users as regular user
      const getUsersResponse = await request(app)
        .get('/api/v1/users')
        .set(userToken);

      expect(getUsersResponse.status).toBe(403);

      // Try to create a user as regular user
      const createUserResponse = await request(app)
        .post('/api/v1/users')
        .set(userToken)
        .send({
          name: 'Unauthorized Create',
          email: 'unauthorized@example.com',
          password: 'password123'
        });

      expect(createUserResponse.status).toBe(403);

      // Try to update another user as regular user
      const updateUserResponse = await request(app)
        .patch(`/api/v1/users/${userId}`)
        .set(userToken)
        .send({ name: 'Unauthorized Update' });

      expect(updateUserResponse.status).toBe(403);

      // Try to delete a user as regular user
      const deleteUserResponse = await request(app)
        .delete(`/api/v1/users/${userId}`)
        .set(userToken);

      expect(deleteUserResponse.status).toBe(403);
    });
  });

  describe('Health Check and Error Handling', () => {
    test('Health check endpoint should return 200', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    test('Should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/non-existent-route');
      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });

    test('Should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "malformed@example.com", "password": "password123"');

      expect(response.status).toBe(400);
    });
  });
}); 