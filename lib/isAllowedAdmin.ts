export function isAllowedAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const list = process.env.NEXT_PUBLIC_ADMIN_EMAILS || ''
  const allowed = new Set(list.split(',').map(e => e.trim().toLowerCase()).filter(Boolean))
  return allowed.has(email.toLowerCase())
}
