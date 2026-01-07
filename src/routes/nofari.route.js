import { Router } from "express";
import fs from "fs";
import path from "path";
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

    // 3️⃣ ENSURE AUDIO DIRECTORY EXISTS
    const audioDir = path.join(process.cwd(), "public", "audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // 4️⃣ SAVE MP3 FILE
    const fileName = `nofari-${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);

    fs.writeFileSync(filePath, audioBuffer);

    // 5️⃣ RESPOND WITH TEXT + AUDIO URL
    res.json({
      reply,
      audioUrl: `/audio/${fileName}`,
    });

  } catch (err) {
    console.error("NOFARI error:", err);
    res.status(500).json({ error: "NOFARI failed" });
  }
});

export default router;
