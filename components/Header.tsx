import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/Carols Logo - Long - Transparent - White.png" alt="Event Logo" width={180} height={40} priority />
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/agenda" className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 transition-colors">Agenda</Link>
          <Link href="/live" className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 transition-colors">Enter Live</Link>
          <Link href="/admin" className="px-3 py-1.5 rounded-md bg-brand-blue/70 hover:bg-brand-blue transition-colors">Admin</Link>
        </nav>
      </div>
    </header>
  )
}
