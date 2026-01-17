import express from "express";
import { generateGroqReply } from "../services/groq.service.js";
import { generateVoice } from "../services/elevenlabs.service.js";
import {
  enableDailyCheckIn,
  disableDailyCheckIn,
} from "../services/checkin.service.js";

const router = express.Router();

/* 🔎 Detect check-in intent from user text */
function detectCheckInIntent(text) {
  const msg = text.toLowerCase();

  if (
    msg.includes("check in with me") ||
    msg.includes("check in every day") ||
    msg.includes("daily check in") ||
    msg.includes("check on me")
  ) {
    return "ENABLE";
  }

  if (
    msg.includes("stop check") ||
    msg.includes("stop the check") ||
    msg.includes("dont check in") ||
    msg.includes("don't check in") ||
    msg.includes("stop checking in")
  ) {
    return "DISABLE";
  }

  return null;
}

/**
 * POST /nofari
 * body: { text: string }
 */
router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    let checkInEnabled = null;
    const intent = detectCheckInIntent(text);

    // 🔔 Handle daily check-in enable / disable
    if (intent === "ENABLE") {
      await enableDailyCheckIn("local-user");
      checkInEnabled = true;
    }

    if (intent === "DISABLE") {
      await disableDailyCheckIn("local-user");
      checkInEnabled = false;
    }

    // 🧠 Get NOFARI reply
    const reply = await generateGroqReply(text);

    // 🔊 Voice (unchanged)
    let audioUrl = null;
    try {
      audioUrl = await generateVoice(reply);
    } catch (e) {
      console.warn("Voice generation failed:", e.message);
    }

    res.json({
      reply,
      audioUrl,
      checkInEnabled,
    });
  } catch (err) {
    console.error("NOFARI route error:", err);
    res.status(500).json({ error: "NOFARI failed" });
  }
});

export default router;
