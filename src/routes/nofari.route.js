import express from "express";
import { generateVoice } from "../services/elevenlabs.service.js";

const router = express.Router();

router.post("/", async (req, res) => {

  try {

    const text = req.body.text || req.body.message;

    if (!text) {
      return res.json({
        reply: "I'm here. Tell me what's going on."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.GROQ_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are NOFARI, a calm emotional support AI with warm big-sister energy."
            },
            {
              role: "user",
              content: text
            }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "I'm here with you.";

    // 🔊 GENERATE ELEVENLABS VOICE
    const audioUrl = await generateVoice(reply);

    res.json({
      reply,
      audioUrl
    });

  } catch (err) {

    console.error("NOFARI route error:", err);

    res.json({
      reply: "Something went wrong but I'm still here."
    });

  }

});

export default router;