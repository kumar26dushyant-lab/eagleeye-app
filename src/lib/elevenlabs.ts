export async function generateAudio(text: string): Promise<ArrayBuffer> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'Rachel'
  
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`ElevenLabs error: ${response.status} - ${error}`)
  }

  return response.arrayBuffer()
}

export function estimateAudioDuration(text: string): number {
  // Rough estimate: ~150 words per minute, average word length ~5 chars
  const wordCount = text.split(/\s+/).length
  const minutes = wordCount / 150
  return Math.ceil(minutes * 60) // Return seconds
}
