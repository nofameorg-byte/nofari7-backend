import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

/* ===============================
   HEALTH CHECK
================================= */

app.get("/", (req, res) => {
  res.send("NOFARI backend running");
});

/* ===============================
   NOFARI CHAT
================================= */

app.post("/nofari", async (req, res) => {
  try {

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message required"
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            {
              role: "system",
              content:
                "You are NOFARI, a warm emotional support AI who speaks calmly like a caring big sister."
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

    const reply =
      data?.choices?.[0]?.message?.content ||
      "I'm here with you.";

    res.json({
      reply
    });

  } catch (error) {

    console.error("Groq error:", error);

    res.json({
      reply: "I'm here with you."
    });

  }
});

/* ===============================
   START SERVER
================================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`NOFARI backend running on port ${PORT}`);
});