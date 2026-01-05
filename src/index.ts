import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import chatRoutes from "./routes/chat.routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/audio", express.static(path.join(process.cwd(), "public/audio")));
app.use("/chat", chatRoutes);

app.get("/", (_req, res) => {
  res.send("NOFARI backend running.");
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🟢 NOFARI backend running on port ${PORT}`);
});
