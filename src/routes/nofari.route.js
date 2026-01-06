import { Router } from "express";
import { generateGroqReply } from "../services/groq.service.js";
import { generateVoice } from "../services/elevenlabs.service.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { text, memory } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // NOFARI thinks
    const reply = await generateGroqReply(text, memory);

    // NOFARI speaks
    const audioBuffer = await generateVoice(reply);

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);

  } catch (err) {
    console.error("NOFARI error:", err);
    res.status(500).json({ error: "NOFARI failed" });
  }
});

export default router;
