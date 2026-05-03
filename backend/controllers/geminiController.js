const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');
const { validateVoterIdFormat } = require('../shared/validation');
const eciService = require('../services/eciService');

/**
 * PRODUCTION-GRADE AI CONTROLLER
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
 * Validates the magic numbers of the buffer to ensure it's a real image.
 * Prevents script-masquerading-as-image attacks.
 * @param {Buffer} buffer 
 */
function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 4) return false;
  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  // JPEG: FFD8FF, PNG: 89504E47, WEBP: 52494646 (RIFF)
  return hex.startsWith('FFD8FF') || hex === '89504E47' || hex === '52494646';
}

function sanitizePrompt(input) {
  if (!input) return '';
  let sanitized = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    .replace(/<\|.*?\|>/g, "")
    .trim();

  const adversarialPatterns = [
    /ignore (all )?previous instructions?/gi,
    /system_instruction/gi,
    /you are now/gi,
    /### system/gi,
    /\[system\]/gi,
    /forget (your )?purpose/gi,
    /reset (all )?settings/gi,
    /switch to (developer|root|debug) mode/gi,
    /new rules:/gi,
    /stop being an assistant/gi
  ];

  adversarialPatterns.forEach(pattern => {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, "[POLICIED_REDACTION]");
    }
  });

  return sanitized.substring(0, 2000);
}

async function enrichVoterData(rawData) {
  const extracted = extractedVoterSchema.parse(rawData);
  const provenanceMap = {};

  const stateQuery = extracted.state || extracted.city || extracted.address || '';
  const resolvedState = await eciService.resolveState(stateQuery);
  provenanceMap.state = resolvedState ? 'AUTHORITATIVE_MATCH' : 'EXTRACTION_ONLY';

  const election = resolvedState ? await eciService.getScheduleForState(resolvedState) : null;
  provenanceMap.election = election ? 'AUTHORITATIVE_RECORD' : 'NOT_FOUND';

  const boothQuery = extracted.constituency || extracted.pollingStation || '';
  const resolvedBooth = await eciService.getBoothForConstituency(boothQuery);
  provenanceMap.booth = resolvedBooth ? 'AUTHORITATIVE_MATCH' : 'EXTRACTION_ONLY';

  const isEpicValid = validateVoterIdFormat(extracted.epic || '');
  provenanceMap.epic = isEpicValid ? 'FORMAT_VERIFIED' : 'UNRECOGNIZED_FORMAT';

  let confidence = 0.5;
  if (isEpicValid) confidence += 0.25;
  if (resolvedState) confidence += 0.1;
  if (resolvedBooth) confidence += 0.1;

  return {
    epic: extracted.epic || null,
    epicValid: isEpicValid,
    name: extracted.name || null,
    gender: extracted.gender || null,
    address: extracted.address || null,
    pollingStation: extracted.pollingStation || null,
    pollingStationAddress: extracted.pollingStationAddress || null,
    constituency: extracted.constituency || null,
    detectedRegion: resolvedState || (extracted.city || extracted.state || null),
    nearestBooth: resolvedBooth || extracted.pollingStation || null,
    election: election,
    provenance: provenanceMap,
    meta: {
      ...await eciService.getFreshness(),
      extractionConfidence: parseFloat(confidence.toFixed(2))
    }
  };
}

const chatWithGemini = async (req, res, next) => {
  try {
    const validation = chatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input format', details: validation.error });
    }
    
    const { prompt: rawPrompt, history = [] } = validation.data;
    const prompt = sanitizePrompt(rawPrompt);

    const langMatch = prompt.match(/\[Please strictly answer in (\w+)\]/);
    const targetLang = langMatch ? langMatch[1] : 'English';

    const facts = await eciService.getFacts();
    const systemInstruction = `You are the VoterPath Expert, a cryptographically grounded election assistant.
    - CORE MANDATE: Provide deterministic guidance based on the ECI Authoritative Layer.
    - LANGUAGE RULE: Strictly use ${targetLang} language and its native script.
    - GROUNDING DATA: ${JSON.stringify(facts.schedules)}
    - LIMITATION: If a fact is not in the grounding data, state that you don't have that specific official detail. Do not hallucinate dates.`;

    try {
      if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY_MISSING');

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        systemInstruction: systemInstruction
      });

      const chat = model.startChat({
        history: history.slice(-10),
        generationConfig: { maxOutputTokens: 1000, temperature: 0.1 }
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      return res.json({ 
        text: response.text(),
        provenance: { source: "ECI_Grounded_Gemini_2.0", trustLevel: "FACT_GROUNDED" }
      });

    } catch (apiError) {
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
                ...history.slice(-5).map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text })),
                { role: "user", content: prompt }
              ],
              temperature: 0.1
            })
          });

          if (groqResponse.ok) {
            const groqData = await groqResponse.json();
            return res.json({ 
              text: groqData.choices[0].message.content,
              provenance: { source: "ECI_Grounded_Llama_3.3", trustLevel: "FALLBACK_GROUNDED" }
            });
          }
        } catch (fallbackErr) {
          console.error('[Chat] Fallback failed:', fallbackErr);
        }
      }

      res.status(503).json({ error: 'Election assistant is temporarily overloaded. Please try again in 30 seconds.' });
    }
  } catch (error) {
    next(error);
  }
};

const scanVoterID = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });
    
    // 1. MIME Type Check
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Unsupported file type. JPEG, PNG, WEBP only.' });
    }

    // 2. Magic Number Buffer Validation (Security Hardening)
    if (!isValidImageBuffer(req.file.buffer)) {
      return res.status(400).json({ error: 'Malicious file detected: Content does not match MIME type.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const base64Data = req.file.buffer.toString('base64');
    const promptText = `Extract Indian Voter ID details into JSON. Fields: epic, name, gender, address, pollingStation, pollingStationAddress, constituency, state, city. Use null if unreadable.`;

    const result = await model.generateContent([
      promptText,
      { inlineData: { data: base64Data, mimeType: req.file.mimetype } }
    ]);

    const rawExtracted = JSON.parse(await result.response.text());
    const enriched = await enrichVoterData(rawExtracted);
    
    return res.json({ result: enriched });
  } catch (error) {
    console.error("OCR Error:", error);
    res.status(500).json({ error: 'Voter ID analysis failed. Ensure the image is clear and try again.' });
  }
};

module.exports = { chatWithGemini, scanVoterID };
