import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

function summarize(notifications: Notification[]) {
  const unread = notifications.filter((notification) => !notification.is_read)
  const counts = unread.reduce<Record<string, number>>((acc, notification) => {
    acc[notification.type] = (acc[notification.type] || 0) + 1
    return acc
  }, {})

  const parts = [
    counts.application || counts.new_application ? `${counts.application || counts.new_application} new applications` : '',
    counts.message ? `${counts.message} messages` : '',
    counts.job_match ? `${counts.job_match} job matches` : '',
    counts.payment ? `${counts.payment} payment updates` : '',
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : 'All caught up'
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { data: latest, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const notifications = (latest || []) as Notification[]

  return NextResponse.json({
    unread_count: count || 0,
    latest: notifications,
    summary: summarize(notifications),
  })
}
