import axios from "axios"

export async function sendPush(playerId,message){

await axios.post(
"https://onesignal.com/api/v1/notifications",
{
app_id:process.env.ONESIGNAL_APP_ID,
include_player_ids:[playerId],
headings:{en:"NOFARI's Circle"},
contents:{en:message}
},
{
headers:{
Authorization:`Basic ${process.env.ONESIGNAL_REST_KEY}`
}
}
)

}