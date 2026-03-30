'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, ChevronRight, Zap } from 'lucide-react'
import dynamicImport from 'next/dynamic'
const HeroBackground = dynamicImport(() => import('@/components/effects/HeroBackground'), { ssr: false })

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'player' as 'player' | 'host' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await register(form.username, form.email, form.password, form.role)
      router.push('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Registration failed. Please check your details.')
    } finally { setLoading(false) }
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

        <div className="text-center mb-6">
          <h1 className="text-2xl font-display font-bold text-slate-800 mb-1">Create Account</h1>
          <p className="text-sm text-slate-400">Join the Kill Pro community</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-50 p-1 rounded-xl border border-slate-100">
          {[
            { id: 'player', label: 'Player' },
            { id: 'host', label: 'Host' }
          ].map(r => (
            <button key={r.id} type="button" onClick={() => setForm(f => ({...f, role: r.id as any}))}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                form.role === r.id ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}>
              {r.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))}
                placeholder="Your username" required className="input-clean pl-11" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                placeholder="you@example.com" required className="input-clean pl-11" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type={showPass ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                placeholder="Min. 8 characters" required className="input-clean pl-11 pr-11" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Account'} <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-slate-100">
          <p className="text-sm text-slate-400 mb-2">Already have an account?</p>
          <Link href="/auth/login" className="text-violet-600 hover:text-violet-700 font-medium text-sm transition-colors flex items-center justify-center gap-1 group">
            Sign In <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
