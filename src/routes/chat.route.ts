import { Router } from "express";
import { generateGroqReply } from "../services/groq.service";
import { generateVoice } from "../services/elevenlabs.service";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { message, memory } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message required" });
    }

    const reply = await generateGroqReply(message, memory);
    const audioUrl = await generateVoice(reply);

    res.json({ reply, audioUrl });
  } catch (err: any) {
    console.error("NOFARI ERROR:", err.message);
    res.status(500).json({ error: "NOFARI failed to respond" });
  }
});

export default router;
