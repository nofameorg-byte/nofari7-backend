import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import nofariRoutes from "./routes/nofari.route.js";

const app = express();

app.use(cors());
app.use(express.json());

// 🔊 SERVE AUDIO FILES
app.use("/audio", express.static(path.join(process.cwd(), "public/audio")));

app.use("/nofari", nofariRoutes);

app.get("/", (_req, res) => {
  res.send("NOFARI backend running");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🟢 NOFARI backend listening on port ${PORT}`);
});
