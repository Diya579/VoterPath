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
 * @param {string} input 
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
 * Helper to enrich extracted voter data with authoritative ECI facts.
 * @param {any} rawData 
 */
async function enrichVoterData(rawData) {
  const extracted = extractedVoterSchema.parse(rawData);
  const detectedState = await eciService.resolveState(extracted.state || extracted.city || extracted.address || '');
  const election = detectedState ? await eciService.getScheduleForState(detectedState) : null;
  const booth = await eciService.getBoothForConstituency(extracted.constituency || extracted.pollingStation || '');

  return {
    epic: extracted.epic || null,
    epicValid: validateVoterIdFormat(extracted.epic || ''),
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
}

/**
 * Controller for AI-powered conversational guidance.
 * Grounded in authoritative ECI facts.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
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
- CONTEXT: ${JSON.stringify(facts.schedules)}`;

      const chat = model.startChat({
        history: history,
        generationConfig: { maxOutputTokens: 1000 },
      });

      const result = await chat.sendMessage(`${systemInstruction}\n\nUser: ${prompt}`);
      const response = await result.response;
      return res.json({ text: response.text() });
    } catch (apiError) {
      const err = apiError instanceof Error ? apiError : new Error(String(apiError));
      // @ts-ignore
      const isQuotaError = err.status === 429 || err.message.includes('429') || err.message.includes('quota');

      // FALLBACK TO GROQ: If Gemini hits 429 (Rate Limit)
      if (isQuotaError && process.env.GROQ_API_KEY) {
        console.warn('[Chat] Gemini Quota Exceeded. Falling back to Groq Llama-3.3...');
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
                { role: "system", content: "You are the VoterPath Expert. Grounded in ECI facts. Answer in the requested language/script." },
                ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text })),
                { role: "user", content: prompt }
              ],
              max_tokens: 1000
            })
          });
          
          if (groqResponse.ok) {
            const groqData = await groqResponse.json();
            return res.json({ text: groqData.choices[0].message.content });
          } else {
            const errorText = await groqResponse.text();
            console.error('[Chat] Groq Fallback failed status:', groqResponse.status, errorText);
          }
        } catch (groqErr) {
          console.error('[Chat] Groq Fallback failed:', groqErr);
        }
      }

      console.error("Gemini Chat API Error:", err.stack || err.message);
      res.status(503).json({ 
        error: isQuotaError 
          ? 'Service is heavily loaded. Please try again in a few seconds.' 
          : (err.message || 'Election information service is temporarily unavailable.')
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for Voter ID OCR and data enrichment.
 * Uses Gemini JSON mode for reliable structural extraction.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const scanVoterID = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Unsupported file type. JPEG, PNG, WEBP only.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
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

    // Exponential Backoff Retry Logic
    let attempts = 0;
    const maxAttempts = 3;
    let delay = 2000;

    while (attempts < maxAttempts) {
      try {
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
        
        // Handle Safety Filter Blocks
        if (response.promptFeedback?.blockReason) {
          throw new Error(`The image was blocked by the safety filter: ${response.promptFeedback.blockReason}`);
        }

        const rawText = response.text();
        let rawExtracted;
        try {
          rawExtracted = JSON.parse(rawText);
        } catch (parseErr) {
          console.error("JSON Parse Error in Vision Output:", rawText);
          throw new Error('Failed to parse extraction results. The image might be unreadable.');
        }
        
        // Validation & Enrichment
        const enrichedResult = await enrichVoterData(rawExtracted);
        return res.json({ result: enrichedResult });

      } catch (apiError) {
        const err = apiError instanceof Error ? apiError : new Error(String(apiError));
        // @ts-ignore
        const isQuotaError = err.status === 429 || err.message.includes('429') || err.message.includes('quota');
        attempts++;

        // FALLBACK TO GROQ VISION: If Gemini hits 429
        if (isQuotaError && process.env.GROQ_API_KEY) {
          console.warn('[OCR] Gemini quota hit. Attempting Groq Llama-3.2-Vision fallback...');
          try {
            const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: [
                  {
                    role: "user",
                    content: [
                      { type: "text", text: promptText },
                      {
                        type: "image_url",
                        image_url: { url: `data:${req.file.mimetype};base64,${base64Data}` }
                      }
                    ]
                  }
                ],
                response_format: { type: "json_object" }
              })
            });

            if (groqResponse.ok) {
              const groqData = await groqResponse.json();
              const groqRaw = JSON.parse(groqData.choices[0].message.content);
              const enriched = await enrichVoterData(groqRaw);
              return res.json({ result: enriched });
            } else {
              const errorText = await groqResponse.text();
              console.error('[OCR] Groq Fallback failed with status:', groqResponse.status, errorText);
            }
          } catch (groqErr) {
            console.error('[OCR] Groq Fallback Exception:', groqErr);
          }
        }

        if (isQuotaError && attempts < maxAttempts) {
          console.warn(`[OCR] Gemini Rate limit hit. Retrying in ${delay}ms... (Attempt ${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        console.error("OCR API Error:", err.stack || err.message);
        const status = err.message.includes('GEMINI_API_KEY') ? 500 : 503;
        return res.status(status).json({ 
          error: isQuotaError 
            ? 'The AI analysis service is busy. Retrying automatically...' 
            : (err.message || 'OCR processing service is unavailable.')
        });
      }
    }
  } catch (error) {
    console.error("Unhandled OCR Controller Error:", error);
    next(error);
  }
};

module.exports = { chatWithGemini, scanVoterID };
