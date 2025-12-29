"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '../../lib/supabaseClient'

type Item = {
  id: string
  order_index: number
  title: string
  type: 'song' | 'speech' | 'reading' | 'announcement'
  language: 'si' | 'en'
  content: string
  text_align?: string
}

export default function AgendaPage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [currentItemId, setCurrentItemId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      // Load all items
      const { data: itemsList } = await getSupabaseClient()
        .from('items')
        .select('*')
        .order('order_index', { ascending: true })
      
      setItems(itemsList || [])
      setLoading(false)

      // Subscribe to show_state for real-time current item updates
      const channel = getSupabaseClient()
        .channel('agenda-state')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'show_state', filter: `id=eq.1` },
          (payload: any) => {
            setCurrentItemId(payload.new?.current_item_id || null)
          }
        )
        .subscribe()

      // Load initial current item
      const { data: state } = await getSupabaseClient()
        .from('show_state')
        .select('current_item_id')
        .eq('id', 1)
        .single()
      setCurrentItemId(state?.current_item_id || null)

      return () => {
        channel.unsubscribe()
      }
    }

    const cleanup = loadData()
    return () => {
      cleanup.then(c => c?.())
    }
  }, [])

  if (loading) return <p className="text-center text-slate-400">Loading agenda…</p>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold mb-6">Event Agenda</h1>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-slate-400">No items scheduled.</p>
        ) : (
          items.map((item) => {
            const isCurrent = item.id === currentItemId
            const isPast = currentItemId && items.findIndex(i => i.id === currentItemId) > items.findIndex(i => i.id === item.id)

            return (
              <Link key={item.id} href={`/live?itemId=${item.id}`}>
                <div
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-brand-gold/20 border-brand-gold/60 ring-1 ring-brand-gold/40'
                      : isPast
                      ? 'bg-white/5 border-slate-700 opacity-50'
                      : 'bg-white/10 border-slate-700 hover:bg-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-brand-gold">#{item.order_index}</span>
                        <h2 className="text-lg font-semibold">{item.title}</h2>
                        {isCurrent && <span className="text-xs px-2 py-1 rounded bg-brand-gold text-slate-900 font-medium">NOW</span>}
                      </div>
                      <div className="text-sm text-slate-400">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)} · {item.language === 'si' ? 'Sinhala' : 'English'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        router.push(`/live?itemId=${item.id}`)
                      }}
                      className="px-3 py-2 rounded bg-brand-blue hover:bg-brand-blue/90 text-sm font-medium transition-colors"
                    >
                      {item.type === 'song' ? 'View Lyrics' : 'View Content'}
                    </button>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
