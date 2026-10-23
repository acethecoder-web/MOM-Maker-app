import rateLimit from "express-rate-limit";
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, EXPORT_RATE_LIMIT_MAX, AUDIO_RATE_LIMIT_MAX } from "../config/limits.js";

export const minutesLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Try again later." },
});

export const exportLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: EXPORT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many downloads. Try again later." },
});

export const audioLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: AUDIO_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many audio requests. Try again later." },
});