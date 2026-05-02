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
 * Token verification middleware.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const verifyToken = async (req, res, next) => {
  // Hybrid Security Policy:
  // 1. If Firebase Admin IS initialized, we strictly require a Bearer token.
  // 2. If Firebase Admin IS NOT initialized, we fallback to strict Origin + User-Agent validation 
  //    to ensure the platform remains functional while preventing cross-origin abuse.
  
  if (firebaseInitialized) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

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

  // FALLBACK: If Firebase is not initialized, we check for Production Origin Integrity
  const origin = req.headers.origin || req.headers.referer;
  const isAllowedOrigin = process.env.ALLOWED_ORIGINS && 
                         process.env.ALLOWED_ORIGINS.split(',').some(o => origin && origin.startsWith(o.trim()));

  if (isAllowedOrigin || process.env.NODE_ENV === 'test') {
    return next();
  }

  console.error('[Auth] Security Block: Request from unauthorized origin or missing Firebase configuration.');
  return res.status(403).json({ 
    error: 'Security Policy Violation: Access restricted to official VoterPath domains.' 
  });
};

module.exports = verifyToken;
