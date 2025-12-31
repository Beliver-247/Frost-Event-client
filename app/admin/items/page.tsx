"use client"
import { useEffect, useState, useRef } from 'react'
import { getSupabaseClient } from '../../../lib/supabaseClient'
import { isAllowedAdmin } from '../../../lib/isAllowedAdmin'
import Link from 'next/link'

type Item = {
  id: string
  order_index: number
  title: string
  type: 'song' | 'speech' | 'reading' | 'announcement'
  language: 'si' | 'en'
  content: string
  text_align: 'left' | 'center' | 'justify'
}

type FormData = Omit<Item, 'id'> & { id?: string }

const emptyForm: FormData = {
  order_index: 1,
  title: '',
  type: 'song',
  language: 'en',
  content: '',
  text_align: 'left',
}

export default function ItemsManagerPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [editing, setEditing] = useState<FormData | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const contentHistory = useRef<string[]>([])

  useEffect(() => {
    (async () => {
      const { data: { user } } = await getSupabaseClient().auth.getUser()
      if (!user || !isAllowedAdmin(user.email)) {
        await getSupabaseClient().auth.signOut()
        setAuthorized(false)
        return
      }
      setAuthorized(true)
      await loadItems()
    })()
  }, [])

  async function loadItems() {
    const { data } = await getSupabaseClient().from('items').select('*').order('order_index', { ascending: true })
    setItems(data || [])
  }

  async function handleLogout() {
    await getSupabaseClient().auth.signOut()
    window.location.href = '/login'
  }

  function openNew() {
    const maxOrder = items.length ? Math.max(...items.map(i => i.order_index)) : 0
    setEditing({ ...emptyForm, order_index: maxOrder + 1 })
    contentHistory.current = []
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  function openEdit(item: Item) {
    setEditing({ ...item })
    contentHistory.current = []
    setShowForm(true)
    setError(null)
    setSuccess(null)
  }

  function cancelForm() {
    setEditing(null)
    setShowForm(false)
    setError(null)
    setSuccess(null)
  }

  function insertMarkdown(tag: string) {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea || !editing) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = editing.content.substring(start, end)
    const before = editing.content.substring(0, start)
    const after = editing.content.substring(end)
    const wrapper = tag === 'bold' ? '**' : '*'
    contentHistory.current.push(editing.content)
    setEditing({ ...editing, content: before + wrapper + selected + wrapper + after })
    setTimeout(() => { 
      textarea.focus()
      textarea.setSelectionRange(start + wrapper.length, end + wrapper.length) 
    }, 10)
  }

  function handleContentChange(value: string) {
    if (!editing) return
    contentHistory.current.push(editing.content)
    setEditing({ ...editing, content: value })
  }

  function undoContent() {
    if (!editing) return
    const prev = contentHistory.current.pop()
    if (prev !== undefined) {
      setEditing({ ...editing, content: prev })
    }
  }

  async function saveItem() {
    if (!editing) return
    setError(null)
    setSuccess(null)

    // Validation
    if (!editing.title.trim()) {
      setError('Title is required')
      return
    }
    if (editing.type === 'song' && !editing.content.trim()) {
      setError('Content is required for songs')
      return
    }
    if (editing.order_index < 1) {
      setError('Order index must be >= 1')
      return
    }

    // Check duplicate title
    const duplicate = items.find(i => i.title.toLowerCase() === editing.title.toLowerCase() && i.id !== editing.id)
    if (duplicate) {
      setError(`Title "${editing.title}" already exists`)
      return
    }

    const payload = {
      order_index: editing.order_index,
      title: editing.title.trim(),
      type: editing.type,
      language: editing.language,
      content: editing.content.trim(),
      text_align: editing.text_align,
    }

    // Normalize target index
    const sorted = [...items].sort((a, b) => a.order_index - b.order_index)
    const maxOrder = sorted.length ? sorted[sorted.length - 1].order_index : 0
    const targetIndex = Math.max(1, Math.min(payload.order_index, editing.id ? maxOrder : maxOrder + 1))
    payload.order_index = targetIndex

    async function shiftOnInsert(idx: number) {
      // Shift all items with order_index >= idx down by 1 (descending to avoid clashes)
      const toShift = sorted.filter(i => i.order_index >= idx).sort((a, b) => b.order_index - a.order_index)
      for (const row of toShift) {
        const { error: e } = await getSupabaseClient().from('items').update({ order_index: row.order_index + 1 }).eq('id', row.id)
        if (e) throw e
      }
    }

    async function shiftOnUpdate(id: string, oldIdx: number, newIdx: number) {
      if (newIdx === oldIdx) return
      if (newIdx < oldIdx) {
        // Move up: shift down items in [newIdx, oldIdx-1]
        const toShift = sorted
          .filter(i => i.id !== id && i.order_index >= newIdx && i.order_index < oldIdx)
          .sort((a, b) => b.order_index - a.order_index)
        for (const row of toShift) {
          const { error: e } = await getSupabaseClient().from('items').update({ order_index: row.order_index + 1 }).eq('id', row.id)
          if (e) throw e
        }
      } else {
        // Move down: shift up items in (oldIdx, newIdx]
        const toShift = sorted
          .filter(i => i.id !== id && i.order_index > oldIdx && i.order_index <= newIdx)
          .sort((a, b) => a.order_index - b.order_index)
        for (const row of toShift) {
          const { error: e } = await getSupabaseClient().from('items').update({ order_index: row.order_index - 1 }).eq('id', row.id)
          if (e) throw e
        }
      }
    }

    try {
      if (editing.id) {
        const current = items.find(i => i.id === editing.id)
        const oldIdx = current?.order_index ?? targetIndex
        await shiftOnUpdate(editing.id, oldIdx, targetIndex)
        const { error: err } = await getSupabaseClient().from('items').update({ ...payload, order_index: targetIndex }).eq('id', editing.id)
        if (err) throw err
        setSuccess('Item updated successfully')
      } else {
        await shiftOnInsert(targetIndex)
        const { error: err } = await getSupabaseClient().from('items').insert([{ ...payload, order_index: targetIndex }])
        if (err) throw err
        setSuccess('Item created successfully')
      }
    } catch (err: any) {
      setError(err?.message || 'Reorder failed')
      return
    }

    await loadItems()
    setTimeout(() => {
      cancelForm()
    }, 1000)
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return
    setError(null)
    setSuccess(null)
    const { error: err } = await getSupabaseClient().from('items').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setSuccess('Item deleted')
    await loadItems()
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

  if (authorized === null) return <p>Loading…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Items</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="px-3 py-2 rounded bg-white/10 hover:bg-white/15">← Back to Dashboard</Link>
          <button onClick={openNew} className="px-4 py-2 rounded bg-brand-gold/80 hover:bg-brand-gold">+ Add Item</button>
          <button onClick={handleLogout} className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-700 transition-colors">Logout</button>
        </div>
      </div>

      {error && <div className="rounded-lg px-4 py-3 bg-rose-500/10 border border-rose-500/40 text-rose-200">{error}</div>}
      {success && <div className="rounded-lg px-4 py-3 bg-green-500/10 border border-green-500/40 text-green-200">{success}</div>}

      {showForm && editing && (
        <div className="rounded-xl p-6 bg-slate-900/70 border border-slate-700 space-y-4">
          <h2 className="text-xl font-semibold">{editing.id ? 'Edit Item' : 'New Item'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Order Index *</label>
              <input
                type="number"
                value={editing.order_index}
                onChange={(e) => setEditing({ ...editing, order_index: parseInt(e.target.value) || 1 })}
                className="w-full rounded bg-white/10 px-3 py-2"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Type *</label>
              <select
                value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as any })}
                className="w-full rounded bg-white/10 px-3 py-2"
              >
                <option value="song">Song</option>
                <option value="speech">Speech</option>
                <option value="reading">Reading</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Language *</label>
              <select
                value={editing.language}
                onChange={(e) => setEditing({ ...editing, language: e.target.value as any })}
                className="w-full rounded bg-white/10 px-3 py-2"
              >
                <option value="en">English</option>
                <option value="si">Sinhala (සිංහල)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Title *</label>
              <input
                type="text"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full rounded bg-white/10 px-3 py-2"
                placeholder="Joy to the World"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Text Alignment</label>
            <select
              value={editing.text_align}
              onChange={(e) => setEditing({ ...editing, text_align: e.target.value as any })}
              className="w-full rounded bg-white/10 px-3 py-2"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="justify">Justify</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Content (Lyrics/Text) *</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => insertMarkdown('bold')}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm font-bold"
                title="Bold: **text**"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('italic')}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm italic"
                title="Italic: *text*"
              >
                I
              </button>
              <button
                type="button"
                onClick={undoContent}
                disabled={contentHistory.current.length === 0}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm disabled:opacity-40"
                title="Undo last edit"
              >
                Undo
              </button>
            </div>
            <textarea
              value={editing.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full rounded bg-white/10 px-3 py-2 font-mono text-sm"
              rows={12}
              placeholder="Paste lyrics or text here. Use line breaks for verses."
            />
            <p className="text-xs text-slate-400 mt-1">Formatting: **bold**, *italic*. Use blank lines to separate verses. Supports Sinhala Unicode.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={saveItem} className="px-4 py-2 rounded bg-brand-blue hover:bg-brand-blue/90">
              {editing.id ? 'Update' : 'Create'}
            </button>
            <button onClick={cancelForm} className="px-4 py-2 rounded bg-white/10 hover:bg-white/15">Cancel</button>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-slate-800">
        <table className="w-full text-left">
          <thead className="bg-slate-900/70">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-slate-400">Order</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400">Title</th>
              <th className="hidden sm:table-cell px-4 py-3 text-xs font-medium text-slate-400">Type</th>
              <th className="hidden md:table-cell px-4 py-3 text-xs font-medium text-slate-400">Lang</th>
              <th className="hidden lg:table-cell px-4 py-3 text-xs font-medium text-slate-400">Align</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-white/5">
                <td className="px-4 py-3 text-sm">{item.order_index}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-slate-400 sm:hidden">{item.type} · {item.language}</div>
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-sm text-slate-400">{item.type}</td>
                <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-400">{item.language}</td>
                <td className="hidden lg:table-cell px-4 py-3 text-sm text-slate-400">{item.text_align || 'left'}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-xs sm:text-sm">Edit</button>
                    <button onClick={() => deleteItem(item.id)} className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs sm:text-sm">Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No items yet. Click "+ Add Item" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
