import express from "express";
import { generateVoice } from "../services/elevenlabs.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text required" });
    }

    // generateVoice RETURNS A URL STRING
    const audioUrl = await generateVoice(text);

    // ✅ SEND JSON (what the app expects)
    res.json({ audioUrl });

  } catch (err) {
    console.error("VOICE ERROR:", err);
    res.status(500).json({ error: "Voice failed" });
  }
});

export default router;
