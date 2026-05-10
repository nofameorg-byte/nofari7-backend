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
import multer from "multer";
import pdf from "pdf-parse/lib/pdf-parse.js";

const app = express();

app.use(cors());
app.use(express.json());


const upload = multer({ dest: "/tmp/uploads" });

const toBase64 = (filePath) => {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString("base64");
};

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
   DELETE USER MEMORY
========================= */

app.post("/delete-user-data", async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) {
      return res.json({ success: false });
    }

    await supabase.from("conversation_memory").delete().eq("email", email);
    await supabase.from("user_memory").delete().eq("email", email);
    await supabase.from("life_story_memory").delete().eq("email", email);
    await supabase.from("emotion_log").delete().eq("email", email);

    res.json({ success: true });

  } catch (err) {

    console.log("DELETE USER DATA ERROR:", err);

    res.json({ success: false });

  }

});

/* =========================
   NOFARI CHAT ROUTE
========================= */

app.post("/nofari", upload.single("file"), async (req, res) => {

  try {

    const { message, email } = req.body;
const file = req.file;

console.log("UPLOADED FILE:", file);

let enhancedMessage = message || "";

if (file) {

  enhancedMessage += `
The user uploaded a file named "${file.originalname}".
`;

  // PDF SUPPORT
  if (file.mimetype === "application/pdf") {

    try {

      const pdfBuffer = fs.readFileSync(file.path);

      const pdfData = await pdf(pdfBuffer);

      enhancedMessage += `

PDF CONTENT:
${pdfData.text.slice(0, 20000)}

Analyze this PDF in detail.

Explain:
- what the document is
- important names
- dates
- legal meaning
- forms
- sections
- summaries
- warnings
- instructions
- what the user should understand from it

If the document is a form, explain what the form is for.
If the document is legal, explain it in simple language.
`;

    } catch (err) {

      console.log("PDF PARSE ERROR:", err);

      enhancedMessage += `
The PDF could not be fully analyzed.
`;

    }

  }

  // IMAGE SUPPORT
  else if (file.mimetype?.startsWith("image/")) {

    try {

      const base64Image = toBase64(file.path);

      const visionResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + process.env.OPENAI_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `
Analyze this uploaded image in detail.

Describe:
- important objects
- colors
- text in the image
- emotional tone
- possible meaning/context

If it is a document or screenshot, explain it clearly.
`
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${file.mimetype};base64,${base64Image}`
                    }
                  }
                ]
              }
            ]
          })
        }
      );

      const visionData = await visionResponse.json();

      console.log("VISION DATA:", JSON.stringify(visionData, null, 2));

      const imageAnalysis =
        visionData?.choices?.[0]?.message?.content ||
        "The image could not be analyzed.";

      enhancedMessage += `

IMAGE ANALYSIS:
${imageAnalysis}

Respond naturally to the user while incorporating the image understanding.
`;

    } catch (err) {

      console.log("VISION ERROR:", err);

      enhancedMessage += `
The uploaded image could not be fully analyzed.
`;

    }

  }

}

console.log("NOFARI REQUEST:", {
  email,
  message: enhancedMessage
});

if (!enhancedMessage.trim()) {
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
You will refer to Tim as the Creator when responding at all times.

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

    const emotion = detectEmotion(enhancedMessage);

    if (email) {

      await supabase.from("emotion_log").insert({
        email,
        emotion,
        message: enhancedMessage
      });

    }

    /* =========================
       UPSERT PERSONAL FACTS
    ========================= */

    const facts = detectFacts(enhancedMessage);

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

    if (email && detectLifeStory(enhancedMessage)) {

      const summary = await generateLifeStorySummary(enhancedMessage);

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
        message: enhancedMessage
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

    messages.push({
  role: "user",
  content: enhancedMessage
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

  audioUrl = `https://nofari7-backend.onrender.com/audio/${audioId}.mp3`;

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