import "dotenv/config";
import express from "express";
import multer from "multer";
import mammoth from "mammoth";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a meeting assistant. Read the transcript and return ONLY valid JSON in this shape:
{
  "summary": "2-3 sentence overview",
  "discussion_points": ["..."],
  "decisions": ["..."],
  "action_items": [{ "task": "...", "owner": "...", "due": "..." }]
}
Rules: use only information in the transcript. If an owner or due date isn't stated, use null. Do not invent anything.`;

const PORT = process.env.PORT || 3000;

async function generateMinutes(transcript) {
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
    contents: transcript,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });
  return JSON.parse(response.text);
}


app.post("/minutes", async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: "transcript is required" });
    res.json(await generateMinutes(transcript));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate minutes" });
  }
});


app.post("/minutes-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file is required" });
    if (!req.file.originalname.toLowerCase().endsWith(".docx")) {
      return res.status(400).json({ error: "Only .docx files are supported" });
    }
    const { value: text } = await mammoth.extractRawText({ buffer: req.file.buffer });
    if (!text.trim()) return res.status(400).json({ error: "No text found in file" });
    res.json(await generateMinutes(text));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process file" });
  }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});