import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly from the project directory before reading process.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Memory storage for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Safe diagnostic logging on startup (NEVER printing secret keys)
console.log('Server port:', PORT);
console.log('Groq API key configured:', Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== ''));
console.log('Groq Vision model:', process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b');

// Helper to check Groq API configuration
const getGroqApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_groq_api_key_here') {
    return null;
  }
  return apiKey.trim();
};

// POST /api/recognize-snack
app.post('/api/recognize-snack', upload.single('image'), async (req, res) => {
  console.log('[AIR WORLD SERVER] Recognition request received');

  try {
    if (!req.file) {
      console.warn('[AIR WORLD SERVER] Upload request received without image file.');
      return res.status(400).json({
        error: 'Invalid snack image. No image file uploaded.',
        packetDetected: false
      });
    }

    console.log(`[AIR WORLD SERVER] Image received (${Math.round(req.file.size / 1024)} KB, mime: ${req.file.mimetype})`);

    const groqApiKey = getGroqApiKey();
    if (!groqApiKey) {
      console.warn('[AIR WORLD SERVER] GROQ_API_KEY is missing or unconfigured in .env');
      return res.status(503).json({
        error: 'The snack scientists are currently unavailable. Groq API key is not configured on the server. Please set GROQ_API_KEY in .env file.',
        configured: false,
        packetDetected: false
      });
    }

    const mimeType = req.file.mimetype || 'image/jpeg';
    const base64Image = req.file.buffer.toString('base64');
    const selectedModel = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';

    const promptText = `
You are AIR WORLD's universal snack recognition system.
Analyze the provided image and determine if a packaged food or snack product is visible.
Potential categories include chips, biscuits, chocolate, cookies, instant noodles, cereal, packaged snacks, namkeen, or other packaged food items.

CRITICAL INSTRUCTIONS:
- Do NOT assume a specific brand unless it is clearly visible in the image.
- If the exact product or brand cannot be determined with confidence, do NOT hallucinate. Return generic terms like "Unknown packaged snack", "Chips", "Biscuits", or "Packaged food".
- "confidence" MUST be a number between 0.0 and 1.0.
- Set "packetDetected" to true ONLY if a packaged food/snack item is detected. If it's a hand, table, room, or non-food object, set "packetDetected" to false.

Return ONLY a raw JSON object matching this schema:
{
  "productName": "string",
  "brand": "string | null",
  "category": "string",
  "confidence": 0.95,
  "description": "string",
  "packetDetected": true
}
`;

    console.log(`[AIR WORLD SERVER] Calling Groq Vision API (model: ${selectedModel})...`);

    // Helper to send request to Groq API
    const fetchGroqVision = async () => {
      const groqReqBody = {
        model: selectedModel,
        messages: [
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
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        response_format: {
          type: 'json_object'
        }
      };

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(groqReqBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[AIR WORLD SERVER] Groq API returned status ${response.status}:`, errText);
        
        // Automatic fallback retry with llama-3.2-11b-vision-preview if rate limited (429), bad request (400), or missing model (404)
        if ((response.status === 429 || response.status === 400 || response.status === 404) && selectedModel !== 'llama-3.2-11b-vision-preview') {
          console.warn('[AIR WORLD SERVER] Retrying with fallback model llama-3.2-11b-vision-preview...');
          groqReqBody.model = 'llama-3.2-11b-vision-preview';
          delete groqReqBody.response_format;

          const fallbackRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(groqReqBody)
          });
          if (!fallbackRes.ok) {
            const fallbackErr = await fallbackRes.text();
            console.error(`[AIR WORLD SERVER] Fallback Groq API status ${fallbackRes.status}:`, fallbackErr);
            throw new Error(`Groq API error (status ${fallbackRes.status})`);
          }
          return await fallbackRes.json();
        }

        throw new Error(`Groq API error (status ${response.status})`);
      }

      return await response.json();
    };

    // Server-side 25s Promise.race timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('GROQ_TIMEOUT')), 25000);
    });

    let groqData;
    try {
      groqData = await Promise.race([
        fetchGroqVision(),
        timeoutPromise
      ]);
    } catch (apiError) {
      if (apiError.message === 'GROQ_TIMEOUT') {
        console.warn('[AIR WORLD SERVER] Groq Vision request timed out after 25s.');
        return res.status(504).json({
          error: 'Groq request timed out.',
          details: 'Server timeout after 25s',
          packetDetected: false
        });
      }

      console.error('[AIR WORLD SERVER] Groq API request failed:', apiError.message);
      return res.status(502).json({
        error: 'The snack scientists are currently unavailable.',
        details: apiError.message || 'Groq Vision API call failed',
        packetDetected: false
      });
    }

    const rawContent = groqData.choices?.[0]?.message?.content || '';
    console.log('[AIR WORLD SERVER] Groq Vision response content received successfully.');

    // Clean up markdown code block wrapper formatting if present
    const cleanedJson = rawContent
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('[AIR WORLD SERVER] Failed to parse JSON from Groq response:', parseError);
      console.error('[AIR WORLD SERVER] Unparseable raw text:', rawContent);
      return res.status(500).json({
        error: 'Malformed response received from AI recognition model.',
        details: 'JSON parse error',
        packetDetected: false
      });
    }

    const validatedResult = {
      productName: parsedResult.productName || 'Unknown Packaged Snack',
      brand: parsedResult.brand || 'Unknown',
      category: parsedResult.category || 'Packaged Snack',
      confidence: typeof parsedResult.confidence === 'number' 
        ? Math.min(1, Math.max(0, parsedResult.confidence))
        : 0.85,
      description: parsedResult.description || 'Suspicious packaging detected.',
      packetDetected: Boolean(parsedResult.packetDetected)
    };

    console.log('[AIR WORLD SERVER] Validated Snack Result:', validatedResult);
    return res.json(validatedResult);

  } catch (error) {
    console.error('[AIR WORLD SERVER] Server endpoint error:', {
      name: error.name,
      message: error.message
    });
    return res.status(500).json({
      error: 'The snack scientists encountered a server anomaly.',
      details: error.message,
      packetDetected: false
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '');
  res.json({
    status: 'online',
    service: 'AIR WORLD Groq Vision API Gateway',
    groqConfigured: hasKey,
    model: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b'
  });
});

// Production Static File Serving
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`[AIR WORLD Server] Running on http://localhost:${PORT}`);
});
