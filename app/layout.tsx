import './globals.css'
import type { Metadata } from 'next'
import { Header } from '../components/Header'

export const metadata: Metadata = {
  title: 'Frost 25',
  description: 'Live lyrics and items for the carols show',
  icons: {
    icon: '/Frost Logo - 2025 Gold.png',
    apple: '/Frost Logo - 2025 Gold.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-white bg-gold-blue-gradient">
        <Header />
        <main className="relative mx-auto max-w-3xl px-4 pb-16 pt-6">
          {children}
        </main>
      </body>
    </html>
  )
}
