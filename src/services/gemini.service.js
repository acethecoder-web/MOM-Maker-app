import { GoogleGenAI } from "@google/genai";
import { MINUTES_SYSTEM_PROMPT } from "../prompts/minutes.prompt.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(fn, { retries = 3, baseDelayMs = 2000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = [500, 503, 504].includes(err.status);
      if (!retryable || attempt >= retries) throw err;
      console.warn(`Gemini ${err.status}, retrying (${attempt + 1}/${retries})...`);
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
}


export async function generateMinutes(transcript) {
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: transcript,
      config: {
        systemInstruction: MINUTES_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    }),
  );
  return JSON.parse(response.text);
}


function speakerName(label) {
  const m = /^spk_(\d+)$/i.exec(label || "");
  return m ? `Speaker ${m[1]}` : label || "";
}

function extractText(response) {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const lines = [];

  for (const part of parts) {
    const t = part.audioTranscription;
    const text = (
      part.text ||
      t?.text ||
      (t?.words ?? []).map((w) => w.word).join(" ") ||
      ""
    ).trim();
    if (!text) continue;

    const speaker = speakerName(t?.speakerLabel);
    lines.push(speaker ? `${speaker}: ${text}` : text);
  }

  return lines.length ? lines.join("\n") : (response.text || "").trim();
}

async function runTranscribe(file, mimeType, diarization) {
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: process.env.GEMINI_TRANSCRIBE_MODEL || "gemini-3.5-transcribe",
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: file.uri,
                mimeType: file.mimeType || mimeType,
              },
            },
          ],
        },
      ],
      config: {
        audioTranscriptionConfig: { diarization, languageCodes: [] },
      },
    }),
  );

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  console.log("Transcribe debug:", {
    diarization,
    finishReason: response.candidates?.[0]?.finishReason,
    partCount: parts.length,
    partKeys: parts.map((p) => Object.keys(p)),
    responseTextLength: (response.text || "").length,
  });

  return extractText(response);
}

const FALLBACK_TRANSCRIBE_PROMPT = `Transcribe this audio recording as accurately as you can.
Write only what is said. Do not summarize or add comments.
If you can tell speakers apart, label them "Speaker 1:", "Speaker 2:", and so on.
Keep the original language of each speaker.`;

async function transcribeWithGeneralModel(file, mimeType) {
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: FALLBACK_TRANSCRIBE_PROMPT },
            {
              fileData: {
                fileUri: file.uri,
                mimeType: file.mimeType || mimeType,
              },
            },
          ],
        },
      ],
    }),
  );
  return (response.text || "").trim();
}

export async function transcribeAudio(buffer, mimeType) {
  let file = await ai.files.upload({
    file: new Blob([buffer], { type: mimeType }),
    config: { mimeType },
  });

  try {
    while (file.state === "PROCESSING") {
      await sleep(2000);
      file = await ai.files.get({ name: file.name });
    }
    if (file.state === "FAILED") throw new Error("Audio processing failed");

    try {
      let transcript = await runTranscribe(file, mimeType, true);
      if (!transcript) {
        transcript = await runTranscribe(file, mimeType, false);
      }
      return transcript;
    } catch (err) {
      if (err.status !== 503) throw err;
      console.warn("Transcription model busy, falling back to the general model");
      return await transcribeWithGeneralModel(file, mimeType);
    }
  } finally {
    ai.files.delete({ name: file.name }).catch(() => {});
  }
}