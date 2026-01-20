import fetch from "node-fetch";
import { NOFARI_DIRECTIVES } from "../config/directives.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.1-8b-instant";

if (!GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY missing");
}

// 🔍 Slang detector (INTENTIONAL + LIMITED)
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

  const messages = [
    {
      role: "system",
      content: `
${NOFARI_DIRECTIVES}

TONE CONTROL (NON-NEGOTIABLE):
- Your DEFAULT tone is soft, calm, emotionally supportive, and professional.
- You MUST ONLY use slang or casual language IF the CURRENT user message uses slang.
- Slang is TEMPORARY and must NOT carry over to the next response.
- If the user message does NOT contain slang, you MUST return to a soft, neutral, emotionally grounded tone.
- Never assume slang is desired unless the user uses it first.
- Matching tone is turn-by-turn, not persistent.
`,
    },

    ...(slangMode
      ? [
          {
            role: "system",
            content:
              "The current user message uses slang. Mirror slang naturally in THIS response only.",
          },
        ]
      : [
          {
            role: "system",
            content:
              "The current user message does NOT use slang. Respond in a calm, supportive, professional tone with NO slang.",
          },
        ]),

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
