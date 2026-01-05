import { Router } from "express";
import { generateGroqReply } from "../services/groq.service.js";
import { generateVoice } from "../services/elevenlabs.service.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { message, memory } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    // 🧠 Generate NOFARI reply (Groq — directives locked)
    const reply = await generateGroqReply(message, memory);

    // 🔊 Generate voice audio (ElevenLabs)
    let audioUrl: string | null = null;
    try {
      audioUrl = await generateVoice(reply);
    } catch (voiceErr) {
      console.error("Voice generation failed:", voiceErr);
      // Voice failure should NOT break chat
    }

    // ✅ Return both text + audio
    res.json({
      reply,
      audioUrl,
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

export default router;
