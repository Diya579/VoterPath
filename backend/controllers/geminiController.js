const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');
const { validateVoterIdFormat } = require('../shared/validation');
const { electionData, regionToState, constituencyBooths } = require('../data/electionData');
const { getEciData } = require('../services/eciService');

// Schema for request validation
const chatSchema = z.object({
  prompt: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() }))
  })).optional()
});

const extractedVoterSchema = z.object({
  epic: z.string().optional(),
  name: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  pollingStation: z.string().optional(),
  pollingStationAddress: z.string().optional(),
  constituency: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional()
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Robustly sanitizes user input to prevent common prompt injection patterns.
 * Preserves the core intent while stripping structural attack keywords.
 */
function sanitizePrompt(input) {
  if (!input) return '';
  return input
    .replace(/<script.*?>.*?<\/script>/gi, '') // Remove script tags
    .replace(/\[\/?system\]/gi, '')           // Strip [system] override attempts
    .replace(/###\s*(system|instruction)/gi, '') // Strip markdown system blocks
    .replace(/<\|.*?\|>/g, '')               // Strip token-boundary injections
    .replace(/ignore previous instructions?/gi, '') // Classic injection phrase
    .trim();
}

/**
 * PRIVACY NOTICE: VoterPath processes PII in memory for extraction and enrichment only.
 * Data is not persisted. The 'rawText' from LLM is stripped before sending to client.
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
      const eci = await getEciData();
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const langMatch = prompt.match(/\[Please strictly answer in (\w+)\]/);
      const targetLang = langMatch ? langMatch[1] : 'English';

      const systemInstruction = `You are an expert AI assistant for VoterPath India 2026.
CRITICAL LANGUAGE RULE: You MUST respond ONLY in ${targetLang} language using its NATIVE SCRIPT.
- Use native script ONLY (not romanized).
- You are an ELECTION assistant ONLY. DO NOT answer unrelated questions.
- AUTH DATA: Source from Election Commission of India (ECI).
- Qualifying Date: ${eci.qualifyingDate}.
- States involved: ${Object.keys(eci.states).join(', ')}.
- Election Dates: ${JSON.stringify(eci.states)}`;

      const chat = model.startChat({
        history: history,
        generationConfig: { maxOutputTokens: 1000 },
      });

      const result = await chat.sendMessage(`${systemInstruction}\n\nUser Question: ${prompt}`);
      const response = await result.response;
      res.json({ text: response.text() });
    } catch (apiError) {
      console.warn("Gemini API Error:", apiError.message);
      res.status(503).json({ error: 'Election information service is temporarily unavailable. Please verify with eci.gov.in.' });
    }
  } catch (error) {
    next(error);
  }
};

const scanVoterID = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // MIME type allowlisting
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Unsupported file type. Please upload JPEG, PNG or WEBP.' });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const base64Data = req.file.buffer.toString('base64');
      
      const promptText = `Analyze this Indian Voter ID card image. Extract text and return ONLY a valid JSON object:
{
  "epic": "The EPIC number e.g. ABC1234567.",
  "name": "Full name.",
  "gender": "Male/Female.",
  "address": "Full address.",
  "pollingStation": "Name of polling station.",
  "pollingStationAddress": "Address of polling station.",
  "constituency": "Assembly constituency.",
  "state": "State name.",
  "city": "City/District."
}`;

      const result = await model.generateContent([
        promptText,
        {
          inlineData: {
            data: base64Data,
            mimeType: req.file.mimetype
          }
        }
      ]);

      const text = result.response.text() || "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const rawExtracted = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      
      // Strict schema validation for extracted data
      const extracted = extractedVoterSchema.parse(rawExtracted);

      const detectedState = resolveState(extracted.state, extracted.city, extracted.address, extracted.constituency);
      const election = detectedState ? (electionData[detectedState] || null) : null;
      const booth = resolveNearestBooth(extracted.constituency, extracted.city);

      const enrichedResult = {
        epic: extracted.epic || 'NOT_FOUND',
        epicValid: validateVoterIdFormat(extracted.epic),
        name: extracted.name || 'NOT_FOUND',
        gender: extracted.gender || null,
        address: extracted.address || null,
        pollingStation: extracted.pollingStation || null,
        pollingStationAddress: extracted.pollingStationAddress || null,
        constituency: extracted.constituency || null,
        detectedRegion: detectedState || (extracted.city || extracted.state || null),
        nearestBooth: extracted.pollingStation || booth,
        election: election
      };

      // SECURITY: We do NOT return 'rawText' to prevent exposing model internal reasoning or PII-heavy raw blocks.
      res.json({ result: enrichedResult });
    } catch (apiError) {
      console.warn("Gemini Vision API Error:", apiError.message);
      res.status(503).json({ error: 'OCR processing service is unavailable. Please enter details manually or try again later.' });
    }
  } catch (error) {
    next(error);
  }
};

function resolveState(state, city, address, constituency) {
  if (state && regionToState[state]) return regionToState[state];
  if (city && regionToState[city]) return regionToState[city];
  if (constituency) {
    for (const [key, val] of Object.entries(regionToState)) {
      if (constituency.toLowerCase().includes(key.toLowerCase())) return val;
    }
  }
  if (address) {
    for (const [key, val] of Object.entries(regionToState)) {
      if (address.toLowerCase().includes(key.toLowerCase())) return val;
    }
  }
  return null;
}

function resolveNearestBooth(constituency, city) {
  if (constituency) {
    for (const [key, val] of Object.entries(constituencyBooths)) {
      if (constituency.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(constituency.toLowerCase())) {
        return val;
      }
    }
  }
  if (city) {
    for (const [key, val] of Object.entries(constituencyBooths)) {
      if (key.toLowerCase().includes(city.toLowerCase())) {
        return val;
      }
    }
  }
  return null;
}

module.exports = { chatWithGemini, scanVoterID };
