"use client"
import { useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { isAllowedAdmin } from '../../lib/isAllowedAdmin'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function sendMagicLink() {
    setMessage(null)
    if (!isAllowedAdmin(email)) {
      setMessage('Email is not authorized for admin access.')
      return
    }
    setLoading(true)
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/admin`
    const { error } = await getSupabaseClient().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    setLoading(false)
    if (error) setMessage(error.message)
    else setMessage('Magic link sent! Check your inbox.')
  }

  return (
    <div className="max-w-md mx-auto bg-slate-900/70 rounded-xl p-6 shadow-glow">
      <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
      <p className="text-sm text-slate-300 mb-4">Only allowlisted emails can request a magic link.</p>
      <div className="space-y-3">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" className="w-full rounded bg-white/10 px-3 py-2" />
        <button onClick={sendMagicLink} disabled={loading} className="w-full rounded bg-brand-blue px-3 py-2 hover:bg-brand-blue/90">
          {loading ? 'Sending…' : 'Send Magic Link'}
        </button>
        {message && <p className="text-sm text-slate-300">{message}</p>}
      </div>
    </div>
  )
}
