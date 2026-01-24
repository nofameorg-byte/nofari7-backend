import express from "express";
import cors from "cors";
import path from "path";
import nofariRoute from "./routes/nofari.route.js";
import voiceRoute from "./routes/voice.route.js"; // ElevenLabs (LIVE)
import voicePiperRoute from "./routes/voice-piper.route.js"; // Piper (LOCAL)

const app = express();

app.use(cors());
app.use(express.json());

/**
 * 🔊 Serve generated audio files
 * These are written by Piper directly to the server disk
 * Location: /var/www/nofari/audio
 */
app.use(
  "/audio",
  express.static("/var/www/nofari/audio")
);

// NOFARI chat route
app.use("/nofari", nofariRoute);

// ElevenLabs voice (production)
app.use("/voice", voiceRoute);

// Piper voice (self-hosted)
app.use("/voice-piper", voicePiperRoute);

// Health check
app.get("/", (req, res) => {
  res.send("NOFARI backend running");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`NOFARI backend running on port ${PORT}`);
});
