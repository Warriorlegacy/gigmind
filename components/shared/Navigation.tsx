'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, Bell, User as UserIcon, LogOut, CheckCircle } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import Logo from './Logo'

export default function Navigation() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [hasUnread, setHasUnread] = useState(false)
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) fetchProfile(user.id)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null
      setUser(newUser)
      if (newUser) fetchProfile(newUser.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url, full_name')
      .eq('id', userId)
      .maybeSingle()
    if (data) setProfile(data)
  }

  useEffect(() => {
    if (!user) return

    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New notification:', payload)
          setNotifications(prev => [payload.new, ...prev].slice(0, 5))
          setHasUnread(true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    setNotifications(data || [])
    
    // Check for ANY unread notification, not just in the last 5
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    
    setHasUnread((count ?? 0) > 0)
  }

  const handleNotificationsClick = async () => {
    setNotificationsOpen(!notificationsOpen)
    if (!notificationsOpen && user) {
      // Mark as read when opening
      await markAsRead()
      setHasUnread(false)
    }
  }

  const markAsRead = async () => {
    if (!user) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfileMenuOpen(false)
    router.push('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo size="sm" />

          <div className="hidden md:flex items-center gap-6">
            <Link href="/jobs" className="text-sm text-muted-foreground hover:text-white transition-colors">Browse Jobs</Link>
            <Link href="/providers" className="text-sm text-muted-foreground hover:text-white transition-colors">Find Providers</Link>
            {user && (
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-white transition-colors">Dashboard</Link>
            )}
            <Link href="/ai-chat" className="text-sm text-muted-foreground hover:text-white transition-colors">AI Chat</Link>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button 
                    onClick={handleNotificationsClick}
                    className={`relative p-2 rounded-lg transition-all ${hasUnread ? 'bg-brand/10 text-brand' : 'hover:bg-surface-card text-muted-foreground hover:text-white'}`}
                  >
                    <Bell className={`w-5 h-5 ${hasUnread ? 'animate-wiggle' : ''}`} />
                    {hasUnread && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full border border-surface-card animate-ping" />
                    )}
                    {hasUnread && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full border border-surface-card" />
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-xl bg-surface-card border border-surface-border shadow-xl py-2 overflow-hidden z-50">
                      <div className="px-4 py-2 border-b border-surface-border flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                        <span className="text-[10px] text-muted-foreground">{notifications.length} recent</span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div key={n.id} className="px-4 py-3 border-b border-surface-border/50 hover:bg-surface-hover transition-colors last:border-0">
                              <div className="flex gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-brand'}`} />
                                <div>
                                  <div className="text-sm font-medium text-white mb-0.5">{n.title}</div>
                                  <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>
                                  <div className="text-[10px] text-muted-foreground/60 mt-1">
                                    {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center">
                            <Bell className="w-8 h-8 text-surface-border mx-auto mb-2" />
                            <div className="text-sm text-muted-foreground">No notifications yet</div>
                          </div>
                        )}
                      </div>
                      <Link 
                        href="/messages" 
                        onClick={() => setNotificationsOpen(false)}
                        className="block w-full text-center py-2 text-xs text-brand hover:text-brand-light transition-colors border-t border-surface-border"
                      >
                        View all messages
                      </Link>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-card transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center overflow-hidden border border-white/10 group">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                        />
                      ) : (
                        <UserIcon className="w-4 h-4 text-white" />
                      )}
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
            {user && (
              <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            )}
            <Link href="/ai-chat" className="block text-sm text-muted-foreground hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>AI Chat</Link>
            {user ? (
              <>
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
