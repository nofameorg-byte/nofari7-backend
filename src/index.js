import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const app = express();

app.use(cors());
app.use(express.json());

/* AUDIO STORAGE (Render-safe) */

const AUDIO_DIR = "/tmp/nofari-audio";

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

app.use("/audio", express.static(AUDIO_DIR));

app.get("/", (req, res) => {
  res.send("NOFARI backend running");
});

app.post("/nofari", async (req, res) => {

  try {

    const { message } = req.body;

    console.log("Incoming message:", message);

    /* GROQ AI */

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are NOFARI, a calm emotional support AI with warm big-sister energy."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log("Groq response:", data);

    const reply =
      data?.choices?.[0]?.message?.content ||
      "I'm here with you.";

    /* ELEVENLABS VOICE */

    const voiceResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg"
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

    const buffer = Buffer.from(await voiceResponse.arrayBuffer());

    const filename = `nofari-${crypto.randomUUID()}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    fs.writeFileSync(filepath, buffer);

    const audioUrl = `/audio/${filename}`;

    /* RESPONSE */

    res.json({
      reply,
      audioUrl
    });

  } catch (error) {

    console.log("NOFARI error:", error);

    res.json({
      reply: "I'm here with you."
    });

  }

});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`NOFARI backend running on port ${PORT}`);
});