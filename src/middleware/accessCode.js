import crypto from "crypto";

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function requireAccessCode(req, res, next) {
  const expected = process.env.ACCESS_CODE;

  if (!expected) {
    console.error("ACCESS_CODE is not set");
    return res.status(500).json({ error: "Server is not configured" });
  }

  const provided = req.get("x-access-code") || "";
  if (!safeEqual(provided, expected)) {
    return res.status(401).json({ error: "Invalid access code" });
  }

  next();
}