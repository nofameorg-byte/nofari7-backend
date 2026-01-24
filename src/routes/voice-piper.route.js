import express from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

const router = express.Router();

// Same audio folder your app already serves
const audioDir = path.join(process.cwd(), "src/public/audio");

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

router.post("/", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text required" });
  }

  const fileName = `nofari-piper-${Date.now()}.wav`;
  const outputPath = path.join(audioDir, fileName);

  // IMPORTANT:
  // Render does NOT expose `piper` as a shell binary.
  // We must call it through Python.
  const command = `
python3 - << 'EOF'
from piper import PiperVoice
voice = PiperVoice.load("en_US-amy-medium")
voice.synthesize("${text.replace(/"/g, '\\"')}", "${outputPath}")
EOF
  `;

  exec(command, (err) => {
    if (err) {
      console.error("Piper error:", err);
      return res.status(500).json({ error: "Piper voice failed" });
    }

    res.json({
      audioUrl: `/audio/${fileName}`,
      engine: "piper",
      status: "test-only"
    });
  });
});

export default router;
