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
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', err.message);
  }
} else {
  console.warn('[Auth] FIREBASE_SERVICE_ACCOUNT not set. Running in development bypass mode.');
}

/**
 * @typedef {import('express').Request & { user?: any }} AuthenticatedRequest
 */

/**
 * Token verification middleware.
 * @param {AuthenticatedRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const verifyToken = async (req, res, next) => {
  // Hybrid Security Policy:
  // 1. If a Bearer token is provided, we MUST verify it via Firebase Admin (if initialized).
  // 2. If NO token is provided, we allow the request ONLY if it comes from an authorized Production Origin.
  // This ensures the platform remains "fail-closed" to outside abuse while staying frictionless for users.
  
  const authHeader = req.headers.authorization;
  
  // CASE 1: Token provided -> Validate strictly
  if (authHeader && authHeader.startsWith('Bearer ')) {
    if (!firebaseInitialized) {
      console.warn('[Auth] Token received but Firebase Admin not initialized. Falling back to Origin check.');
    } else {
      const token = authHeader.split(' ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        return next();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[Auth] Token verification failed:', err.message);
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
      }
    }
  }

  // CASE 2: No token or Firebase uninitialized -> Check Production Origin Integrity
  const origin = req.headers.origin || req.headers.referer;
  const allowedList = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
    : [
        'http://localhost:5173',
        'https://voterpath-776684989084.us-central1.run.app'
      ];
  const isAllowedOrigin = allowedList.some(o => origin && origin.startsWith(o));

  if (isAllowedOrigin) {
    return next();
  }

  console.error('[Auth] Security Block: Unauthorized origin or missing authentication token.');
  console.error(`[Auth] Rejected Origin: ${origin}`);
  console.error(`[Auth] Configured Allowed Origins: ${allowedList.join(', ')}`);
  
  return res.status(403).json({ 
    error: 'Security Policy Violation: Access restricted to official VoterPath domains.' 
  });
};

module.exports = verifyToken;
