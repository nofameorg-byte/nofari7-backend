import fetch from "node-fetch";
import { NOFARI_DIRECTIVES } from "../config/directives.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.1-8b-instant";

if (!GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY missing");
}

// 🔍 Slang detector (STRICT + TURN-BASED)
function usesSlang(text) {
  const slangTriggers = [
    "nah",
    "fr",
    "lowkey",
    "highkey",
    "bs",
    "trippin",
    "ain't",
    "ion",
    "bruh",
    "hell",
    "ain even",
  ];

  const t = text.toLowerCase();
  return slangTriggers.some((w) => t.includes(w));
}

export async function generateGroqReply(userText, memory = "") {
  const slangMode = usesSlang(userText);

  // ✅ ALWAYS build messages as a clean array
  const messages = [];

  // Base identity + personality
  messages.push({
    role: "system",
    content: NOFARI_DIRECTIVES,
  });

  // Tone control (TURN BY TURN)
  if (slangMode) {
    messages.push({
      role: "system",
      content:
        "The user is using slang. Mirror slang naturally in THIS response only. Do not continue slang if the user stops.",
    });
  } else {
    messages.push({
      role: "system",
      content:
        "The user is NOT using slang. Respond in a calm, soft, emotionally supportive, professional tone. Do NOT use slang.",
    });
  }

  // Memory (optional)
  if (memory) {
    messages.push({
      role: "system",
      content: `Conversation context (do not quote or mention): ${memory}`,
    });
  }

  // User message (ALWAYS LAST)
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
        messages, // ✅ GUARANTEED PRESENT
        temperature: slangMode ? 0.95 : 0.65,
        max_tokens: 500,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
