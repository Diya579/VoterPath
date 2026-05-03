/**
 * VoterPath API Router Architecture
 * (c) 2024 VoterPath Contributors
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Controller Imports
const { chatWithGemini, scanVoterID } = require('../controllers/geminiController');
const { getEligibility, getSchedules, getRegistrationSteps } = require('../controllers/factsController');

// Middleware Imports
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * GLOBAL SECURITY PERIMETER
 * 
 * Logic:
 * All API routes are protected by a strict fail-closed identity gateway.
 * Requests must include a verified Firebase ID Token.
 */
router.use(verifyToken);

/**
 * FILE UPLOAD CONFIGURATION (Transient Memory Storage)
 */
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 2 * 1024 * 1024, // 2MB Security Limit
    files: 1 
  }
});

/**
 * AI & MULTIMODAL ROUTES
 */

/**
 * @route POST /api/chat
 * @desc Deterministically grounded AI guidance.
 */
router.post('/chat', chatWithGemini);

/**
 * @route POST /api/scan
 * @desc Vision-assisted extraction with semantic cross-validation.
 */
router.post('/scan', upload.single('image'), scanVoterID);

/**
 * DETERMINISTIC CIVIC DATA ROUTES (v1)
 * 
 * These routes provide non-LLM, rule-based access to the authoritative manifest.
 */

/**
 * @route GET /api/v1/facts/eligibility
 * @desc Returns grounded voter eligibility rules.
 */
router.get('/v1/facts/eligibility', getEligibility);

/**
 * @route GET /api/v1/facts/schedules
 * @desc Returns verified election timelines by state.
 */
router.get('/v1/facts/schedules', getSchedules);

/**
 * @route GET /api/v1/facts/steps
 * @desc Returns official registration and correction procedures.
 */
router.get('/v1/facts/steps', getRegistrationSteps);

module.exports = router;
