import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly from the project directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Memory storage for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// Safe startup logging (NEVER printing secret API keys)
console.log('Server port:', PORT);
console.log(
  'Groq API key configured:',
  Boolean(
    process.env.GROQ_API_KEY &&
    process.env.GROQ_API_KEY.trim() !== ''
  )
);
console.log(
  'Groq Vision model:',
  process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b'
);

// Helper to check Groq API configuration
const getGroqApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;

  if (
    !apiKey ||
    apiKey.trim() === '' ||
    apiKey === 'your_groq_api_key_here'
  ) {
    return null;
  }

  return apiKey.trim();
};

// ============================================================
// GROQ API CALL WITH ABORT CONTROLLER & BOUNDED RETRY (429/5XX ONLY)
// ============================================================

const callGroqApi = async (groqReqBody, groqApiKey, attempt = 1) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  let response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(groqReqBody),
      signal: controller.signal
    });
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    if (fetchErr.name === 'AbortError') {
      const timeoutErr = new Error('Groq API request timed out after 25s');
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    throw fetchErr;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text();
    let groqErrObj = {};
    try {
      groqErrObj = JSON.parse(errText);
    } catch (_) {}

    const groqErrorMsg = groqErrObj.error?.message || errText || 'Unknown Groq API error';
    const groqErrorType = groqErrObj.error?.type || 'groq_api_error';
    const groqErrorCode = groqErrObj.error?.code || response.status;
    const safeResponseText = errText.length > 1000 ? errText.substring(0, 1000) + '...' : errText;

    // Log explicit, safe error details for Render (NEVER logging API key)
    console.error(`[AIR WORLD GROQ ERROR] Status: ${response.status}`);
    console.error(`[AIR WORLD GROQ ERROR] Response: ${safeResponseText}`);
    console.error(`[AIR WORLD GROQ ERROR] Message: ${groqErrorMsg}`);
    console.error(`[AIR WORLD GROQ ERROR] Type: ${groqErrorType}`);
    console.error(`[AIR WORLD GROQ ERROR] Code: ${groqErrorCode}`);

    // Retry ONLY for transient rate limits (429) or server errors (5xx) once after 1.5s
    // DO NOT retry HTTP 400
    if ((response.status === 429 || response.status >= 500) && attempt === 1) {
      console.warn(`[AIR WORLD SERVER] Groq returned transient status ${response.status}. Retrying attempt 2 in 1.5s...`);
      await new Promise(r => setTimeout(r, 1500));
      return callGroqApi(groqReqBody, groqApiKey, 2);
    }

    const err = new Error(groqErrorMsg);
    err.status = response.status;
    err.groqType = groqErrorType;
    err.groqCode = groqErrorCode;
    throw err;
  }

  return await response.json();
};

// ============================================================
// POST /api/recognize-snack
// ============================================================

