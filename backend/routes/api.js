const express = require('express');
const router = express.Router();
const multer = require('multer');
const { chatWithGemini, scanVoterID } = require('../controllers/geminiController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * VOTERPATH SECURE API ROUTES
 * 
 * All routes are protected by the strict fail-closed authentication middleware.
 * Request rate-limiting is applied at the server level.
 */

// 1. GLOBAL SECURITY GATEWAY
// Verifies Firebase ID Tokens for all downstream requests.
router.use(verifyToken);

// 2. FILE UPLOAD CONFIGURATION
// Uses memory storage for transient processing to prevent data persistence on disk.
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 2 * 1024 * 1024, // 2MB Limit per file
    files: 1 // Only one file per request
  }
});

/**
 * @route POST /api/chat
 * @desc AI-powered election guidance grounded in authoritative facts.
 */
router.post('/chat', chatWithGemini);

/**
 * @route POST /api/scan
 * @desc OCR extraction from Voter ID cards with fact-base enrichment.
 */
router.post('/scan', upload.single('image'), scanVoterID);

module.exports = router;
