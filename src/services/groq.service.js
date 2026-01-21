import fetch from "node-fetch";
import { NOFARI_DIRECTIVES } from "../config/directives.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.1-8b-instant";

if (!GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY missing");
}

// =======================
// SLANG CONFIG
// =======================
const SLANG_TRIGGERS = [
  "nah",
  "fr",
  "lowkey",
  "highkey",
  "bs",
  "trippin",
  "ain't",
  "ion",
  "bruh",
  "ain even",
  "you not",
];

// =======================
// ANALYTICS EMITTER
// (swap console.log later for DB)
// =======================
function emitAnalytics(event) {
  console.log("[NOFARI_ANALYTICS]", JSON.stringify(event));
}

// =======================
// SLANG DETECTOR (TURN-BASED)
// =======================
function detectSlang(text) {
  const t = text.toLowerCase();
  const matched = SLANG_TRIGGERS.filter((w) => t.includes(w));

  return {
    slangDetected: matched.length > 0,
    matchedSlang: matched,
  };
}

// =======================
// SLANG SANITIZER (FINAL GUARD)
// =======================
function stripSlangIfNeeded(text) {
  const patterns = SLANG_TRIGGERS.map(
    (w) => new RegExp(`\\b${w.replace("'", "\\'")}\\b`, "gi")
  );

  let cleaned = text;
  let removed = false;

  patterns.forEach((pattern) => {
    if (pattern.test(cleaned)) {
      removed = true;
      cleaned = cleaned.replace(pattern, "");
    }
  });

  return {
    cleanedText: cleaned.replace(/\s{2,}/g, " ").trim(),
    slangRemoved: removed,
  };
}

// =======================
// MAIN GENERATOR
// =======================
export async function generateGroqReply(userText, memory = "") {
  const { slangDetected, matchedSlang } = detectSlang(userText);

  const messages = [];

  // Base identity
  messages.push({
    role: "system",
    content: NOFARI_DIRECTIVES,
  });

  // TURN-LOCKED TONE
  messages.push({
    role: "system",
    content: slangDetected
      ? "The user is using slang. You may mirror slang naturally in THIS RESPONSE ONLY. If the user stops using slang, you must immediately stop."
      : "The user is NOT using slang. You must respond in a calm, warm, professional tone. You are NOT allowed to use slang, AAVE, or casual phrasing in this response.",
  });

  // Memory (optional)
  if (memory) {
    messages.push({
      role: "system",
      content: `Conversation context (do not quote or mention): ${memory}`,
    });
  }

  // User message LAST
  messages.push({
    role: "user",
    content: userText,
  });

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: slangDetected ? 0.9 : 0.55,
        max_tokens: 500,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  let reply = data.choices[0].message.content.trim();

  // FINAL HARD BLOCK
  let sanitizerResult = { cleanedText: reply, slangRemoved: false };
  if (!slangDetected) {
    sanitizerResult = stripSlangIfNeeded(reply);
    reply = sanitizerResult.cleanedText;
  }

  // =======================
  // ANALYTICS EVENT
  // =======================
  emitAnalytics({
    event: "nofari_reply_generated",
    timestamp: new Date().toISOString(),
    slangDetected,
    matchedSlang,
    toneMode: slangDetected ? "slang" : "calm",
    slangRemovedBySanitizer: sanitizerResult.slangRemoved,
    model: GROQ_MODEL,
  });

  return reply;
}
