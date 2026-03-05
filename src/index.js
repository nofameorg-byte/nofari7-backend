import express from "express";
import http from "http";
import { Server } from "socket.io";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

/*
--------------------------------
HEALTH ROUTE
--------------------------------
*/

app.get("/", (req, res) => {
  res.json({ status: "NOFARI backend running" });
});

/*
--------------------------------
NOFARI CHAT (RESTORED)
--------------------------------
*/

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            {
              role: "system",
              content:
                "You are NOFARI, a calm supportive emotional companion who speaks warmly like a big sister.",
            },
            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const reply = data.choices?.[0]?.message?.content || "I'm here with you.";

    res.json({ reply });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).json({ error: "chat_failed" });
  }
});

/*
--------------------------------
SOCKET CONNECTION
--------------------------------
*/

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/*
--------------------------------
START SERVER
--------------------------------
*/

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`NOFARI backend running on port ${PORT}`);
});