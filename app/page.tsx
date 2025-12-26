"use client"
import AnimatedBackground from '../components/AnimatedBackground'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export default function WelcomePage() {
  const shouldReduceMotion = useReducedMotion()
  const [redirecting, setRedirecting] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      setRedirecting(true)
      window.location.assign('/live')
    }, 3000)
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current) }
  }, [])

  return (
    <div className="relative overflow-hidden">
      <AnimatedBackground />
      <div className="mx-auto max-w-3xl text-center pt-10 pb-16">
        <div className="mx-auto mb-6">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Image src="/logo.svg" alt="Event Logo" width={160} height={160} priority className="drop-shadow" />
          </motion.div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <motion.span
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Frost Carols Night
          </motion.span>
        </h1>
        <p className="mt-2 text-slate-300">December 26, 2025 · 7:00 PM</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/live" className="px-6 py-3 rounded-lg bg-brand-blue text-white shadow-glow hover:bg-brand-blue/90 transition-colors">Enter Live Lyrics</Link>
          </motion.div>
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button
              onClick={() => { if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; setRedirecting(false) } }}
              className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
            >
              {redirecting ? 'Cancel' : 'Skip'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
