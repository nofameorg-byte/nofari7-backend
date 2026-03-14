import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { startCircleJobs } from "./jobs/circleJobs.js";
import { getDailyCircleMessage } from "./services/circleDailyMessage.js";
import { NOFARI_DIRECTIVES } from "./config/directives.js";

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   SUPABASE
========================= */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   CREATOR SESSION MEMORY
========================= */

const creatorSessions = new Set();

/* =========================
   AUDIO STORAGE
========================= */

const AUDIO_DIR = "/tmp/nofari-audio";

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

app.use("/audio", express.static(AUDIO_DIR));

app.get("/", (req, res) => {
  res.send("NOFARI backend running");
});

/* =========================
   EMOTION DETECTOR
========================= */

function detectEmotion(text) {

  const t = text.toLowerCase();

  if (t.includes("sad") || t.includes("depressed") || t.includes("cry"))
    return "sad";

  if (t.includes("anxious") || t.includes("anxiety") || t.includes("nervous"))
    return "anxious";

  if (t.includes("angry") || t.includes("mad") || t.includes("pissed"))
    return "angry";

  if (t.includes("happy") || t.includes("great") || t.includes("good"))
    return "happy";

  return "neutral";

}

/* =========================
   PERSONAL FACT DETECTOR
========================= */

function detectFacts(text) {

  const facts = [];

  const lower = text.toLowerCase();

  if (lower.includes("my name is")) {

    const name = text.split("my name is")[1]?.trim();

    if (name) facts.push({ type: "name", value: name });

  }

  if (lower.includes("my daughter")) {
    facts.push({ type: "family", value: "daughter" });
  }

  if (lower.includes("my son")) {
    facts.push({ type: "family", value: "son" });
  }

  return facts;

}

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
        data: { screen: "circle" },
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

    const { message, email } = req.body;

    console.log("NOFARI REQUEST:", { email, message });

    if (!message) {
      return res.json({
        reply: "I'm here. Tell me what's going on."
      });
    }

    const msgLower = message.toLowerCase();

    /* =========================
       CREATOR ACTIVATION
    ========================= */

    if (
      email === "nofameorg@gmail.com" &&
      msgLower.includes("master key aaliyah")
    ) {
      creatorSessions.add(email);
    }

    /* =========================
       CREATOR EXIT
    ========================= */

    if (
      email === "nofameorg@gmail.com" &&
      msgLower.includes("exit master key")
    ) {
      creatorSessions.delete(email);
    }

    /* =========================
       CREATOR STATUS
    ========================= */

    const isCreator = creatorSessions.has(email);

    const systemPrompt = `
${NOFARI_DIRECTIVES}

Creator Verified: ${isCreator}
`;

    /* =========================
       EMOTION TRACKING
    ========================= */

    const emotion = detectEmotion(message);

    if (email) {

      await supabase.from("emotion_log").insert({
        email,
        emotion,
        message
      });

    }

    /* =========================
       STORE PERSONAL FACTS
    ========================= */

    const facts = detectFacts(message);

    if (email) {

      for (const f of facts) {

        await supabase.from("user_memory").insert({
          email,
          type: f.type,
          value: f.value
        });

      }

    }

    /* =========================
       SAVE USER MESSAGE
    ========================= */

    if (email) {

      await supabase.from("conversation_memory").insert({
        email,
        role: "user",
        message
      });

    }

    /* =========================
       LOAD LAST 15 MESSAGES
    ========================= */

    let messages = [];

    if (email) {

      const { data: history } = await supabase
        .from("conversation_memory")
        .select("*")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(15);

      if (history) {

        messages = history
          .reverse()
          .map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.message
          }));

      }

    }

    /* =========================
       LOAD PERSONAL MEMORY
    ========================= */

    let memoryContext = "";

    if (email) {

      const { data: memory } = await supabase
        .from("user_memory")
        .select("*")
        .eq("email", email)
        .limit(10);

      if (memory && memory.length > 0) {

        memoryContext = "Known user information:\n";

        memory.forEach(f => {
          memoryContext += `${f.type}: ${f.value}\n`;
        });

      }

    }

    messages.unshift({
      role: "system",
      content: `${systemPrompt}

You remember important things about the user and speak with empathy.

${memoryContext}`
    });

    /* =========================
       GROQ REQUEST
    ========================= */

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
          messages
        })
      }
    );

    const data = await groqResponse.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "I'm here with you.";

    if (email) {

      await supabase.from("conversation_memory").insert({
        email,
        role: "nofari",
        message: reply
      });

    }

    /* =========================
       VOICE
    ========================= */

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