import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { minutesFromText, minutesFromFile } from "../controllers/minutes.controller.js";
import { minutesLimiter } from "../middleware/rateLimit.js";
import { requireAccessCode } from "../middleware/accessCode.js";
import {exportLimiter} from "../middleware/rateLimit.js";
import { exportMinutesDocx } from "../controllers/minutes.controller.js";

const router = Router();

router.post("/minutes", minutesLimiter, requireAccessCode, minutesFromText);
router.post("/minutes-file", minutesLimiter, requireAccessCode, upload.single("file"), minutesFromFile);
router.post("/minutes/export", exportLimiter, requireAccessCode, exportMinutesDocx);

export default router;