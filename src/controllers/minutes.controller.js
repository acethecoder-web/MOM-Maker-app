import { generateMinutes } from "../services/gemini.service.js";
import { extractTextFromDocx } from "../services/docx.service.js";
import { MAX_TRANSCRIPT_CHARS } from "../config/limits.js";
import { buildMinutesDocx, normalizeMinutes } from "../services/minutesDocx.service.js";
import path from "path";
import { transcribeAudio } from "../services/gemini.service.js";
import { AUDIO_MIME_BY_EXT } from "../config/audio.js";

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

export async function exportMinutesDocx(req, res) {
  try {
    const raw = req.body?.minutes;
    if (!raw || typeof raw !== "object") {
      return res.status(400).json({ error: "minutes is required" });
    }

    const buffer = await buildMinutesDocx(normalizeMinutes(raw));
    const date = new Date().toISOString().slice(0, 10);

    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="meeting-minutes-${date}.docx"`,
    });
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create the document" });
  }
}

export async function minutesFromAudio(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const mimeType = AUDIO_MIME_BY_EXT[ext];
    if (!mimeType) {
      return res.status(400).json({ error: "Unsupported audio format" });
    }

    const transcript = await transcribeAudio(req.file.buffer, mimeType);
    if (!transcript || transcript === "NO_SPEECH") {
      return res.status(400).json({ error: "No speech detected in the audio" });
    }
    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      return res.status(413).json({
        error: `Recording is too long (max ${MAX_TRANSCRIPT_CHARS.toLocaleString()} characters of transcript)`,
      });
    }

    const minutes = await generateMinutes(transcript);
    res.json({ ...minutes, transcript });
 } catch (err) {
  console.error("Audio error:", err.status, err.message);
  if (err.status === 503) {
    return res.status(503).json({
      error: "The AI service is busy right now. Please try again in a minute.",
    });
  }
  res.status(500).json({ error: "Failed to process the audio" });
}
}