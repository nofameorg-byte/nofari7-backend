import { Router, Request, Response } from "express";
import fetch from "node-fetch";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { text } = req.body as { text?: string };

    if (!text) {
      return res.status(400).json({ error: "Text required" });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      return res.status(500).json({ error: "ElevenLabs config missing" });
    }

    const response = await fetch(
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
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.65,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (err) {
    console.error("Voice error:", err);
    res.status(500).json({ error: "Voice failed" });
  }
});

export default router;
