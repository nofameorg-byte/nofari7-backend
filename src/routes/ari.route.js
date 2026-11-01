
import express from "express";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const router = express.Router();
const AUDIO_DIR = "/tmp/nofari-audio";

router.post("/", async (req, res) => {
  try {
    const message = req.body?.message;

    if (typeof message !== "string" ||
        !message.trim() ||
        message.length > 1000) {
      return res.status(400).json({
        error: "A message of 1-1000 characters is required"
      });
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "You are ARI, a physical AI companion powered by NOFARI. " +
                "Respond warmly, naturally, and briefly. " +
                "You provide emotional support, not medical treatment."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    if (!groqResponse.ok) {
      throw new Error(`Groq HTTP ${groqResponse.status}`);
    }

    const data = await groqResponse.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "I'm here with you.";

    const voiceResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}?output_format=pcm_16000`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/octet-stream"
        },
        body: JSON.stringify({
          text: reply,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!voiceResponse.ok) {
      throw new Error(
        `ElevenLabs HTTP ${voiceResponse.status}: ` +
        (await voiceResponse.text()).slice(0, 300)
      );
    }

    const audio = Buffer.from(
      await voiceResponse.arrayBuffer()
    );

    if (!audio.length || audio.length % 2 !== 0) {
      throw new Error("Invalid PCM audio response");
    }

    await fs.mkdir(AUDIO_DIR, { recursive: true });

    const filename = `${crypto.randomUUID()}.pcm`;
    await fs.writeFile(
      path.join(AUDIO_DIR, filename),
      audio
    );

    return res.json({
      reply,
      audioUrl:
        `https://nofari7-backend.onrender.com/audio/${filename}`,
      format: "pcm_s16le",
      sampleRate: 16000,
      channels: 1
    });

  } catch (error) {
    console.error("ARI route error:", error);
    return res.status(502).json({
      error: "ARI voice generation failed"
    });
  }
});

export default router;
