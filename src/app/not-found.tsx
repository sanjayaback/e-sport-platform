import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
      <div className="relative text-center animate-in">
        <div className="text-8xl font-display font-bold text-neon-green/20 mb-4 select-none">404</div>
        <div className="w-16 h-16 bg-neon-green/10 border border-neon-green/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Zap className="w-8 h-8 text-neon-green" />
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-gray-400 font-body mb-8 max-w-sm mx-auto">
          The arena you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn-primary">Back to Home</Link>
          <Link href="/tournaments" className="btn-secondary">Browse Tournaments</Link>
        </div>
      </div>
    </div>
  )
}
