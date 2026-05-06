import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateProposal } from '@/lib/ai/agents'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json()
  const { jobTitle, jobDescription, providerBio, skills, amount, timeline } = body as {
    jobTitle: string
    jobDescription: string
    providerBio: string
    skills: string[]
    amount: number
    timeline: string
  }

  if (!jobTitle || !jobDescription) {
    return NextResponse.json({ error: 'jobTitle and jobDescription are required' }, { status: 400 })
  }

  try {
    const proposal = await generateProposal(jobTitle, jobDescription, providerBio || '', skills || [], amount || 0, timeline || '1 week')
    return NextResponse.json({ proposal })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI service unavailable'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
