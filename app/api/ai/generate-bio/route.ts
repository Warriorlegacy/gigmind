import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateProviderBio } from '@/lib/ai/agents'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json()
  const { name, service, experience, skills, location, strengths } = body as Record<string, string>

  if (!name || !service) {
    return NextResponse.json({ error: 'name and service are required' }, { status: 400 })
  }

  try {
    const bio = await generateProviderBio({ name, service, experience, skills, location, strengths })
    return NextResponse.json({ bio })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI service unavailable'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
