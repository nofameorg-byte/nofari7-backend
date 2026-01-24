import express from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

const router = express.Router();

router.post("/voice-piper", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    const fileName = `nofari-${Date.now()}.wav`;
    const outputPath = `/var/www/nofari/audio/${fileName}`;

    const piperCmd = `
      echo "${text.replace(/"/g, '\\"')}" | \
      /root/piper-venv/bin/piper \
        -m /opt/piper/models/en_US-amy-medium.onnx \
        -c /opt/piper/models/en_US-amy-medium.onnx.json \
        -f ${outputPath}
    `;

    exec(piperCmd, (error) => {
      if (error) {
        console.error("Piper error:", error);
        return res.status(500).json({ error: "Piper voice failed" });
      }

      res.json({
        success: true,
        audioUrl: `/audio/${fileName}`,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