app.post(
  '/api/recognize-snack',
  upload.single('image'),
  async (req, res) => {
    console.log('[AIR WORLD SERVER] Recognition request received');

    try {
      // 1. Check uploaded image file
      if (!req.file || !req.file.buffer) {
        console.warn('[AIR WORLD SERVER] Upload request received without image file.');
        return res.status(400).json({
          error: 'Groq recognition failed',
          details: 'Missing req.file or image buffer',
          packetDetected: false
        });
      }

      // 2. Determine and log safe image payload diagnostics
      let mimeType = req.file.mimetype || 'image/jpeg';
      if (!mimeType.startsWith('image/')) {
        mimeType = 'image/jpeg';
      }

      const base64Image = req.file.buffer.toString('base64');
      const imageSizeKb = Math.round(req.file.size / 1024);

      console.log(`[AIR WORLD GROQ DEBUG] Image MIME type: ${mimeType}`);
      console.log(`[AIR WORLD GROQ DEBUG] Image size: ${imageSizeKb} KB`);
      console.log(`[AIR WORLD GROQ DEBUG] Base64 length: ${base64Image.length}`);

      if (!base64Image || base64Image.length < 100) {
        console.warn('[AIR WORLD SERVER] Converted base64 image string is invalid or empty.');
        return res.status(400).json({
          error: 'Groq recognition failed',
          details: 'Base64 image conversion produced empty string',
          packetDetected: false
        });
      }

      // 3. Check Groq API key
      const groqApiKey = getGroqApiKey();
      if (!groqApiKey) {
        console.warn('[AIR WORLD SERVER] GROQ_API_KEY is missing or unconfigured.');
        return res.status(503).json({
          error: 'Groq recognition failed',
          details: 'GROQ_API_KEY environment variable is not set',
          configured: false,
          packetDetected: false
        });
      }

      const selectedModel = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';

      // 4. Prepare AI Prompt
      const promptText = `
You are AIR WORLD's universal snack recognition system.

Analyze the provided image and determine if a packaged food or snack product is visible.

Potential categories include: chips, biscuits, chocolate, cookies, instant noodles, cereal, packaged snacks, namkeen, other packaged food.

CRITICAL INSTRUCTIONS:
- Do NOT assume a specific brand unless clearly visible.
- Use generic terms ("Unknown packaged snack", "Chips", "Biscuits", "Packaged food") if uncertain.
- "confidence" MUST be a number between 0.0 and 1.0.
- "description" MUST be very concise (max 15 words).
- Set "packetDetected" to true ONLY if a packaged food/snack item is detected. If non-food, set to false.

RESPONSE FORMAT REQUIREMENTS:
- Output ONLY a raw, unformatted JSON object.
- Do NOT use markdown code blocks (no \`\`\` or \`\`\`json).
- Do NOT add preamble or postscript text.
- Start directly with { and end with }.

Target JSON Schema:
{
  "productName": "string",
  "brand": "string or null",
  "category": "string",
  "confidence": 0.95,
  "description": "string (brief)",
  "packetDetected": true
}
`;

      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      const groqReqBody = {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are AIR WORLD universal snack recognition AI. Output ONLY raw JSON matching the schema.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: {
          type: 'json_object'
        }
      };

      console.log(`[AIR WORLD SERVER] Calling Groq Vision API (model: ${selectedModel})...`);

      let groqData;
      try {
        groqData = await callGroqApi(groqReqBody, groqApiKey, 1);
      } catch (apiError) {
        const status = apiError.status || 502;
        const msg = apiError.message || 'Groq Vision API call failed';

        if (status === 400) {
          return res.status(400).json({
            error: 'Groq recognition failed',
            details: `Groq invalid request (400): ${msg}`,
            packetDetected: false
          });
        }

        if (status === 401 || status === 403) {
          return res.status(503).json({
            error: 'Groq recognition failed',
            details: `Groq authentication/authorization error (${status}): ${msg}`,
            packetDetected: false
          });
        }

        if (status === 429) {
          return res.status(429).json({
            error: 'Groq recognition failed',
            details: `Groq rate limit exceeded (429): ${msg}`,
            packetDetected: false
          });
        }

        if (status === 504) {
          return res.status(504).json({
            error: 'Groq recognition failed',
            details: `Groq request timed out (504): ${msg}`,
            packetDetected: false
          });
        }

        return res.status(502).json({
          error: 'Groq recognition failed',
          details: `Groq API error (${status}): ${msg}`,
          packetDetected: false
        });
      }

      // ========================================================
      // PARSE & VALIDATE GROQ RESPONSE
      // ========================================================

      const rawContent = groqData.choices?.[0]?.message?.content || '';
      console.log('[AIR WORLD SERVER] Groq Vision response content received successfully.');

      const cleanedJson = rawContent
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      let parsedResult;
      try {
        parsedResult = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error('[AIR WORLD SERVER] Failed to parse JSON from Groq response:', parseError.message);
        console.error('[AIR WORLD SERVER] Unparseable raw text:', rawContent);

        return res.status(500).json({
          error: 'Groq recognition failed',
          details: 'JSON parse error on AI response',
          packetDetected: false
        });
      }

      const validatedResult = {
        productName: typeof parsedResult.productName === 'string' && parsedResult.productName.trim() !== ''
          ? parsedResult.productName.trim()
          : 'Unknown Packaged Snack',
        brand: typeof parsedResult.brand === 'string' && parsedResult.brand.trim() !== ''
          ? parsedResult.brand.trim()
          : 'Unknown',
        category: typeof parsedResult.category === 'string' && parsedResult.category.trim() !== ''
          ? parsedResult.category.trim()
          : 'Packaged Snack',
        confidence: typeof parsedResult.confidence === 'number' && !isNaN(parsedResult.confidence)
          ? Math.min(1, Math.max(0, parsedResult.confidence))
          : 0.85,
        description: typeof parsedResult.description === 'string' && parsedResult.description.trim() !== ''
          ? parsedResult.description.trim()
          : 'Suspicious packaging detected.',
        packetDetected: Boolean(parsedResult.packetDetected)
      };

      console.log('[AIR WORLD SERVER] Validated Snack Result:', validatedResult);
      return res.json(validatedResult);

    } catch (error) {
      console.error('[AIR WORLD SERVER] Server endpoint anomaly:', {
        name: error.name,
        message: error.message
      });

      return res.status(500).json({
        error: 'Groq recognition failed',
        details: error.message,
        packetDetected: false
      });
    }
  }
);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  const hasKey = Boolean(
    process.env.GROQ_API_KEY &&
    process.env.GROQ_API_KEY.trim() !== ''
  );

  res.json({
    status: 'online',
    service: 'AIR WORLD Groq Vision API Gateway',
    groqConfigured: hasKey,
    model: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b'
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AIR WORLD Server] Running on port ${PORT}`);
});