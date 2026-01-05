import fetch from "node-fetch";

/**
 * Streams voice audio directly from ElevenLabs.
 * NO files written. NO disk usage.
 */
export async function streamVoice(
  text: string,
  res: any
): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    throw new Error("ElevenLabs config missing");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.65,
        },
      }),
    }
  );

  if (!response.ok || !response.body) {
    const errText = await response.text();
    throw new Error(`ElevenLabs stream failed: ${errText}`);
  }

  // ✅ Stream audio directly to client
  res.setHeader("Content-Type", "audio/mpeg");
  response.body.pipe(res);
}
