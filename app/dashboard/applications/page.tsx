'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/shared/Navigation'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime, formatINR } from '@/lib/utils/formatting'
import { ArrowLeft, Users, IndianRupee, Clock, Briefcase } from 'lucide-react'

interface Application {
  id: string
  job_id: string
  status: string
  created_at: string
  proposed_amount: number | null
  cover_letter: string | null
  jobs: {
    title: string
    status: string
  } | null
  provider_profiles: {
    profiles: {
      full_name: string
      avatar_url: string | null
    } | null
  } | null
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get applications received for jobs posted by this user
    const { data } = await supabase
      .from('applications')
      .select('*, jobs!inner(title, status, hirer_id), provider_profiles(user_id, profiles(id, full_name, avatar_url))')
      .eq('jobs.hirer_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setApplications(data as any)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-3xl font-bold text-white">All Applications</h1>
            <div className="px-3 py-1 rounded-full bg-brand/10 text-brand text-sm font-medium">
              {applications.length} Received
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 rounded-2xl bg-surface-card border border-surface-border animate-pulse" />
              ))}
            </div>
          ) : applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((app: any) => (
                <div key={app.id} className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-brand/30 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-brand/10 border border-brand/20">
                        {app.provider_profiles?.profiles?.avatar_url ? (
                          <img src={app.provider_profiles.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand font-bold">
                            {app.provider_profiles?.profiles?.full_name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{app.provider_profiles?.profiles?.full_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatRelativeTime(app.created_at)}</span>
                          {app.proposed_amount && <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> {formatINR(app.proposed_amount)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        app.status === 'hired' ? 'bg-success-bg text-success' :
                        app.status === 'shortlisted' ? 'bg-info-bg text-info' :
                        'bg-surface-hover text-muted-foreground'
                      }`}>{app.status}</span>
                      <Link href={`/jobs/${app.job_id}`} className="p-2 rounded-lg bg-surface-hover text-white hover:bg-brand/10 hover:text-brand transition-colors">
                        <Briefcase className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Applied for</div>
                    <div className="text-white font-medium">{app.jobs?.title}</div>
                  </div>

                  <div className="bg-surface p-4 rounded-xl border border-surface-border italic text-sm text-muted-foreground line-clamp-3">
                    &quot;{app.cover_letter}&quot;
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Link 
                      href={`/messages?provider=${app.provider_profiles?.user_id}&job=${app.job_id}`} 
                      className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-bold text-center hover:bg-brand-dark transition-colors"
                    >
                      Message
                    </Link>
                    <Link 
                      href={`/jobs/${app.job_id}`}
                      className="flex-1 py-2.5 rounded-xl border border-surface-border text-muted-foreground text-sm font-medium text-center hover:text-white transition-colors"
                    >
                      View Job
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface-card rounded-2xl border border-surface-border border-dashed">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Applications Found</h3>
              <p className="text-muted-foreground mb-8">You haven&apos;t received any applications for your posted jobs yet.</p>
              <Link href="/ai-chat" className="px-6 py-3 rounded-xl bg-brand text-white font-medium">Post a New Job</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
