'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Check, LayoutDashboard, LogOut, Menu, Settings, User as UserIcon, X } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils/formatting'
import Logo from './Logo'

type Profile = {
  avatar_url: string | null
  full_name: string | null
  role: string | null
}

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

const navItems = [
  { href: '/jobs', label: 'Browse Jobs' },
  { href: '/providers', label: 'Find Providers' },
  { href: '/ai-chat', label: 'AI Chat' },
]

function notificationIcon(type: string) {
  if (type === 'application' || type === 'new_application') return '📋'
  if (type === 'hired') return '✅'
  if (type === 'message') return '💬'
  if (type === 'payment') return '💰'
  return '🔔'
}

export default function Navigation() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [summary, setSummary] = useState('All caught up')
  const router = useRouter()
  const supabase = createClient()
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url, full_name, role')
      .eq('id', userId)
      .maybeSingle()

    if (data) setProfile(data as Profile)
  }, [supabase])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const res = await fetch('/api/notifications/digest')
    if (!res.ok) return

    const data = await res.json() as {
      unread_count: number
      latest: Notification[]
      summary: string
    }

    setNotifications(data.latest)
    setUnreadCount(data.unread_count)
    setSummary(data.summary)
  }, [user])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      if (currentUser) fetchProfile(currentUser.id)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      if (nextUser) fetchProfile(nextUser.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, supabase])

  useEffect(() => {
    if (!user) return

    fetchNotifications()
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNotifications, supabase, user])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const openNotifications = async () => {
    const nextOpen = !notificationsOpen
    setNotificationsOpen(nextOpen)

    if (nextOpen && user) {
      await fetchNotifications()
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      setUnreadCount(0)
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setMenuOpen(false)
    setProfileMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const hasProviderRole = profile?.role === 'provider' || profile?.role === 'both'

  const desktopLinks = (
    <>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} className="text-sm text-muted-foreground hover:text-white transition-colors">
          {item.label}
        </Link>
      ))}
      {user && (
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-white transition-colors">
          Dashboard
        </Link>
      )}
    </>
  )

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo size="sm" />

          <div className="hidden md:flex items-center gap-6">
            {desktopLinks}

            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    onClick={openNotifications}
                    className={`relative p-2 rounded-lg transition-all ${unreadCount > 0 ? 'bg-brand/10 text-brand' : 'hover:bg-surface-card text-muted-foreground hover:text-white'}`}
                    aria-label="Open notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold grid place-items-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-surface-card border border-surface-border shadow-xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">Notifications</div>
                          <div className="text-[11px] text-muted-foreground">{summary}</div>
                        </div>
                        <button type="button" onClick={openNotifications} className="text-[11px] text-brand hover:text-brand-light inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map((notification) => (
                          <div key={notification.id} className="px-4 py-3 border-b border-surface-border/50 last:border-0 hover:bg-surface-hover transition-colors">
                            <div className="flex gap-3">
                              <span className="text-lg leading-none mt-0.5">{notificationIcon(notification.type)}</span>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-white truncate">{notification.title}</div>
                                {notification.body && <div className="text-xs text-muted-foreground line-clamp-2">{notification.body}</div>}
                                <div className="text-[10px] text-muted-foreground/70 mt-1">{formatRelativeTime(notification.created_at)}</div>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="px-4 py-10 text-center text-sm text-muted-foreground">🔔 No notifications yet</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center overflow-hidden border border-white/10 hover:scale-[1.02] transition-all duration-200"
                    aria-label="Open account menu"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-white" />
                    )}
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-card border border-surface-border shadow-xl py-2 z-50">
                      <Link href="/dashboard" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-white hover:bg-surface-hover transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> My Dashboard
                      </Link>
                      <Link href="/settings" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-white hover:bg-surface-hover transition-colors">
                        <Settings className="w-4 h-4" /> Account Settings
                      </Link>
                      {hasProviderRole && (
                        <Link href="/settings/provider" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-white hover:bg-surface-hover transition-colors">
                          <UserIcon className="w-4 h-4" /> Provider Profile
                        </Link>
                      )}
                      <div className="my-2 h-px bg-surface-border" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error-bg transition-colors">
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

          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-surface-card transition-colors" aria-label="Open menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div className="bg-surface-card border-b border-surface-border px-4 py-5 space-y-3 shadow-xl" onClick={(event) => event.stopPropagation()}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="block py-2 text-sm text-muted-foreground hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/dashboard" className="block py-2 text-sm text-muted-foreground hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link href="/settings" className="block py-2 text-sm text-muted-foreground hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Account Settings</Link>
                {hasProviderRole && <Link href="/settings/provider" className="block py-2 text-sm text-muted-foreground hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Provider Profile</Link>}
                <button onClick={handleLogout} className="w-full text-left py-2 text-sm text-error">Sign Out</button>
              </>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 rounded-lg border border-surface-border text-sm text-muted-foreground hover:text-white transition-colors">Log In</Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-medium">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
