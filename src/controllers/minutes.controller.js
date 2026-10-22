import { generateMinutes } from "../services/gemini.service.js";
import { extractTextFromDocx } from "../services/docx.service.js";

export async function minutesFromText(req, res) {
  try {
    const { transcript } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: "transcript is required" });
    }
    const minutes = await generateMinutes(transcript);
    res.json(minutes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate minutes" });
  }
}

export async function minutesFromFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }
    if (!req.file.originalname.toLowerCase().endsWith(".docx")) {
      return res.status(400).json({ error: "Only .docx files are supported" });
    }

    const text = await extractTextFromDocx(req.file.buffer);
    if (!text.trim()) {
      return res.status(400).json({ error: "No text found in file" });
    }

    const minutes = await generateMinutes(text);
    res.json(minutes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process file" });
  }
}