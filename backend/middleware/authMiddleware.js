const admin = require('../firebase/admin');

/**
 * STRICT FAIL-CLOSED AUTHENTICATION MIDDLEWARE
 * 
 * Logic:
 * 1. Checks for Authorization: Bearer <token>
 * 2. Verifies token with Firebase Admin SDK.
 * 3. In Production: No bypasses allowed.
 * 4. In Dev/Test: Optional bypass only if ALLOW_TEST_TOKENS is enabled.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[Auth] Security Block: Missing or malformed Authorization header.');
    return res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
  }

  const token = authHeader.split('Bearer ')[1];

  // 1. DEVELOPMENT/TEST BYPASS (Strictly controlled)
  const isDev = process.env.NODE_ENV !== 'production';
  const allowTestTokens = process.env.ALLOW_TEST_TOKENS === 'true';
  
  if (isDev && allowTestTokens && token === 'test-token') {
    console.warn('[Auth] Warning: Using insecure test-token bypass.');
    // @ts-ignore
    req.user = { uid: 'test-user', email: 'test@voterpath.org', isAnonymous: true };
    return next();
  }

  // 2. PRODUCTION VERIFICATION
  try {
    // If Firebase Admin failed to initialize, we MUST fail closed in production.
    if (!admin) {
      console.error('[Auth] CRITICAL: Firebase Admin not initialized.');
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'Internal Security Error: Auth provider offline.' });
      }
      // Fallback for local development without keys
      throw new Error('Firebase Admin uninitialized');
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    // @ts-ignore
    req.user = decodedToken;
    next();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Auth] Token Verification Failed:', err.message);
    
    // Explicit 401 for invalid tokens to prevent probe-leaks
    return res.status(401).json({ 
      error: 'Invalid or expired session. Please sign in again.',
      code: 'auth/invalid-token'
    });
  }
};

module.exports = { verifyToken };
