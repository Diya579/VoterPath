const express = require('express');
const router = express.Router();
const multer = require('multer');
const { chatWithGemini, scanVoterID } = require('../controllers/geminiController');
const verifyToken = require('../middleware/authMiddleware');

// Apply Auth Middleware globally for all API routes (Google Services Integration)
router.use(verifyToken);

// Multer configuration for handling file uploads in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// POST /api/chat
router.post('/chat', chatWithGemini);

// POST /api/scan
router.post('/scan', upload.single('image'), scanVoterID);

module.exports = router;
