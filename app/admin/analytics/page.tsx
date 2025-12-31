"use client"
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../../../lib/supabaseClient'
import { isAllowedAdmin } from '../../../lib/isAllowedAdmin'
import Link from 'next/link'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

type Stats = {
  totalViews: number
  uniqueVisitors: number
  todayViews: number
  last7DaysViews: number
  pageBreakdown: { page: string; count: number }[]
  hourlyBreakdown: { hour: string; count: number }[]
}

export default function AnalyticsPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user || !isAllowedAdmin(user.email)) {
        await getSupabaseClient().auth.signOut()
        setAuthorized(false)
        return
      }
      setAuthorized(true)
      await loadStats()
    })()
  }, [])

  async function loadStats() {
    const supabase = getSupabaseClient()
    setLoading(true)

    try {
      // Total views
      const { count: totalViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })

      // Unique visitors
      const { data: visitors } = await supabase
        .from('page_views')
        .select('visitor_id')
      const uniqueVisitors = new Set(visitors?.map(v => v.visitor_id)).size

      // Today's views
      const todayStart = startOfDay(new Date()).toISOString()
      const { count: todayViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart)

      // Last 7 days
      const last7Days = subDays(new Date(), 7).toISOString()
      const { count: last7DaysViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', last7Days)

      // Page breakdown
      const { data: allViews } = await supabase
        .from('page_views')
        .select('page_path')
      const pageCounts = allViews?.reduce((acc, v) => {
        acc[v.page_path] = (acc[v.page_path] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      const pageBreakdown = Object.entries(pageCounts || {})
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)

      // Hourly breakdown (last 24h)
      const last24h = subDays(new Date(), 1).toISOString()
      const { data: recentViews } = await supabase
        .from('page_views')
        .select('created_at')
        .gte('created_at', last24h)
        .order('created_at', { ascending: true })

      const hourlyCounts = recentViews?.reduce((acc, v) => {
        const hour = format(new Date(v.created_at), 'HH:00')
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      const hourlyBreakdown = Object.entries(hourlyCounts || {})
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour))

      setStats({
        totalViews: totalViews || 0,
        uniqueVisitors,
        todayViews: todayViews || 0,
        last7DaysViews: last7DaysViews || 0,
        pageBreakdown,
        hourlyBreakdown,
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await getSupabaseClient().auth.signOut()
    window.location.href = '/login'
  }

  if (authorized === false) {
    return (
      <div className="max-w-md mx-auto bg-slate-900/70 rounded-xl p-6 shadow-glow">
        <h1 className="text-xl font-semibold mb-4">Not authorized</h1>
        <p className="text-slate-300">Your account is not allowed.</p>
        <Link href="/login" className="mt-4 inline-block px-4 py-2 rounded bg-brand-blue">Login</Link>
      </div>
    )
  }

  if (authorized === null || loading) return <p>Loading…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="px-3 py-2 rounded bg-white/10 hover:bg-white/15">← Back to Dashboard</Link>
          <button onClick={loadStats} className="px-3 py-2 rounded bg-brand-blue hover:bg-brand-blue/90">Refresh</button>
          <button onClick={handleLogout} className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-700">Logout</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-800">
          <div className="text-sm text-slate-400">Total Views</div>
          <div className="text-3xl font-bold text-brand-gold mt-1">{stats?.totalViews.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-800">
          <div className="text-sm text-slate-400">Unique Visitors</div>
          <div className="text-3xl font-bold text-brand-blue mt-1">{stats?.uniqueVisitors.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-800">
          <div className="text-sm text-slate-400">Today</div>
          <div className="text-3xl font-bold text-green-400 mt-1">{stats?.todayViews.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-800">
          <div className="text-sm text-slate-400">Last 7 Days</div>
          <div className="text-3xl font-bold text-purple-400 mt-1">{stats?.last7DaysViews.toLocaleString()}</div>
        </div>
      </div>

      {/* Page Breakdown */}
      <div className="bg-slate-900/70 rounded-xl p-6 border border-slate-800">
        <h2 className="text-lg font-semibold mb-4">Page Views Breakdown</h2>
        <div className="space-y-2">
          {stats?.pageBreakdown.map(({ page, count }) => (
            <div key={page} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
              <span className="text-slate-300">{page}</span>
              <span className="font-semibold text-brand-gold">{count.toLocaleString()}</span>
            </div>
          ))}
          {stats?.pageBreakdown.length === 0 && (
            <p className="text-slate-400">No data yet</p>
          )}
        </div>
      </div>

      {/* Hourly Breakdown */}
      <div className="bg-slate-900/70 rounded-xl p-6 border border-slate-800">
        <h2 className="text-lg font-semibold mb-4">Last 24 Hours Activity</h2>
        <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-2">
          {stats?.hourlyBreakdown.map(({ hour, count }) => (
            <div key={hour} className="text-center">
              <div className="text-xs text-slate-400 mb-1">{hour}</div>
              <div className="bg-brand-blue/20 rounded px-2 py-1 text-sm font-semibold">{count}</div>
            </div>
          ))}
          {stats?.hourlyBreakdown.length === 0 && (
            <p className="col-span-full text-slate-400">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  )
}
