"use client"
import { useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { isAllowedAdmin } from '../../lib/isAllowedAdmin'
import Link from 'next/link'

type Item = {
  id: string
  order_index: number
  title: string
  type: 'song' | 'speech' | 'reading' | 'announcement'
  language: 'si' | 'en'
  content: string
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [query, setQuery] = useState('')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [health, setHealth] = useState<{ ok: boolean; error?: string } | null>(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user || !isAllowedAdmin(user.email)) {
        await getSupabaseClient().auth.signOut()
        setAuthorized(false)
        return
      }
      setAuthorized(true)
      await loadData()
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/health')
        const json = await res.json()
        setHealth(json)
      } catch (e: any) {
        setHealth({ ok: false, error: e?.message || 'Health check failed' })
      }
    })()
  }, [])

  async function loadData() {
    const { data: list } = await getSupabaseClient().from('items').select('*').order('order_index', { ascending: true })
    setItems(list || [])
    const { data: state } = await getSupabaseClient().from('show_state').select('*').eq('id', 1).single()
    setCurrentId(state?.current_item_id || null)
  }

  async function setLive(id: string) {
    const { error } = await getSupabaseClient().from('show_state').update({ current_item_id: id, updated_at: new Date().toISOString() }).eq('id', 1)
    if (!error) setCurrentId(id)
  }

  const filtered = useMemo(() => items.filter(i => i.title.toLowerCase().includes(query.toLowerCase())), [items, query])

  function gotoNextPrev(dir: 1 | -1) {
    if (!currentId) return
    const idx = items.findIndex(i => i.id === currentId)
    if (idx === -1) return
    const nextIdx = idx + dir
    const next = items[nextIdx]
    if (next) setLive(next.id)
  }

  async function handleLogout() {
    await getSupabaseClient().auth.signOut()
    window.location.href = '/login'
  }

  if (authorized === false) {
    return (
      <div className="max-w-md mx-auto bg-slate-900/70 rounded-xl p-6 shadow-glow">
        <h1 className="text-xl font-semibold mb-4">Not authorized</h1>
        <p className="text-slate-300">Your account is not allowed. Please contact the organizer.</p>
        <Link href="/login" className="mt-4 inline-block px-4 py-2 rounded bg-brand-blue">Login</Link>
      </div>
    )
  }

  if (authorized === null) return <p>Loading…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/items" className="px-3 py-2 rounded bg-brand-gold/80 hover:bg-brand-gold">Manage Items</Link>
          <button onClick={() => gotoNextPrev(-1)} className="px-3 py-2 rounded bg-white/10 hover:bg-white/15">Previous</button>
          <button onClick={() => gotoNextPrev(1)} className="px-3 py-2 rounded bg-white/10 hover:bg-white/15">Next</button>
          <Link href="/live" target="_blank" className="px-3 py-2 rounded bg-brand-blue hover:bg-brand-blue/90">Preview Live</Link>
          <button onClick={handleLogout} className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-700 transition-colors">Logout</button>
        </div>
      </div>

      {health && (
        <div className={`rounded-lg px-3 py-2 text-sm border ${health.ok ? 'border-green-500/40 text-green-200 bg-green-500/10' : 'border-rose-500/40 text-rose-200 bg-rose-500/10'}`}>
          {health.ok ? 'Connected to Supabase (show_state reachable)' : `Supabase error: ${health.error ?? 'Unknown error'}`}
        </div>
      )}

      <div className="flex items-center gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items…" className="flex-1 rounded bg-white/10 px-3 py-2" />
        <button onClick={loadData} className="px-3 py-2 rounded bg-white/10 hover:bg-white/15">Refresh</button>
      </div>

      <ul className="divide-y divide-slate-800 rounded-xl overflow-hidden border border-slate-800">
        {filtered.map(i => (
          <li key={i.id} className={`p-4 cursor-pointer hover:bg-white/05 ${currentId === i.id ? 'bg-brand-blue/20 border-l-4 border-brand-gold' : ''}`} onClick={() => setLive(i.id)}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{i.title}</div>
                  {currentId === i.id && <span className="text-xs px-2 py-0.5 rounded bg-brand-gold text-slate-900 font-semibold">LIVE NOW</span>}
                </div>
                <div className="text-xs text-slate-400">{i.type} · {i.language} · #{i.order_index}</div>
              </div>
              <button className="px-3 py-1.5 rounded bg-brand-gold/20 hover:bg-brand-gold/30">Set Live</button>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="p-4 text-slate-400">No items found.</li>
        )}
      </ul>
    </div>
  )
}
