import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import cron from "node-cron";

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const AUDIO_DIR = "/tmp/nofari-audio";

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

app.use("/audio", express.static(AUDIO_DIR));

app.get("/", (req, res) => {
  res.send("NOFARI backend running");
});


/* =========================
   DAILY CIRCLE GENERATOR
========================= */

async function generateDailyCircleMessage() {

  const today = new Date().toISOString().slice(0,10);

  const { data: existing } = await supabase
    .from("circle_messages")
    .select("*")
    .gte("created_at", `${today}T00:00:00`)
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0].message;
  }

  const groq = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method:"POST",
      headers:{
        Authorization:`Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"llama-3.1-8b-instant",
        messages:[
          {
            role:"system",
            content:
            "Write a short powerful emotional support message for people struggling mentally. 1–2 sentences."
          }
        ]
      })
    }
  );

  const data = await groq.json();

  const message =
    data?.choices?.[0]?.message?.content ||
    "You are stronger than the moment you are facing.";

  await supabase.from("circle_messages").insert({
    message
  });

  return message;
}



/* =========================
   ONESIGNAL PUSH
========================= */

async function sendCirclePush(message) {

  await fetch("https://onesignal.com/api/v1/notifications", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:`Basic ${process.env.ONESIGNAL_API_KEY}`
    },
    body:JSON.stringify({
      app_id:process.env.ONESIGNAL_APP_ID,
      included_segments:["All"],
      headings:{en:"NOFARI's Circle"},
      contents:{en:message}
    })
  });

}



/* =========================
   DAILY SCHEDULE
   7:00 AM EST MON-SAT
========================= */

cron.schedule("0 7 * * 1-6", async () => {

  console.log("Running daily Circle message job");

  const message = await generateDailyCircleMessage();

  await sendCirclePush(message);

}, {
  timezone:"America/New_York"
});



/* =========================
   CIRCLE MESSAGE ROUTE
========================= */

app.get("/circle-message", async (req, res) => {

  try {

    const { data } = await supabase
      .from("circle_messages")
      .select("message")
      .order("created_at", { ascending:false })
      .limit(1)
      .single();

    if (data?.message) {
      return res.json({ message:data.message });
    }

    const generated = await generateDailyCircleMessage();

    res.json({ message:generated });

  } catch {

    res.json({
      message:"You are stronger than the moment you are facing."
    });

  }

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

    if (name) facts.push({ type:"name", value:name });

  }

  if (lower.includes("my daughter")) {
    facts.push({ type:"family", value:"daughter" });
  }

  if (lower.includes("my son")) {
    facts.push({ type:"family", value:"son" });
  }

  return facts;

}



/* =========================
   CHAT ROUTE
========================= */

app.post("/nofari", async (req, res) => {

  try {

    const { message, email } = req.body;

    if (!message || !email) {
      return res.status(400).json({ error:"Missing message or email" });
    }

    const emotion = detectEmotion(message);

    await supabase.from("emotion_log").insert({
      email,
      emotion,
      message
    });

    const facts = detectFacts(message);

    for (const f of facts) {

      await supabase.from("user_memory").insert({
        email,
        type:f.type,
        value:f.value
      });

    }

    await supabase.from("conversation_memory").insert({
      email,
      role:"user",
      message
    });

    const { data:history } = await supabase
      .from("conversation_memory")
      .select("*")
      .eq("email", email)
      .order("created_at",{ascending:false})
      .limit(15);

    const messages = history
      .reverse()
      .map(m => ({
        role: m.role === "user" ? "user":"assistant",
        content:m.message
      }));

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method:"POST",
        headers:{
          Authorization:`Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          model:"llama-3.1-8b-instant",
          messages
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "I'm here with you.";

    await supabase.from("conversation_memory").insert({
      email,
      role:"nofari",
      message:reply
    });


/* =========================
   ELEVENLABS VOICE
========================= */

const voiceResponse = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
  {
    method:"POST",
    headers:{
      "xi-api-key":process.env.ELEVENLABS_API_KEY,
      "Content-Type":"application/json",
      Accept:"audio/mpeg"
    },
    body:JSON.stringify({
      text:reply,
      model_id:"eleven_multilingual_v2"
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

  } catch (err) {

    console.error("NOFARI error:", err);

    res.status(500).json({ error:"server error" });

  }

});



const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("NOFARI backend running on port", PORT);
});