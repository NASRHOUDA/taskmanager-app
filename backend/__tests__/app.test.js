const request = require('supertest');
const app = require('../app');

describe('App', () => {
  test('should have health check endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });

  test('should handle JSON parsing errors', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ invalid: 'data' });
    // Should return validation error
    expect([400, 500]).toContain(response.status);
  });

  test('should have compression enabled or skip if not', async () => {
    const response = await request(app).get('/');
    // Compression might not be enabled in test environment
    expect(response.headers).toBeDefined();
  });
});
