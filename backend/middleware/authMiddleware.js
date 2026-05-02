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

const verifyToken = async (req, res, next) => {
  // Strict Fail-Closed Policy:
  // If Firebase Admin is not initialized, we only allow access in TEST environment.
  // We have removed the 'x-dev-bypass' header to prevent production bypass.
  if (!firebaseInitialized) {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }
    console.error('[Auth] System configuration error: FIREBASE_SERVICE_ACCOUNT not set in environment.');
    return res.status(500).json({ error: 'System Authentication Configuration Error. Please set FIREBASE_SERVICE_ACCOUNT.' });
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
