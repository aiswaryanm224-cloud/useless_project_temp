import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

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

// Safe diagnostic logging on startup (NEVER printing the key itself)
console.log('Server port:', process.env.PORT || 3001);
console.log('Gemini API key configured:', Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''));

// Helper to initialize Gemini SDK client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// POST /api/recognize-snack
app.post('/api/recognize-snack', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.warn('[AIR WORLD Server] Upload request received without image file.');
      return res.status(400).json({
        error: 'No image file uploaded.',
        packetDetected: false
      });
    }

    console.log(`[AIR WORLD Server] Image file received: ${Math.round(req.file.size / 1024)} KB, mime: ${req.file.mimetype}`);

    const ai = getGeminiClient();
    if (!ai) {
      console.warn('[AIR WORLD Server] GEMINI_API_KEY is missing or unconfigured in .env');
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in .env file.',
        configured: false,
        packetDetected: false
      });
    }

    // Convert uploaded buffer to inlineData base64 object for Gemini
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype || 'image/jpeg'
      }
    };

    const promptText = `
You are AIR WORLD's universal snack recognition system.
Analyze the provided image and determine if a packaged food or snack product is visible.
Potential categories include chips, biscuits, chocolate, cookies, instant noodles, cereal, packaged snacks, or other packaged food items.

CRITICAL INSTRUCTIONS:
- Do NOT assume a specific brand unless it is clearly visible in the image.
- If the exact product or brand cannot be determined with confidence, do NOT hallucinate. Return generic terms like "Snack packet", "Chips", "Biscuits", or "Packaged food".
- "confidence" MUST be a number between 0.0 and 1.0.
- Set "packetDetected" to true ONLY if a packaged food/snack item is detected. If it's a hand, table, room, or non-food object, set "packetDetected" to false.

Return ONLY a raw JSON object with NO markdown, NO code block formatting, matching this schema:
{
  "productName": "string",
  "brand": "string | null",
  "category": "string",
  "confidence": 0.95,
  "description": "string",
  "packetDetected": true
}
`;

    console.log('[AIR WORLD Server] Invoking Gemini Vision API (model: gemini-2.0-flash)...');

    // Use supported vision-capable model gemini-2.0-flash
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [imagePart, promptText]
      });
    } catch (apiError) {
      console.error('[AIR WORLD Server] Gemini SDK generateContent call failed:', {
        name: apiError.name,
        message: apiError.message,
        status: apiError.status,
        statusCode: apiError.statusCode || apiError.code
      });
      return res.status(500).json({
        error: 'The snack scientists encountered an issue analyzing the packet.',
        details: apiError.message || 'Gemini API call failed',
        packetDetected: false
      });
    }

    const responseText = response.text || '';
    console.log('[AIR WORLD Server] Gemini Vision response text received successfully.');

    // Clean up markdown wrapper formatting if present
    const cleanedJson = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('[AIR WORLD Server] Failed to parse JSON from AI response:', parseError);
      console.error('[AIR WORLD Server] Unparseable raw text:', responseText);
      return res.status(500).json({
        error: 'Malformed response received from AI recognition model.',
        details: 'JSON parse error',
        packetDetected: false
      });
    }

    const validatedResult = {
      productName: parsedResult.productName || 'Unidentified Snack Packet',
      brand: parsedResult.brand || null,
      category: parsedResult.category || 'Packaged Snack',
      confidence: typeof parsedResult.confidence === 'number' 
        ? Math.min(1, Math.max(0, parsedResult.confidence))
        : 0.85,
      description: parsedResult.description || 'Suspicious packaging detected.',
      packetDetected: Boolean(parsedResult.packetDetected)
    };

    console.log('[AIR WORLD Server] Validated Snack Result:', validatedResult);
    return res.json(validatedResult);

  } catch (error) {
    console.error('[AIR WORLD Server] Server endpoint error:', {
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
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  res.json({
    status: 'online',
    service: 'AIR WORLD Gemini API Gateway',
    geminiConfigured: hasKey
  });
});

app.listen(PORT, () => {
  console.log(`[AIR WORLD Server] Running on http://localhost:${PORT}`);
});
