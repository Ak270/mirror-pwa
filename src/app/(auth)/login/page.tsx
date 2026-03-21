'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null)

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'info', text: 'Check your email to confirm your account.' })
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleAnonymous() {
    setLoading(true)
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    } else {
      // Store anonymous user creation timestamp for 7-day trial tracking
      if (data.user) {
        localStorage.setItem('mirror_anon_created_at', new Date().toISOString())
      }
      router.push('/onboarding')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-brand flex flex-col items-center justify-center px-5 py-12"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #3D3D9B 0%, #1A1A5E 60%, #0D0D3F 100%)' }}>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-white text-5xl font-light tracking-tight hover:opacity-80 transition-opacity">
            Mirror
          </Link>
          <p className="font-display italic text-[#C4C0FF]/80 mt-2 text-base">
            You are the only judge.
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-card p-7 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex bg-surface rounded-btn p-1 mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-all duration-150 ${mode === 'signin' ? 'bg-white text-brand shadow-sm' : 'text-muted'}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-all duration-150 ${mode === 'signup' ? 'bg-white text-brand shadow-sm' : 'text-muted'}`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="mirror-label" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mirror-input pl-9"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="mirror-label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mirror-input pr-10"
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-brand transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {message && (
              <div className={`text-sm px-4 py-3 rounded-btn ${message.type === 'error' ? 'bg-slip-light text-slip' : 'bg-success-light text-success'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mirror-btn-primary w-full disabled:opacity-60"
            >
              {loading ? 'Loading…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-muted">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="mirror-btn-secondary w-full flex items-center justify-center gap-3 disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={handleAnonymous}
              disabled={loading}
              className="w-full py-3 text-sm text-muted hover:text-brand transition-colors text-center disabled:opacity-60"
            >
              Try without an account →
            </button>
          </div>

          <p className="text-xs text-center text-muted mt-5 leading-relaxed">
            Anonymous accounts give you full 7-day access. Your data is stored locally and can be synced to an account any time.
          </p>
        </div>
      </div>
    </div>
  )
}
