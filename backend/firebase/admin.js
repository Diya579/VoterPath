/**
 * VoterPath Firebase Infrastructure
 * (c) 2024 VoterPath Contributors
 */

const admin = require('firebase-admin');

/**
 * FIREBASE ADMIN SDK INITIALIZATION ENGINE
 * 
 * STRICT PRODUCTION STANDARDS:
 * 1. No hardcoded credentials or mock keys.
 * 2. Strict reliance on environment-provided Service Account JSON.
 * 3. Fail-closed behavior on missing or malformed configuration.
 */

let adminApp = null;

try {
  if (admin.apps.length === 0) {
    let credential = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
      } catch (error) {
        const jsonErr = error instanceof Error ? error : new Error(String(error));
        console.error('[Firebase Security] Malformed Service Account JSON:', jsonErr.message);
      }
    }

    if (credential || process.env.FIREBASE_PROJECT_ID) {
      adminApp = admin.initializeApp({
        credential: credential || admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('[Firebase] Infrastructure Initialized Successfully.');
    } else {
      console.error('[Firebase Security] CRITICAL: No credentials provided. Auth GATE will fail-closed.');
    }
  } else {
    adminApp = admin.app();
  }
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error('[Firebase Security] Infrastructure Boot Failure:', err.message);
}

module.exports = adminApp;
