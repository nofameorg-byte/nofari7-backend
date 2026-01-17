import { Router } from "express";
import { generateGroqReply } from "../services/groq.service.js";
import {
  enableDailyCheckIn,
  disableDailyCheckIn,
} from "../services/checkin.service.js";

const router = Router();

function detectCheckInIntent(message) {
  const text = message.toLowerCase();

  if (
    text.includes("check in with me") ||
    text.includes("daily check in") ||
    text.includes("check on me")
  ) {
    return "ENABLE";
  }

  if (
    text.includes("stop check") ||
    text.includes("stop the check") ||
    text.includes("dont check in") ||
    text.includes("don't check in")
  ) {
    return "DISABLE";
  }

  return null;
}

router.post("/", async (req, res) => {
  try {
    const { message, memory, userId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: "Message and userId required" });
    }

    const intent = detectCheckInIntent(message);

    let checkInEnabled = null;

    if (intent === "ENABLE") {
      await enableDailyCheckIn(userId);
      checkInEnabled = true;
    }

    if (intent === "DISABLE") {
      await disableDailyCheckIn(userId);
      checkInEnabled = false;
    }

    const reply = await generateGroqReply(message, memory);

    res.json({
      reply,
      checkInEnabled,
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

export default router;
