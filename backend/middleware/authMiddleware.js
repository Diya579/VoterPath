/**
 * VoterPath Security Infrastructure
 * (c) 2024 VoterPath Contributors
 */

const admin = require('../firebase/admin');

/**
 * STRICT FAIL-CLOSED AUTHENTICATION MIDDLEWARE
 * 
 * This middleware enforces a zero-trust policy for all API endpoints.
 * 
 * SECURITY CONTRACT:
 * 1. REQUIREMENT: All requests must provide a valid 'Authorization: Bearer <ID_TOKEN>' header.
 * 2. VERIFICATION: Tokens are verified using the Firebase Admin SDK.
 * 3. FAIL-CLOSED: If the Auth Provider (Firebase) is unreachable or uninitialized, 
 *    the request is rejected with a 500 error in production.
 * 4. AUDITABILITY: All security blocks are logged for incident response.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Structural Check
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[Auth] Security Block: Missing or malformed Authorization header.');
    return res.status(401).json({
      error: 'Authentication required. Please sign in to continue.',
      code: 'auth/missing-header'
    });
  }

  const token = authHeader.split('Bearer ')[1];

  // 2. Provider Integrity Check
  if (!admin) {
    console.error('[Auth] CRITICAL: Firebase Admin not initialized. Rejecting request.');
    
    // In production, we MUST fail closed if the security provider is offline.
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        error: 'Internal Security Error: Authentication provider is offline.',
        code: 'auth/provider-offline'
      });
    }

    // In development, we still fail but with a clearer error for the developer.
    return res.status(503).json({
      error: 'Security Provider (Firebase Admin) not initialized. Check your environment variables.',
      code: 'auth/uninitialized'
    });
  }

  // 3. Cryptographic Verification
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach decoded user data to the request object for downstream controllers
    // @ts-ignore
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAnonymous: decodedToken.firebase?.sign_in_provider === 'anonymous',
      claims: decodedToken
    };

    return next();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Auth] Token Verification Failed:', err.message);

    // Explicit 401 for invalid tokens to prevent session probing
    return res.status(401).json({
      error: 'Invalid or expired session. Please sign in again.',
      code: 'auth/invalid-token'
    });
  }
};

module.exports = { verifyToken };
