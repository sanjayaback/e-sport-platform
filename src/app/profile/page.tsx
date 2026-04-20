'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import axios from 'axios'
import {
  User,
  Wallet,
  Trophy,
  TrendingUp,
  Calendar,
  DollarSign,
  Crown,
  CreditCard,
  Target,
  Gamepad2,
  RefreshCw,
} from 'lucide-react'

interface ProfileData {
  user: {
    _id: string
    username: string
    email: string
    role: string
    walletBalance: number
    isSubscribed: boolean
    createdAt: string
  }
  statistics: {
    totalSpent: number
    totalWinnings: number
    totalDeposits: number
    tournamentsPlayed: number
    tournamentsWon: number
    tournamentsHosted: number
    winRate: number
  }
  financials: {
    payments: Array<{
      _id: string
      tournamentId?: string
      amount: number
      status: string
      type: string
      timestamp: string
    }>
    totalTransactions: number
  }
  activity: {
    participatedTournaments: Array<{
      _id: string
      title: string
      gameName: string
      entryFee: number
      status: string
      winnerId?: string
      scheduledAt: string
      createdAt: string
    }>
    hostedTournaments: Array<{
      _id: string
      title: string
      gameName: string
      entryFee: number
      maxPlayers: number
      prizePool: number
      status: string
      scheduledAt: string
      createdAt: string
    }>
    totalActivity: number
  }
}

type TabId = 'overview' | 'transactions' | 'tournaments'

