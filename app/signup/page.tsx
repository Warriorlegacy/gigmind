'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Briefcase, Search } from 'lucide-react'

type Role = 'hirer' | 'provider' | 'both'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role>('hirer')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const preselectedRole = searchParams.get('role') as Role | null
  if (preselectedRole && !loading) {
    // handled in initial state
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const roles: { value: Role; label: string; desc: string; icon: typeof Briefcase }[] = [
    { value: 'hirer', label: 'I need services', desc: 'Hire professionals for your projects', icon: Search },
    { value: 'provider', label: 'I provide services', desc: 'Get matched with clients and grow', icon: Briefcase },
    { value: 'both', label: 'Both', desc: 'Hire and provide services', icon: User },
  ]

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
              <span className="text-white font-display font-bold">G</span>
            </div>
            <span className="font-display font-bold text-2xl text-white">GigMind</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-muted-foreground text-sm">Join India&apos;s AI-powered service marketplace</p>
        </div>

        <div className="p-8 rounded-2xl bg-surface-card border border-surface-border">
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">I want to...</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      role === r.value
                        ? 'border-brand bg-brand/10 text-white'
                        : 'border-surface-border bg-surface text-muted-foreground hover:border-surface-hover'
                    }`}
                  >
                    <r.icon className={`w-5 h-5 mx-auto mb-1 ${role === r.value ? 'text-brand' : ''}`} />
                    <div className="text-xs font-medium">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-surface border border-surface-border text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-error-bg border border-error/20 text-error text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-gradient text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating account...' : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-brand hover:text-brand-light transition-colors font-medium">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
