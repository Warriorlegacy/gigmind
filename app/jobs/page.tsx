'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/shared/Navigation'
import { formatINR, formatRelativeTime } from '@/lib/utils/formatting'
import { Search, MapPin, IndianRupee, Clock, Users, Filter, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string
  city: string
  budget_min: number | null
  budget_max: number | null
  budget_type: string
  duration: string | null
  applications_count: number
  created_at: string
  categories: { name: string; slug: string; icon: string } | null
  profiles: { full_name: string; avatar_url: string | null } | null
}

const CATEGORIES = [
  { slug: '', name: 'All' },
  { slug: 'real-estate', name: 'Real Estate' },
  { slug: 'medical', name: 'Medical' },
  { slug: 'home-repair', name: 'Home Repair' },
  { slug: 'office-assistance', name: 'Office Help' },
  { slug: 'interior-design', name: 'Interior' },
  { slug: 'security', name: 'Security' },
  { slug: 'human-resources', name: 'HR' },
  { slug: 'cleaning', name: 'Cleaning' },
  { slug: 'transport', name: 'Transport' },
  { slug: 'education', name: 'Education' },
  { slug: 'event-management', name: 'Events' },
  { slug: 'it-services', name: 'IT' },
]

export default function JobsPage() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [city, setCity] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [category, city, page])

  const fetchJobs = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (city) params.set('city', city)
    if (search) params.set('search', search)
    params.set('page', page.toString())
    params.set('limit', '10')

    const res = await fetch(`/api/jobs?${params}`)
    const data = await res.json()
    setJobs(data.data || [])
    setTotalPages(data.totalPages || 1)
    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchJobs()
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-20 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Browse Jobs</h1>
              <p className="text-muted-foreground text-sm mt-1">Find work that matches your skills</p>
            </div>
            <Link
              href="/ai-chat"
              className="px-4 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Post Job
            </Link>
          </div>

          {/* Search + Filter Toggle */}
          <div className="flex gap-3 mb-6">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs by title or keyword..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-card border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
              />
            </form>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border transition-colors flex items-center gap-2 ${
                showFilters ? 'border-brand bg-brand/10 text-brand' : 'border-surface-border text-muted-foreground hover:text-white'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Filters</span>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border mb-6 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white text-sm">Filters</h3>
                <button onClick={() => { setCategory(''); setCity(''); }} className="text-xs text-brand hover:text-brand-light">Clear All</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => { setCategory(cat.slug); setPage(1) }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          category === cat.slug
                            ? 'bg-brand text-white'
                            : 'bg-surface border border-surface-border text-muted-foreground hover:text-white'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">City</label>
                  <select
                    value={city}
                    onChange={(e) => { setCity(e.target.value); setPage(1) }}
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                  >
                    <option value="">All Cities</option>
                    <optgroup label="Metros">
                      <option value="Delhi">Delhi / NCR</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Kolkata">Kolkata</option>
                    </optgroup>
                    <optgroup label="Major Cities">
                      <option value="Lucknow">Lucknow</option>
                      <option value="Kanpur">Kanpur</option>
                      <option value="Pune">Pune</option>
                      <option value="Ahmedabad">Ahmedabad</option>
                      <option value="Jaipur">Jaipur</option>
                      <option value="Chandigarh">Chandigarh</option>
                      <option value="Indore">Indore</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Job Cards */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 rounded-2xl bg-surface-card border border-surface-border animate-pulse">
                  <div className="h-5 bg-surface-hover rounded w-3/4 mb-3" />
                  <div className="h-4 bg-surface-hover rounded w-1/2 mb-4" />
                  <div className="flex gap-4">
                    <div className="h-4 bg-surface-hover rounded w-20" />
                    <div className="h-4 bg-surface-hover rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-surface-card flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-bold text-white mb-2">No jobs found</h3>
              <p className="text-muted-foreground text-sm mb-6">Try adjusting your filters or search terms</p>
              <Link href="/ai-chat" className="px-6 py-3 rounded-xl bg-brand-gradient text-white font-medium inline-flex items-center gap-2">
                Post a Job <Plus className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-brand/30 hover:scale-[1.01] transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {job.categories && (
                          <span className="px-2 py-0.5 rounded-md bg-brand/10 text-brand text-xs font-medium">
                            {job.categories.icon} {job.categories.name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-white text-lg mb-1 truncate">{job.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{job.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        {job.city && (
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.city}</span>
                        )}
                        {(job.budget_min || job.budget_max) && (
                          <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> {job.budget_min && job.budget_max ? `${formatINR(job.budget_min)} - ${formatINR(job.budget_max)}` : job.budget_min ? `From ${formatINR(job.budget_min)}` : `Up to ${formatINR(job.budget_max!)}`}</span>
                        )}
                        {job.duration && (
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.duration}</span>
                        )}
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {job.applications_count} applications</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(job.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-surface-border text-muted-foreground hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const p = i + 1
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      page === p ? 'bg-brand text-white' : 'border border-surface-border text-muted-foreground hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-surface-border text-muted-foreground hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Floating Post Job Button (Mobile) */}
      <Link
        href="/ai-chat"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-gradient text-white shadow-lg shadow-brand/25 flex items-center justify-center hover:opacity-90 transition-opacity md:hidden"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}
