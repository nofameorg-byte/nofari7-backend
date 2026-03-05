import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get("/", (req, res) => {
  res.send("NOFARI backend running");
});





/* =========================
   NOFARI CHAT ENDPOINT
========================= */

app.post("/nofari", async (req, res) => {

  try {

    const userText =
      req.body?.text ||
      req.body?.message ||
      req.body?.content ||
      "";

    if (!userText) {
      return res.json({
        reply: "I'm here with you. Tell me what's on your mind."
      });
    }

    const groqRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are NOFARI, a calm emotional support companion. Respond in 2-3 supportive sentences."
          },
          {
            role: "user",
            content: userText
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply =
      groqRes?.data?.choices?.[0]?.message?.content ||
      "I'm here with you.";

    res.json({ reply });

  } catch (err) {

    console.error("NOFARI backend error:", err?.response?.data || err);

    res.json({
      reply: "I'm here with you. Let's take a breath and try again."
    });

  }

});





/* =========================
   CIRCLE SOCKET SYSTEM
========================= */

const MAX_ROOM_SIZE = 6;

let rooms = {};

const names = [
  "CalmRiver",
  "QuietStone",
  "NightEcho",
  "BlueLeaf",
  "SoftCloud",
  "WarmSun",
  "SilverWave",
  "KindSky",
  "StillWater",
  "GentleWind"
];

function randomName() {
  return names[Math.floor(Math.random() * names.length)];
}

function findRoom() {
  for (const roomId in rooms) {
    if (rooms[roomId].length < MAX_ROOM_SIZE) {
      return roomId;
    }
  }
  return null;
}

io.on("connection", (socket) => {

  socket.on("circle-join", () => {

    let roomId = findRoom();

    if (!roomId) {
      roomId = `circle-${Date.now()}`;
      rooms[roomId] = [];
    }

    const nickname = randomName();

    rooms[roomId].push({
      socketId: socket.id,
      nickname
    });

    socket.join(roomId);

    io.to(roomId).emit("circle-users", rooms[roomId]);

    socket.emit("circle-joined", {
      roomId,
      nickname
    });

  });

  socket.on("disconnect", () => {

    for (const roomId in rooms) {

      rooms[roomId] = rooms[roomId].filter(
        u => u.socketId !== socket.id
      );

      io.to(roomId).emit("circle-users", rooms[roomId]);

      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }

    }

  });

});





/* =========================
   SUPABASE
========================= */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);





/* =========================
   CIRCLE PUSH SYSTEM
========================= */

async function generateCircleMessage(type, tone) {

  const prompt = `
Create a short supportive mental health message.

Type: ${type}
Tone: ${tone}

Rules:
- 2 to 3 sentences
- calm supportive tone
- no astrology words

End with:

NOFARI's Circle here to support your day.
`;

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama3-70b-8192",
      messages: [
        { role: "user", content: prompt }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      }
    }
  );

  return res.data.choices[0].message.content;

}

async function sendPush(playerId, message) {

  await axios.post(
    "https://onesignal.com/api/v1/notifications",
    {
      app_id: process.env.ONESIGNAL_APP_ID,
      include_player_ids: [playerId],
      headings: { en: "NOFARI's Circle" },
      contents: { en: message }
    },
    {
      headers: {
        Authorization: `Basic ${process.env.ONESIGNAL_REST_KEY}`
      }
    }
  );

}

async function runCircle(type) {

  const { data: users } = await supabase
    .from("users")
    .select("*");

  if (!users) return;

  for (const user of users) {

    if (!user.onesignal_player_id) continue;

    const message = await generateCircleMessage(
      type,
      user.tone || "calm supportive"
    );

    await sendPush(user.onesignal_player_id, message);

  }

}

cron.schedule(
  "0 8 * * *",
  () => runCircle("morning grounding"),
  { timezone: "America/New_York" }
);

cron.schedule(
  "0 13 * * *",
  () => runCircle("midday encouragement"),
  { timezone: "America/New_York" }
);

cron.schedule(
  "0 21 * * *",
  () => runCircle("night reflection"),
  { timezone: "America/New_York" }
);





/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`NOFARI backend running on port ${PORT}`);
});