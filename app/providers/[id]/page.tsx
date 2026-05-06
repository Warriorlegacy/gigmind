'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/shared/Navigation'
import { createClient } from '@/lib/supabase/client'
import { formatINR } from '@/lib/utils/formatting'
import { MapPin, Star, Shield, Clock, Briefcase, MessageSquare, IndianRupee, Calendar, Globe, ArrowLeft, CircleCheck as CheckCircle, FileText, ExternalLink, X } from 'lucide-react'

interface Provider {
  id: string
  bio: string
  tagline: string
  experience_years: number
  rate_hourly: number | null
  rate_daily: number | null
  rate_project_min: number | null
  rate_project_max: number | null
  availability: string
  languages: string[]
  service_radius_km: number
  total_jobs_done: number
  avg_rating: number
  review_count: number
  is_featured: boolean
  kyc_status: string
  profiles: { id: string; full_name: string; avatar_url: string | null; city: string; is_verified: boolean; plan: string } | null
  provider_categories: { category_id: string; categories: { slug: string; name: string; icon: string } }[]
  portfolio_items: { id: string; title: string; media_url: string; media_type: string }[]
}

interface Review {
  id: string
  rating: number
  review_text: string | null
  created_at: string
  reviewer: { full_name: string } | null
}

export default function ProviderProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about')
  const [selectedItem, setSelectedItem] = useState<{ url: string; type: string; title: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadProvider()
  }, [id])

  const loadProvider = async () => {
    const { data } = await supabase
      .from('provider_profiles')
      .select('*, profiles(id, full_name, avatar_url, city, is_verified, plan), provider_categories(category_id, categories(slug, name, icon)), portfolio_items(id, title, media_url, media_type)')
      .eq('id', id)
      .maybeSingle()

    if (data) setProvider(data as Provider)

    const { data: reviewData } = await supabase
      .from('reviews')
      .select('id, rating, review_text, created_at, reviewer:profiles!reviews_reviewer_id_fkey(full_name)')
      .eq('reviewee_id', data?.user_id)
      .eq('review_type', 'hirer_to_provider')
      .order('created_at', { ascending: false })
      .limit(5)

    setReviews((reviewData || []) as unknown as Review[])
    setLoading(false)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-warning text-warning' : 'text-surface-border'}`} />
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-surface-hover rounded-2xl" />
            <div className="h-8 bg-surface-hover rounded w-1/3" />
            <div className="h-4 bg-surface-hover rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-surface pt-20">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-2xl font-bold text-white mb-2">Provider Not Found</h2>
          <Link href="/providers" className="px-6 py-3 rounded-xl bg-brand text-white font-medium inline-block mt-4">Browse Providers</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/providers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Providers
          </Link>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cover + Avatar */}
              <div className="relative">
                <div className="h-32 sm:h-40 rounded-2xl bg-brand-gradient opacity-20" />
                <div className="absolute -bottom-8 left-6 flex items-end gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-surface-card border-4 border-surface flex items-center justify-center">
                    <span className="text-3xl font-display font-bold text-brand">{provider.profiles?.full_name?.charAt(0) || '?'}</span>
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-xl font-bold text-white">{provider.profiles?.full_name}</h1>
                      {provider.profiles?.is_verified && <Shield className="w-5 h-5 text-info" />}
                      {provider.is_featured && <span className="px-2 py-0.5 rounded-md bg-warning-bg text-warning text-xs font-medium">Featured</span>}
                    </div>
                    {provider.tagline && <p className="text-muted-foreground text-sm">{provider.tagline}</p>}
                  </div>
                </div>
              </div>

              <div className="pt-12" />

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Jobs Done', value: provider.total_jobs_done },
                  { label: 'Rating', value: provider.avg_rating?.toFixed(1) || '0.0' },
                  { label: 'Reviews', value: provider.review_count },
                  { label: 'Experience', value: `${provider.experience_years}yr` },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl bg-surface-card border border-surface-border text-center">
                    <div className="font-display font-bold text-white text-lg">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl bg-surface-card border border-surface-border">
                {(['about', 'portfolio', 'reviews'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                      activeTab === tab ? 'bg-brand text-white' : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'about' && (
                <div className="p-6 rounded-2xl bg-surface-card border border-surface-border animate-fade-in">
                  <h3 className="font-display font-bold text-white mb-3">About</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{provider.bio || 'No bio yet.'}</p>

                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium text-white text-sm">Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {provider.provider_categories?.map((pc, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-brand/10 text-brand text-sm">
                          {pc.categories?.icon} {pc.categories?.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
                    {provider.profiles?.city && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 text-brand" /> {provider.profiles.city} (within {provider.service_radius_km}km)
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 text-brand" /> {provider.availability === 'immediate' ? 'Available immediately' : provider.availability === 'within_week' ? 'Available within a week' : 'Custom availability'}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="w-4 h-4 text-brand" /> {provider.languages?.join(', ') || 'Hindi, English'}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="w-4 h-4 text-brand" /> {provider.experience_years} years experience
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'portfolio' && (
                <div className="animate-fade-in">
                  {provider.portfolio_items?.length ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {provider.portfolio_items.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem({ url: item.media_url, type: item.media_type, title: item.title })}
                          className="aspect-square rounded-xl bg-surface-card border border-surface-border overflow-hidden group cursor-pointer relative"
                        >
                          {item.media_type === 'image' ? (
                            <img src={item.media_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
                              <FileText className="w-10 h-10 text-brand" />
                              <span className="text-xs text-muted-foreground font-medium truncate w-full">{item.title}</span>
                              <span className="text-[10px] uppercase tracking-wider text-brand font-bold bg-brand/10 px-2 py-0.5 rounded">PDF</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                              <ExternalLink className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-surface-card border border-surface-border text-center">
                      <p className="text-muted-foreground text-sm">No portfolio items yet.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-3 animate-fade-in">
                  {reviews.length > 0 ? reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl bg-surface-card border border-surface-border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                        <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      {review.review_text && <p className="text-sm text-muted-foreground">{review.review_text}</p>}
                      <p className="text-xs text-muted-foreground mt-2">— {review.reviewer?.full_name || 'Anonymous'}</p>
                    </div>
                  )) : (
                    <div className="p-8 rounded-2xl bg-surface-card border border-surface-border text-center">
                      <p className="text-muted-foreground text-sm">No reviews yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="sticky top-24 space-y-4">
                {/* Rate Card */}
                <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
                  <h3 className="font-display font-bold text-white mb-4">Rate Card</h3>
                  <div className="space-y-3 text-sm">
                    {provider.rate_hourly && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hourly</span>
                        <span className="text-white font-medium">{formatINR(provider.rate_hourly)}</span>
                      </div>
                    )}
                    {provider.rate_daily && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily</span>
                        <span className="text-white font-medium">{formatINR(provider.rate_daily)}</span>
                      </div>
                    )}
                    {provider.rate_project_min && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Project</span>
                        <span className="text-white font-medium">
                          {formatINR(provider.rate_project_min)}
                          {provider.rate_project_max ? ` - ${formatINR(provider.rate_project_max)}` : '+'}
                        </span>
                      </div>
                    )}
                    {!provider.rate_hourly && !provider.rate_daily && !provider.rate_project_min && (
                      <p className="text-muted-foreground">Contact for rates</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Link
                    href={`/messages?provider=${provider.id}`}
                    className="w-full py-3 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Send Message
                  </Link>
                  <Link
                    href={`/jobs?category=${provider.provider_categories?.[0]?.categories?.slug || ''}`}
                    className="w-full py-3 rounded-xl border border-surface-border text-muted-foreground hover:text-white hover:border-surface-hover transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Briefcase className="w-4 h-4" /> View Related Jobs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={() => setSelectedItem(null)}
        >
          <button 
            onClick={() => setSelectedItem(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-5xl w-full max-h-full relative flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <div className="w-full rounded-2xl overflow-hidden bg-surface-card border border-surface-border shadow-2xl flex items-center justify-center min-h-[300px]">
              {selectedItem.type === 'image' ? (
                <img src={selectedItem.url} alt={selectedItem.title} className="max-w-full max-h-[80vh] object-contain" />
              ) : (
                <div className="w-full h-[80vh] flex flex-col">
                  <iframe src={selectedItem.url} className="flex-1 w-full border-none" title={selectedItem.title} />
                </div>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-white font-medium">{selectedItem.title}</h3>
              <a 
                href={selectedItem.url} 
                target="_blank" 
                rel="noreferrer"
                className="text-brand text-sm hover:underline mt-1 inline-flex items-center gap-1"
              >
                Open original file <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
