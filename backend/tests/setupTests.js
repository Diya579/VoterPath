/**
 * Global Jest Setup for Backend
 */

// Mock Firebase Admin with realistic token validation behavior
jest.mock('../firebase/admin', () => {
  return {
    auth: () => ({
      /**
       * @param {string} token
       */
      verifyIdToken: async (token) => {
        // Reject empty tokens
        if (!token) throw new Error('Firebase ID token is missing.');
        
        // Simulate real token validation (format + specific test keys)
        if (token === 'valid-test-token') {
          return {
            uid: 'test-user-123',
            email: 'test@voterpath.org',
            firebase: { sign_in_provider: 'google.com' }
          };
        }

        if (token === 'expired-token') {
          throw new Error('Firebase ID token has expired.');
        }

        throw new Error('Firebase ID token has invalid signature.');
      }
    }),
    apps: [{ name: 'mock-app' }]
  };
});

// Set necessary environment variables for tests
process.env.PORT = '8080';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173,https://voterpath.org,https://voterpath-776684989084.us-central1.run.app';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.NODE_ENV = 'test';
