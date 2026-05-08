'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/shared/Logo'

type LoginTab = 'phone' | 'email'

export default function LoginPage() {
  const [tab, setTab] = useState<LoginTab>('phone')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const finishLogin = () => {
    const target = redirect.startsWith('/') ? redirect : '/dashboard'
    router.push(target)
    router.refresh()
  }

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    finishLogin()
  }

  const sendOtp = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }

    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${digits}`,
      options: { channel: 'sms' },
    })

    if (error) setError(error.message)
    else setOtpSent(true)
    setLoading(false)
  }

  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (otp.replace(/\D/g, '').length !== 6) {
      setError('Enter the 6-digit OTP.')
      return
    }

    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      phone: `+91${digits}`,
      token: otp.replace(/\D/g, ''),
      type: 'sms',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    finishLogin()
  }

  const handleGoogle = async () => {
    const origin = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}${redirect}` },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-sm">Sign in with OTP, email, or Google</p>
        </div>

        <div className="p-8 rounded-2xl bg-surface-card border border-surface-border">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface mb-6">
            <button type="button" onClick={() => setTab('phone')} className={`py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'phone' ? 'bg-brand text-white' : 'text-muted-foreground hover:text-white'}`}>
              Phone OTP
            </button>
            <button type="button" onClick={() => setTab('email')} className={`py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'email' ? 'bg-brand text-white' : 'text-muted-foreground hover:text-white'}`}>
              Email
            </button>
          </div>

          {tab === 'phone' ? (
            <form onSubmit={verifyOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <span className="absolute left-11 top-1/2 -translate-y-1/2 text-sm text-white">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-20 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                    placeholder="9876543210"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">6-digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                    inputMode="numeric"
                    placeholder="000000"
                    required
                  />
                </div>
              )}

              {error && <div className="p-3 rounded-lg bg-error-bg border border-error/20 text-error text-sm">{error}</div>}

              {!otpSent ? (
                <button type="button" onClick={sendOtp} disabled={loading} className="w-full py-3 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              ) : (
                <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? 'Verifying...' : <>Verify & Sign In <ArrowRight className="w-4 h-4" /></>}
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all" placeholder="you@example.com" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full pl-11 pr-12 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all" placeholder="Enter your password" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors" aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && <div className="p-3 rounded-lg bg-error-bg border border-error/20 text-error text-sm">{error}</div>}

              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? 'Signing in...' : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          <button type="button" onClick={handleGoogle} className="mt-5 w-full py-3 rounded-xl border border-surface-border text-white font-medium hover:bg-surface-hover transition-colors">
            Continue with Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-brand hover:text-brand-light transition-colors font-medium">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
