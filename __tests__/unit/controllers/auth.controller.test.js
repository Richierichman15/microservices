const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const { testUsers, setupTestUsers } = require('../../fixtures/users');
const { clearDatabase } = require('../../setup/mongodb');
const { getAuthHeader } = require('../../utils/auth');

describe('Auth Controller', () => {
  // Setup database before all tests
  beforeAll(async () => {
    await setupTestUsers(User);
  });

  // Clean database after all tests
  afterAll(async () => {
    await clearDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register a new user and return token', async () => {
      const newUser = {
        name: 'New Test User',
        email: 'newtestuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('_id');
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.name).toBe(newUser.name);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should return 409 if email is already in use', async () => {
      const existingUser = {
        name: 'Existing User',
        email: testUsers[0].email, // Using existing email
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(existingUser);

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Email already in use');
    });

    test('should return 400 for invalid data', async () => {
      const invalidUser = {
        name: 'Invalid User',
        // Missing email
        password: 'pass' // Too short password
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should login and return token with valid credentials', async () => {
      const credentials = {
        email: testUsers[0].email,
        password: testUsers[0].password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(credentials.email);
    });

    test('should return 401 with invalid credentials', async () => {
      const invalidCredentials = {
        email: testUsers[0].email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidCredentials);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    test('should return 400 if email and password are not provided', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    test('should get user profile when authenticated', async () => {
      const user = await User.findOne({ email: testUsers[0].email });
      const token = getAuthHeader(user);

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set(token);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user._id).toBe(user._id.toString());
      expect(response.body.data.user.email).toBe(user.email);
    });

    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /api/v1/auth/profile', () => {
    test('should update user profile when authenticated', async () => {
      const user = await User.findOne({ email: testUsers[0].email });
      const token = getAuthHeader(user);
      const updatedData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .patch('/api/v1/auth/profile')
        .set(token)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.name).toBe(updatedData.name);
    });

    test('should not update role via profile update', async () => {
      const user = await User.findOne({ email: testUsers[1].email });
      const token = getAuthHeader(user);
      const updatedData = {
        role: 'admin' // Attempt to escalate privileges
      };

      const response = await request(app)
        .patch('/api/v1/auth/profile')
        .set(token)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.role).toBe('user'); // Role should remain unchanged
    });

    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/profile')
        .send({ name: 'Unauthenticated Update' });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });
}); 