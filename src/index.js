import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("NOFARI backend running");
});

app.post("/nofari", async (req, res) => {

  try {

    const { message } = req.body;

    console.log("Incoming message:", message);

    const response = await fetch(
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
              content: "You are NOFARI, a warm emotional support AI."
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

    console.log("Groq response:", data);

    const reply =
      data?.choices?.[0]?.message?.content ||
      "I'm here with you.";

    res.json({ reply });

  } catch (error) {

    console.log("Groq failure:", error);

    res.json({
      reply: "I'm here with you."
    });

  }

});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`NOFARI backend running on port ${PORT}`);
});