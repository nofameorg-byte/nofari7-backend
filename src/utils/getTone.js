export function getTone(birthday) {

const date = new Date(birthday)
const m = date.getMonth() + 1
const d = date.getDate()

if ((m==3 && d>=21) || (m==4 && d<=19))
return "confident action focused"

if ((m==4 && d>=20) || (m==5 && d<=20))
return "calm grounded"

if ((m==5 && d>=21) || (m==6 && d<=20))
return "thoughtful reflective"

if ((m==6 && d>=21) || (m==7 && d<=22))
return "emotionally supportive"

if ((m==7 && d>=23) || (m==8 && d<=22))
return "motivational strong"

if ((m==8 && d>=23) || (m==9 && d<=22))
return "organized steady"

if ((m==9 && d>=23) || (m==10 && d<=22))
return "balanced peaceful"

if ((m==10 && d>=23) || (m==11 && d<=21))
return "resilient determined"

if ((m==11 && d>=22) || (m==12 && d<=21))
return "optimistic forward"

if ((m==12 && d>=22) || (m==1 && d<=19))
return "disciplined focused"

if ((m==1 && d>=20) || (m==2 && d<=18))
return "independent unique"

return "empathetic gentle"

}