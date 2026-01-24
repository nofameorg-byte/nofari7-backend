import express from "express";
import cors from "cors";
import path from "path";
import nofariRoute from "./routes/nofari.route.js";
import voiceRoute from "./routes/voice.route.js"; // ElevenLabs (EXISTING)
import voicePiperRoute from "./routes/voice-piper.route.js"; // ✅ NEW

const app = express();

app.use(cors());
app.use(express.json());

// serve audio files
app.use(
  "/audio",
  express.static(path.join(process.cwd(), "src/public/audio"))
);

// NOFARI chat route
app.use("/nofari", nofariRoute);

// ElevenLabs voice (LIVE)
app.use("/voice", voiceRoute);

// Piper voice (TEST ONLY)
app.use("/voice-piper", voicePiperRoute);

// health check
app.get("/", (req, res) => {
  res.send("NOFARI backend running");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`NOFARI backend running on port ${PORT}`);
});
