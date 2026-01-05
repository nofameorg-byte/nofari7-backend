import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.route.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/chat", chatRoutes);

app.get("/", (_req, res) => {
  res.send("NOFARI7 backend running.");
});

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🟢 NOFARI7 backend listening on port ${PORT}`);
});
