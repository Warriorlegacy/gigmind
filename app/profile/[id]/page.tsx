'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/shared/Navigation'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime, formatINR } from '@/lib/utils/formatting'
import { MapPin, Star, Clock, MessageSquare, Briefcase, IndianRupee, ShieldCheck, Calendar, ArrowLeft, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  city: string
  state: string
  is_verified: boolean
  created_at: string
}

interface ProviderProfile {
  bio: string
  tagline: string
  experience_years: number
  rate_hourly: number | null
  rate_daily: number | null
  avg_rating: number
  review_count: number
  languages: string[]
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  media_url: string
  media_type: string
}

export default function PublicProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [provider, setProvider] = useState<ProviderProfile | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
    checkAuth()
  }, [id])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const loadProfile = async () => {
    setLoading(true)
    try {
      // Fetch basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Fetch provider details if any
      const { data: providerData } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('user_id', id)
        .maybeSingle()

      if (providerData) {
        setProvider(providerData)
        
        // Fetch portfolio
        const { data: portfolioData } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('provider_id', providerData.id)
          .order('created_at', { ascending: false })
        
        if (portfolioData) setPortfolio(portfolioData)
      }
    } catch (err) {
      toast.error('Profile not found')
    } finally {
      setLoading(false)
    }
  }

  const handleMessage = () => {
    if (!currentUser) {
      router.push('/signup')
      return
    }
    if (currentUser.id === id) {
      toast.error("You can't message yourself")
      return
    }
    router.push(`/messages?recipient=${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navigation />
        <div className="pt-32 flex justify-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-32 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Profile Not Found</h2>
          <Link href="/" className="text-brand hover:underline">Return Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface pb-20">
      <Navigation />

      {/* Profile Header Background */}
      <div className="h-48 sm:h-64 bg-gradient-to-br from-brand/20 via-surface to-surface border-b border-surface-border" />

      <main className="max-w-5xl mx-auto px-4 -mt-24">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar / Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl bg-surface-card border border-surface-border glass shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Logo size="lg" showText={false} />
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-3xl overflow-hidden bg-brand/10 border-4 border-surface-card shadow-xl mb-4 relative">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.full_name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-brand bg-brand/5">
                      {profile.full_name.charAt(0)}
                    </div>
                  )}
                  {profile.is_verified && (
                    <div className="absolute bottom-2 right-2 bg-success text-white p-1 rounded-lg shadow-lg">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <h1 className="font-display text-2xl font-bold text-white mb-1">{profile.full_name}</h1>
                {provider?.tagline && <p className="text-brand font-medium text-sm mb-3">{provider.tagline}</p>}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <MapPin className="w-4 h-4" /> {profile.city}{profile.state ? `, ${profile.state}` : ''}
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                  <div className="p-3 rounded-2xl bg-surface/50 border border-surface-border text-center">
                    <div className="text-xs text-muted-foreground mb-1">Rating</div>
                    <div className="flex items-center justify-center gap-1 font-bold text-white">
                      <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                      {provider?.avg_rating.toFixed(1) || '0.0'}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface/50 border border-surface-border text-center">
                    <div className="text-xs text-muted-foreground mb-1">Experience</div>
                    <div className="font-bold text-white">{provider?.experience_years || 0} Years</div>
                  </div>
                </div>

                <button
                  onClick={handleMessage}
                  className="w-full py-4 rounded-2xl bg-brand-gradient text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
                >
                  <MessageSquare className="w-5 h-5" /> Message Now
                </button>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-surface-card border border-surface-border glass">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand" /> Verification & Info
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="text-white font-medium">{new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ID Verified</span>
                  <span className={`font-medium ${profile.is_verified ? 'text-success' : 'text-muted-foreground'}`}>{profile.is_verified ? 'Yes' : 'Pending'}</span>
                </div>
                {provider?.languages && (
                  <div className="pt-2">
                    <span className="text-muted-foreground block mb-2">Languages</span>
                    <div className="flex flex-wrap gap-2">
                      {provider.languages.map(lang => (
                        <span key={lang} className="px-2 py-1 rounded-lg bg-surface text-xs text-white border border-surface-border">{lang}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* About / Bio */}
            <div className="p-8 rounded-3xl bg-surface-card border border-surface-border glass">
              <h2 className="font-display text-xl font-bold text-white mb-4">About</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {provider?.bio || `Hi, I'm ${profile.full_name}. I'm active on GigMind and looking for professional opportunities in ${profile.city}.`}
                </p>
              </div>

              {provider && (
                <div className="grid sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-surface-border">
                  {provider.rate_hourly && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
                        <IndianRupee className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Hourly Rate</div>
                        <div className="font-bold text-white">{formatINR(provider.rate_hourly)}/hr</div>
                      </div>
                    </div>
                  )}
                  {provider.rate_daily && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Daily Rate</div>
                        <div className="font-bold text-white">{formatINR(provider.rate_daily)}/day</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Portfolio Grid */}
            {portfolio.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-white">Work Portfolio</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {portfolio.map((item) => (
                    <div key={item.id} className="group rounded-3xl bg-surface-card border border-surface-border overflow-hidden hover:border-brand/50 transition-all shadow-lg shadow-black/20">
                      <div className="aspect-video relative overflow-hidden bg-surface">
                        <img src={item.media_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                      </div>
                      <div className="p-5">
                        <h4 className="font-bold text-white mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If no provider profile, show placeholder */}
            {!provider && (
              <div className="p-12 rounded-3xl border-2 border-dashed border-surface-border text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Professional details not yet listed</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">This user has not completed their service provider profile yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Nav for Mobile */}
      <div className="fixed bottom-6 left-4 right-4 z-40 lg:hidden">
        <button
          onClick={handleMessage}
          className="w-full py-4 rounded-2xl bg-brand-gradient text-white font-bold shadow-xl shadow-brand/40 flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-5 h-5" /> Message {profile.full_name.split(' ')[0]}
        </button>
      </div>
    </div>
  )
}

function Logo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 bg-brand rounded-lg rotate-12 opacity-50 blur-sm" />
        <div className="absolute inset-0 bg-brand-gradient rounded-lg flex items-center justify-center text-white font-bold">
          G
        </div>
      </div>
    </div>
  )
}
