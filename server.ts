import express, { type Request, type Response, type NextFunction } from 'express';
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
// Render will inject PORT; fallback to 8080 for local dev
const port = (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080) as number;

// Body limits for large base64 audio
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS for any frontend (voxverify UI, competition tester, etc.)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-api-key, Authorization");
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Simple health/info endpoint for GET /
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'VoxVerify backend',
    timestamp: Date.now(),
  });
});

// Main analysis endpoint (competition + frontend)
app.post('/', async (req: Request, res: Response) => {
  console.log(`[POST] Request received at ${req.path}`);

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server API Key missing" });
  }

  try {
    const body = req.body || {};

    // Try multiple possible keys for audio base64
    const base64Audio =
      body['Audio Base64 Format'] ||
      body.audioBase64 ||
      body.audio ||
      body.file;

    if (!base64Audio) {
      console.warn("POST received but no audio data found in body keys:", Object.keys(body));
      return res.status(400).json({
        error: "Missing audio data. Use 'Audio Base64 Format' key (or audioBase64/audio/file).",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/mp3', data: base64Audio } },
          { text: "Forensic Analysis: Is this AI_GENERATED or HUMAN? Be decisive." },
        ],
      },
      config: {
        systemInstruction:
          "You are an expert forensic audio analyzer. Detect AI voice clones and deepfakes with high precision.",
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            language: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["classification", "confidence", "language", "explanation"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return res.json({ ...result, timestamp: Date.now() });
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return res.status(500).json({
      error: "Internal Analysis Error",
      details: error.message,
    });
  }
});

// Fallback for any other route & method
app.all('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start the server on 0.0.0.0 to ensure it is externally reachable
app.listen(port, "0.0.0.0", () => {
  console.log(`VoxVerify Production Server listening on port ${port}`);
});



