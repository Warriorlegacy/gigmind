import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeInput } from '@/lib/sanitize'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json()
  const { job_id, cover_letter, proposed_amount, proposed_timeline } = body as {
    job_id?: string
    cover_letter?: string
    proposed_amount?: number | string | null
    proposed_timeline?: string
  }

  const safeCoverLetter = sanitizeInput(cover_letter || '')
  if (!job_id || safeCoverLetter.length < 50) {
    return NextResponse.json({ error: 'A job and cover letter of at least 50 characters are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_id,
      applicant_id: user.id,
      cover_letter: safeCoverLetter,
      proposed_amount: proposed_amount ? Number(proposed_amount) : null,
      proposed_timeline: proposed_timeline ? sanitizeInput(proposed_timeline) : null,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
