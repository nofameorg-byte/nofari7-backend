import cron from "node-cron"
import {createClient} from "@supabase/supabase-js"
import {generateCircleMessage} from "../services/groqCircle.js"
import {sendPush} from "../services/sendPush.js"

const supabase = createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_SERVICE_ROLE_KEY
)

let lastRunDate = null

async function runCircle(type){

console.log("NOFARI TEST MESSAGE RUNNING")

const {data:users}=await supabase
.from("users")
.select("*")

for(const user of users){

const msg = await generateCircleMessage(type,user.tone)

await sendPush(user.onesignal_player_id,msg)

}

}

export function startCircleJobs(){

cron.schedule("* * * * *",()=>{
runCircle("morning support")
})

}