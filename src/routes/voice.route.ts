import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text required" });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      return res.status(500).json({ error: "ElevenLabs not configured" });
    }

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
        }),
      }
    );

    if (!elevenRes.ok || !elevenRes.body) {
      throw new Error("ElevenLabs failed");
    }

    res.setHeader("Content-Type", "audio/mpeg");

    // ✅ STREAM AUDIO DIRECTLY
    elevenRes.body.pipe(res);
  } catch (err) {
    console.error("Voice error:", err);
    res.status(500).json({ error: "Voice failed" });
  }
});

export default router;
