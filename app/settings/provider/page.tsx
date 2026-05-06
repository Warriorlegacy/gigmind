'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/shared/Navigation'
import { createClient } from '@/lib/supabase/client'
import { formatINR } from '@/lib/utils/formatting'
import { Save, Sparkles, ArrowRight, ArrowLeft, CircleCheck as CheckCircle, Upload, MapPin } from 'lucide-react'

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
  const [userId, setUserId] = useState<string>('')
  const [providerId, setProviderId] = useState<string>('')
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('city')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.city) setCity(profile.city)

    const { data: provider } = await supabase
      .from('provider_profiles')
      .select('*, provider_categories(category_id, categories(slug))')
      .eq('user_id', user.id)
      .maybeSingle()

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
    }

    setAiAnswers(prev => ({ ...prev, name: user.user_metadata?.full_name || '' }))
  }

  const generateBio = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiAnswers),
      })
      const data = await res.json()
      if (data.bio) setBio(data.bio)
    } catch {
      // keep existing bio
    }
    setGenerating(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      if (providerId) {
        await supabase.from('provider_profiles').update({
          tagline, bio, experience_years: experienceYears, availability,
          languages, rate_hourly: rateHourly ? parseFloat(rateHourly) : null,
          rate_daily: rateDaily ? parseFloat(rateDaily) : null,
          rate_project_min: rateProjectMin ? parseFloat(rateProjectMin) : null,
          rate_project_max: rateProjectMax ? parseFloat(rateProjectMax) : null,
          service_radius_km: serviceRadius,
        }).eq('id', providerId)
      } else {
        const { data } = await supabase.from('provider_profiles').insert({
          user_id: userId, tagline, bio, experience_years: experienceYears, availability,
          languages, rate_hourly: rateHourly ? parseFloat(rateHourly) : null,
          rate_daily: rateDaily ? parseFloat(rateDaily) : null,
          rate_project_min: rateProjectMin ? parseFloat(rateProjectMin) : null,
          rate_project_max: rateProjectMax ? parseFloat(rateProjectMax) : null,
          service_radius_km: serviceRadius,
        }).select('id').single()

        if (data) setProviderId(data.id)
      }

      // Update categories
      if (providerId && selectedCategories.length > 0) {
        const { data: cats } = await supabase.from('categories').select('id, slug').in('slug', selectedCategories)
        if (cats) {
          await supabase.from('provider_categories').delete().eq('provider_id', providerId)
          await supabase.from('provider_categories').insert(
            cats.map(c => ({ provider_id: providerId, category_id: c.id }))
          )
        }
      }

      // Update city on profile
      await supabase.from('profiles').update({ city }).eq('id', userId)

      alert('Profile saved successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save profile')
    }
    setSaving(false)
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
          <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  step === s.id ? 'bg-brand text-white' :
                  step > s.id ? 'bg-success-bg text-success' :
                  'bg-surface-card border border-surface-border text-muted-foreground'
                }`}
              >
                {step > s.id ? <CheckCircle className="w-3.5 h-3.5" /> : <span>{s.id}</span>}
                {s.title}
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
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
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
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
                  className="w-full py-3 rounded-xl bg-brand/10 text-brand font-medium hover:bg-brand/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" /> {generating ? 'Generating...' : 'Generate Bio with AI'}
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
                <h2 className="font-display font-bold text-white text-lg">Portfolio</h2>
                <p className="text-muted-foreground text-sm">Upload images of your past work (max 5)</p>
                <div className="border-2 border-dashed border-surface-border rounded-2xl p-8 text-center hover:border-brand/30 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Drag & drop images here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB each</p>
                </div>
                <p className="text-xs text-muted-foreground">Portfolio upload requires Supabase Storage setup. Connect your storage bucket to enable this feature.</p>
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
