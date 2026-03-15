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
   CREATOR SETTINGS
========================= */

const CREATOR_EMAIL = "nofameorg@gmail.com";

/* =========================
   SUPABASE
========================= */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
   LIFE STORY DETECTOR
========================= */

function detectLifeStory(text) {

  const t = text.toLowerCase();

  if (
    t.includes("divorce") ||
    t.includes("breakup") ||
    t.includes("lost my") ||
    t.includes("my mom died") ||
    t.includes("my dad died") ||
    t.includes("had a baby") ||
    t.includes("my child") ||
    t.includes("i was abused") ||
    t.includes("i was assaulted")
  ) {
    return true;
  }

  return false;

}

/* =========================
   LIFE STORY SUMMARY
========================= */

async function generateLifeStorySummary(message) {

  try {

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
              content: "Summarize the user's life event in ONE short sentence."
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

    return data?.choices?.[0]?.message?.content || null;

  } catch (err) {

    console.log("Life story summary error:", err);
    return null;

  }

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

    /* =========================
       CREATOR MODE
    ========================= */

    const isCreator = email === CREATOR_EMAIL;

    let creatorContext = "";

    if (isCreator) {

      creatorContext = `
CREATOR MODE ACTIVE

The user speaking with you is the verified creator of the NOFARI project.

You may speak openly about:
- NOFARI features
- system behavior
- development decisions
- product design
- architecture
`;

    }

    const systemPrompt = `
${NOFARI_DIRECTIVES}

${creatorContext}
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
       UPSERT PERSONAL FACTS
    ========================= */

    const facts = detectFacts(message);

    if (email) {

      for (const f of facts) {

        await supabase.from("user_memory").upsert(
          {
            email,
            type: f.type,
            value: f.value
          },
          { onConflict: "email,type" }
        );

      }

    }

    /* =========================
       LIFE STORY MEMORY
    ========================= */

    if (email && detectLifeStory(message)) {

      const summary = await generateLifeStorySummary(message);

      if (summary) {

        await supabase.from("life_story_memory").insert({
          email,
          summary
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

    /* =========================
       LOAD LIFE STORIES
    ========================= */

    let lifeContext = "";

    if (email) {

      const { data: stories } = await supabase
        .from("life_story_memory")
        .select("*")
        .eq("email", email)
        .limit(5);

      if (stories && stories.length > 0) {

        lifeContext = "Important life experiences:\n";

        stories.forEach(s => {
          lifeContext += `${s.summary}\n`;
        });

      }

    }

    messages.unshift({
      role: "system",
      content: `${systemPrompt}

You remember important things about the user and speak with empathy.

${memoryContext}

${lifeContext}
`
    });

    /* =========================
       GROQ REQUEST
    ========================= */

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.GROQ_API_KEY,
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

    /* =========================
   GENERATE VOICE
========================= */

let audioUrl = null;

try {

  const audioId = crypto.randomBytes(8).toString("hex");
  const audioPath = `${AUDIO_DIR}/${audioId}.mp3`;

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

  fs.writeFileSync(audioPath, buffer);

  audioUrl = `/audio/${audioId}.mp3`;

} catch (err) {

  console.log("ELEVENLABS ERROR:", err);

}

    if (email) {

      await supabase.from("conversation_memory").insert({
        email,
        role: "nofari",
        message: reply
      });

    }

    res.json({
      reply,
      audioUrl
    });

  } catch (error) {

    console.log("NOFARI ERROR:", error);

    res.json({
      reply: "I'm here with you.",
      audioUrl: null
    });

  }

});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log(`NOFARI backend running on port ${PORT}`);

  startCircleJobs();

});