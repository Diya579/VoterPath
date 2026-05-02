const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');
const { validateVoterIdFormat } = require('../shared/validation');
const eciService = require('../services/eciService');

// Schema for request validation
const chatSchema = z.object({
  prompt: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() }))
  })).optional()
});

const extractedVoterSchema = z.object({
  epic: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  pollingStation: z.string().nullable().optional(),
  pollingStationAddress: z.string().nullable().optional(),
  constituency: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional()
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Robustly sanitizes user input to prevent common prompt injection patterns.
 * Preserves core intent while neutralizing structural attack vectors.
 */
function sanitizePrompt(input) {
  if (!input) return '';
  // Pattern matching for system instruction overrides
  const blockedPatterns = [
    /ignore previous instructions?/gi,
    /you are now/gi,
    /\[system\]/gi,
    /### system/gi,
    /system_instruction/gi,
    /<\|.*?\|>/g
  ];
  
  let sanitized = input;
  blockedPatterns.forEach(p => { sanitized = sanitized.replace(p, '[neutralized]'); });
  
  return sanitized
    .replace(/<script.*?>.*?<\/script>/gi, '') 
    .trim();
}

/**
 * Controller for AI-powered conversational guidance.
 * Grounded in authoritative ECI facts.
 */
const chatWithGemini = async (req, res, next) => {
  try {
    const validation = chatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input format', details: validation.error });
    }
    const { prompt: rawPrompt, history = [] } = validation.data;
    const prompt = sanitizePrompt(rawPrompt);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured on the server.');
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const facts = await eciService.getFacts();
      const langMatch = prompt.match(/\[Please strictly answer in (\w+)\]/);
      const targetLang = langMatch ? langMatch[1] : 'English';

      const systemInstruction = `You are the VoterPath Expert, an authoritative election assistant.
- CRITICAL: Respond ONLY in ${targetLang} language using its NATIVE SCRIPT.
- KNOWLEDGE BASE: Sourced directly from ECI Authoritative Service.
- Qualifying Date: ${facts.qualifyingDate}.
- Election Cycle: ${facts.version}.
- Data Freshness: ${facts.lastUpdated}.
- PROHIBITED: Do not discuss non-election topics. Do not write code. Do not speculate on results.
- CONTEXT: ${JSON.stringify(facts.schedules)}`;

      const chat = model.startChat({
        history: history,
        generationConfig: { maxOutputTokens: 1000 },
      });

      const result = await chat.sendMessage(`${systemInstruction}\n\nUser: ${prompt}`);
      const response = await result.response;
      res.json({ text: response.text() });
    } catch (apiError) {
      console.error("Gemini Chat API Error:", apiError.stack || apiError.message);
      const status = apiError.message.includes('GEMINI_API_KEY') ? 500 : 503;
      res.status(status).json({ 
        error: apiError.message.includes('GEMINI_API_KEY') 
          ? 'Server configuration error.' 
          : 'Election information service is temporarily unavailable.' 
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for Voter ID OCR and data enrichment.
 * Uses Gemini JSON mode for reliable structural extraction.
 */
const scanVoterID = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Unsupported file type. JPEG, PNG, WEBP only.' });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured on the server.');
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const base64Data = req.file.buffer.toString('base64');
      
      const promptText = `Analyze this Indian Voter ID card. Extract details as a JSON object:
      {
        "epic": "string",
        "name": "string",
        "gender": "string",
        "address": "string",
        "pollingStation": "string",
        "pollingStationAddress": "string",
        "constituency": "string",
        "state": "string",
        "city": "string"
      }
      If a field is unreadable, use null.`;

      const result = await model.generateContent([
        promptText,
        {
          inlineData: {
            data: base64Data,
            mimeType: req.file.mimetype
          }
        }
      ]);

      const response = await result.response;
      const rawText = response.text();
      
      let rawExtracted;
      try {
        rawExtracted = JSON.parse(rawText);
      } catch (parseErr) {
        console.error("JSON Parse Error in Vision Output:", rawText);
        throw new Error('Failed to parse extraction results. The image might be unreadable.');
      }
      
      // Validation & Enrichment
      const extracted = extractedVoterSchema.parse(rawExtracted);
      
      const detectedState = await eciService.resolveState(extracted.state || extracted.city || extracted.address);
      const election = detectedState ? await eciService.getScheduleForState(detectedState) : null;
      const booth = await eciService.getBoothForConstituency(extracted.constituency || extracted.pollingStation);

      const enrichedResult = {
        epic: extracted.epic || null,
        epicValid: validateVoterIdFormat(extracted.epic),
        name: extracted.name || null,
        gender: extracted.gender || null,
        address: extracted.address || null,
        pollingStation: extracted.pollingStation || null,
        pollingStationAddress: extracted.pollingStationAddress || null,
        constituency: extracted.constituency || null,
        detectedRegion: detectedState || (extracted.city || extracted.state || null),
        nearestBooth: booth || extracted.pollingStation || null,
        election: election,
        meta: await eciService.getFreshness()
      };

      res.json({ result: enrichedResult });
    } catch (apiError) {
      console.error("Gemini Vision API Error:", apiError.stack || apiError.message);
      const status = apiError.message.includes('GEMINI_API_KEY') ? 500 : 503;
      res.status(status).json({ 
        error: apiError.message.includes('GEMINI_API_KEY') 
          ? 'Server configuration error.' 
          : (apiError.message || 'OCR processing service is unavailable.')
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { chatWithGemini, scanVoterID };
