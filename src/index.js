import "dotenv/config";
import express from "express";
import cors from "cors";

import voiceRoutes from "./routes/voice.route.js";
import chatRoutes from "./routes/chat.route.js";
import nofariRoutes from "./routes/nofari.route.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/voice", voiceRoutes);
app.use("/chat", chatRoutes);
app.use("/nofari", nofariRoutes);

app.get("/", (_req, res) => {
  res.send("NOFARI7 backend running");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🟢 NOFARI7 backend listening on port ${PORT}`);
});
