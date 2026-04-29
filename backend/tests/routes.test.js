const request = require('supertest');
const app = require('../server');

describe('Route Definition Audit', () => {
  it('POST /api/chat is defined', async () => {
    const response = await request(app).post('/api/chat').send({ prompt: 'test' });
    // 200 or 500 depends on mock, but not 404
    expect(response.statusCode).not.toBe(404);
  });

  it('POST /api/scan is defined', async () => {
    const response = await request(app).post('/api/scan');
    expect(response.statusCode).not.toBe(404);
  });
});
