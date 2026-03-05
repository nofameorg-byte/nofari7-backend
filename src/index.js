import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import nofariRoute from "./routes/nofari.route.js";
import voiceRoute from "./routes/voice.route.js";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ RENDER-SAFE writable audio directory
const AUDIO_PATH = "/tmp/nofari-audio";

// Serve audio files
app.use("/audio", express.static(AUDIO_PATH));

// Routes
app.use("/nofari", nofariRoute);
app.use("/voice", voiceRoute);

// Health check
app.get("/", (req, res) => {
  res.send("NOFARI backend running");
});

/* ===============================
   SOCKET.IO VIDEO SIGNALING
================================= */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create-room", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    if (rooms[roomId].length < 2) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);
      socket.emit("room-created", roomId);
    } else {
      socket.emit("room-full");
    }
  });

  socket.on("join-room", (roomId) => {
    if (rooms[roomId] && rooms[roomId].length === 1) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);
      socket.to(roomId).emit("user-joined");
    } else {
      socket.emit("room-full");
    }
  });

  socket.on("signal", ({ roomId, data }) => {
    socket.to(roomId).emit("signal", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

/* ===============================
   START SERVER
================================= */

const PORT = process.env.PORT || 10000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`NOFARI backend running on port ${PORT}`);
});