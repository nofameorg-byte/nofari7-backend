import { Router } from "express";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { generateGroqReply } from "../services/groq.service.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text required" });
    }

    // 1️⃣ GROQ TEXT
    const reply = await generateGroqReply(text);

    // 2️⃣ ELEVENLABS MP3
    const voiceRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: reply,
          model_id: "eleven_multilingual_v2",
        }),
      }
    );

    if (!voiceRes.ok) {
      throw new Error(await voiceRes.text());
    }

    const audioBuffer = Buffer.from(await voiceRes.arrayBuffer());

    // 3️⃣ SAVE MP3
    const audioDir = path.join(process.cwd(), "public", "audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const fileName = `nofari-${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);
    fs.writeFileSync(filePath, audioBuffer);

    // 4️⃣ RESPOND
    res.json({
      reply,
      audioUrl: `/audio/${fileName}`,
    });

  } catch (err) {
    console.error("NOFARI ERROR:", err);
    res.status(500).json({ error: "NOFARI failed" });
  }
});

export default router;
