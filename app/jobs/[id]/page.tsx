'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/shared/Navigation'
import { createClient } from '@/lib/supabase/client'
import { formatINR, formatRelativeTime } from '@/lib/utils/formatting'
import { MapPin, IndianRupee, Clock, Users, ArrowLeft, Send, Sparkles, Star, Calendar, CircleCheck as CheckCircle, Trash2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

interface Job {
  id: string
  title: string
  description: string
  requirements: string | null
  location_text: string
  city: string
  budget_min: number | null
  budget_max: number | null
  budget_type: string
  duration: string | null
  start_date: string | null
  status: string
  applications_count: number
  views_count: number
  created_at: string
  categories: { id: string; name: string; slug: string; icon: string } | null
  profiles: { id: string; full_name: string; avatar_url: string | null; created_at: string } | null
}

export default function JobDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [proposedAmount, setProposedAmount] = useState('')
  const [proposedTimeline, setProposedTimeline] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [hasProviderProfile, setHasProviderProfile] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [isHirer, setIsHirer] = useState(false)
  const [jobApplications, setJobApplications] = useState<any[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadJob()
    checkAuth()
  }, [id, job?.id])

  const loadJob = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, categories(id, name, slug, icon), profiles(id, full_name, avatar_url, created_at)')
      .eq('id', id)
      .single()

    if (data) {
      setJob(data as Job)
      await supabase.from('jobs').update({ views_count: (data.views_count || 0) + 1 }).eq('id', id)
    }
    setLoading(false)
  }

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      setIsHirer(job?.profiles?.id === user.id)

      // Check for provider profile
      const { data: provider } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      
      setHasProviderProfile(!!provider)
      
      const jobOwner = job?.profiles?.id === user.id
      setIsHirer(jobOwner)

      if (jobOwner) {
        fetchJobApplications()
      }

      if (provider) {
        // Check for existing application
        const { data: application } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', id)
          .eq('provider_id', provider.id)
          .maybeSingle()
        
        setHasApplied(!!application)
      }
    }
  }

  const fetchJobApplications = async () => {
    setAppsLoading(true)
    const { data } = await supabase
      .from('applications')
      .select('*, provider_profiles(*, profiles(full_name, avatar_url))')
      .eq('job_id', id)
      .order('created_at', { ascending: false })
    
    if (data) setJobApplications(data)
    setAppsLoading(false)
  }

  const generateAIProposal = async () => {
    if (!job) return
    setGeneratingAI(true)
    try {
      const { data: provider } = await supabase
        .from('provider_profiles')
        .select('bio')
        .eq('user_id', user.id)
        .maybeSingle()

      const res = await fetch('/api/ai/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: job.title,
          jobDescription: job.description,
          providerBio: provider?.bio || '',
          skills: [],
          amount: parseFloat(proposedAmount) || 0,
          timeline: proposedTimeline || '1 week',
        }),
      })
      const data = await res.json()
      if (data.proposal) setCoverLetter(data.proposal)
    } catch {
      // fallback: keep existing cover letter
    }
    setGeneratingAI(false)
  }

  const handleApply = async () => {
    if (!user || !hasProviderProfile) {
      router.push('/signup?role=provider')
      return
    }
    setSubmitting(true)
    try {
      const { data: provider } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!provider) return

      const { error } = await supabase.from('applications').insert({
        job_id: id,
        provider_id: provider.id,
        cover_letter: coverLetter,
        proposed_amount: proposedAmount ? parseFloat(proposedAmount) : null,
        proposed_timeline: proposedTimeline,
      })

      if (error) throw error

      // Notify the hirer
      if (job?.profiles?.id) {
        await supabase.from('notifications').insert({
          user_id: job.profiles.id,
          title: 'New Job Application',
          body: `Someone applied to your job: "${job.title}"`,
          type: 'application',
          link: `/jobs/${id}`
        })
      }

      await supabase.from('jobs').update({
        applications_count: (job?.applications_count || 0) + 1,
      }).eq('id', id)

      setShowApplyModal(false)
      toast.success('Application submitted successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit application')
    }
    setSubmitting(false)
  }

  const handleDeleteJob = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', id)

      if (error) throw error

      toast.success('Job cancelled successfully')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel job')
      setDeleting(false)
    }
  }

  const isJobOwner = user && job && job.profiles?.id === user.id

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-hover rounded w-3/4" />
            <div className="h-4 bg-surface-hover rounded w-1/2" />
            <div className="h-32 bg-surface-hover rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-surface pt-20">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-2xl font-bold text-white mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-6">This job may have been removed or doesn&apos;t exist.</p>
          <Link href="/jobs" className="px-6 py-3 rounded-xl bg-brand text-white font-medium">Browse Jobs</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Jobs
          </Link>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
                <div className="flex items-center gap-2 mb-3">
                  {job.categories && (
                    <span className="px-2.5 py-1 rounded-lg bg-brand/10 text-brand text-xs font-medium">
                      {job.categories.icon} {job.categories.name}
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    job.status === 'open' ? 'bg-success-bg text-success' :
                    job.status === 'in_progress' ? 'bg-info-bg text-info' :
                    'bg-surface-hover text-muted-foreground'
                  }`}>
                    {job.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-start justify-between mb-4">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">{job.title}</h1>
                  {isJobOwner && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-2.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors"
                      title="Cancel this job"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
                  {job.city && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand" /> {job.city}</span>}
                  {(job.budget_min || job.budget_max) && (
                    <span className="flex items-center gap-1.5"><IndianRupee className="w-4 h-4 text-brand" />
                      {job.budget_min && job.budget_max ? `${formatINR(job.budget_min)} - ${formatINR(job.budget_max)}` : job.budget_min ? `From ${formatINR(job.budget_min)}` : `Up to ${formatINR(job.budget_max!)}`}
                      {job.budget_type !== 'negotiable' && <span className="text-xs">/ {job.budget_type}</span>}
                    </span>
                  )}
                  {job.duration && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand" /> {job.duration}</span>}
                  {job.start_date && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-brand" /> Starts {new Date(job.start_date).toLocaleDateString('en-IN')}</span>}
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-brand" /> {job.applications_count} applications</span>
                </div>

                <div className="prose prose-invert max-w-none">
                  <h3 className="font-display font-bold text-white text-lg mb-2">Description</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
                </div>

                {job.requirements && (
                  <div className="mt-6 pb-6 border-b border-surface-border/50">
                    <h3 className="font-display font-bold text-white text-lg mb-2">Requirements</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
                  </div>
                )}

                {isHirer && (
                  <div className="mt-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                        Applications <span className="text-sm font-normal text-muted-foreground">({jobApplications.length})</span>
                      </h2>
                    </div>

                    {appsLoading ? (
                      <div className="space-y-4">
                        {[1, 2].map(i => (
                          <div key={i} className="h-32 rounded-2xl bg-surface-hover animate-pulse" />
                        ))}
                      </div>
                    ) : jobApplications.length > 0 ? (
                      <div className="space-y-4">
                        {jobApplications.map((app) => (
                          <div key={app.id} className="p-6 rounded-2xl bg-surface border border-surface-border hover:border-brand/30 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
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
                                  <div className="font-bold text-white">{app.provider_profiles?.profiles?.full_name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatRelativeTime(app.created_at)}</span>
                                    {app.proposed_amount && <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> {formatINR(app.proposed_amount)}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                  app.status === 'hired' ? 'bg-success-bg text-success' :
                                  app.status === 'shortlisted' ? 'bg-info-bg text-info' :
                                  app.status === 'rejected' ? 'bg-error-bg text-error' :
                                  'bg-surface-hover text-muted-foreground'
                                }`}>{app.status}</span>
                                <Link 
                                  href={`/messages?provider=${app.provider_profiles?.user_id}&job=${id}`}
                                  className="p-2 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground bg-surface-card/50 p-4 rounded-xl border border-surface-border/50 italic mb-4">
                              "{app.cover_letter}"
                            </div>
                            <div className="flex gap-3">
                              <button className="flex-1 py-2 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-dark transition-colors">Hire Now</button>
                              <button className="flex-1 py-2 rounded-lg border border-surface-border text-muted-foreground text-xs font-medium hover:text-white transition-colors">Shortlist</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-surface rounded-2xl border border-surface-border border-dashed">
                        <Users className="w-10 h-10 text-surface-border mx-auto mb-3" />
                        <p className="text-muted-foreground">No applications yet. Your job is live!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Hirer Info */}
              {job.profiles && (
                <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
                  <h3 className="font-display font-bold text-white text-sm mb-4">Posted By</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                      <span className="text-brand font-bold text-sm">{job.profiles.full_name?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{job.profiles.full_name}</div>
                      <div className="text-xs text-muted-foreground">Member since {formatRelativeTime(job.profiles.created_at)}</div>
                    </div>
                  </div>
                    {/* Actions */}
                    {!isJobOwner && (
                      <div className="space-y-3">
                        {hasApplied ? (
                          <div className="w-full py-3 rounded-xl bg-success/10 text-success font-medium flex items-center justify-center gap-2 border border-success/20">
                            <CheckCircle className="w-4 h-4" /> Already Applied
                          </div>
                        ) : hasProviderProfile ? (
                          <button
                            onClick={() => setShowApplyModal(true)}
                            className="w-full py-3 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                          >
                            <Send className="w-4 h-4" /> Apply Now
                          </button>
                        ) : user ? (
                          <Link
                            href="/settings/provider"
                            className="w-full py-3 rounded-xl bg-brand/10 text-brand font-medium hover:bg-brand/20 transition-colors flex items-center justify-center gap-2 border border-brand/20"
                          >
                            Become a Provider to Apply
                          </Link>
                        ) : (
                          <Link
                            href="/signup?role=provider"
                            className="w-full py-3 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                          >
                            Sign in to Apply
                          </Link>
                        )}
                        <Link
                          href={`/messages?provider=${job.profiles.id}&job=${job.id}`}
                          className="w-full py-3 rounded-xl border border-surface-border text-muted-foreground hover:text-white hover:border-surface-hover transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <MessageSquare className="w-4 h-4" /> Message Hirer
                        </Link>
                      </div>
                    )}
                    {isJobOwner && job.status === 'open' && (
                      <div className="p-4 rounded-xl bg-brand/5 border border-brand/10 text-center">
                        <p className="text-xs text-brand mb-2">Manage applications in your dashboard</p>
                        <Link href="/dashboard" className="text-sm font-bold text-brand hover:underline">Go to Dashboard</Link>
                      </div>
                    )}
                  </div>
              )}

              {/* Job Stats */}
              <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
                <h3 className="font-display font-bold text-white text-sm mb-4">Job Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Views</span><span className="text-white">{job.views_count}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Applications</span><span className="text-white">{job.applications_count}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Posted</span><span className="text-white">{formatRelativeTime(job.created_at)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowApplyModal(false)}>
          <div className="w-full max-w-lg bg-surface-card rounded-2xl border border-surface-border p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-white mb-6">Apply for This Job</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Cover Letter</label>
                <div className="relative">
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all resize-none text-sm"
                    placeholder="Why are you the best fit for this job?"
                  />
                  <button
                    onClick={generateAIProposal}
                    disabled={generatingAI}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-brand/10 text-brand text-xs font-medium hover:bg-brand/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" /> {generatingAI ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Proposed Amount (₹)</label>
                  <input
                    type="number"
                    value={proposedAmount}
                    onChange={(e) => setProposedAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-sm"
                    placeholder="e.g. 5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Timeline</label>
                  <input
                    type="text"
                    value={proposedTimeline}
                    onChange={(e) => setProposedTimeline(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-sm"
                    placeholder="e.g. 3 days"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-3 rounded-xl border border-surface-border text-muted-foreground hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={submitting || !coverLetter.trim()}
                  className="flex-1 py-3 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting...' : <><CheckCircle className="w-4 h-4" /> Submit Application</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-sm bg-surface-card rounded-2xl border border-surface-border p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-white mb-2">Cancel This Job?</h2>
            <p className="text-muted-foreground text-sm mb-6">Are you sure you want to cancel this job? This action cannot be undone.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-surface-border text-muted-foreground hover:text-white transition-colors text-sm"
              >
                Keep Job
              </button>
              <button
                onClick={handleDeleteJob}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-error/10 text-error hover:bg-error/20 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {deleting ? 'Cancelling...' : 'Cancel Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
