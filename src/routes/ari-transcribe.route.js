import express from "express";
import multer from "multer";

import { Blob } from "node:buffer";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 }
});

router.post("/", upload.single("audio"), async (req, res) => {
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
