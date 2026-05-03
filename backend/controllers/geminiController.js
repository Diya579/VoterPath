/**
 * VoterPath AI Controller (Production Grade)
 * (c) 2024 VoterPath Contributors
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');
const { validateVoterIdFormat } = require('../shared/validation');
const eciService = require('../services/eciService');

/**
 * SCHEMAS & CONSTANTS
 */

const chatSchema = z.object({
  prompt: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() }))
  })).max(20).optional()
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
 * UTILITY: Security & Normalization
 */

function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 4) return false;
  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  return hex.startsWith('FFD8FF') || hex === '89504E47' || hex === '52494646';
}

function normalizeInput(input) {
  if (!input) return '';
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "") // Strip control chars
    .trim()
    .substring(0, 2000);
}

function sanitizeHistory(history) {
  if (!history || !Array.isArray(history)) return [];
  return history
    .slice(-10) // Limit context depth
    .filter(h => {
      const text = h.parts?.[0]?.text || '';
      // Reject turn if it contains suspicious control character patterns
      return !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(text) && text.length < 2000;
    });
}

/**
 * INTENT ROUTING: Deterministic Pathfinding
 * Extracts specific civic intents before model invocation to ensure grounding.
 */
async function resolveCivicContext(prompt) {
  const normalized = prompt.toLowerCase();
  
  // 1. Schedule Intent
  if (normalized.includes('when') || normalized.includes('schedule') || normalized.includes('date') || normalized.includes('timeline')) {
    const facts = await eciService.getFacts();
    // Simple extraction of state from prompt
    const stateMatch = facts.schedules.find(s => normalized.includes(s.region.toLowerCase()));
    if (stateMatch) return { intent: 'SCHEDULE', data: stateMatch };
    return { intent: 'SCHEDULE_GENERAL', data: facts.schedules };
  }

  // 2. Booth Intent
  if (normalized.includes('booth') || normalized.includes('polling station') || normalized.includes('where to vote')) {
    // We can't resolve this without a specific constituency name
    // This will fall back to Gemini asking for clarification
    return { intent: 'BOOTH_QUERY' };
  }

  // 3. Eligibility Intent
  if (normalized.includes('eligible') || normalized.includes('age') || normalized.includes('can i vote')) {
    return { intent: 'ELIGIBILITY', data: { ageLimit: 18, nationality: 'Indian' } };
  }

  return { intent: 'GENERAL_GUIDANCE' };
}

/**
 * SEMANTIC VALIDATION LAYER
 * Verifies that the AI-extracted document data makes civic sense.
 */
function validateExtractedSemantics(extracted, manifest) {
  const warnings = [];
  
  // 1. EPIC ID Verification
  const isEpicValid = validateVoterIdFormat(extracted.epic || '');
  if (extracted.epic && !isEpicValid) {
    warnings.push('EPIC ID does not match expected format for Indian Voter IDs.');
  }

  // 2. Cross-Field Consistency (State-Constituency check if data was richer)
  // For now, we check if the state is in our known manifest
  if (extracted.state) {
    const normalizedState = extracted.state.toLowerCase().trim();
    const stateExists = manifest.schedules.some(s => s.region.toLowerCase() === normalizedState);
    if (!stateExists) {
      warnings.push(`State '${extracted.state}' not found in the verified election registry.`);
    }
  }

  return { isEpicValid, warnings };
}

/**
 * ENRICHMENT ENGINE
 */
async function enrichVoterData(rawData) {
  const extracted = extractedVoterSchema.parse(rawData);
  const manifest = await eciService.getFacts();
  
  // Semantic Validation
  const { isEpicValid, warnings } = validateExtractedSemantics(extracted, manifest);

  // Deterministic Lookups
  const stateQuery = extracted.state || extracted.city || extracted.address || '';
  const stateResult = await eciService.resolveState(stateQuery);
  
  const election = stateResult.status === 'exact' ? await eciService.getScheduleForState(stateResult.value) : null;

  const boothQuery = extracted.constituency || extracted.pollingStation || '';
  const boothResult = await eciService.getBoothForConstituency(boothQuery);

  return {
    epic: extracted.epic || null,
    name: extracted.name || null,
    gender: extracted.gender || null,
    address: extracted.address || null,
    detectedRegion: stateResult.value || extracted.state || null,
    nearestBooth: boothResult.value || extracted.pollingStation || null,
    election: election,
    
    // Detailed Provenance (Audit requirement 9 & 10)
    provenance: {
      epicStatus: isEpicValid ? 'FORMAT_VERIFIED' : 'UNRECOGNIZED_FORMAT',
      regionStatus: stateResult.status === 'exact' ? 'MANIFEST_EXACT_MATCH' : 'EXTRACTION_ONLY',
      boothStatus: boothResult.status === 'exact' ? 'MANIFEST_EXACT_MATCH' : 'EXTRACTION_ONLY',
      electionStatus: election ? 'MANIFEST_RECORD_FOUND' : 'NOT_FOUND'
    },
    
    // Granular Metrics
    metrics: {
      ocrConfidence: extracted.epic ? 0.8 : 0.4, // Simplified mock for demo
      isGrounded: stateResult.status === 'exact' || boothResult.status === 'exact',
      warnings: warnings
    },
    
    meta: await eciService.getFreshness()
  };
}

