'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, Bell, User, LogOut } from 'lucide-react'
import Logo from './Logo'

export default function Navigation() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfileMenuOpen(false)
    window.location.href = '/'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo size="sm" />

          <div className="hidden md:flex items-center gap-6">
            <Link href="/jobs" className="text-sm text-muted-foreground hover:text-white transition-colors">Browse Jobs</Link>
            <Link href="/providers" className="text-sm text-muted-foreground hover:text-white transition-colors">Find Providers</Link>
            <Link href="/ai-chat" className="text-sm text-muted-foreground hover:text-white transition-colors">AI Chat</Link>
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/messages" className="relative p-2 rounded-lg hover:bg-surface-card transition-colors">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-card transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface-card border border-surface-border shadow-xl py-2">
                      <Link href="/dashboard" className="block px-4 py-2 text-sm text-muted-foreground hover:text-white hover:bg-surface-hover transition-colors">Dashboard</Link>
                      <Link href="/settings" className="block px-4 py-2 text-sm text-muted-foreground hover:text-white hover:bg-surface-hover transition-colors">Settings</Link>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-bg transition-colors flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-white transition-colors">Log In</Link>
                <Link href="/signup" className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-colors">Sign Up</Link>
              </div>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-surface-card transition-colors">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-surface-border bg-surface-card">
          <div className="px-4 py-4 space-y-3">
            <Link href="/jobs" className="block text-sm text-muted-foreground hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Browse Jobs</Link>
            <Link href="/providers" className="block text-sm text-muted-foreground hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Find Providers</Link>
            <Link href="/ai-chat" className="block text-sm text-muted-foreground hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>AI Chat</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link href="/messages" className="block text-sm text-muted-foreground hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Messages</Link>
                <button onClick={handleLogout} className="text-sm text-error">Sign Out</button>
              </>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link href="/login" className="flex-1 text-center px-4 py-2 rounded-lg border border-surface-border text-sm text-muted-foreground hover:text-white transition-colors">Log In</Link>
                <Link href="/signup" className="flex-1 text-center px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
