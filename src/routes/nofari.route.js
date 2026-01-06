import { Router } from "express";
import { generateGroqReply } from "../services/groq.service.js";
import { generateVoice } from "../services/elevenlabs.service.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { text, memory } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text required" });
    }

    // 1️⃣ NOFARI THINKS (TEXT)
    const reply = await generateGroqReply(text, memory);

    // 2️⃣ NOFARI SPEAKS (AUDIO BUFFER)
    const audioBuffer = await generateVoice(reply);

    // 3️⃣ CONVERT AUDIO → BASE64
    const audioBase64 = audioBuffer.toString("base64");

    // 4️⃣ ALWAYS RETURN JSON (NO STREAMING)
    res.status(200).json({
      reply,
      audio: audioBase64,
    });

  } catch (err) {
    console.error("NOFARI backend error:", err);
    res.status(500).json({ error: "NOFARI failed" });
  }
});

export default router;
