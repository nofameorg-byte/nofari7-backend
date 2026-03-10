import fetch from "node-fetch";

let todaysMessage = "";
let lastGeneratedDate = "";

export async function getDailyCircleMessage() {

  const today = new Date().toISOString().split("T")[0];

  if (lastGeneratedDate === today && todaysMessage) {
    return todaysMessage;
  }

  try {

    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are NOFARI, a warm supportive presence that speaks like a calm protective big sister."
            },
            {
              role: "user",
              content:
                "Write a short daily support message under 40 words. Encourage the user. Avoid therapy or medical language."
            }
          ],
          temperature: 0.9
        })
      }
    );

    const data = await res.json();

    todaysMessage = data.choices[0].message.content.trim();
    lastGeneratedDate = today;

    return todaysMessage;

  } catch (err) {

    console.error("Circle message error:", err);

    return "Remember — even small steps forward still move your life ahead.";
  }
}