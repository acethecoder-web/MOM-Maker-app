import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: "2mb" }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a meeting assistant. Read the transcript and return ONLY valid JSON in this shape:
{
  "summary": "2-3 sentence overview",
  "discussion_points": ["..."],
  "decisions": ["..."],
  "action_items": [{ "task": "...", "owner": "...", "due": "..." }]
}
Rules: use only information in the transcript. If an owner or due date isn't stated, use null. Do not invent anything.`;

app.post("/minutes", async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: "transcript is required" });

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: transcript,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    res.json(JSON.parse(response.text));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate minutes" });
  }
});

app.listen(3000, () => console.log("Running on http://localhost:3000"));