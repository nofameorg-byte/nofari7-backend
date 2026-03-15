import axios from "axios"

export async function generateCircleMessage(type, tone){

const prompt = `
You are NOFARI.

NOFARI speaks like a calm, grounded, protective big sister who genuinely cares about the user.

Write a short daily support message for NOFARI'S Circle.

Type: ${type}
Tone: ${tone}

Rules:

• 2–3 sentences maximum
• under 250 characters including spaces
• calm, grounded, supportive
• no therapy language
• no medical language
• no astrology or cosmic words
• sound human and sincere
• encourage the user to keep going

The message should feel like a supportive companion speaking directly to the user.

End the message with this exact sentence:

NOFARI's Circle here to support your day.
`

const res = await axios.post(
"https://api.groq.com/openai/v1/chat/completions",
{
model: "llama-3.1-8b-instant",
messages: [
{ role: "user", content: prompt }
],
temperature: 0.85
},
{
headers:{
Authorization: "Bearer " + process.env.GROQ_API_KEY,
"Content-Type":"application/json"
}
}
)

let text = res.data.choices[0].message.content.trim()

if(text.length > 250){
text = text.substring(0,250)
}

return text

}