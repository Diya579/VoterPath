/**
 * VoterPath Security Infrastructure
 * (c) 2024 VoterPath Contributors
 */

/** @type {any} */
const admin = require('../firebase/admin');

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

/**
 * STRICT FAIL-CLOSED AUTHENTICATION GATEWAY
 * 
 * Logic:
 * 1. Structural Validation: Requires 'Authorization: Bearer <token>' header.
 * 2. Provider Check: Rejects requests if Firebase Admin is unavailable (Production Safeguard).
 * 3. Identity Verification: Validates the JWT signature against Firebase Auth keys.
 * 4. Context Enrichment: Injects the verified UID and claims into the request object.
 * 
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. STRUCTURAL HEADER CHECK
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[Auth] Security Block: Missing or malformed Authorization header.');
    return res.status(401).json({
      error: 'Authentication required. Please sign in to continue.',
      code: 'auth/missing-header'
    });
  }

  const token = authHeader.split('Bearer ')[1];

  // 2. PROVIDER AVAILABILITY CHECK (Fail-Closed)
  if (!admin) {
    console.error('[Auth] CRITICAL: Firebase Admin instance is null.');
    
    // In production, we cannot allow unauthenticated traffic if the provider is down.
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        error: 'Security Provider Error: Authentication is currently unavailable.',
        code: 'auth/provider-offline'
      });
    }

    // In non-production, we return a service unavailable code.
    return res.status(503).json({
      error: 'Identity service is uninitialized.',
      code: 'auth/uninitialized'
    });
  }

  try {
    // 3. CRYPTOGRAPHIC IDENTITY VERIFICATION
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // 4. REQUEST CONTEXT ENRICHMENT
    /** @type {any} */
    const requestWithUser = req;
    requestWithUser.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAnonymous: decodedToken.firebase?.sign_in_provider === 'anonymous',
      claims: decodedToken
    };

    return next();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Auth] Identity Verification Failed:', err.message);

    // We return a generic 401 to prevent timing or session probing.
    return res.status(401).json({
      error: 'Your session is invalid or has expired.',
      code: 'auth/invalid-token'
    });
  }
};

module.exports = { verifyToken };
