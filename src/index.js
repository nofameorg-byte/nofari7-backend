import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

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
   CHAT ROUTE
========================= */

app.post("/nofari", async (req, res) => {

  try {

    const { message, email } = req.body;

    if (!message || !email) {

      return res.status(400).json({ error: "Missing message or email" });

    }



    /* =========================
       EMOTION TRACKING
    ========================= */

    const emotion = detectEmotion(message);

    await supabase.from("emotion_log").insert({

      email,
      emotion,
      message

    });



    /* =========================
       FACT MEMORY
    ========================= */

    const facts = detectFacts(message);

    for (const f of facts) {

      await supabase.from("user_memory").insert({

        email,
        type: f.type,
        value: f.value

      });

    }



    /* =========================
       SAVE MESSAGE
    ========================= */

    await supabase.from("conversation_memory").insert({

      email,
      role: "user",
      message

    });



    /* =========================
       LOAD LAST 15 MESSAGES
    ========================= */

    const { data: history } = await supabase
      .from("conversation_memory")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(15);



    const messages = history
      .reverse()
      .map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.message
      }));



    messages.unshift({
      role: "system",
      content:
        "You are NOFARI, a calm supportive AI with warm big-sister energy. Speak gently, clearly, and supportively."
    });



    /* =========================
       GROQ REQUEST
    ========================= */

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
          messages
        })
      }
    );



    const data = await response.json();

    const reply = data.choices?.[0]?.message?.content || "I'm here with you.";



    /* =========================
       SAVE REPLY
    ========================= */

    await supabase.from("conversation_memory").insert({

      email,
      role: "nofari",
      message: reply

    });



    /* =========================
       RETURN RESPONSE
    ========================= */

    res.json({

      reply

    });

  } catch (err) {

    console.error("NOFARI error:", err);

    res.status(500).json({ error: "server error" });

  }

});



/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log("NOFARI backend running on port", PORT);

});