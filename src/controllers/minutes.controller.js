import { generateMinutes } from "../services/gemini.service.js";
import { extractTextFromDocx } from "../services/docx.service.js";
import { MAX_TRANSCRIPT_CHARS } from "../config/limits.js";

export async function minutesFromText(req, res) {
  try {
    const { transcript } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: "transcript is required" });
    }
    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
  return res.status(413).json({
    error: `Transcript is too long (max ${MAX_TRANSCRIPT_CHARS.toLocaleString()} characters)`,
  });
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
    if (text.length > MAX_TRANSCRIPT_CHARS) {
  return res.status(413).json({
    error: `Document is too long (max ${MAX_TRANSCRIPT_CHARS.toLocaleString()} characters of text)`,
  });
}
    const minutes = await generateMinutes(text);
    res.json(minutes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process file" });
  }
}