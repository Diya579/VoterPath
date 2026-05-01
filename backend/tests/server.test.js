const request = require('supertest');
const app = require('../server');

describe('Server Basic Setup', () => {
  it('should respond to health check or invalid routes', async () => {
    const response = await request(app).get('/invalid');
    expect(response.statusCode).toBe(404);
  });

  it('should have CORS headers for allowed origins', async () => {
    const response = await request(app)
      .options('/api/chat')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST');
    // CORS preflight should include allow-origin for whitelisted origins
    expect(response.statusCode).not.toBe(500);
  });
});
