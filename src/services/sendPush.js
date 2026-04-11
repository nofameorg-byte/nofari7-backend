import axios from "axios"

export async function sendPush(message) {

  await axios.post(
    "https://onesignal.com/api/v1/notifications",
    {
      app_id: process.env.ONESIGNAL_APP_ID,

      // send to all active subscribed users
      included_segments: ["All"],

      headings: {
        en: "NOFARI's Circle"
      },

      contents: {
        en: message
      }
    },
    {
      headers: {
        Authorization: `Basic ${process.env.ONESIGNAL_REST_KEY}`,
        "Content-Type": "application/json"
      }
    }
  )

}