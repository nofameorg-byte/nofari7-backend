import cron from "node-cron"
import { createClient } from "@supabase/supabase-js"
import { generateCircleMessage } from "../services/groqCircle.js"
import { sendPush } from "../services/sendPush.js"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runCircle(type) {

  try {

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

    console.log("Generating circle message...")

    const msg = await generateCircleMessage(type, "supportive")

    console.log("Generated message:", msg)

    /* =========================
       SAVE MESSAGE
    ========================= */

    console.log("Saving message to Supabase...")

    await supabase
      .from("circle_daily_message")
      .update({
        message: msg,
        created_at: new Date()
      })
      .eq("id", 1)

    console.log("Message saved successfully")

    /* =========================
       SEND PUSH NOTIFICATIONS
    ========================= */

    console.log("Fetching users with push enabled...")

    const { data: users } = await supabase
      .from("users")
      .select("onesignal_player_id")

    let pushCount = 0

    for (const user of users) {

      if (!user.onesignal_player_id) continue

      try {

        await sendPush(user.onesignal_player_id, msg)

        pushCount++

      } catch (err) {

        console.error("Push failed:", err)

      }

    }

    console.log(`Push notifications sent: ${pushCount}`)

  } catch (err) {

    console.error("Circle job failed:", err)

  }

}

export function startCircleJobs() {

  console.log("Circle scheduler started")

  // Runs every day at 7:00 AM
  cron.schedule("0 7 * * *", () => {

    console.log("Cron triggered: running circle job")

    runCircle("morning support")

  })

}