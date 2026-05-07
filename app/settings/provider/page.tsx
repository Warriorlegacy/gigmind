'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/shared/Navigation'
import { createClient } from '@/lib/supabase/client'
import { formatINR } from '@/lib/utils/formatting'
import { Save, Sparkles, ArrowRight, ArrowLeft, CircleCheck as CheckCircle, Upload, MapPin, Trash2, FileText, Camera, Users } from 'lucide-react'
import { toast } from 'sonner'
import ProfileAvatar from '@/components/shared/ProfileAvatar'

const CATEGORIES = [
  { slug: 'real-estate', name: 'Real Estate', icon: '🏠' },
  { slug: 'medical', name: 'Medical', icon: '🏥' },
  { slug: 'home-repair', name: 'Home Repair', icon: '🔧' },
  { slug: 'office-assistance', name: 'Office Help', icon: '🏢' },
  { slug: 'interior-design', name: 'Interior Design', icon: '🎨' },
  { slug: 'security', name: 'Security', icon: '🔐' },
  { slug: 'human-resources', name: 'HR', icon: '👥' },
  { slug: 'cleaning', name: 'Cleaning', icon: '🧹' },
  { slug: 'transport', name: 'Transport', icon: '🚚' },
  { slug: 'education', name: 'Education', icon: '📚' },
  { slug: 'event-management', name: 'Events', icon: '🎉' },
  { slug: 'it-services', name: 'IT Services', icon: '💻' },
]

const STEPS = [
  { id: 1, title: 'Basic Info' },
  { id: 2, title: 'AI Bio Generator' },
  { id: 3, title: 'Skills & Categories' },
  { id: 4, title: 'Rate Card' },
  { id: 5, title: 'Portfolio' },
  { id: 6, title: 'Location & Radius' },
]

