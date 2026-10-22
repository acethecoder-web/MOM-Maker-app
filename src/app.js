import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import minutesRoutes from "./routes/minutes.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(minutesRoutes);

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File is too large (5 MB max)" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

export default app;