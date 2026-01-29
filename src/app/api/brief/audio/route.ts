import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAudio } from '@/lib/elevenlabs'
import type { DailyBrief } from '@/types'

export async function POST() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  // Get today's brief
  const { data } = await supabase
    .from('daily_briefs')
    .select('*')
    .eq('user_id', user.id)
    .eq('brief_date', today)
    .single()

  const brief = data as unknown as DailyBrief | null

  if (!brief?.brief_text) {
    return NextResponse.json({ error: 'No brief text available' }, { status: 400 })
  }

  try {
    // Generate audio
    const audioBuffer = await generateAudio(brief.brief_text)
    
    // Upload to Supabase storage
    const fileName = `briefs/${user.id}/${today}.mp3`
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName)

    // Update brief with audio URL
    await supabase
      .from('daily_briefs')
      .update({ audio_url: publicUrl } as never)
      .eq('id', brief.id)

    return NextResponse.json({ audio_url: publicUrl })
  } catch (error) {
    console.error('Audio generation error:', error)
    return NextResponse.json({ error: 'Failed to generate audio' }, { status: 500 })
  }
}
