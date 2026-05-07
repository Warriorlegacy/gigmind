'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/shared/Navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, User, MapPin, Phone, Hash, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function HirerSettings() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    city: '',
    state: '',
    pincode: '',
    role: 'hirer'
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        phone: data.phone || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        role: data.role || 'hirer'
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
        updated_at: new Date().toISOString()
      })
      .eq('id', user?.id)

    if (error) {
      toast.error('Failed to update profile')
    } else {
      toast.success('Profile updated!')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-white mb-2">Account Settings</h1>
              <p className="text-muted-foreground">Manage your personal information and preferences</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info Card */}
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-6">
              <div className="flex items-center gap-2 text-brand font-semibold mb-2">
                <User className="w-5 h-5" />
                <span>Personal Information</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                      placeholder="+91 00000 00000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-6">
              <div className="flex items-center gap-2 text-brand font-semibold mb-2">
                <MapPin className="w-5 h-5" />
                <span>Location Details</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">City</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                    placeholder="Lucknow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">State</label>
                  <input
                    type="text"
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                    placeholder="UP"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Pincode</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                      type="text"
                      value={profile.pincode}
                      onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                      placeholder="226001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Switch Card */}
            {profile.role === 'hirer' && (
              <div className="p-6 rounded-2xl bg-brand/5 border border-brand/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-brand" />
                      Become a Provider
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">Want to offer your services on GigMind? Set up your provider profile now.</p>
                  </div>
                  <button
                    onClick={() => router.push('/settings/provider')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-all shadow-md"
                  >
                    Setup Provider <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  )
}
