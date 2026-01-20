import fetch from "node-fetch";
import { NOFARI_DIRECTIVES } from "../config/directives.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.1-8b-instant";

if (!GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY missing");
}

// 🔍 VERY SIMPLE SLANG DETECTOR (INTENTIONAL)
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
    "im tired",
    "tired as",
    "hell",
    "bruh",
    "ain even",
  ];

  const t = text.toLowerCase();
  return slangTriggers.some((w) => t.includes(w));
}

export async function generateGroqReply(userText, memory = "") {
  const slangMode = usesSlang(userText);

  const messages = [
    {
      role: "system",
      content: NOFARI_DIRECTIVES,
    },

    // 🔥 THIS IS THE KEY LINE
    ...(slangMode
      ? [
          {
            role: "system",
            content:
              "The user is speaking in slang. You MUST respond in slang and casual language. Responding without slang is incorrect.",
          },
        ]
      : []),

    ...(memory
      ? [
          {
            role: "system",
            content: `Conversation context (do not quote): ${memory}`,
          },
        ]
      : []),

    {
      role: "user",
      content: userText,
    },
  ];

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
        temperature: slangMode ? 1.0 : 0.7,
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
