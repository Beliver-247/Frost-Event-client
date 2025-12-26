"use client"
import { useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { format } from 'date-fns'
import clsx from 'clsx'

type Item = {
  id: string
  order_index: number
  title: string
  type: 'song' | 'speech' | 'reading' | 'announcement'
  language: 'si' | 'en'
  content: string
}

export default function LivePage() {
  const [item, setItem] = useState<Item | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState<'s' | 'm' | 'l'>('m')
  const [autoScroll, setAutoScroll] = useState<boolean>(false)

  const classSize = useMemo(() => ({ s: 'text-base', m: 'text-lg', l: 'text-xl sm:text-2xl' })[fontSize], [fontSize])

  useEffect(() => { localStorage.setItem('fontSize', fontSize) }, [fontSize])
  useEffect(() => { localStorage.setItem('autoScroll', String(autoScroll)) }, [autoScroll])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const f = localStorage.getItem('fontSize') as 's' | 'm' | 'l' | null
      if (f) setFontSize(f)
      const a = localStorage.getItem('autoScroll')
      if (a) setAutoScroll(a === 'true')
    }
  }, [])

  async function fetchCurrent() {
    const supabase = getSupabaseClient()
    const { data: state, error: stateErr } = await supabase.from('show_state').select('*').eq('id', 1).single()
    if (stateErr) return
    if (state?.updated_at) setUpdatedAt(state.updated_at)
    if (state?.current_item_id) {
      const { data: it } = await getSupabaseClient().from('items').select('*').eq('id', state.current_item_id).single()
      if (it) {
        setItem(it)
        try { localStorage.setItem('lastItem', JSON.stringify(it)) } catch {}
        if (autoScroll) {
          setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, 50)
        }
      }
    }
  }

  useEffect(() => {
    // Restore cached item quickly
    try {
      const cached = localStorage.getItem('lastItem')
      if (cached) setItem(JSON.parse(cached))
    } catch {}

    fetchCurrent()

    const channel = getSupabaseClient()
      .channel('public:show_state')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'show_state', filter: 'id=eq.1' },
        (payload) => {
          fetchCurrent()
        }
      )
      .subscribe()

    return () => { getSupabaseClient().removeChannel(channel) }
  }, [autoScroll])

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Live Now</h1>
          {updatedAt && (
            <p className="text-xs text-slate-400">Last updated: {format(new Date(updatedAt), 'PPpp')}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-300">Font</label>
          <select value={fontSize} onChange={(e) => setFontSize(e.target.value as any)} className="rounded bg-white/10 px-2 py-1">
            <option value="s">S</option>
            <option value="m">M</option>
            <option value="l">L</option>
          </select>
          <label className="ml-3 text-sm text-slate-300">Auto-scroll</label>
          <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
        </div>
      </header>
      <section className={clsx('rounded-xl p-5 bg-slate-900/70 shadow-glow', classSize)}>
        {item ? (
          <div>
            <h2 className="text-brand-gold font-bold text-2xl mb-3">{item.title}</h2>
            <article className="whitespace-pre-wrap leading-relaxed tracking-wide text-slate-100">
              {item.content}
            </article>
          </div>
        ) : (
          <p className="text-slate-400">Waiting for the show to start…</p>
        )}
      </section>
    </div>
  )
}
