import express from "express";
import { getDailyCircleMessage } from "../services/circleDailyMessage.js";

const router = express.Router();

router.get("/circle-message", async (req, res) => {

  const message = await getDailyCircleMessage();

  res.json({
    message
  });

});

export default router;