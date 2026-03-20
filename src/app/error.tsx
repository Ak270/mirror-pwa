'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-6 opacity-40">· · ·</div>
        <h1 className="font-display text-brand text-2xl font-light mb-2">
          Something went sideways.
        </h1>
        <p className="text-muted text-sm mb-8">
          Mirror is still here. Nothing was lost.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="mirror-btn-primary px-6 py-2.5 text-sm"
          >
            Try again
          </button>
          <Link href="/dashboard" className="mirror-btn-secondary px-6 py-2.5 text-sm">
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
