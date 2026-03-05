import cron from "node-cron"
import {createClient} from "@supabase/supabase-js"
import {generateCircleMessage} from "../services/groqCircle.js"
import {sendPush} from "../services/sendPush.js"

const supabase = createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_SERVICE_ROLE
)

async function runCircle(type){

const {data:users}=await supabase
.from("users")
.select("*")

for(const user of users){

const msg = await generateCircleMessage(type,user.tone)

await sendPush(user.onesignal_player_id,msg)

}

}

export function startCircleJobs(){

cron.schedule("0 8 * * *",()=>{
runCircle("morning grounding")
})

cron.schedule("0 13 * * *",()=>{
runCircle("midday encouragement")
})

cron.schedule("0 21 * * *",()=>{
runCircle("night reflection")
})

}