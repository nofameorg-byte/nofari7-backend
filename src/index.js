import express from "express";
import cors from "cors";
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`NOFARI backend running on port ${PORT}`);
});
