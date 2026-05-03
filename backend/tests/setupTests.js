/**
 * Global Jest Setup for Backend
 * Configures mocks for security-sensitive modules.
 */

jest.mock('../firebase/admin', () => {
  return {
    auth: () => ({
      verifyIdToken: async (token) => {
        if (token === 'test-token') {
          return {
            uid: 'test-user',
            email: 'test@voterpath.org',
            firebase: { sign_in_provider: 'anonymous' }
          };
        }
        throw new Error('Firebase ID token has invalid signature.');
      }
    }),
    apps: [{ name: 'mock-app' }]
  };
});
