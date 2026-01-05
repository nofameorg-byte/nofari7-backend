import express, { Request, Response } from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.route.js";
import voiceRoutes from "./routes/voice.route.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/chat", chatRoutes);
app.use("/voice", voiceRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.send("NOFARI7 backend running.");
});

const PORT = Number(process.env.PORT) || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🟢 NOFARI7 backend listening on port ${PORT}`);
});
