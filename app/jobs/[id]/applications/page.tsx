'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/shared/Navigation'
import { createClient } from '@/lib/supabase/client'
import { formatINR, formatRelativeTime } from '@/lib/utils/formatting'
import {
  ArrowLeft, IndianRupee, Clock, User, Check, X, Crown,
  Loader2, MessageSquare, Star,
} from 'lucide-react'
import { toast } from 'sonner'

interface Application {
  id: string
  cover_letter: string
  proposed_amount: number | null
  proposed_timeline: string | null
  status: string
  created_at: string
  provider_profiles: {
    id: string
    bio: string
    tagline: string
    avg_rating: number
    total_jobs_done: number
    profiles: {
      id: string
      full_name: string
      avatar_url: string | null
    } | null
  } | null
}

interface Job {
  id: string
  title: string
  status: string
  hirer_id: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning-bg text-warning',
  shortlisted: 'bg-info-bg text-info',
  rejected: 'bg-error/10 text-error',
  hired: 'bg-success-bg text-success',
}

export default function ApplicationsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Fetch job and verify ownership
    const { data: jobData, error: jobErr } = await supabase
      .from('jobs')
      .select('id, title, status, hirer_id')
      .eq('id', id)
      .single()

    if (jobErr || !jobData || jobData.hirer_id !== user.id) {
      toast.error('Access denied')
      router.push('/dashboard')
      return
    }

    setJob(jobData as Job)

    // Fetch applications with provider info
    const { data: apps } = await supabase
      .from('applications')
      .select(`
        id, cover_letter, proposed_amount, proposed_timeline, status, created_at,
        provider_profiles(
          id, bio, tagline, avg_rating, total_jobs_done,
          profiles(id, full_name, avatar_url)
        )
      `)
      .eq('job_id', id)
      .order('created_at', { ascending: false })

    setApplications((apps || []) as unknown as Application[])
    setLoading(false)
  }

  const updateStatus = async (appId: string, newStatus: string) => {
    setUpdatingId(appId)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          status: newStatus,
          jobId: id,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Update failed')

      if (newStatus === 'hired') {
        toast.success('Provider hired! Job is now in progress.')
      } else {
        toast.success(`Application ${newStatus}.`)
      }

      // Optimistic update
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status: newStatus } : a)
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
    setUpdatingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pt-20">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 bg-surface-hover rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href={`/jobs/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Job
          </Link>

          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-white">{job?.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {applications.length} application{applications.length !== 1 ? 's' : ''} received
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface-card border border-surface-border text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-display font-bold text-white mb-1">No applications yet</h3>
              <p className="text-muted-foreground text-sm">Share your job to attract providers.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const provider = app.provider_profiles
                const profile = provider?.profiles
                const isUpdating = updatingId === app.id
                const isHired = app.status === 'hired'
                const jobInProgress = job?.status === 'in_progress'

                return (
                  <div
                    key={app.id}
                    className={`p-6 rounded-2xl bg-surface-card border transition-all ${
                      isHired ? 'border-success/40 bg-success-bg/5' : 'border-surface-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Applicant Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-brand/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name} className="w-11 h-11 object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-brand" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{profile?.full_name || 'Anonymous'}</span>
                            {provider?.avg_rating ? (
                              <span className="flex items-center gap-0.5 text-xs text-warning">
                                <Star className="w-3 h-3 fill-warning" /> {provider.avg_rating.toFixed(1)}
                              </span>
                            ) : null}
                            {provider?.total_jobs_done ? (
                              <span className="text-xs text-muted-foreground">{provider.total_jobs_done} jobs done</span>
                            ) : null}
                          </div>
                          {provider?.tagline && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{provider.tagline}</p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${STATUS_COLORS[app.status] || 'bg-surface-hover text-muted-foreground'}`}>
                        {isHired ? '✓ Hired' : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>

                    {/* Proposed Details */}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      {app.proposed_amount && (
                        <span className="flex items-center gap-1 text-white font-medium">
                          <IndianRupee className="w-3.5 h-3.5 text-brand" />
                          {formatINR(app.proposed_amount)}
                        </span>
                      )}
                      {app.proposed_timeline && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 text-brand" />
                          {app.proposed_timeline}
                        </span>
                      )}
                      <span className="text-muted-foreground text-xs">Applied {formatRelativeTime(app.created_at)}</span>
                    </div>

                    {/* Cover Letter */}
                    {app.cover_letter && (
                      <div className="mt-4 p-4 rounded-xl bg-surface border border-surface-border/60">
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">
                          {app.cover_letter}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!isHired && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {app.status !== 'shortlisted' && app.status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(app.id, 'shortlisted')}
                            disabled={isUpdating}
                            className="px-4 py-2 rounded-lg bg-info/10 text-info hover:bg-info/20 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                          >
                            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Shortlist
                          </button>
                        )}
                        {app.status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(app.id, 'rejected')}
                            disabled={isUpdating}
                            className="px-4 py-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                          >
                            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                            Reject
                          </button>
                        )}
                        {!jobInProgress && (
                          <button
                            onClick={() => updateStatus(app.id, 'hired')}
                            disabled={isUpdating}
                            className="px-4 py-2 rounded-lg bg-brand-gradient text-white hover:opacity-90 transition-opacity text-xs font-medium flex items-center gap-1 disabled:opacity-50 ml-auto"
                          >
                            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />}
                            Hire This Person
                          </button>
                        )}
                      </div>
                    )}

                    {isHired && (
                      <div className="mt-4 flex items-center gap-2 text-success text-sm font-medium">
                        <Check className="w-4 h-4" /> This person has been hired — job is now in progress.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
