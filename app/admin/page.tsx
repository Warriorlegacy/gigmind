'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/shared/Navigation'
import { createClient } from '@/lib/supabase/client'
import { formatINR, formatRelativeTime } from '@/lib/utils/formatting'
import { Users, Briefcase, IndianRupee, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, TrendingUp, Shield } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface Stats {
  totalUsers: number
  totalJobs: number
  totalRevenue: number
  pendingDisputes: number
}

interface Transaction {
  id: string
  amount: number
  platform_fee: number
  status: string
  created_at: string
  jobs: { title: string } | null
}

interface KYCProvider {
  id: string
  kyc_status: string
  profiles: { full_name: string; phone: string | null } | null
  created_at: string
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalJobs: 0, totalRevenue: 0, pendingDisputes: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [kycProviders, setKycProviders] = useState<KYCProvider[]>([])
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)
    loadStats()
    loadTransactions()
    loadKYC()
  }

  const loadStats = async () => {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true })
    const { data: revenueData } = await supabase.from('transactions').select('platform_fee').eq('status', 'released')
    const totalRevenue = (revenueData || []).reduce((sum: number, t: any) => sum + (t.platform_fee || 0), 0)
    const { count: disputeCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'disputed')

    setStats({
      totalUsers: userCount || 0,
      totalJobs: jobCount || 0,
      totalRevenue,
      pendingDisputes: disputeCount || 0,
    })

    // Generate mock revenue data for chart
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue: Math.floor(Math.random() * 5000) + 500,
      })
    }
    setRevenueData(days)
  }

  const loadTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*, jobs(title)')
      .order('created_at', { ascending: false })
      .limit(10)

    setTransactions((data || []) as Transaction[])
  }

  const loadKYC = async () => {
    const { data } = await supabase
      .from('provider_profiles')
      .select('id, kyc_status, created_at, profiles(full_name, phone)')
      .eq('kyc_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)

    setKycProviders((data || []) as unknown as KYCProvider[])
  }

  const handleKYC = async (providerId: string, status: 'verified' | 'rejected') => {
    await supabase.from('provider_profiles').update({ kyc_status: status }).eq('id', providerId)
    if (status === 'verified') {
      const { data: provider } = await supabase.from('provider_profiles').select('user_id').eq('id', providerId).maybeSingle()
      if (provider) {
        await supabase.from('profiles').update({ is_verified: true }).eq('id', provider.user_id)
      }
    }
    loadKYC()
  }

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-surface pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-hover rounded w-1/3" />
            <div className="grid sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-surface-hover rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mb-8">Platform overview and management</p>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'brand' },
              { icon: Briefcase, label: 'Total Jobs', value: stats.totalJobs, color: 'info' },
              { icon: IndianRupee, label: 'Revenue', value: formatINR(stats.totalRevenue), color: 'success' },
              { icon: AlertTriangle, label: 'Disputes', value: stats.pendingDisputes, color: 'error' },
            ].map((stat) => (
              <div key={stat.label} className="p-5 rounded-2xl bg-surface-card border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color === 'brand' ? 'brand/10' : stat.color === 'info' ? 'info-bg' : stat.color === 'success' ? 'success-bg' : 'error-bg'} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color === 'brand' ? 'brand' : stat.color}`} />
                  </div>
                  <div>
                    <div className="font-display font-bold text-white text-xl">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border mb-8">
            <h2 className="font-display font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand" /> Revenue (Last 30 Days)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#1A1A24', border: '1px solid #2A2A3A', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: number) => [`₹${value}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#6C47FF" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
              <h2 className="font-display font-bold text-white mb-4">Recent Transactions</h2>
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-xl bg-surface">
                      <div>
                        <div className="text-sm text-white">{txn.jobs?.title || 'Job'}</div>
                        <div className="text-xs text-muted-foreground">{formatRelativeTime(txn.created_at)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{formatINR(txn.amount)}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          txn.status === 'released' ? 'bg-success-bg text-success' :
                          txn.status === 'held' ? 'bg-warning-bg text-warning' :
                          txn.status === 'disputed' ? 'bg-error-bg text-error' :
                          'bg-surface-hover text-muted-foreground'
                        }`}>{txn.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">No transactions yet</p>
              )}
            </div>

            {/* Pending KYC */}
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border">
              <h2 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-warning" /> Pending KYC Verifications
              </h2>
              {kycProviders.length > 0 ? (
                <div className="space-y-3">
                  {kycProviders.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-surface">
                      <div>
                        <div className="text-sm text-white">{p.profiles?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{p.profiles?.phone || 'No phone'} &bull; {formatRelativeTime(p.created_at)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleKYC(p.id, 'verified')}
                          className="p-1.5 rounded-lg bg-success-bg text-success hover:bg-success/20 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleKYC(p.id, 'rejected')}
                          className="p-1.5 rounded-lg bg-error-bg text-error hover:bg-error/20 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">No pending KYC requests</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
