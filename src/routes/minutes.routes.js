import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { minutesFromText, minutesFromFile } from "../controllers/minutes.controller.js";

const router = Router();

router.post("/minutes", minutesFromText);
router.post("/minutes-file", upload.single("file"), minutesFromFile);

export default router;