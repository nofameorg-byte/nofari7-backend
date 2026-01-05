import { Router, Request, Response } from "express";
import { generateGroqReply } from "../services/groq.service.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { message, memory } = req.body as {
      message?: string;
      memory?: string;
    };

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const reply = await generateGroqReply(message, memory);

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

export default router;
