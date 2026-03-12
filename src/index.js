import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { startCircleJobs } from "./jobs/circleJobs.js";
import { getDailyCircleMessage } from "./services/circleDailyMessage.js";

const app = express();

app.use(cors());
app.use(express.json());

const AUDIO_DIR = "/tmp/nofari-audio";

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

app.use("/audio", express.static(AUDIO_DIR));

app.get("/", (req, res) => {
  res.send("NOFARI backend running");
});


/* =========================
   CIRCLE MESSAGE ROUTE
========================= */

app.get("/circle-message", async (req, res) => {

  try {

    const message = await getDailyCircleMessage();

    res.json({
      message
    });

  } catch (err) {

    console.log("Circle route error:", err);

    res.json({
      message: "Even small steps forward still move your life ahead."
    });

  }

});


/* =========================
   ONE SIGNAL PUSH FUNCTION
========================= */

async function sendCirclePush() {

  try {

    console.log("Sending Circle push notification");

    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.ONESIGNAL_REST_KEY}`
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        included_segments: ["All"],
        headings: { en: "NOFARI's Circle" },
        contents: { en: "Your support message is ready." },

        data: {
          screen: "circle"
        },

        ios_badgeType: "Increase",
        ios_badgeCount: 1
      })
    });

  } catch (err) {

    console.log("OneSignal push error:", err);

  }

}


/* =========================
   MANUAL PUSH TEST ROUTE
========================= */

app.get("/send-circle-push", async (req, res) => {

  await sendCirclePush();

  res.json({
    status: "Push sent"
  });

});


/* =========================
   NOFARI CHAT ROUTE
========================= */

app.post("/nofari", async (req, res) => {

  try {

    let message =
      req.body?.message ||
      req.body?.text ||
      "";

    message = String(message).trim();

    if (!message) {
      return res.json({
        reply: "I'm here. Tell me what's going on."
      });
    }

    const groqResponse = await fetch(
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
              content:
                "You are NOFARI, a calm emotional support AI with warm big-sister energy."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await groqResponse.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "I'm here with you.";

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

    res.json({
      reply,
      audioUrl
    });

  } catch (error) {

    console.log("NOFARI ERROR:", error);

    res.json({
      reply: "I'm here with you."
    });

  }

});


const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log(`NOFARI backend running on port ${PORT}`);

  startCircleJobs();

});