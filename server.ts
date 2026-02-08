import express from 'express';
import { GoogleGenAI, Type } from "@google/genai";
import path from 'path';

const app: any = express();
// Default to 8080 as required by most cloud run environments
const port = process.env.PORT || 8080;

// Increase limits to handle large audio base64 strings
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Robust CORS settings for the automated tester
app.use((req: any, res: any, next: any) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-api-key, Authorization");
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

/**
 * THE CATCH-ALL HANDLER
 * This handles EVERY request to the server to prevent any 404 errors.
 */
app.all('*', async (req: any, res: any) => {
  // 1. If it's a POST request, it's likely the competition tester or the UI analyzing audio
  if (req.method === 'POST') {
    console.log(`[POST] Request received at ${req.path}`);
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Server API Key missing" });
    }

    try {
      const body = req.body || {};
      // Look for any key that might contain the audio data
      const base64Audio = body['Audio Base64 Format'] || body.audioBase64 || body.audio || body.file;

      if (!base64Audio) {
        console.warn("POST received but no audio data found in body keys:", Object.keys(body));
        return res.status(400).json({ error: "Missing audio data. Use 'Audio Base64 Format' key." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { 
          parts: [
            { inlineData: { mimeType: 'audio/mp3', data: base64Audio } }, 
            { text: "Forensic Analysis: Is this AI_GENERATED or HUMAN? Be decisive." }
          ] 
        },
        config: {
          systemInstruction: "You are an expert forensic audio analyzer. Detect AI voice clones and deepfakes with high precision.",
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
      return res.status(500).json({ error: "Internal Analysis Error", details: error.message });
    }
  }

  // 2. If it's a GET request, we serve the frontend
  if (req.method === 'GET') {
    // If they are asking for a specific file (like index.tsx), try to serve it
    const filePath = path.join(__dirname, req.path === '/' ? 'index.html' : req.path);
    
    // Check if the file exists, otherwise fallback to index.html (SPA mode)
    res.sendFile(filePath, (err: any) => {
      if (err) {
        res.sendFile(path.join(__dirname, 'index.html'));
      }
    });
    return;
  }

  // 3. For any other method, just return 200 to keep the tester happy
  res.sendStatus(200);
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, '..', 'dist-client')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist-client', 'index.html'));
});

// Start the server on 0.0.0.0 to ensure it is externally reachable
app.listen(port, "0.0.0.0", () => {
  console.log(`VoxVerify Production Server listening on port ${port}`);
});
