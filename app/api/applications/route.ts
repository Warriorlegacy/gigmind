import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// Service role client bypasses RLS — used for updates that require cross-table auth checks
const adminClient = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { applicationId, status, jobId } = body

    if (!applicationId || !status || !jobId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validStatuses = ['shortlisted', 'rejected', 'hired']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Verify the caller is the hirer of this job
    const { data: job, error: jobErr } = await adminClient
      .from('jobs')
      .select('id, hirer_id, title, status')
      .eq('id', jobId)
      .single()

    if (jobErr || !job || job.hirer_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update application status
    const { error: updateErr } = await adminClient
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .eq('job_id', jobId)

    if (updateErr) throw updateErr

    // If hiring, update job + notify provider
    if (status === 'hired') {
      const { data: app } = await adminClient
        .from('applications')
        .select('provider_id, provider_profiles(id, user_id, profiles(id))')
        .eq('id', applicationId)
        .single()

      if (app?.provider_id) {
        await adminClient
          .from('jobs')
          .update({ status: 'in_progress', hired_provider_id: app.provider_id })
          .eq('id', jobId)
      }

      // Notify the hired provider
      const providerProfile = app?.provider_profiles as any
      const providerUserId = providerProfile?.user_id

      if (providerUserId) {
        await adminClient.from('notifications').insert({
          user_id: providerUserId,
          type: 'hired',
          title: 'You have been hired! 🎉',
          body: `Congratulations! You've been selected for: ${job.title}`,
          data: { job_id: jobId, application_id: applicationId },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[applications PATCH]', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
