'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const FEATURES = [
  {
    icon: '🪞',
    title: 'No Proof Required',
    desc: 'Trust-based logging. Your word is the only source of truth. No screenshots, step counts, or GPS data.',
  },
  {
    icon: '💛',
    title: 'No Judgment',
    desc: 'Failure is never punished visually. Honest slips are treated with amber warmth, not red alarm.',
  },
  {
    icon: '🔒',
    title: 'Your Data Only',
    desc: 'No ads, no sharing. Private vault habits never leave your device. You are in complete control.',
  },
  {
    icon: '📊',
    title: 'Patterns, Not Performance',
    desc: 'Graphs show patterns you cannot see day-to-day. A mirror of time — not a scoreboard.',
  },
]

const CATEGORIES = [
  { emoji: '🔓', name: 'Break Free', desc: 'Reduce habits that no longer serve you' },
  { emoji: '🌱', name: 'Build Up', desc: 'Build consistency in things that matter' },
  { emoji: '🌙', name: 'Rhythm', desc: 'Align your body with your natural clock' },
  { emoji: '🧘', name: 'Mind & Spirit', desc: 'Tend to your inner life with gentle practice' },
]

export default function LandingPage() {
  const starsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!starsRef.current) return
    const container = starsRef.current
    for (let i = 0; i < 60; i++) {
      const star = document.createElement('div')
      const size = Math.random() * 5 + 2
      star.style.cssText = `
        position:absolute;
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:rgba(108,99,255,0.4);
        top:${Math.random() * 100}%;
        left:${Math.random() * 100}%;
        animation: pulse-star ${2 + Math.random() * 3}s ease-in-out infinite;
        animation-delay:${Math.random() * 3}s;
      `
      container.appendChild(star)
    }
  }, [])

  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-brand px-6 py-20">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #3D3D9B 0%, #1A1A5E 60%, #0D0D3F 100%)' }}
        />
        <div ref={starsRef} className="absolute inset-0" aria-hidden="true" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-accent/30 border border-accent/50 text-[#C4C0FF] font-mono text-xs tracking-widest uppercase px-4 py-1.5 rounded-pill mb-8">
              Habit Tracking for Real Life
            </div>

            <h1 className="font-display font-light text-white tracking-tight leading-none mb-4"
              style={{ fontSize: 'clamp(72px, 14vw, 120px)' }}>
              Mirror
            </h1>

            <p className="font-display italic text-[#C4C0FF]/90 mb-4 font-light"
              style={{ fontSize: 'clamp(18px, 3vw, 26px)' }}>
              You are the only judge.
            </p>

            <p className="text-white/70 mb-10 max-w-md mx-auto"
              style={{ fontSize: 'clamp(14px, 2vw, 17px)' }}>
              Track your habits honestly. No proof required. No shame.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/login" className="bg-accent text-white font-semibold px-8 py-3.5 rounded-btn hover:bg-opacity-90 transition-all duration-150 text-base">
                Start for free
              </Link>
              <a href="#how-it-works" className="bg-white/10 border border-white/30 text-white font-medium px-8 py-3.5 rounded-btn hover:bg-white/20 transition-all duration-150 text-base">
                See how it works
              </a>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-sm animate-bounce">
          ↓
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-mono text-xs text-accent tracking-widest uppercase mb-3">Philosophy</p>
            <h2 className="font-display text-brand font-light tracking-tight"
              style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
              A mirror, not a scoreboard.
            </h2>
            <p className="text-muted mt-4 max-w-lg mx-auto text-base leading-relaxed">
              Mirror treats you as your own highest authority. There is no proof required, no external validation, no judgment from the product.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="mirror-card p-7">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-brand text-lg mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-24" style={{ background: '#FAFAFA' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="font-mono text-xs text-accent tracking-widest uppercase mb-3">What to work on</p>
            <h2 className="font-display text-brand font-light tracking-tight"
              style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
              Four areas of honest intention.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="mirror-card p-6 text-center hover:shadow-hover transition-shadow duration-200">
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <div className="font-semibold text-brand mb-1">{cat.name}</div>
                <div className="text-muted text-sm">{cat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="py-24 bg-brand text-white text-center px-6">
        <div className="max-w-2xl mx-auto">
          <p className="font-display italic font-light leading-relaxed text-white/90"
            style={{ fontSize: 'clamp(22px, 4vw, 38px)' }}>
            "Mirror does not reward performance — it rewards honesty."
          </p>
          <div className="mt-12">
            <Link href="/login" className="bg-accent text-white font-semibold px-10 py-4 rounded-btn hover:bg-opacity-90 transition-all text-base">
              Start for free
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-brand py-12 px-6 text-center">
        <div className="font-display text-white text-3xl font-light mb-2">Mirror</div>
        <div className="font-display italic text-[#C4C0FF]/70 text-sm mb-6">You are the only judge.</div>
        <div className="flex justify-center gap-8 text-white/40 text-xs flex-wrap">
          <span>PWA Habit Tracker</span>
          <span>Next.js 14 · Supabase · Vercel</span>
          <span>Warmth · Honesty · Privacy</span>
        </div>
      </footer>
    </main>
  )
}
