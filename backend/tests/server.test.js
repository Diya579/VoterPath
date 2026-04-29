const request = require('supertest');
const app = require('../server');

describe('Server Basic Setup', () => {
  it('should respond to health check or invalid routes', async () => {
    const response = await request(app).get('/invalid');
    expect(response.statusCode).toBe(404);
  });

  it('should have CORS enabled', async () => {
    const response = await request(app).options('/api/chat');
    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });
});
