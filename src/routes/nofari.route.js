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

    // 1️⃣ NOFARI THINKS (Groq)
    const reply = await generateGroqReply(text, memory);

    // 2️⃣ NOFARI SPEAKS (ElevenLabs)
    const audioBuffer = await generateVoice(reply);

    // 3️⃣ SEND AUDIO STREAM + TEXT HEADER (OPTION A)
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("X-NOFARI-TEXT", reply);

    res.send(audioBuffer);

  } catch (err) {
    console.error("NOFARI error:", err);
    res.status(500).json({ error: "NOFARI failed" });
  }
});

export default router;
