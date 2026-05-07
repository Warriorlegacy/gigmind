'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/shared/Navigation'
import { formatINR } from '@/lib/utils/formatting'
import { Search, MapPin, Star, Shield, MessageSquare, Eye, Filter } from 'lucide-react'

interface Provider {
  id: string
  tagline: string
  bio: string
  experience_years: number
  rate_daily: number | null
  rate_hourly: number | null
  avg_rating: number
  review_count: number
  total_jobs_done: number
  availability: string
  languages: string[]
  profiles: { full_name: string; avatar_url: string | null; city: string; is_verified: boolean; plan: string } | null
  provider_categories: { category_id: string; categories: { slug: string; name: string; icon: string } }[]
}

const CATEGORY_TABS = [
  { slug: '', name: 'All' },
  { slug: 'real-estate', name: 'Real Estate' },
  { slug: 'medical', name: 'Medical' },
  { slug: 'home-repair', name: 'Home Repair' },
  { slug: 'interior-design', name: 'Interior' },
  { slug: 'security', name: 'Security' },
  { slug: 'cleaning', name: 'Cleaning' },
  { slug: 'it-services', name: 'IT' },
]

const RATING_FILTERS = [
  { value: '', label: 'All' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '4.5', label: '4.5+' },
]

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [minRating, setMinRating] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProviders()
  }, [category, minRating])

  const fetchProviders = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (city) params.set('city', city)
    if (minRating) params.set('min_rating', minRating)
    if (search) params.set('search', search)

    const res = await fetch(`/api/providers?${params}`)
    const data = await res.json()
    setProviders(data.data || [])
    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProviders()
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'fill-warning text-warning' : 'text-surface-border'}`} />
    ))
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Find Providers</h1>
            <p className="text-muted-foreground text-sm mt-1">Verified professionals across 12+ service categories</p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 mb-6">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.slug}
                onClick={() => setCategory(tab.slug)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === tab.slug
                    ? 'bg-brand text-white'
                    : 'bg-surface-card border border-surface-border text-muted-foreground hover:text-white'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex gap-3 mb-6">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, skill, or service..."
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
            </button>
          </div>

          {showFilters && (
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border mb-6 animate-fade-in">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
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
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Min Rating</label>
                  <div className="flex gap-2">
                    {RATING_FILTERS.map((rf) => (
                      <button
                        key={rf.value}
                        onClick={() => setMinRating(rf.value)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                          minRating === rf.value
                            ? 'bg-brand text-white'
                            : 'bg-surface border border-surface-border text-muted-foreground hover:text-white'
                        }`}
                      >
                        {rf.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Provider Cards */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-6 rounded-2xl bg-surface-card border border-surface-border animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-surface-hover" />
                    <div className="flex-1">
                      <div className="h-4 bg-surface-hover rounded w-3/4 mb-2" />
                      <div className="h-3 bg-surface-hover rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-surface-hover rounded w-full mb-2" />
                  <div className="h-3 bg-surface-hover rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-surface-card flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-bold text-white mb-2">No providers found</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-brand/30 hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand font-bold">{provider.profiles?.full_name?.charAt(0) || '?'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-white text-sm truncate">{provider.profiles?.full_name}</span>
                        {provider.profiles?.is_verified && <Shield className="w-4 h-4 text-info flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {renderStars(provider.avg_rating)}
                        <span className="text-xs text-muted-foreground ml-1">({provider.review_count})</span>
                      </div>
                    </div>
                  </div>

                  {provider.tagline && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{provider.tagline}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {provider.provider_categories?.slice(0, 3).map((pc, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-brand/10 text-brand text-xs">
                        {pc.categories?.icon} {pc.categories?.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    {provider.profiles?.city && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {provider.profiles.city}</span>
                    )}
                    {provider.rate_daily && (
                      <span className="font-medium text-white">{formatINR(provider.rate_daily)}/day</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/providers/${provider.id}`}
                      className="flex-1 py-2 rounded-lg border border-surface-border text-muted-foreground hover:text-white hover:border-surface-hover transition-colors text-xs font-medium text-center flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                    <Link
                      href={`/messages?provider=${provider.id}`}
                      className="flex-1 py-2 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors text-xs font-medium text-center flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
