import express from "express";
import cors from "cors";
import { generateGroqReply } from "./services/groq.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "NOFARI backend alive"
  });
});

/*
NOFARI CHAT ROUTE
New architecture route
*/

app.post("/chat", async (req, res) => {
  try {

    const { message, memory } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message required"
      });
    }

    const reply = await generateGroqReply(message, memory || "");

    res.json({
      reply
    });

  } catch (err) {

    console.error("NOFARI chat error:", err);

    res.status(500).json({
      error: "NOFARI response failed"
    });

  }
});

/*
OLD FRONTEND COMPATIBILITY ROUTE
This restores the old `/nofari` endpoint your previous app used
*/

app.post("/nofari", async (req, res) => {
  try {

    const { text, memory } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Text required"
      });
    }

    const reply = await generateGroqReply(text, memory || "");

    res.json({
      reply
    });

  } catch (err) {

    console.error("NOFARI legacy route error:", err);

    res.status(500).json({
      error: "NOFARI response failed"
    });

  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("NOFARI backend running on port", PORT);
});