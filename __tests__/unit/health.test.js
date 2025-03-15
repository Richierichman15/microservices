const request = require('supertest');
const app = require('../../src/app');

describe('Health Endpoint', () => {
  test('GET /api/health should return 200 and status success', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Server is running');
    expect(response.body).toHaveProperty('timestamp');
  });
}); 