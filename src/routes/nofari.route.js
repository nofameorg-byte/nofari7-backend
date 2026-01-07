import { Router } from "express";
import fs from "fs";
import path from "path";
import { generateGroqReply } from "../services/groq.service.js";
import { generateVoice } from "../services/elevenlabs.service.js";

const router = Router();

router.post("/", async (req, res) => {
  console.log("🟢 NOFARI ROUTE HIT");

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text required" });
    }

    console.log("🟡 TEXT RECEIVED");

    const reply = await generateGroqReply(text);
    console.log("🟢 GROQ OK");

    const audioBuffer = await generateVoice(reply);
    console.log("🟢 ELEVENLABS OK");

    const audioDir = path.join(process.cwd(), "public", "audio");
    console.log("📁 AUDIO DIR:", audioDir);

    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
      console.log("📁 AUDIO DIR CREATED");
    }

    const fileName = `nofari-${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);

    fs.writeFileSync(filePath, audioBuffer);
    console.log("💾 MP3 SAVED:", filePath);

    res.json({
      reply,
      audioUrl: `/audio/${fileName}`,
    });

  } catch (err) {
    console.error("❌ NOFARI ERROR:", err);
    res.status(500).json({ error: "NOFARI failed" });
  }
});

export default router;
