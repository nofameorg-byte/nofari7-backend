import express from "express";
import cors from "cors";
import path from "path";
import nofariRoute from "./routes/nofari.route.js";

const app = express();

app.use(cors());
app.use(express.json());

// serve audio files publicly
app.use("/audio", express.static(path.join(process.cwd(), "public/audio")));

// 🔥 THIS IS THE IMPORTANT LINE
app.use("/nofari", nofariRoute);

// health check
app.get("/", (req, res) => {
  res.send("NOFARI backend running");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`NOFARI backend running on port ${PORT}`);
});
