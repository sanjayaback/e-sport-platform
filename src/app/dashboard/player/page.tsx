'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/components/AuthProvider'
import { ITournament } from '@/types'
import {
  Trophy, Wallet, GamepadIcon, CheckCircle, XCircle,
  Crown, ExternalLink, ArrowUpRight, ArrowDownLeft,
  Plus, X, DollarSign, Loader2,
} from 'lucide-react'
import Link from 'next/link'

// ─── FINANCIAL MODAL ──────────────────────────────────────────────────────────

function FinancialModal({
  type,
  onClose,
  onRefresh,
}: {
  type: 'deposit' | 'withdraw'
  onClose: () => void
  onRefresh: () => void
}) {
  const [amount, setAmount]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount')
    setError(''); setLoading(true)
    try {
      await axios.post('/api/payments', { type, amount: Number(amount) })
      onRefresh(); onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Transaction failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="hd-modal-backdrop">
      <div className="card-clean hd-modal-box animate-in">

        {/* Header */}
        <div className="hd-modal-header">
          <h3 className="hd-modal-title" style={{ textTransform: 'capitalize' }}>
            {type}
          </h3>
          <button onClick={onClose} className="hd-modal-close">
            <X size={15} />
          </button>
        </div>

        {/* Error */}
        {error && <div className="hd-error-banner">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="hd-form">
          <div className="hd-field">
            <label className="hd-label">Amount (USD)</label>
            <div className="hd-input-wrap">
              <DollarSign size={14} className="hd-input-icon" />
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                required
                className="input-clean hd-input-padded"
              />
            </div>
          </div>

          <div className="hd-modal-footer" style={{ paddingTop: 16, marginTop: 0, borderTop: 'none' }}>
            <button type="button" onClick={onClose} className="btn-secondary hd-footer-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary hd-footer-submit" style={{ opacity: loading ? 0.6 : 1 }}>
              {loading
                ? <Loader2 size={14} style={{ animation: 'ringSpin 0.8s linear infinite' }} />
                : type === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PlayerDashboard() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()

  const [tournaments, setTournaments] = useState<ITournament[]>([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState<'deposit' | 'withdraw' | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || user.role === 'host' || user.role === 'admin'))
      router.push('/')
  }, [user, authLoading, router])

  const fetchMyTournaments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/tournaments?limit=50')
      const all: ITournament[] = res.data.data.tournaments
      const mine = all.filter(t =>
        t.players.some(p => {
          const pid = (p.playerId as any)?._id || p.playerId
          return String(pid) === user?._id
        })
      )
      setTournaments(mine)
    } catch (e) { }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { if (user) fetchMyTournaments() }, [user, fetchMyTournaments])

  // ── Auth guard ──────────────────────────────────────────────────────────────
  if (authLoading || !user) return (
    <div className="ad-loading-guard">
      <div className="kp-spinner" />
    </div>
  )

  // ── Derived ─────────────────────────────────────────────────────────────────
  const won = tournaments.filter(t => 
    t.status === 'finished' && 
    (String(t.winnerId) === user._id || (t.winnerId as any)?._id === user._id)
  )
  const active = tournaments.filter(t => t.status !== 'finished')
  const totalWinnings = won.reduce((acc, t) => acc + (Number(t.prizePool) || 0), 0)

  const statCards = [
    { label: 'Tournaments', value: tournaments.length,              icon: GamepadIcon },
    { label: 'Active',      value: active.length,                   icon: Trophy      },
    { label: 'Wins',        value: won.length,                      icon: Crown       },
    { label: 'Winnings',    value: `Rs.${totalWinnings.toLocaleString()}`, icon: DollarSign },
  ]

  return (
    <div className="ad-page">
      {modal && (
        <FinancialModal
          type={modal}
          onClose={() => setModal(null)}
          onRefresh={() => { fetchMyTournaments(); refreshUser() }}
        />
      )}

      <div className="kp-wrap ad-inner">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="ad-page-header animate-in-d0">
          <div>
            <div className="ad-page-eyebrow">
              <GamepadIcon size={13} />
              Player Dashboard
            </div>
            <h1 className="ad-page-title">
              Welcome, <em className="kp-headline-em">{user.username}</em>
            </h1>
          </div>
          <Link href="/tournaments" className="btn-primary">
            <Plus size={15} /> Find Tournament
          </Link>
        </div>

        {/* ── Wallet + Stats row ─────────────────────────────────────────── */}
        <div className="animate-in-d1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Wallet card */}
          

          {/* Stat cards grid (2×2) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {statCards.map((s, i) => (
              <div
                key={s.label}
                className={`card-clean ad-stat-card ${loading ? 'stat-hidden' : 'stat-visible'}`}
                style={{ transitionDelay: `${i * 0.07}s` }}
              >
                <div className="ad-stat-icon">
                  <s.icon size={16} />
                </div>
                <div className="ad-stat-value">{s.value}</div>
                <div className="ad-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tournament history table ────────────────────────────────────── */}
        <div className="card-clean ad-table-card animate-in-d2">

          {/* Table header */}
          <div className="ad-table-header">
            <div>
              <div className="ad-table-title">My Tournaments</div>
              <div className="ad-table-sub">{tournaments.length} total</div>
            </div>
            <Link href="/tournaments" className="btn-outline">
              Browse all
            </Link>
          </div>

          <div className="ad-table-scroll">
            <table className="ad-table">
              <thead>
                <tr className="ad-thead-row">
                  {['Tournament', 'Game', 'Status', 'Fee', 'Prize', 'Payment', 'Result', ''].map(h => (
                    <th key={h} className="ad-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>

                {/* Loading */}
                {loading && (
                  <tr>
                    <td colSpan={8} className="ad-td-center">
                      <Loader2 size={20} className="ad-loader" />
                    </td>
                  </tr>
                )}

                {/* Empty */}
                {!loading && tournaments.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '64px 16px' }}>
                      <div className="kp-empty-state">
                        <div className="kp-empty-icon">
                          <GamepadIcon size={22} />
                        </div>
                        <div className="kp-empty-title">No tournaments yet</div>
                        <div className="kp-empty-desc">Join your first tournament to get started</div>
                        <Link href="/tournaments" className="btn-secondary">
                          Browse Tournaments
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Rows */}
                {!loading && tournaments.map(t => {
                  const myEntry = t.players.find(p => {
                    const pid = (p.playerId as any)?._id || p.playerId
                    return String(pid) === user._id
                  })
                  const isWinner = String(t.winnerId) === user._id || (t.winnerId as any)?._id === user._id

                  return (
                    <tr key={t._id} className="ad-tr">

                      {/* Title */}
                      <td className="ad-td">
                        <Link href={`/tournaments/${t._id}`} className="ad-link">
                          {t.title}
                        </Link>
                      </td>

                      {/* Game */}
                      <td className="ad-td ad-td-muted">{t.gameName}</td>

                      {/* Status */}
                      <td className="ad-td">
                        <span className={
                          t.status === 'live'     ? 'badge-live'     :
                          t.status === 'upcoming' ? 'badge-upcoming' : 'badge-finished'
                        }>
                          {t.status === 'live' && <span className="live-dot" />}
                          {t.status}
                        </span>
                      </td>

                      {/* Fee */}
                      <td className="ad-td ad-td-muted">
                        {t.entryFee === 0 ? 'Free' : `Rs.${t.entryFee}`}
                      </td>

                      {/* Prize */}
                      <td className="ad-td ad-td-prize">Rs.{t.prizePool.toLocaleString()}</td>

                      {/* Payment */}
                      <td className="ad-td">
                        {myEntry?.paid ? (
                          <span className="ad-status-pill ad-status-confirmed">
                            <CheckCircle size={10} style={{ display: 'inline', marginRight: 3 }} />
                            Paid
                          </span>
                        ) : (
                          <span className="ad-status-pill ad-status-pending">
                            <XCircle size={10} style={{ display: 'inline', marginRight: 3 }} />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Result */}
                      <td className="ad-td">
                        {t.status === 'finished' ? (
                          isWinner ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#d97706' }}>
                              <Crown size={13} /> Winner
                            </span>
                          ) : (
                            <span className="ad-td-faint">—</span>
                          )
                        ) : (
                          <span className="ad-status-pill ad-status-pending" style={{ background: 'var(--kp-sl)', color: 'var(--kp-ink3)', borderColor: 'var(--kp-border)' }}>
                            In progress
                          </span>
                        )}
                      </td>

                      {/* Link */}
                      <td className="ad-td">
                        <Link href={`/tournaments/${t._id}`} className="ad-icon-btn" title="View tournament">
                          <ExternalLink size={14} />
                        </Link>
                      </td>

                    </tr>
                  )
                })}

              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}