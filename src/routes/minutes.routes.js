import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { minutesFromText, minutesFromFile } from "../controllers/minutes.controller.js";
import { minutesLimiter } from "../middleware/rateLimit.js";
import { requireAccessCode } from "../middleware/accessCode.js";

const router = Router();

router.post("/minutes", minutesLimiter, requireAccessCode, minutesFromText);
router.post("/minutes-file", minutesLimiter, requireAccessCode, upload.single("file"), minutesFromFile);

export default router;