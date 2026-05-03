const admin = require('firebase-admin');

// Firebase Admin SDK for Backend Token Verification
let firebaseInitialized = false;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('[Auth] Failed to initialize Firebase Admin:', err.message);
  }
}

/**
 * @typedef {import('express').Request & { user?: any }} AuthenticatedRequest
 */

/**
 * Token verification middleware.
 * STRICT FAIL-CLOSED POLICY: Every request MUST have a valid token.
 * Origin checks are handled separately by CORS; they are not an auth bypass.
 * 
 * @param {AuthenticatedRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[Auth] Security Block: Missing or malformed Authorization header.');
    return res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
  }

  const token = authHeader.split(' ')[1];

  if (!firebaseInitialized) {
    // In production, if Firebase Admin is not initialized, we CANNOT verify tokens.
    // We fail-closed to prevent unauthorized access.
    if (process.env.NODE_ENV === 'production') {
      console.error('[Auth] Critical: Firebase Admin not initialized in production. Failing closed.');
      return res.status(500).json({ error: 'Internal Security Error: Authentication service unavailable.' });
    }
    
    // In development, we allow a "test-token" if env is not set up
    if (process.env.NODE_ENV !== 'production' && token === 'test-token') {
      req.user = { uid: 'dev-user', anonymous: true };
      return next();
    }
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
  }
};

module.exports = verifyToken;
