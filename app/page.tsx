"use client"
import AnimatedBackground from '../components/AnimatedBackground'
import Link from 'next/link'
import Image from 'next/image'

export default function WelcomePage() {
  return (
    <div className="relative overflow-hidden">
      <AnimatedBackground />
      <div className="mx-auto max-w-3xl text-center pt-10 pb-16">
        <div className="mx-auto mb-6 flex justify-center">
          <div className="hero-logo-in">
            <Image src="/Frost Logo - 2025 Gold.png" alt="Event Logo" width={400} height={400} priority className="h-[400px] w-[400px] object-contain drop-shadow" />
          </div>
        </div>
        {/* <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <motion.span
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            SLIIT Frost'25
          </motion.span>
        </h1>
        <p className="mt-2 text-slate-300">January 05, 2026 · 5:30 PM</p> */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="hero-action-in hero-action-in-first">
            <Link href="/live" className="px-6 py-3 rounded-lg bg-brand-blue text-white shadow-glow hover:bg-brand-blue/90 transition-colors">Enter Live</Link>
          </div>
          <div className="hero-action-in hero-action-in-second">
            <Link href="/agenda" className="px-6 py-3 rounded-lg bg-brand-gold text-slate-900 font-semibold hover:bg-brand-gold/90 transition-colors shadow-glow">View Agenda</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
