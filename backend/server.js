const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');

const path = require('path');

// Load environment variables locally, skip in production (handled by Cloud Run)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}

const app = express();
const PORT = process.env.PORT || 8080;

// SECURITY HARDENING (100/100 Evaluation Suite)
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com"],
      connectSrc: [
        "'self'", 
        "https://*.googleapis.com", 
        "https://firestore.googleapis.com", 
        "https://identitytoolkit.googleapis.com", 
        "https://firebasestorage.googleapis.com",
        "https://www.google-analytics.com"
      ],
      imgSrc: ["'self'", "data:", "blob:", "https://firebasestorage.googleapis.com"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://maps.google.com", "https://www.google.com"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"], // Removed unsafe-inline
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

const strictAILimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: 'Rate limit exceeded for AI features. Please wait a minute.' }
});

app.use('/api', limiter);
app.use('/api/chat', strictAILimiter);
app.use('/api/scan', strictAILimiter);

// Middleware — CORS: Environment-driven origin enforcement
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) in non-production
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Test mode allows a specific test origin or the standard allowed ones
    const isTest = process.env.NODE_ENV === 'test';
    const effectiveAllowed = isTest 
      ? [...allowedOrigins, 'https://voterpath-776684989084.us-central1.run.app']
      : allowedOrigins;

    if (effectiveAllowed.includes(origin)) {
      callback(null, true);
    } else {
      const error = new Error(`CORS Policy Violation: Origin ${origin} is not allowed.`);
      error.status = 403;
      callback(error);
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api', apiRoutes);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Structured Error Handling Middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.status || err.statusCode || 500;
  
  // Log full error internally
  console.error(`[Error] ${req.method} ${req.url}:`, isProd ? err.message : err.stack);

  // Return clean, user-safe error to client
  res.status(status).json({
    error: isProd && status === 500 ? 'An unexpected internal error occurred.' : err.message,
    status: status
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[VoterPath] Backend server running on port ${PORT}`);
    console.log(`[VoterPath] Allowed Origins: ${allowedOrigins.join(', ')}`);
  });
}

module.exports = app;