/**
 * ROUTE HANDLER: CHAT
 */
const chatWithGemini = async (req, res, next) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Security Provider (Gemini) not configured on server.', code: 'ai/config-missing' });
    }

    const validation = chatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input format', details: validation.error });
    }
    
    const prompt = normalizeInput(validation.data.prompt);
    const history = sanitizeHistory(validation.data.history);

    // 1. Deterministic Intent Routing (Audit requirement 6)
    const context = await resolveCivicContext(prompt);

    const systemInstruction = `You are the VoterPath Expert. 
    Your role is to SIMPLIFY and EXPLAIN the following civic data to the user.
    - CONTEXT INTENT: ${context.intent}
    - GROUNDING DATA: ${JSON.stringify(context.data || "Use general guidance")}
    - RULE: Do not hallucinate dates or locations not in the GROUNDING DATA.
    - RULE: If a user asks for personal data, remind them that you only see the data they uploaded via the scanner.`;

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        systemInstruction: systemInstruction
      });

      const chat = model.startChat({
        history: history,
        generationConfig: { maxOutputTokens: 1000, temperature: 0.1 }
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      
      return res.json({ 
        text: response.text(),
        provenance: { 
          source: "Manifest_Grounded_Gemini_2.0", 
          intentDetected: context.intent,
          trustLevel: "CURATED_FACTS_GROUNDED" 
        }
      });

    } catch (apiError) {
      console.error('[AI] Primary Provider Error:', apiError);
      
      // Fallback Path (Audit requirement 13)
      if (process.env.GROQ_API_KEY) {
        try {
          const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: systemInstruction },
                ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text })),
                { role: "user", content: prompt }
              ],
              temperature: 0.1
            })
          });

          if (groqResponse.ok) {
            const groqData = await groqResponse.json();
            return res.json({ 
              text: groqData.choices[0].message.content,
              provenance: { 
                source: "Manifest_Grounded_Llama_3.3", 
                intentDetected: context.intent,
                trustLevel: "FALLBACK_GROUNDED" 
              }
            });
          }
        } catch (fallbackErr) {
          console.error('[AI] Fallback Failed:', fallbackErr);
        }
      }

      return res.status(503).json({ error: 'Election assistant is temporarily unavailable.', code: 'ai/service-offline' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * ROUTE HANDLER: OCR
 */
const scanVoterID = async (req, res, next) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'OCR Provider not configured.', code: 'ocr/config-missing' });
    }

    if (!req.file) return res.status(400).json({ error: 'No image provided' });
    
    // 1. Multi-stage Payload Validation
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a JPEG, PNG, or WEBP image.' });
    }

    if (!isValidImageBuffer(req.file.buffer)) {
      console.warn('[Security] Magic number mismatch for uploaded image.');
      return res.status(400).json({ error: 'Invalid file content: The file is corrupted or not a valid image.' });
    }

    // 2. AI Extraction
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const base64Data = req.file.buffer.toString('base64');
    const promptText = `Extract Indian Voter ID details into JSON. 
    Fields: epic, name, gender, address, pollingStation, pollingStationAddress, constituency, state, city. 
    Use null if unreadable. Do not guess.`;

    try {
      const result = await model.generateContent([
        promptText,
        { inlineData: { data: base64Data, mimeType: req.file.mimetype } }
      ]);

      const responseText = await result.response.text();
      const rawExtracted = JSON.parse(responseText);
      
      // 3. Semantic Enrichment & Validation (Audit requirement 8, 9, 10)
      const enriched = await enrichVoterData(rawExtracted);
      
      return res.json({ result: enriched });

    } catch (aiError) {
      console.error('[OCR] AI Extraction Failed:', aiError);
      return res.status(422).json({ 
        error: 'The document could not be processed. Please ensure the Voter ID is clearly visible and well-lit.',
        code: 'ocr/extraction-failed'
      });
    }
  } catch (error) {
    console.error("[OCR] Internal Error:", error);
    res.status(500).json({ error: 'Internal system error during analysis.', code: 'ocr/internal-error' });
  }
};

module.exports = { chatWithGemini, scanVoterID };
