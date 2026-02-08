import { GoogleGenAI, Type } from "@google/genai";
import { DetectionResult } from "../types";

export const analyzeVoiceSample = async (
  base64Audio: string
): Promise<DetectionResult> => {
  // Always initialize fresh to catch API key updates
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-3-pro-preview';

  const systemInstruction = `
    You are a specialized Audio Forensic AI. Your task is to detect "AI_GENERATED" voices (clones, TTS, Deepfakes) versus "HUMAN" voices.

    FORENSIC SCAN PROTOCOL:
    1. Reason internally about the following:
       - Spectral Envelope: AI often has unnaturally smooth frequency transitions.
       - Rhythmic Jitter: Real humans have microscopic timing irregularities. AI is often too "on the grid."
       - Breathing: AI breathing sounds are often additive/looped. Human breathing interacts with the vocal tract organically.
       - Phonation: Look for "neural vocoder buzz" or a lack of saliva/mouth-click artifacts.
    
    2. Classification Rules:
       - If you detect any "too-perfect" cadence or spectral smoothness, classify as "AI_GENERATED".
       - Only classify as "HUMAN" if there are undeniable organic imperfections and a natural acoustic interaction.
    
    3. Supported Languages: Tamil, English, Hindi, Malayalam, Telugu.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { 
        parts: [
          { inlineData: { mimeType: 'audio/mp3', data: base64Audio } }, 
          { text: "Perform a deep-level forensic analysis. Is this AI_GENERATED or HUMAN? Be extremely critical of high-quality clones." }
        ] 
      },
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: { type: Type.STRING, description: "Must be AI_GENERATED or HUMAN" },
            confidence: { type: Type.NUMBER },
            language: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Detailed forensic reasoning based on acoustic micro-artifacts." },
          },
          required: ["classification", "confidence", "language", "explanation"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      ...result,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error("Forensic analysis failed:", error);
    throw new Error(error.message || "Forensic scan failed.");
  }
};