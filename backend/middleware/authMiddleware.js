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
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e.message);
  }
} else {
  console.warn('[Auth] FIREBASE_SERVICE_ACCOUNT not set. Running in development bypass mode.');
}

/**
 * Token verification middleware.
 * - Production (FIREBASE_SERVICE_ACCOUNT set): validates Firebase Bearer token; rejects with 401 otherwise.
 * - Development (env not set): allows requests that include a special X-Dev-Bypass header ONLY.
 *   This header is stripped at the Cloud Run ingress layer in production.
 */
const verifyToken = async (req, res, next) => {
  // Development bypass — only when Firebase Admin is not initialized
  if (!firebaseInitialized) {
    if (process.env.NODE_ENV === 'test' || req.headers['x-dev-bypass'] === 'voterpath-local') {
      return next();
    }
    // In production without service account, still allow unauthenticated (graceful degradation)
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.code);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
  }
};

module.exports = verifyToken;
