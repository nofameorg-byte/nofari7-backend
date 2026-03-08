import axios from "axios"

export async function generateCircleMessage(type, tone){

const prompt = `
Create a short supportive mental health message.

Type: ${type}
Tone: ${tone}

Rules:
- 2 to 3 sentences
- no astrology or astronomy words
- calm, supportive, encouraging
- written like a supportive companion

End with this exact sentence:

NOFARI's Circle here to support your day.
`

const res = await axios.post(
"https://api.groq.com/openai/v1/chat/completions",
{
model: "llama-3.1-8b-instant",
messages: [
{role:"user",content:prompt}
]
},
{
headers:{
Authorization:`Bearer ${process.env.GROQ_API_KEY}`
}
}
)

return res.data.choices[0].message.content

}