/// <reference types="jest" />
const request = require('supertest');
const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');

// Isolated express app — separate from main server to avoid side effects
const app = express();
app.use(express.json());
app.get('/test-auth', verifyToken, (req, res) => res.json({ success: true }));

describe('Auth Middleware', () => {
  beforeAll(() => {
    process.env.ALLOW_TEST_TOKENS = 'true';
    process.env.NODE_ENV = 'test';
  });

  it('should reject requests with missing token (Fail-Closed)', async () => {
    const response = await request(app).get('/test-auth');
    expect(response.statusCode).toBe(401);
  });

  it('should allow requests with a valid test-token when enabled', async () => {
    const response = await request(app)
      .get('/test-auth')
      .set('Authorization', 'Bearer test-token');
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should reject requests when test-tokens are disabled', async () => {
    process.env.ALLOW_TEST_TOKENS = 'false';
    const response = await request(app)
      .get('/test-auth')
      .set('Authorization', 'Bearer test-token');
    expect(response.statusCode).toBe(401);
    process.env.ALLOW_TEST_TOKENS = 'true'; // Reset
  });

  it('should return 500 in production if auth provider is missing', async () => {
    process.env.NODE_ENV = 'production';
    const response = await request(app)
      .get('/test-auth')
      .set('Authorization', 'Bearer some-token');
    
    // In production without Firebase Admin, it must fail closed with 500
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toMatch(/Internal Security Error/i);
    process.env.NODE_ENV = 'test'; // Reset
  });
});
