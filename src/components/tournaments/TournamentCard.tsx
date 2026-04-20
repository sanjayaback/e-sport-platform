'use client'
import Link from 'next/link'
import { ITournament } from '@/types'
import { Users, Trophy, Calendar, ArrowRight, Sword, Key, Eye } from 'lucide-react'

interface Props { tournament: ITournament }

export default function TournamentCard({ tournament }: Props) {
  const spotsLeft = tournament.maxPlayers - tournament.players.length
  const fillPct   = Math.round((tournament.players.length / tournament.maxPlayers) * 100)

  return (
    <Link href={`/tournaments/${tournament._id}`} className="kp-game-card group block">

      {/* ── Thumbnail ──────────────────────────────────────────────────────── */}
      <div
        className="kp-game-thumb"
        style={{
          background: tournament.gameName === 'PUBG'
            ? 'linear-gradient(145deg, #E8EAED, #CED3DC)'
            : 'linear-gradient(160deg, #DFE3E8, #CDD2D9)',
          height: 140,
        }}
      >
        <img
          src={
            tournament.gameName === 'PUBG'
              ? 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400'
              : 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=400'
          }
          alt={tournament.title}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
          className="group-hover:scale-105"
        />

        {/* Status badge */}
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <span className={
            tournament.status === 'live'     ? 'badge-live'     :
            tournament.status === 'upcoming' ? 'badge-upcoming' : 'badge-finished'
          }>
            {tournament.status === 'live' && <span className="live-dot" />}
            {tournament.status}
          </span>
        </div>

        {/* Player count pill */}
        <div className="kp-game-pill" style={{ top: 12, right: 12 }}>
          <Users size={10} style={{ display: 'inline', marginRight: 4 }} />
          {tournament.players.length}/{tournament.maxPlayers}
        </div>

        {/* Arena label */}
        <div
          className="pill-tag"
          style={{ position: 'absolute', bottom: 12, left: 12 }}
        >
          Kill Pro Arena
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="kp-game-body" style={{ padding: '16px 18px 18px' }}>

        {/* Game name */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 600, color: 'var(--kp-ink3)',
            marginBottom: 8,
          }}
        >
          <Sword size={12} style={{ color: 'var(--kp-ink2)' }} />
          {tournament.gameName}
        </div>

        {/* Title */}
        <div
          className="kp-game-name"
          style={{
            fontSize: 15, lineHeight: 1.3, marginBottom: 10,
            transition: 'color 0.15s',
          }}
        >
          {tournament.title}
        </div>

        {/* Date */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, color: 'var(--kp-ink3)',
            paddingBottom: 12, borderBottom: '1px solid var(--kp-silver)',
            marginBottom: 12,
          }}
        >
          <Calendar size={11} />
          {new Date(tournament.scheduledAt).toLocaleDateString()}
        </div>

        {/* Room Details Indicator */}
        {tournament.roomId && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: '#10b981',
              marginBottom: 12,
              padding: '6px 10px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 6,
            }}
          >
            <Key size={12} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>Room Details Available</span>
            <Eye size={11} style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        )}

        {/* Prize + Fee */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--kp-ink3)', marginBottom: 4,
              }}
            >
              <Trophy size={10} /> Prize
            </div>
            <div
              style={{
                fontFamily: 'var(--kp-fd)', fontWeight: 800,
                fontSize: 17, color: 'var(--kp-ink)', letterSpacing: '-0.02em',
              }}
            >
              Rs.{tournament.prizePool.toLocaleString()}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--kp-ink3)', marginBottom: 4,
              }}
            >
              Entry
            </div>
            <div
              style={{
                fontFamily: 'var(--kp-fd)', fontWeight: 800,
                fontSize: 17, color: 'var(--kp-ink)', letterSpacing: '-0.02em',
              }}
            >
              {tournament.entryFee === 0 ? 'FREE' : `Rs.${tournament.entryFee}`}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="kp-bar-track" style={{ marginBottom: 10 }}>
          <div
            className="kp-bar"
            style={{
              width: `${fillPct}%`,
              background: tournament.status === 'live' ? '#10b981' : 'var(--kp-ink)',
            }}
          />
        </div>

        {/* Footer */}
        <div className="kp-game-footer">
          <span className="kp-game-players">
            {spotsLeft <= 0
              ? <span style={{ color: '#dc2626', fontWeight: 700 }}>Full</span>
              : `${spotsLeft} spots left`
            }
          </span>
          <span
            className="kp-game-join"
            style={{ gap: 4, transition: 'gap 0.2s ease' }}
          >
            View <ArrowRight size={13} />
          </span>
        </div>

      </div>
    </Link>
  )
}