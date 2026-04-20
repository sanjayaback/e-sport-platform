'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import TournamentCard from '@/components/tournaments/TournamentCard'
import { ITournament } from '@/types'
import { Search, Trophy, Sparkles } from 'lucide-react'

const GAMES    = ['all', 'PUBG', 'Free Fire', 'Other']
const STATUSES = ['all', 'upcoming', 'live', 'finished']

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<ITournament[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [pages,   setPages]   = useState(1)
  const [loading, setLoading] = useState(true)
  const [game,    setGame]    = useState('all')
  const [status,  setStatus]  = useState('all')
  const [search,  setSearch]  = useState('')

  const fetchTournaments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' })
      if (game   !== 'all') params.set('game',   game)
      if (status !== 'all') params.set('status', status)
      const res = await axios.get(`/api/tournaments?${params}`)
      const { data } = res.data
      let list: ITournament[] = data.tournaments
      if (search.trim()) {
        const q = search.toLowerCase()
        list = list.filter(t =>
          t.title.toLowerCase().includes(q) ||
          t.gameName.toLowerCase().includes(q)
        )
      }
      setTournaments(list)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) { } finally {
      setLoading(false)
    }
  }, [game, status, page, search])

  useEffect(() => { fetchTournaments() }, [fetchTournaments])

  return (
    <div className="kp-page" style={{ minHeight: '100vh', paddingTop: 108, paddingBottom: 80 }}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="kp-wrap animate-in-d0" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="kp-section-header" style={{ marginBottom: 32 }}>

          {/* Left — title block */}
          <div>
            <div className="ad-page-eyebrow" style={{ marginBottom: 10 }}>
              <Trophy size={13} />
              All Tournaments
            </div>
            <h1 className="ad-page-title" style={{ marginBottom: 8 }}>Tournaments</h1>
            <p className="kp-section-desc">
              Find your next tournament and compete against players worldwide.
            </p>
          </div>

          {/* Right — quick stats */}
          <div className="card-clean kp-quick-stats" style={{ padding: '16px 24px', gap: 0, borderRadius: 14 }}>
            <div className="kp-qs-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="kp-qs-value">{total}</div>
              <div className="kp-qs-label">Total</div>
            </div>
            <div className="kp-qs-divider" />
            <div className="kp-qs-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span className="live-dot" style={{ background: '#10b981' }} />
                <span className="kp-qs-value">8.4K+</span>
              </div>
              <div className="kp-qs-label">Players</div>
            </div>
          </div>

        </div>

        {/* ── Filters row ──────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Search */}
          <div className="hd-input-wrap">
            <Search size={14} className="hd-input-icon" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search tournaments…"
              className="input-clean"
              style={{ paddingLeft: 40 }}
            />
          </div>

          {/* Game filter */}
          <div className="ad-tabs">
            {GAMES.map(g => (
              <button
                key={g}
                onClick={() => { setGame(g); setPage(1) }}
                className={`ad-tab${game === g ? ' ad-tab-active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="ad-tabs">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1) }}
                className={`ad-tab${status === s ? ' ad-tab-active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {s}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="kp-wrap" style={{ paddingBottom: 40 }}>

        {/* Loading */}
        {loading && (
          <div className="kp-loading-state">
            <div className="kp-spinner" />
            <p className="kp-loading-text">Loading tournaments…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && tournaments.length === 0 && (
          <div className="kp-empty-state" style={{ border: '2px dashed var(--kp-border)', borderRadius: 14, padding: '72px 24px' }}>
            <div className="kp-empty-icon">
              <Sparkles size={22} />
            </div>
            <div className="kp-empty-title">No tournaments found</div>
            <div className="kp-empty-desc">Try adjusting your filters</div>
            <button
              onClick={() => { setGame('all'); setStatus('all'); setSearch('') }}
              className="btn-secondary"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && tournaments.length > 0 && (
          <>
            <div className="kp-tourn-grid animate-in" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {tournaments.map(t => (
                <TournamentCard key={t._id} tournament={t} />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 48 }}>

                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-outline"
                  style={{ opacity: page === 1 ? 0.35 : 1 }}
                >
                  Previous
                </button>

                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: Math.min(pages, 5) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={page === i + 1 ? 'btn-primary' : 'btn-outline'}
                      style={{
                        width: 36, height: 36,
                        padding: 0,
                        justifyContent: 'center',
                        fontFamily: 'var(--kp-fd)',
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="btn-outline"
                  style={{ opacity: page === pages ? 0.35 : 1 }}
                >
                  Next
                </button>

              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}