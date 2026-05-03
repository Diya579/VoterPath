/**
 * VoterPath Firebase Infrastructure
 * (c) 2024 VoterPath Contributors
 */

const admin = require('firebase-admin');

/**
 * FIREBASE ADMIN SDK INITIALIZATION ENGINE
 * 
 * DESIGN RATIONALE:
 * Provides a central, verified instance of the Admin SDK. 
 * Supports production Service Account JSON and local Project ID fallbacks.
 * In TEST environments, it auto-initializes with mock credentials to enable 
 * local test runners to execute without cloud dependencies.
 */

let adminApp = null;

try {
  // 1. TEST-MODE BOOTSTRAP
  // If running in Jest/Vitest without env vars, we seed a mock project ID.
  const isTest = process.env.NODE_ENV === 'test';
  const hasNoConfig = !process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_SERVICE_ACCOUNT;

  if (isTest && hasNoConfig) {
    process.env.FIREBASE_PROJECT_ID = 'voterpath-dev-mock';
  }

  // 2. SINGLETON INITIALIZATION
  if (admin.apps.length === 0) {
    let credential = null;

    // A. Service Account Path (Production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
      } catch (jsonErr) {
        console.error('[Firebase] Malformed FIREBASE_SERVICE_ACCOUNT JSON:', jsonErr.message);
      }
    }

    // B. Application Default / Project ID Path (Stage/Dev)
    if (credential || process.env.FIREBASE_PROJECT_ID) {
      try {
        adminApp = admin.initializeApp({
          credential: credential || admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        console.log('[Firebase] Admin SDK Initialized Successfully.');
      } catch (initErr) {
        // C. Mock Fallback for Local CI
        if (isTest) {
          adminApp = admin.initializeApp({
            credential: admin.credential.cert({
              projectId: 'mock-auth',
              clientEmail: 'mock@voterpath.org',
              privateKey: '-----BEGIN PRIVATE KEY-----\nMIIB...-----END PRIVATE KEY-----\n',
            }),
            projectId: 'voterpath-dev-mock'
          });
          console.warn('[Firebase] Warning: Initialized with LOCAL MOCK credentials.');
        } else {
          throw initErr;
        }
      }
    } else {
      console.warn('[Firebase] Warning: Authentication infrastructure is unconfigured. Auth will FAIL-CLOSED.');
    }
  } else {
    // Return existing instance if already initialized.
    adminApp = admin.app();
  }
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error('[Firebase] CRITICAL INITIALIZATION FAILURE:', err.message);
}

module.exports = adminApp;
