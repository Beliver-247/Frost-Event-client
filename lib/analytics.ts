import { getSupabaseClient } from './supabaseClient'

let visitorId: string | null = null

function getVisitorId(): string {
  if (visitorId) return visitorId
  
  if (typeof window === 'undefined') return 'server'
  
  // Check localStorage for existing visitor ID
  const stored = localStorage.getItem('visitorId')
  if (stored) {
    visitorId = stored
    return stored
  }
  
  // Generate new visitor ID
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  localStorage.setItem('visitorId', id)
  visitorId = id
  return id
}

export async function trackPageView(pagePath: string) {
  if (typeof window === 'undefined') return
  
  try {
    const supabase = getSupabaseClient()
    await supabase.from('page_views').insert({
      page_path: pagePath,
      visitor_id: getVisitorId(),
      user_agent: navigator.userAgent,
    })
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.error('Analytics tracking failed:', error)
  }
}
