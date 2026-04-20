'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Mail, Lock, AlertCircle, Eye, EyeOff, ArrowLeft, ChevronRight, Zap } from 'lucide-react'
import dynamicImport from 'next/dynamic'
const HeroBackground = dynamicImport(() => import('@/components/effects/HeroBackground'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-50 via-white to-indigo-50" />
})

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen font-body overflow-hidden flex items-center justify-center p-6">
      <HeroBackground />

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-xl p-8 animate-in">
        
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-xl text-slate-800">Kill <span className="text-gradient">Pro</span></span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-slate-800 mb-1">Welcome Back</h1>
          <p className="text-sm text-slate-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-clean pl-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-clean pl-11 pr-11"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'} <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-slate-100">
          <p className="text-sm text-slate-400 mb-2">Don&apos;t have an account?</p>
          <Link href="/auth/register" className="text-violet-600 hover:text-violet-700 font-medium text-sm transition-colors flex items-center justify-center gap-1 group">
            Create Account <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
