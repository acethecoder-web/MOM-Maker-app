import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { minutesFromText, minutesFromFile } from "../controllers/minutes.controller.js";
import { minutesLimiter } from "../middleware/ratelimit.js";
import { requireAccessCode } from "../middleware/accessCode.js";


const router = Router();

router.post("/minutes",minutesLimiter,minutesFromText,requireAccessCode);
router.post("/minutes-file", minutesLimiter, requireAccessCode, upload.single("file"), minutesFromFile);

export default router;