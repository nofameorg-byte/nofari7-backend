import cron from "node-cron"
import { createClient } from "@supabase/supabase-js"
import { generateCircleMessage } from "../services/groqCircle.js"
import { sendPush } from "../services/sendPush.js"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

let lastRunDate = null

async function runCircle(type) {

  const today = new Date().toISOString().split("T")[0]

  if (lastRunDate === today) {
    return
  }

  lastRunDate = today

  console.log("NOFARI MORNING MESSAGE RUNNING")

  const msg = await generateCircleMessage(type, "supportive")

  // Save message globally so the app can read it
  global.circleMessage = msg

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

  // Run every day at 7:00 AM
  cron.schedule("0 7 * * *", () => {
    runCircle("morning support")
  })

}