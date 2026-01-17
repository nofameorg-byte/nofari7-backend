import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import crypto from "crypto";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

if (!ELEVENLABS_API_KEY || !VOICE_ID) {
  throw new Error("ElevenLabs env vars missing");
}

const AUDIO_DIR = path.join(process.cwd(), "src/public/audio");

// ensure audio directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

export async function generateVoice(text) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  const filename = `nofari-${crypto.randomUUID()}.mp3`;
  const filepath = path.join(AUDIO_DIR, filename);

  fs.writeFileSync(filepath, buffer);

  // 👇 THIS IS WHAT THE FRONTEND EXPECTS
  return `/audio/${filename}`;
}