export default function ProviderSettingsPage() {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string>('')
  const [providerId, setProviderId] = useState<string>('')
  const [portfolioItems, setPortfolioItems] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [tagline, setTagline] = useState('')
  const [bio, setBio] = useState('')
  const [experienceYears, setExperienceYears] = useState(0)
  const [availability, setAvailability] = useState('immediate')
  const [languages, setLanguages] = useState<string[]>(['Hindi', 'English'])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [rateHourly, setRateHourly] = useState('')
  const [rateDaily, setRateDaily] = useState('')
  const [rateProjectMin, setRateProjectMin] = useState('')
  const [rateProjectMax, setRateProjectMax] = useState('')
  const [city, setCity] = useState('')
  const [serviceRadius, setServiceRadius] = useState(20)

  // AI Bio Q&A
  const [aiAnswers, setAiAnswers] = useState({
    name: '', service: '', experience: '', skills: '', location: '', strengths: '',
  })

  useEffect(() => {
    loadExisting()
  }, [])

  const loadExisting = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('city, role, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    if (profileData) {
      setProfile(profileData)
      if (profileData.city) setCity(profileData.city)
    }

    const { data: provider, error: fetchError } = await supabase
      .from('provider_profiles')
      .select('*, provider_categories(category_id, categories(slug))')
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching provider profile:', fetchError)
      return
    }

    if (provider) {
      setProviderId(provider.id)
      setTagline(provider.tagline || '')
      setBio(provider.bio || '')
      setExperienceYears(provider.experience_years || 0)
      setAvailability(provider.availability || 'immediate')
      setLanguages(provider.languages || ['Hindi', 'English'])
      setRateHourly(provider.rate_hourly?.toString() || '')
      setRateDaily(provider.rate_daily?.toString() || '')
      setRateProjectMin(provider.rate_project_min?.toString() || '')
      setRateProjectMax(provider.rate_project_max?.toString() || '')
      setServiceRadius(provider.service_radius_km || 20)
      setSelectedCategories(provider.provider_categories?.map((pc: any) => pc.categories?.slug).filter(Boolean) || [])
      
      // Pre-fill AI answers with existing data to make generation easier
      setAiAnswers(prev => ({
        ...prev,
        service: provider.tagline || '',
        experience: provider.experience_years?.toString() || '',
        skills: provider.skills || '', // assuming there's a skills field, let's check
      }))
      
      // Load portfolio items
      const { data: items } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false })
      
      if (items) setPortfolioItems(items)
    }

    setAiAnswers(prev => ({ ...prev, name: user.user_metadata?.full_name || '' }))
  }

  const generateBio = async () => {
    if (!aiAnswers.service || !aiAnswers.experience) {
      toast.error('Please fill in service type and experience')
      return
    }

    console.log('Starting bio generation with:', aiAnswers)
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiAnswers),
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server returned ${res.status}`)
      }

      const data = await res.json()
      console.log('AI Bio Response:', data)
      
      if (data.error) {
        toast.error(data.error)
      } else if (data.bio) {
        setBio(data.bio)
        toast.success('Bio generated successfully!')
      } else {
        toast.error('AI returned an empty response. Please try again.')
      }
    } catch (err) {
      console.error('Bio Generation Error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to generate bio')
    }
    setGenerating(false)
  }

  const saveProfile = async () => {
    if (!tagline.trim()) {
      toast.error('Please enter a tagline')
      return
    }
    if (!bio.trim()) {
      toast.error('Please enter a bio')
      return
    }
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one service category')
      return
    }
    if (!city.trim()) {
      toast.error('Please enter your city')
      return
    }

    setSaving(true)
    try {
      console.log('Starting save process...', { providerId, userId, tagline, city, selectedCategories })

      // 1. Update primary profile (City and Role) first
      const currentRole = profile?.role || 'hirer'
      let newRole = currentRole
      if (currentRole === 'hirer') newRole = 'both'
      
      console.log('Updating user profile...', { city, newRole })
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          city,
          role: newRole,
          avatar_url: profile.avatar_url 
        })
        .eq('id', userId)

      if (profileError) {
        console.error('Update user profile error:', profileError)
        toast.error(`Profile update error: ${profileError.message}`)
        throw profileError
      }

      // 2. Upsert provider-specific profile
      const providerData = {
        user_id: userId,
        tagline,
        bio,
        experience_years: experienceYears,
        availability,
        languages,
        rate_hourly: rateHourly ? parseFloat(rateHourly) : null,
        rate_daily: rateDaily ? parseFloat(rateDaily) : null,
        rate_project_min: rateProjectMin ? parseFloat(rateProjectMin) : null,
        rate_project_max: rateProjectMax ? parseFloat(rateProjectMax) : null,
        service_radius_km: serviceRadius,
      }

      console.log('Upserting provider profile...')
      const { data: upsertData, error: providerError } = await supabase
        .from('provider_profiles')
        .upsert(providerData, { onConflict: 'user_id' })
        .select('id')
      
      if (providerError) {
        console.error('Provider profile upsert error:', providerError)
        throw providerError
      }
      
      let finalProviderId = upsertData?.[0]?.id || providerId
      
      if (!finalProviderId) {
        const { data: existing } = await supabase
          .from('provider_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()
        if (existing) finalProviderId = existing.id
      }

      if (finalProviderId) {
        setProviderId(finalProviderId)
        console.log('Provider profile saved with ID:', finalProviderId)
        
        // 3. Update categories
        if (selectedCategories.length > 0) {
          const { data: cats } = await supabase
            .from('categories')
            .select('id, slug')
            .in('slug', selectedCategories)

          if (cats && cats.length > 0) {
            await supabase
              .from('provider_categories')
              .delete()
              .eq('provider_id', finalProviderId)

            await supabase
              .from('provider_categories')
              .insert(
                cats.map(c => ({ provider_id: finalProviderId, category_id: c.id }))
              )
          }
        }
      }

      // 4. Save new portfolio items (if any)
      const newItems = portfolioItems.filter(item => item.isNew)
      if (newItems.length > 0 && finalProviderId) {
        console.log('Saving new portfolio items...', newItems.length)
        const { error: portfolioError } = await supabase
          .from('portfolio_items')
          .insert(
            newItems.map(item => ({
              provider_id: finalProviderId,
              title: item.title,
              media_url: item.media_url,
              media_type: item.media_type
            }))
          )
        
        if (portfolioError) {
          console.error('Save portfolio items error:', portfolioError)
          // Don't throw, just warn
          toast.error('Failed to save some portfolio items')
        }
      }

      toast.success('Profile updated!')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile'
      console.error('Final save error:', err)
      toast.error(message)
    }
    setSaving(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('portfolios')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('portfolios')
        .getPublicUrl(filePath)

      // Save to database immediately or add to local state?
      // Better to save immediately if we have providerId, else add to state for later
      if (providerId) {
        const { data: newItem, error: itemError } = await supabase
          .from('portfolio_items')
          .insert({
            provider_id: providerId,
            title: file.name,
            media_url: publicUrl,
            media_type: file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : 'image')
          })
          .select()
          .single()
        
        if (itemError) throw itemError
        setPortfolioItems(prev => [newItem, ...prev])
        toast.success('File uploaded successfully!')
      } else {
        // Just add to local state to be saved when profile is created
        setPortfolioItems(prev => [{
          title: file.name,
          media_url: publicUrl,
          media_type: file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : 'image'),
          isNew: true
        }, ...prev])
        toast.success('File added to portfolio. Save profile to finalize.')
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Failed to upload file')
    }
    setUploading(false)
  }

  const removePortfolioItem = async (id: string, isNew?: boolean) => {
    if (isNew) {
      setPortfolioItems(prev => prev.filter(item => item.media_url !== id))
      return
    }

    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      setPortfolioItems(prev => prev.filter(item => item.id !== id))
      toast.success('Item removed')
    } catch (err) {
      toast.error('Failed to remove item')
    }
  }

  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  const toggleLanguage = (lang: string) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">Provider Profile Setup</h1>
          <p className="text-muted-foreground text-sm mb-8">Complete your profile to start receiving job matches</p>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all border ${
                  step === s.id ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20' :
                  step > s.id ? 'bg-success/10 border-success/20 text-success' :
                  'bg-surface-card border-surface-border text-muted-foreground hover:text-white'
                }`}
              >
                {step > s.id ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full bg-surface-card border border-inherit flex items-center justify-center text-[8px]">{s.id}</span>}
                {s.title.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start mb-8 pb-8 border-b border-surface-border/50">
                  <ProfileAvatar 
                    url={profile?.avatar_url} 
                    onUpload={(url) => setProfile({ ...profile, avatar_url: url })} 
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-semibold text-white mb-2">Profile Photo</h3>
                    <p className="text-muted-foreground mb-4">A professional photo helps you stand out and build trust with clients.</p>
                    <div className="flex justify-center sm:justify-start gap-2">
                      <span className="text-[10px] px-2 py-1 rounded bg-brand/10 text-brand font-medium uppercase tracking-wider">Professional</span>
                      <span className="text-[10px] px-2 py-1 rounded bg-brand/10 text-brand font-medium uppercase tracking-wider">Friendly</span>
                    </div>
                  </div>
                </div>

                <h2 className="font-display font-bold text-white text-lg">Basic Info</h2>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Expert Plumber with 10+ Years Experience"
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Experience (years)</label>
                  <input
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Availability</label>
                  <div className="flex gap-3">
                    {['immediate', 'within_week', 'custom'].map((a) => (
                      <button
                        key={a}
                        onClick={() => setAvailability(a)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          availability === a ? 'bg-brand text-white' : 'bg-surface border border-surface-border text-muted-foreground hover:text-white'
                        }`}
                      >
                        {a === 'immediate' ? 'Immediate' : a === 'within_week' ? 'Within Week' : 'Custom'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {['Hindi', 'English', 'Urdu', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          languages.includes(lang) ? 'bg-brand text-white' : 'bg-surface border border-surface-border text-muted-foreground hover:text-white'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="font-display font-bold text-white text-lg">AI Bio Generator</h2>
                <p className="text-muted-foreground text-sm">Answer a few questions and our AI will write a professional bio for you.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Your Name</label>
                    <input type="text" value={aiAnswers.name} onChange={(e) => setAiAnswers(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Service Type</label>
                    <input type="text" value={aiAnswers.service} onChange={(e) => setAiAnswers(p => ({ ...p, service: e.target.value }))} placeholder="e.g. Interior Designer" className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Experience</label>
                    <input type="text" value={aiAnswers.experience} onChange={(e) => setAiAnswers(p => ({ ...p, experience: e.target.value }))} placeholder="e.g. 5 years" className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Key Skills</label>
                    <input type="text" value={aiAnswers.skills} onChange={(e) => setAiAnswers(p => ({ ...p, skills: e.target.value }))} placeholder="e.g. 3D modeling, Space planning" className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Location</label>
                    <input type="text" value={aiAnswers.location} onChange={(e) => setAiAnswers(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Lucknow, UP" className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Special Strengths</label>
                    <input type="text" value={aiAnswers.strengths} onChange={(e) => setAiAnswers(p => ({ ...p, strengths: e.target.value }))} placeholder="e.g. On-time delivery, Budget-friendly" className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50" />
                  </div>
                </div>
                <button
                  onClick={generateBio}
                  disabled={generating}
                  className="w-full py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-brand/20 active:scale-[0.98]"
                >
                  <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} /> 
                  {generating ? 'AI is crafting your bio...' : 'Generate Premium Bio with AI'}
                </button>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Bio (editable)</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all resize-none"
                    placeholder="Your professional bio will appear here..."
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="font-display font-bold text-white text-lg">Skills & Categories</h2>
                <p className="text-muted-foreground text-sm">Select all service categories you offer</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => toggleCategory(cat.slug)}
                      className={`p-4 rounded-xl text-center transition-all ${
                        selectedCategories.includes(cat.slug)
                          ? 'bg-brand/10 border-2 border-brand text-white'
                          : 'bg-surface border border-surface-border text-muted-foreground hover:text-white hover:border-surface-hover'
                      }`}
                    >
                      <div className="text-2xl mb-2">{cat.icon}</div>
                      <div className="text-sm font-medium">{cat.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="font-display font-bold text-white text-lg">Rate Card</h2>
                <p className="text-muted-foreground text-sm">Set your service rates (all in INR)</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Hourly Rate</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <input type="number" value={rateHourly} onChange={(e) => setRateHourly(e.target.value)} placeholder="e.g. 500" className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Daily Rate</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <input type="number" value={rateDaily} onChange={(e) => setRateDaily(e.target.value)} placeholder="e.g. 3000" className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Project Min</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <input type="number" value={rateProjectMin} onChange={(e) => setRateProjectMin(e.target.value)} placeholder="e.g. 10000" className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Project Max</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <input type="number" value={rateProjectMax} onChange={(e) => setRateProjectMax(e.target.value)} placeholder="e.g. 50000" className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-bold text-white text-lg">Portfolio</h2>
                    <p className="text-muted-foreground text-sm">Upload images of your past work (max 5)</p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || portfolioItems.length >= 5}
                    className="px-4 py-2 rounded-xl bg-surface border border-surface-border text-white text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Add Item'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {portfolioItems.map((item, idx) => (
                    <div key={item.id || idx} className="group relative aspect-video rounded-xl overflow-hidden bg-surface border border-surface-border">
                      {item.media_type === 'image' ? (
                        <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground px-2 text-center truncate w-full">{item.title}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-2">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-surface-card text-muted-foreground hover:text-white transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link 
              href="/"
              className="p-2 rounded-lg hover:bg-surface-card text-muted-foreground hover:text-white transition-colors"
              title="Home"
            >
              <Users className="w-5 h-5" />
            </Link>
            <Logo size="sm" showText={false} />
            <span className="font-display font-bold text-lg text-white hidden sm:block">GigMind AI</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium">
              <Sparkles className="w-3 h-3" /> AI Assistant
            </div>
          </div>
                        <button
                          onClick={() => removePortfolioItem(item.id || item.media_url, item.isNew)}
                          className="p-2 rounded-full bg-error/20 text-error hover:bg-error/30 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {portfolioItems.length === 0 && !uploading && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="col-span-2 border-2 border-dashed border-surface-border rounded-2xl p-8 text-center hover:border-brand/30 transition-colors cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">Click to upload your first portfolio item</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="font-display font-bold text-white text-lg">Location & Service Radius</h2>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lucknow" className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Service Radius: {serviceRadius} km</label>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={serviceRadius}
                    onChange={(e) => setServiceRadius(parseInt(e.target.value))}
                    className="w-full accent-brand"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5 km</span>
                    <span>100 km</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-border">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="px-4 py-2.5 rounded-xl border border-surface-border text-muted-foreground hover:text-white transition-colors disabled:opacity-30 flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              {step < 6 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2.5 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark transition-colors flex items-center gap-2 text-sm"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Preview'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
