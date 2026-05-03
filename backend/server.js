/**
 * VoterPath Backend Application Server
 * (c) 2024 VoterPath Contributors
 */

const express = require('express');
const cors = require('cors');
// @ts-ignore
const helmet = require('helmet');
// @ts-ignore
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');
const path = require('path');

/**
 * ENVIRONMENT CONFIGURATION
 */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const app = express();
// STRICT CONFIGURATION: NO DEFAULT PORT. MUST BE EXPLICIT.
const PORT = process.env.PORT; 

if (!PORT && process.env.NODE_ENV !== 'test') {
  console.error('[Infrastructure] CRITICAL: PORT environment variable is not defined.');
  process.exit(1);
}

/**
 * SECURITY PERIMETER
 */
// @ts-ignore
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com"],
      connectSrc: ["'self'", "https://*.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://firebasestorage.googleapis.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// @ts-ignore
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Traffic limit exceeded.' }
});

app.use('/api', globalLimiter);
app.use(express.json({ limit: '1mb' }));

/**
 * CORS ORIGIN ENFORCEMENT
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
  : []; // NO DEFAULT ORIGINS. MUST BE EXPLICIT.

const corsOptions = {
  /** @type {function(string|undefined, function(Error|null, boolean=)): void} */
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      const err = new Error(`CORS Policy Violation: Origin ${origin} not permitted.`);
      /** @type {any} */ (err).status = 403;
      callback(err);
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use('/api', cors(corsOptions), apiRoutes);

/**
 * ERROR ORCHESTRATION
 */
const globalErrorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.status || err.statusCode || 500;
  console.error(`[Server Error] ${req.method} ${req.url}:`, isProd ? err.message : err.stack);
  res.status(status).json({
    error: (isProd && status === 500) ? 'An internal error occurred.' : err.message,
    status: status,
    code: err.code || 'internal/error'
  });
};

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.use(globalErrorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[VoterPath] System Online: Port ${PORT}`);
  });
}

module.exports = app;
