import multer from "multer";
import path from "path";
import { MAX_AUDIO_BYTES } from "../config/limits.js";
import { AUDIO_MIME_BY_EXT } from "../config/audio.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!AUDIO_MIME_BY_EXT[ext]) {
      const err = new Error("Unsupported audio format");
      err.code = "UNSUPPORTED_AUDIO";
      return cb(err);
    }
    cb(null, true);
  },
});