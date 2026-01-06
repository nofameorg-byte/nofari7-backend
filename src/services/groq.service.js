import fetch from "node-fetch";
import { NOFARI_DIRECTIVES } from "../config/directives.js";

const INTERNAL_LLM_ENDPOINT =
  "https://api.groq.com/openai/v1/chat/completions";

export async function generateGroqReply(userMessage, memoryContext) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY missing");
  }

  const messages = [
    { role: "system", content: NOFARI_DIRECTIVES },
    ...(memoryContext
      ? [{ role: "system", content: memoryContext }]
      : []),
    { role: "user", content: userMessage },
  ];

  const response = await fetch(INTERNAL_LLM_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.6,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq error: ${errorText}`);
  }

  const data = await response.json();

  return data.choices[0].message.content;
}
