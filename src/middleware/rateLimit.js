import rateLimit from "express-rate-limit";
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from "../config/limits.js";

export const minutesLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Try again later." },
});