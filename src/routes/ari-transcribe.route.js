import express from "express";
import { timingSafeEqual } from "node:crypto";
import multer from "multer";
import rateLimit from "express-rate-limit";

import { Blob } from "node:buffer";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 }
});

/* ARI_SPEECH_AUTH_V1 */
function requireAriAuth(req, res, next) {
  const expected = process.env.ARI_DEVICE_TOKEN;
  const supplied = req.get("X-ARI-Token");

  if (!expected) {
    return res.status(503).json({
      error: "ARI authentication is not configured"
    });
  }

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied || "");

  const authorized =
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer);

  if (!authorized) {
    return res.status(401).json({
      error: "Unauthorized ARI device"
    });
  }

  next();
}

/* ARI_SPEECH_RATE_LIMIT_V1 */
const ariSpeechLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many ARI speech requests. Please wait."
  }
});

router.post("/", requireAriAuth, ariSpeechLimiter, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        error: "A WAV audio file is required"
      });
    }

    const wav = req.file.buffer;

    if (
      wav.length < 44 ||
      wav.toString("ascii", 0, 4) !== "RIFF" ||
      wav.toString("ascii", 8, 12) !== "WAVE"
    ) {
      return res.status(400).json({
        error: "Invalid WAV recording"
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: "Speech recognition is not configured"
      });
    }

    const form = new FormData();
    form.append(
      "file",
      new Blob([wav], { type: "audio/wav" }),
      "ari-recording.wav"
    );
    form.append("model", "whisper-large-v3-turbo");
    form.append("response_format", "json");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: form
      }
    );

    if (!response.ok) {
      console.error("ARI transcription HTTP", response.status);
      return res.status(502).json({
        error: "Speech recognition failed"
      });
    }

    const result = await response.json();

    return res.json({
      text: typeof result.text === "string" ? result.text : ""
    });
  } catch (error) {
    console.error("ARI transcription error:", error);
    return res.status(500).json({
      error: "Unable to transcribe recording"
    });
  }
});

export default router;
