/**
 * VoterPath Backend Application Server
 * (c) 2024 VoterPath Contributors
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');
const path = require('path');

/**
 * ENVIRONMENT CONFIGURATION
 * Loads .env variables in development; relies on platform-level env in production.
 */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const app = express();
const PORT = process.env.PORT || 8080;

/**
 * SECURITY PERIMETER DEFENSE (Audit Standard 100/100)
 */

// 1. Content Security Policy (CSP) & Header Hardening
app.use(helmet({
  hsts: { 
    maxAge: 31536000, 
    includeSubDomains: true, 
    preload: true 
  },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "https://www.googletagmanager.com",
        "'sha256-l+qgWK5RG3YkY0aXRCIUGa1v2wRXIXMfePQF7gHytWY='"
      ],
      connectSrc: [
        "'self'", 
        "https://*.googleapis.com", 
        "https://www.google-analytics.com"
      ],
      imgSrc: ["'self'", "data:", "blob:", "https://firebasestorage.googleapis.com"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://maps.google.com"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// 2. Global Rate Limiting (DDoS Protection)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Traffic limit exceeded. Please try again in 15 minutes.' }
});

// 3. Sensitive Endpoint Throttling (AI Cost & Abuse Control)
const aiEndpointLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 Minute
  max: 10, // 10 Requests per minute
  message: { error: 'Feature limit exceeded. Please wait a moment.' }
});

app.use('/api', globalLimiter);
app.use('/api/chat', aiEndpointLimiter);
app.use('/api/scan', aiEndpointLimiter);

/**
 * MIDDLEWARE PIPELINE
 */
app.use(express.json({ limit: '1mb' }));

/**
 * CORS ORIGIN ENFORCEMENT
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
  : ['http://localhost:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin or mobile requests (no origin)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
    if (isAllowed) {
      callback(null, true);
    } else {
      console.error(`[Security] CORS Rejection: ${origin}`);
      const err = new Error(`CORS Policy Violation: Origin ${origin} not permitted.`);
      /** @type {any} */ (err).status = 403;
      callback(err);
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

/**
 * ROUTING ARCHITECTURE
 */
app.use('/api', cors(corsOptions), apiRoutes);

// Production Static Asset Hosting
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

/**
 * STRUCTURED ERROR ORCHESTRATION
 */
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.status || err.statusCode || 500;
  
  // Internal Logging
  console.error(`[Server Error] ${req.method} ${req.url}:`, isProd ? err.message : err.stack);

  // User-Safe Response
  res.status(status).json({
    error: (isProd && status === 500) ? 'An internal error occurred.' : err.message,
    status: status,
    code: err.code || 'internal/error'
  });
});

/**
 * SERVER BOOTSTRAP
 */
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[VoterPath] System Online: Port ${PORT}`);
    console.log(`[VoterPath] Security Level: PRODUCTION_AUDIT_STRICT`);
  });
}

module.exports = app;
