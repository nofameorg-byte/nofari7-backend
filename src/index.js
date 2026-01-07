import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import nofariRoutes from "./routes/nofari.route.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// 🔊 SERVE AUDIO FILES (CORRECT PATH)
app.use(
  "/audio",
  express.static(path.join(__dirname, "public", "audio"))
);

app.use("/nofari", nofariRoutes);

app.get("/", (_req, res) => {
  res.send("NOFARI backend running");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🟢 NOFARI backend listening on port ${PORT}`);
});
