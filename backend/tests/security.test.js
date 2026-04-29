const request = require('supertest');
const app = require('../server');

describe('Security Headers Audit', () => {
  it('should have basic security headers from CORS', async () => {
    const response = await request(app).get('/api/chat');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
