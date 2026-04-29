const request = require('supertest');
const express = require('express');
const verifyToken = require('../middleware/authMiddleware');

const app = express();
app.use(express.json());
app.get('/test-auth', verifyToken, (req, res) => res.json({ success: true }));

describe('Auth Middleware', () => {
  it('should allow requests without bearer token during hackathon (bypass mode)', async () => {
    const response = await request(app).get('/test-auth');
    expect(response.statusCode).toBe(200);
  });
});
