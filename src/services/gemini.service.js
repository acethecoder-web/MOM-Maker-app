import { GoogleGenAI } from "@google/genai";
import { MINUTES_SYSTEM_PROMPT } from "../prompts/minutes.prompt.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateMinutes(transcript) {
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
    contents: transcript,
    config: {
      systemInstruction: MINUTES_SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });
  return JSON.parse(response.text);
}