const admin = require('firebase-admin');

/**
 * FIREBASE ADMIN SDK INITIALIZATION
 * 
 * Logic:
 * 1. Checks for FIREBASE_SERVICE_ACCOUNT (JSON string).
 * 2. Fallback to individual FIREBASE_PROJECT_ID, etc.
 * 3. Returns null if not configured (middleware handles fail-closed).
 */
let adminApp = null;

try {
  if (admin.apps.length === 0) {
    let credential = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
      } catch (err) {
        console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', err.message);
      }
    }

    if (credential || process.env.FIREBASE_PROJECT_ID) {
      adminApp = admin.initializeApp({
        credential: credential || admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('[Firebase Admin] Initialized successfully.');
    } else {
      console.warn('[Firebase Admin] Warning: No service account or project ID found. Auth will fail-closed in production.');
    }
  } else {
    adminApp = admin.app();
  }
} catch (error) {
  console.error('[Firebase Admin] Initialization Error:', error.message);
}

module.exports = adminApp;