export default function ProfilePage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  useEffect(() => {
    if (!authLoading && (!user || !token)) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router, token])

  useEffect(() => {
    if (user && token) fetchProfileData()
  }, [user, token])

  async function fetchProfileData() {
    try {
      setLoading(true)
      const res = await axios.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.data.success) setProfileData(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const formatCurrency = (amount: number) =>
    `Rs.${amount.toLocaleString()}`

  const statusPill = (status: string) => {
    const map: Record<string, string> = {
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending:   'bg-amber-50 text-amber-700 border-amber-200',
      failed:    'bg-zinc-100 text-zinc-500 border-zinc-200',
      active:    'bg-sky-50 text-sky-700 border-sky-200',
    }
    return map[status] ?? 'bg-zinc-100 text-zinc-500 border-zinc-200'
  }

  /* ── Loading ── */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-zinc-500 animate-spin" />
          <p className="text-sm text-zinc-400">Loading profile…</p>
        </div>
      </div>
    )
  }

  /* ── Not found ── */
  if (!user || !profileData) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <p className="text-zinc-400 text-sm text-center">Profile not found.</p>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview',     label: 'Overview',     icon: TrendingUp },
    { id: 'transactions', label: 'Transactions',  icon: CreditCard },
    { id: 'tournaments',  label: 'Tournaments',   icon: Trophy },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
              Player profile
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Gaming overview &amp; statistics
            </p>
          </div>
          <button
            onClick={fetchProfileData}
            className="w-9 h-9 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors shadow-sm flex-shrink-0"
            aria-label="Refresh profile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* ── Identity card ── */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 sm:p-6 mb-4">

          {/* Avatar + info */}
          <div className="flex items-start gap-3 sm:gap-4 mb-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base sm:text-lg font-semibold text-zinc-900 truncate">
                {profileData.user.username}
              </p>
              <p className="text-xs sm:text-sm text-zinc-400 truncate">
                {profileData.user.email}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs px-2.5 py-1 rounded-full border bg-zinc-50 text-zinc-500 border-zinc-200 font-medium capitalize">
                  {profileData.user.role}
                </span>
                {profileData.user.isSubscribed && (
                  <span className="text-xs px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 font-medium flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Subscribed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Wallet strip */}
          <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Wallet balance</p>
              <p className="text-xl sm:text-2xl font-semibold text-zinc-900">
                {formatCurrency(profileData.user.walletBalance)}
              </p>
            </div>
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-300 flex-shrink-0" />
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-1 sm:p-1.5 mb-4 flex gap-0.5 sm:gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1 sm:px-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════
            Overview tab — 2 cols mobile, 3 cols sm+
        ══════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: Trophy,     label: 'Tournaments played', value: profileData.statistics.tournamentsPlayed },
              { icon: Target,     label: 'Win rate',           value: `${profileData.statistics.winRate}%` },
              { icon: DollarSign, label: 'Total winnings',     value: formatCurrency(profileData.statistics.totalWinnings) },
              { icon: CreditCard, label: 'Total spent',        value: formatCurrency(profileData.statistics.totalSpent) },
              { icon: Gamepad2,   label: 'Hosted',             value: profileData.statistics.tournamentsHosted },
              { icon: Calendar,   label: 'Member since',       value: formatDate(profileData.user.createdAt) },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-3 sm:p-4 flex flex-col gap-2 sm:gap-3"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mb-0.5 leading-tight">{label}</p>
                  <p className="text-sm sm:text-base font-semibold text-zinc-900 leading-tight break-words">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════
            Transactions tab
        ══════════════════════════════════ */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 sm:p-5">
            <p className="text-sm font-semibold text-zinc-700 mb-4">Transaction history</p>

            {profileData.financials.payments.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-10">No transactions yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-50">
                {profileData.financials.payments.map((payment) => (
                  <li key={payment._id} className="flex items-center justify-between py-3 gap-2 sm:gap-3">

                    {/* Left */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          payment.status === 'completed' ? 'bg-emerald-400'
                          : payment.status === 'pending'  ? 'bg-amber-400'
                          : 'bg-zinc-300'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-zinc-800 capitalize truncate">
                          {payment.type.replace('_', ' ')}
                        </p>
                        <p className="text-[11px] sm:text-xs text-zinc-400">
                          {formatDate(payment.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm font-semibold text-zinc-900">
                        {payment.type === 'winnings' ? '+' : '−'}
                        {formatCurrency(payment.amount)}
                      </p>
                      <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border font-medium ${statusPill(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            Tournaments tab
        ══════════════════════════════════ */}
        {activeTab === 'tournaments' && (
          <div className="space-y-3 sm:space-y-4">

            {/* Participated */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 sm:p-5">
              <p className="text-sm font-semibold text-zinc-700 mb-4">Participated</p>

              {profileData.activity.participatedTournaments.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">No tournaments yet.</p>
              ) : (
                <ul className="divide-y divide-zinc-50">
                  {profileData.activity.participatedTournaments.map((t) => (
                    <li key={t._id} className="py-3 flex items-start justify-between gap-2 sm:gap-3">

                      {/* Title + meta — entry fee on its own line on mobile */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-zinc-800 truncate">{t.title}</p>
                        <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                          {t.gameName} · {formatDate(t.scheduledAt)}
                        </p>
                        <p className="text-[11px] sm:text-xs text-zinc-400">
                          Entry: {formatCurrency(t.entryFee)}
                        </p>
                      </div>

                      {/* Badges — stack vertically on xs, row on sm */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0 sm:flex-row sm:items-center sm:gap-2">
                        {t.winnerId === profileData.user._id && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200 font-medium flex items-center gap-1">
                            <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            Won
                          </span>
                        )}
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border font-medium ${statusPill(t.status)}`}>
                          {t.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Hosted — only for host / admin */}
            {(profileData.user.role === 'host' || profileData.user.role === 'admin') && (
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 sm:p-5">
                <p className="text-sm font-semibold text-zinc-700 mb-4">Hosted</p>

                {profileData.activity.hostedTournaments.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-8">No hosted tournaments yet.</p>
                ) : (
                  <ul className="divide-y divide-zinc-50">
                    {profileData.activity.hostedTournaments.map((t) => (
                      <li key={t._id} className="py-3 flex items-start justify-between gap-2 sm:gap-3">

                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-zinc-800 truncate">{t.title}</p>
                          <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                            {t.gameName} · {formatDate(t.scheduledAt)}
                          </p>
                          <p className="text-[11px] sm:text-xs text-zinc-400">
                            {t.maxPlayers} players · {formatCurrency(t.prizePool)} prize
                          </p>
                        </div>

                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border font-medium flex-shrink-0 mt-0.5 ${statusPill(t.status)}`}>
                          {t.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}