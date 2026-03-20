import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6 opacity-30">🪞</div>
        <h1 className="font-display text-brand text-2xl font-light mb-2">
          This page doesn&apos;t exist.
        </h1>
        <p className="text-muted text-sm mb-8">
          But Mirror is still here.
        </p>
        <Link href="/dashboard" className="mirror-btn-primary inline-flex px-8 py-3">
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
