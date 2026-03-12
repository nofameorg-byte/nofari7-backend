import cron from "node-cron"
import { createClient } from "@supabase/supabase-js"
import { generateCircleMessage } from "../services/groqCircle.js"
import { sendPush } from "../services/sendPush.js"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runCircle(type) {

  const today = new Date().toISOString().split("T")[0]

  /* =========================
     CHECK IF ALREADY RAN TODAY
  ========================= */

  const { data } = await supabase
    .from("circle_daily_message")
    .select("created_at")
    .eq("id", 1)
    .single()

  if (data) {

    const existingDate = new Date(data.created_at)
      .toISOString()
      .split("T")[0]

    if (existingDate === today) {
      console.log("Circle message already generated today")
      return
    }

  }

  console.log("NOFARI MORNING MESSAGE RUNNING")

  /* =========================
     GENERATE GROQ MESSAGE
  ========================= */

  const msg = await generateCircleMessage(type, "supportive")

  /* =========================
     SAVE MESSAGE
  ========================= */

  await supabase
    .from("circle_daily_message")
    .update({
      message: msg,
      created_at: new Date()
    })
    .eq("id", 1)

  /* =========================
     SEND PUSH NOTIFICATIONS
  ========================= */

  const { data: users } = await supabase
    .from("users")
    .select("*")

  for (const user of users) {

    if (!user.onesignal_player_id) {
      continue
    }

    await sendPush(user.onesignal_player_id, msg)

  }

}

export function startCircleJobs() {

  // runs every day at 7:00 AM
  cron.schedule("0 7 * * *", () => {
    runCircle("morning support")
  })

}