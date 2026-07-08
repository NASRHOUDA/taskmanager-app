const request = require('supertest');
const app = require('../app');

describe('Server', () => {
  test('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
  });

  test('should have CORS enabled', async () => {
    const response = await request(app).options('/');
    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  test('should have helmet security headers', async () => {
    const response = await request(app).get('/');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-dns-prefetch-control']).toBeDefined();
  });
});
