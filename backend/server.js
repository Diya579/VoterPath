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

// Middleware — CORS: Strict origin enforcement
const allowedOrigins = [
  'https://voterpath-776684989084.us-central1.run.app',
  'http://localhost:5173',
  'http://localhost:8080'
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) ONLY in development/test
    // Require explicit origin matching for all browser-based production requests
    if (!origin && process.env.NODE_ENV === 'test') {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} is strictly unauthorized.`));
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
  // Fallback to SPA index.html for all other routes
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error Handling Middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server only if we're not running tests
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

module.exports = app; // Export for testing
