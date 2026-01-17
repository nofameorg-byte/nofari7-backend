import fetch from "node-fetch";
import { NOFARI_DIRECTIVES } from "../config/directives.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.1-70b-versatile";

if (!GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY missing");
}

export async function generateGroqReply(userText, memory = "") {
  const messages = [
    {
      role: "system",
      content: NOFARI_DIRECTIVES,
    },
    ...(memory
      ? [
          {
            role: "system",
            content: `Context (do not quote or mention): ${memory}`,
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
        temperature: 0.7,
        max_tokens: 350,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();

  return data.choices[0].message.content.trim();
}
