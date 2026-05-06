'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/shared/Navigation'
import { createClient } from '@/lib/supabase/client'
import { formatINR, formatRelativeTime } from '@/lib/utils/formatting'
import { Briefcase, IndianRupee, MessageSquare, Plus, TrendingUp, Star, ArrowRight, Clock, Users, Sparkles, Crown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  id: string
  role: string
  full_name: string
  plan: string
  wallet_balance: number
}

interface Job {
  id: string
  title: string
  status: string
  budget_min: number | null
  budget_max: number | null
  city: string
  applications_count: number
  created_at: string
  categories: { name: string; icon: string } | null
}

interface Conversation {
  id: string
  last_message: string
  last_message_at: string
  hirer_unread: number
  provider_unread: number
  profiles_provider_profiles: { full_name: string } | null
  profiles: { full_name: string } | null
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [isProvider, setIsProvider] = useState(false)
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (prof) {
      setProfile(prof as Profile)
      setIsProvider(prof.role === 'provider' || prof.role === 'both')
    }

    const { data: jobData } = await supabase
      .from('jobs')
      .select('*, categories(name, icon)')
      .eq('hirer_id', user.id)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(5)

    setJobs((jobData || []) as Job[])

    const { data: convData } = await supabase
      .from('conversations')
      .select('*, profiles!conversations_provider_id_fkey(full_name), profiles!conversations_hirer_id_fkey(full_name)')
      .or(`hirer_id.eq.${user.id},provider_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .limit(5)

    setConversations(convData || [])
    setLoading(false)

    // Check for pending job from AI chat
    const pendingJobStr = localStorage.getItem('gigmind_pending_job')
    if (pendingJobStr) {
      try {
        const pendingJob = JSON.parse(pendingJobStr)
        toast(
          <div className="flex flex-col gap-2 p-1">
            <p className="font-medium text-white">You have a pending job draft:</p>
            <p className="text-sm text-muted-foreground line-clamp-2">"{pendingJob.title}"</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => router.push('/ai-chat')}
                className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-medium"
              >
                View & Post
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('gigmind_pending_job')
                  toast.dismiss()
                }}
                className="px-3 py-1.5 rounded-lg bg-surface-hover text-muted-foreground text-xs font-medium"
              >
                Discard
              </button>
            </div>
          </div>,
          { duration: 10000 }
        )
      } catch (e) {
        localStorage.removeItem('gigmind_pending_job')
      }
    }
  }

  const handleCancelJob = async (jobId: string) => {
    setDeletingJobId(jobId)
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId)

      if (error) throw error

      setJobs(jobs.filter(j => j.id !== jobId))
      toast.success('Job cancelled successfully')
      setShowDeleteConfirm(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel job')
    }
    setDeletingJobId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-hover rounded w-1/3" />
            <div className="grid sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-surface-hover rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Welcome, {profile?.full_name || 'User'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {isProvider ? 'Provider Dashboard' : 'Hirer Dashboard'}
              </p>
            </div>
            <Link
              href="/ai-chat"
              className="px-5 py-2.5 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Post New Job
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {isProvider ? (
              <>
                <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-success-bg flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-white text-xl">{formatINR(profile?.wallet_balance || 0)}</div>
                      <div className="text-xs text-muted-foreground">Wallet Balance</div>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-white text-xl">{jobs.length}</div>
                      <div className="text-xs text-muted-foreground">Active Jobs</div>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-warning-bg flex items-center justify-center">
                      <Star className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-white text-xl">0</div>
                      <div className="text-xs text-muted-foreground">Avg Rating</div>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-info-bg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-white text-xl">0</div>
                      <div className="text-xs text-muted-foreground">This Month</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-white text-xl">{jobs.length}</div>
                      <div className="text-xs text-muted-foreground">Active Jobs</div>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-warning-bg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-white text-xl">0</div>
                      <div className="text-xs text-muted-foreground">Pending Payments</div>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-info-bg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-white text-xl">{conversations.length}</div>
                      <div className="text-xs text-muted-foreground">Messages</div>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-success-bg flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-white text-xl">{formatINR(0)}</div>
                      <div className="text-xs text-muted-foreground">Total Spent</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Upgrade Banner (Provider on Free) */}
          {isProvider && profile?.plan === 'free' && (
            <div className="p-5 rounded-2xl bg-brand-gradient mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-white" />
                <div>
                  <div className="font-display font-bold text-white">Upgrade to Pro</div>
                  <div className="text-white/80 text-sm">Unlimited applications, priority ranking, AI proposals</div>
                </div>
              </div>
              <Link href="/settings?tab=plan" className="px-5 py-2 rounded-lg bg-white text-brand font-medium text-sm hover:bg-white/90 transition-colors">
                Upgrade
              </Link>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Active Jobs */}
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-white">Active Jobs</h2>
                <Link href="/jobs" className="text-brand text-sm hover:text-brand-light flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></Link>
              </div>
              {jobs.length > 0 ? (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div key={job.id} className="p-3 rounded-xl bg-surface hover:bg-surface-hover transition-colors group flex items-start justify-between">
                      <Link href={`/jobs/${job.id}`} className="flex-1 block">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white text-sm truncate">{job.title}</span>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                            job.status === 'open' ? 'bg-success-bg text-success' : 'bg-info-bg text-info'
                          }`}>{job.status.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {job.categories && <span>{job.categories.icon} {job.categories.name}</span>}
                          {job.city && <span>{job.city}</span>}
                          <span>{job.applications_count} applications</span>
                        </div>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setShowDeleteConfirm(job.id)
                        }}
                        className="ml-2 p-1.5 rounded-lg bg-error/10 text-error opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/20"
                        title="Cancel job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm mb-3">No active jobs yet</p>
                  <Link href="/ai-chat" className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Post with AI
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Messages */}
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-white">Recent Messages</h2>
                <Link href="/messages" className="text-brand text-sm hover:text-brand-light flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></Link>
              </div>
              {conversations.length > 0 ? (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <Link key={conv.id} href={`/messages?id=${conv.id}`} className="block p-3 rounded-xl bg-surface hover:bg-surface-hover transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">{conv.profiles?.full_name || 'Chat'}</span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(conv.last_message_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.last_message || 'No messages yet'}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No conversations yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="w-full max-w-sm bg-surface-card rounded-2xl border border-surface-border p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-white mb-2">Cancel This Job?</h2>
            <p className="text-muted-foreground text-sm mb-6">Are you sure you want to cancel this job? This action cannot be undone.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-surface-border text-muted-foreground hover:text-white transition-colors text-sm"
              >
                Keep Job
              </button>
              <button
                onClick={() => handleCancelJob(showDeleteConfirm)}
                disabled={deletingJobId === showDeleteConfirm}
                className="flex-1 py-3 rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {deletingJobId === showDeleteConfirm ? 'Cancelling...' : 'Cancel Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
