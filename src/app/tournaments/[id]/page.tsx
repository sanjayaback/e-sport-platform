'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/components/AuthProvider'
import { ITournament } from '@/types'
import {
  Trophy, Users, Calendar, Zap, QrCode, Image as ImageIcon,
  CheckCircle, XCircle, Crown, Loader2, ArrowLeft, Info, Upload,
  Copy, Eye, EyeOff, Gamepad2,
} from 'lucide-react'
import Link from 'next/link'

// ─── IMAGE RESIZE UTIL ────────────────────────────────────────────────────────

async function resizeImage(base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = base64Str
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width, height = img.height
      if (width > height) { if (width > maxWidth)  { height *= maxWidth  / width;  width  = maxWidth  } }
      else                { if (height > maxHeight) { width  *= maxHeight / height; height = maxHeight } }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
  })
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [tournament,        setTournament]        = useState<ITournament | null>(null)
  const [loading,           setLoading]           = useState(true)
  const [joining,           setJoining]           = useState(false)
  const [transmitting,      setTransmitting]      = useState(false)
  const [gameID,            setGameID]            = useState('')
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const [screenshotBase64,  setScreenshotBase64]  = useState('')
  const [submitMsg,         setSubmitMsg]         = useState('')
  const [error,             setError]             = useState('')
  const [showPassword,      setShowPassword]      = useState(false)
  const [copySuccess,       setCopySuccess]       = useState(false)
  const [showRoomPopup,     setShowRoomPopup]     = useState(false)

  const fetchTournament = useCallback(async () => {
    try {
      const res = await axios.get(`/api/tournaments/${id}`)
      setTournament(res.data.data.tournament)
    } catch { setError('Tournament not found') }
    finally  { setLoading(false) }
  }, [id])

  useEffect(() => { fetchTournament() }, [fetchTournament])

  const isPlayer  = user?.role === 'player'
  const isHost    = user?.role === 'host' || user?.role === 'admin'
  const hasJoined = tournament?.players.some(p =>
    (p.playerId as any) === user?._id || (p.playerId as any)?._id === user?._id
  )
  const myEntry = tournament?.players.find(p =>
    (p.playerId as any) === user?._id || (p.playerId as any)?._id === user?._id
  )

  // Poll for payment approval updates if user has joined but payment not approved
  useEffect(() => {
    if (!isPlayer || !hasJoined || myEntry?.paymentApproved) return

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/tournaments/${id}`)
        const updatedTournament = res.data.data.tournament
        const updatedMyEntry = updatedTournament.players.find((p: any) =>
          (p.playerId as any) === user?._id || (p.playerId as any)?._id === user?._id
        )
        
        // If payment is now approved, update tournament and stop polling
        if (updatedMyEntry?.paymentApproved && !myEntry?.paymentApproved) {
          setTournament(updatedTournament)
          setSubmitMsg('Payment approved! Room details are now available.')
          clearInterval(interval)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 10000) // Check every 10 seconds instead of 5

    return () => clearInterval(interval)
  }, [isPlayer, hasJoined, myEntry?.paymentApproved, user?._id, id, fetchTournament])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setTransmitting(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const optimized = await resizeImage(reader.result as string)
        setScreenshotBase64(optimized); setScreenshotPreview(optimized)
      } catch { setError('Image processing failed') }
      finally  { setTransmitting(false) }
    }
    reader.readAsDataURL(file)
  }

  async function handleJoin() {
    if (!gameID.trim()) { setError('Please enter your Game ID'); return }
    if (tournament && tournament.entryFee > 0 && !screenshotBase64) { setError('Please upload payment screenshot'); return }
    setJoining(true); setError('')
    try {
      let paymentData: any = { gameID }
      
      // If there's a payment screenshot, upload it to Cloudinary first
      if (tournament && tournament.entryFee > 0 && screenshotBase64) {
        const response = await fetch(screenshotBase64)
        const blob = await response.blob()
        const file = new File([blob], 'payment.jpg', { type: 'image/jpeg' })
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('tournamentId', id as string)
        formData.append('userId', user!._id)
        
        const uploadResponse = await axios.post('/api/upload/tournament-screenshot', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        if (!uploadResponse.data.success) {
          throw new Error('Failed to upload payment screenshot to Cloudinary')
        }
        
        paymentData.paymentScreenshot = uploadResponse.data.data.secure_url
      }
      
      await axios.post(`/api/tournaments/join/${id}`, paymentData)
      await fetchTournament()
      setSubmitMsg('Successfully joined! Your payment is pending approval.')
      setScreenshotBase64('')
      setScreenshotPreview('')
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.error || 'Failed to join')
    } finally { setJoining(false) }
  }

  async function handleScreenshot() {
    if (!screenshotBase64) { setError('Please upload a screenshot'); return }
    setError(''); setTransmitting(true)
    try {
      // Convert base64 to file for Cloudinary upload
      const response = await fetch(screenshotBase64)
      const blob = await response.blob()
      const file = new File([blob], 'screenshot.jpg', { type: 'image/jpeg' })
      
      // Upload to Cloudinary first
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tournamentId', id as string)
      formData.append('userId', user!._id)
      
      const uploadResponse = await axios.post('/api/upload/tournament-screenshot', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (!uploadResponse.data.success) {
        throw new Error('Failed to upload to Cloudinary')
      }
      
      // Submit Cloudinary URL to tournament API
      const cloudinaryUrl = uploadResponse.data.data.secure_url
      await axios.post(`/api/tournaments/screenshot/${id}`, { screenshotURL: cloudinaryUrl })
      
      setSubmitMsg('Screenshot submitted! Awaiting host review.')
      await fetchTournament()
      setScreenshotBase64('')
      setScreenshotPreview('')
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.error || 'Failed to submit screenshot')
    } finally { setTransmitting(false) }
  }

  async function handleCopyPassword() {
    if (tournament?.roomPassword) {
      try {
        await navigator.clipboard.writeText(tournament.roomPassword)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (err) {
        console.error('Failed to copy password:', err)
      }
    }
  }

  function maskPassword(password: string) {
    return '*'.repeat(password.length)
  }

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="ad-loading-guard">
      <div className="kp-spinner" />
    </div>
  )

  if (!tournament) return (
    <div className="ad-loading-guard">
      <div className="card-clean animate-in" style={{ padding: '48px 40px', textAlign: 'center', maxWidth: 400 }}>
        <XCircle size={48} style={{ color: '#fca5a5', margin: '0 auto 16px' }} />
        <div className="kp-empty-title">{error || 'Tournament not found'}</div>
        <Link href="/tournaments" className="btn-secondary" style={{ marginTop: 20, display: 'inline-flex' }}>
          <ArrowLeft size={14} /> Back to Tournaments
        </Link>
      </div>
    </div>
  )

  // ── Derived ─────────────────────────────────────────────────────────────────

  const host      = tournament.hostId  as unknown as { username: string; _id: string }
  const winner    = tournament.winnerId as unknown as { username: string; _id: string } | undefined
  const spotsLeft = tournament.maxPlayers - tournament.players.length

  const infoStats = [
    { icon: Users,    label: 'Players',   val: `${tournament.players.length}/${tournament.maxPlayers}` },
    { icon: Zap,      label: 'Entry Fee', val: tournament.entryFee === 0 ? 'FREE' : `Rs.${tournament.entryFee}` },
    { icon: Calendar, label: 'Scheduled', val: new Date(tournament.scheduledAt).toLocaleDateString() },
    { icon: Trophy,   label: 'Spots Left',val: spotsLeft === 0 ? 'Full' : String(spotsLeft) },
  ]

  return (
    <div className="kp-page" style={{ minHeight: '100vh', paddingTop: 108, paddingBottom: 80 }}>
      <div className="kp-wrap">

        {/* ── Back link ────────────────────────────────────────────────────── */}
        <Link
          href="/tournaments"
          className="btn-outline animate-in-d0"
          style={{ marginBottom: 28, display: 'inline-flex' }}
        >
          <ArrowLeft size={13} /> Back to Tournaments
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* ════════════════════════ MAIN ════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── Title card ─────────────────────────────────────────────── */}
            <div className="card-clean animate-in-d0" style={{ padding: '32px 28px' }}>

              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 28 }}>
                <div>
                  {/* Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span className={
                      tournament.status === 'live'     ? 'badge-live'     :
                      tournament.status === 'upcoming' ? 'badge-upcoming' : 'badge-finished'
                    }>
                      {tournament.status === 'live' && <span className="live-dot" />}
                      {tournament.status}
                    </span>
                    <span className="pill-tag">{tournament.gameName}</span>
                  </div>

                  <h1 className="kp-section-title" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 10 }}>
                    {tournament.title}
                  </h1>
                  <p style={{ fontSize: 13, color: 'var(--kp-ink3)' }}>
                    Hosted by{' '}
                    <span style={{ color: 'var(--kp-ink2)', fontWeight: 600 }}>
                      {host?.username || 'System'}
                    </span>
                  </p>
                </div>

                {/* Prize */}
                <div style={{ textAlign: 'right' }}>
                  <div className="kp-qs-label" style={{ marginBottom: 4 }}>Prize Pool</div>
                  <div className="kp-qs-value" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)' }}>
                    Rs.{tournament.prizePool.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Description */}
              {tournament.description && (
                <div
                  style={{
                    display: 'flex', gap: 12, padding: '14px 16px', marginBottom: 24,
                    background: 'var(--kp-sl)', border: '1px solid var(--kp-border)',
                    borderRadius: 10,
                  }}
                >
                  <Info size={15} style={{ color: 'var(--kp-ink3)', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 13, color: 'var(--kp-ink2)', lineHeight: 1.7, margin: 0 }}>
                    {tournament.description}
                  </p>
                </div>
              )}

              {/* Info stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {infoStats.map(s => (
                  <div key={s.label} className="card-surface" style={{ padding: '16px 12px', textAlign: 'center' }}>
                    <div className="kp-feat-icon-wrap" style={{ margin: '0 auto 10px', width: 36, height: 36, borderRadius: 8 }}>
                      <s.icon size={15} />
                    </div>
                    <div style={{ fontFamily: 'var(--kp-fd)', fontWeight: 700, fontSize: 16, color: 'var(--kp-ink)', marginBottom: 4 }}>
                      {s.val}
                    </div>
                    <div className="kp-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Winner banner ──────────────────────────────────────────── */}
            {tournament.status === 'finished' && winner && (
              <div
                className="card-clean animate-in-d1"
                style={{ padding: '28px 28px', background: '#fffbeb', borderColor: '#fde68a' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Crown size={26} style={{ color: '#d97706' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#d97706', marginBottom: 6 }}>
                      Tournament Winner
                    </div>
                    <div style={{ fontFamily: 'var(--kp-fd)', fontWeight: 800, fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: '#92400e', letterSpacing: '-0.02em' }}>
                      {winner.username}
                    </div>
                    <div style={{ fontSize: 13, color: '#b45309', marginTop: 4 }}>
                      Won Rs.{tournament.prizePool.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Players list ───────────────────────────────────────────── */}
            <div className="card-clean ad-table-card animate-in-d2">
              <div className="ad-table-header">
                <div>
                  <div className="ad-table-title">Players</div>
                  <div className="ad-table-sub">{tournament.players.length} joined</div>
                </div>
              </div>

              {tournament.players.length === 0 ? (
                <div className="kp-empty-state" style={{ padding: '48px 24px' }}>
                  <div className="kp-empty-icon"><Users size={20} /></div>
                  <div className="kp-empty-title">No players yet</div>
                  <div className="kp-empty-desc">Be the first to join this tournament</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 16 }}>
                  {tournament.players.map((p, i) => {
                    const pl       = p.playerId as any
                    const username = pl?.username || 'Player'
                    const isWinner = (tournament.winnerId as any) === pl?._id || (tournament.winnerId as any)?._id === pl?._id
                    return (
                      <div key={i} className="card-surface hd-player-row" style={{ borderRadius: 10 }}>
                        {/* Number */}
                        <div className="hd-player-num">{i + 1}</div>

                        {/* Info */}
                        <div className="hd-player-info">
                          <div className="hd-player-name">{username}</div>
                          <div className="hd-player-id">ID: {p.gameID}</div>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {p.paymentScreenshot && (
                            <span className="ad-status-pill" style={{ padding: '2px 7px', background: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.2)', color: '#ea580c' }}>
                              $ Pending
                            </span>
                          )}
                          {p.paymentApproved && (
                            <span className="ad-status-pill ad-status-confirmed" style={{ padding: '2px 7px' }}>
                              <CheckCircle size={10} style={{ display: 'inline', marginRight: 3 }} />
                              Paid
                            </span>
                          )}
                          {p.screenshotURL && (
                            <span className="ad-status-pill ad-status-confirmed" style={{ padding: '2px 7px' }}>
                              <ImageIcon size={10} style={{ display: 'inline', marginRight: 3 }} />
                              SS
                            </span>
                          )}
                          {isWinner && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '2px 7px' }}>
                              <Crown size={10} /> W
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ════════════════════════ SIDEBAR ════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── QR Code ────────────────────────────────────────────────── */}
            {tournament.hostQRCodeURL && (
              <div className="card-clean animate-in-d1" style={{ padding: 20, textAlign: 'center' }}>
                <div className="ad-chart-header" style={{ justifyContent: 'center', marginBottom: 16 }}>
                  <QrCode size={14} />
                  <span>Payment QR Code</span>
                </div>
                <div style={{ background: 'var(--kp-sl)', border: '1px solid var(--kp-border)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                  <img
                    src={tournament.hostQRCodeURL}
                    alt="Payment QR"
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                  />
                </div>
                <p style={{ fontSize: 12, color: 'var(--kp-ink3)', lineHeight: 1.6 }}>
                  Scan to pay the entry fee, then wait for host confirmation.
                </p>
              </div>
            )}

            {/* ── Action panel (logged in) ────────────────────────────────── */}
            {user && (
              <div className="card-clean animate-in-d2" style={{ padding: 20 }}>

                {/* Error */}
                {error && <div className="hd-error-banner" style={{ marginBottom: 16 }}>{error}</div>}

                {/* Success */}
                {submitMsg && (
                  <div className="hd-msg-success" style={{ marginBottom: 16 }}>
                    {submitMsg}
                  </div>
                )}

                {/* ── Join flow ─────────────────────────────────────────── */}
                {isPlayer && !hasJoined && tournament.status === 'upcoming' && spotsLeft > 0 && (
                  <div className="hd-form">
                    <div style={{ fontFamily: 'var(--kp-fd)', fontWeight: 700, fontSize: 16, color: 'var(--kp-ink)', marginBottom: 4 }}>
                      Join Tournament
                    </div>
                    <div className="hd-field">
                      <label className="hd-label">Your Game ID</label>
                      <input
                        type="text"
                        value={gameID}
                        onChange={e => setGameID(e.target.value)}
                        placeholder="e.g. PlayerName#1234"
                        className="input-clean"
                      />
                    </div>
                    
                    {/* Payment screenshot upload */}
                    {tournament.entryFee > 0 && (
                      <div className="hd-field">
                        <label className="hd-label">Payment Screenshot *</label>
                        <div className="hd-upload-wrap">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hd-upload-input"
                          />
                          <div className={`hd-upload-zone${screenshotPreview ? ' hd-upload-zone-filled' : ''}`}>
                            {transmitting ? (
                              <Loader2 size={28} style={{ color: 'var(--kp-ink2)', animation: 'ringSpin 0.8s linear infinite' }} />
                            ) : screenshotPreview ? (
                              <div style={{ textAlign: 'center' }}>
                                <CheckCircle size={24} style={{ color: '#10b981', marginBottom: 8 }} />
                                <p className="hd-upload-text" style={{ color: '#10b981' }}>Screenshot uploaded</p>
                              </div>
                            ) : (
                              <div className="hd-upload-placeholder">
                                <Upload size={24} className="hd-upload-icon" />
                                <p className="hd-upload-text">Upload payment screenshot</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {screenshotPreview && (
                          <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--kp-border)' }}>
                            <img src={screenshotPreview} alt="Payment screenshot" style={{ width: '100%', display: 'block' }} />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={handleJoin}
                      disabled={joining || (tournament.entryFee > 0 && !screenshotBase64)}
                      className="btn-primary hd-submit-btn"
                      style={{ opacity: (joining || (tournament.entryFee > 0 && !screenshotBase64)) ? 0.6 : 1 }}
                    >
                      {joining
                        ? <Loader2 size={14} style={{ animation: 'ringSpin 0.8s linear infinite' }} />
                        : `Join — ${tournament.entryFee === 0 ? 'Free' : `Rs.${tournament.entryFee}`}`
                      }
                    </button>
                    {tournament.entryFee > 0 && !screenshotBase64 && (
                      <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8, textAlign: 'center' }}>
                        Payment screenshot is required to join
                      </p>
                    )}
                  </div>
                )}

                  {/* Room details button - only show when payment is approved */}
                {isPlayer && hasJoined && myEntry?.paymentApproved && (
                  <button
                    onClick={() => setShowRoomPopup(true)}
                    className="btn-primary hd-submit-btn"
                    style={{ 
                      justifyContent: 'center',
                      background: '#000',
                      color: '#fff',
                      border: '1px solid #000',
                      marginBottom: 14
                    }}
                  >
                    <Gamepad2 size={14} style={{ marginRight: 6 }} />
                    View Room Details
                  </button>
                )}

                {/* ── Screenshot upload ─────────────────────────────────── */}
                {isPlayer && hasJoined && (tournament.status === 'live' || tournament.status === 'finished') && (
                  <div className="hd-form">
                    <div style={{ fontFamily: 'var(--kp-fd)', fontWeight: 700, fontSize: 16, color: 'var(--kp-ink)', marginBottom: 4 }}>
                      Submit Screenshot
                    </div>

                    {(myEntry?.screenshotURL || screenshotPreview) ? (
                      <div style={{ textAlign: 'center' }}>
                        <CheckCircle size={36} style={{ color: '#10b981', margin: '0 auto 10px' }} />
                        <div className="hd-msg-success" style={{ marginBottom: 12 }}>Screenshot uploaded</div>
                        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--kp-border)', marginBottom: 12 }}>
                          <img src={myEntry?.screenshotURL || screenshotPreview} alt="Screenshot" style={{ width: '100%', display: 'block' }} />
                        </div>
                        {!myEntry?.screenshotURL && (
                          <button
                            onClick={handleScreenshot}
                            disabled={transmitting}
                            className="btn-primary hd-submit-btn"
                            style={{ opacity: transmitting ? 0.6 : 1 }}
                          >
                            {transmitting
                              ? <Loader2 size={14} style={{ animation: 'ringSpin 0.8s linear infinite' }} />
                              : 'Confirm Submit'
                            }
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="hd-upload-wrap">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hd-upload-input"
                        />
                        <div className={`hd-upload-zone${screenshotPreview ? ' hd-upload-zone-filled' : ''}`}>
                          {transmitting ? (
                            <Loader2 size={28} style={{ color: 'var(--kp-ink2)', animation: 'ringSpin 0.8s linear infinite' }} />
                          ) : (
                            <div className="hd-upload-placeholder">
                              <Upload size={24} className="hd-upload-icon" />
                              <p className="hd-upload-text">Click to upload screenshot</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                
                )}

              


                {/* ── Host manage link ──────────────────────────────────── */}
                {isHost && host?._id === user?._id && (
                  <Link href={`/tournaments/${id}/manage`} className="btn-primary hd-submit-btn" style={{ justifyContent: 'center' }}>
                    Manage Tournament
                  </Link>
                )}

              </div>
            )}

            {/* ── Guest CTA ──────────────────────────────────────────────── */}
            {!user && (
              <div className="card-clean animate-in-d2" style={{ padding: '28px 20px', textAlign: 'center' }}>
                <div className="kp-empty-icon" style={{ margin: '0 auto 14px' }}>
                  <Trophy size={20} />
                </div>
                <div className="kp-empty-title" style={{ marginBottom: 6 }}>Want to Join?</div>
                <div className="kp-empty-desc" style={{ marginBottom: 20 }}>
                  Create an account to participate in tournaments.
                </div>
                <Link href="/auth/register" className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
                  Sign Up Free
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Game Room Access Popup ────────────────────────────────────────── */}
      {showRoomPopup && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20
          }}
          onClick={() => setShowRoomPopup(false)}
        >
          <div 
            className="card-clean"
            style={{
              background: 'white',
              border: '2px solid #000',
              borderRadius: 12,
              padding: 32,
              maxWidth: 400,
              width: '100%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowRoomPopup(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <XCircle size={20} style={{ color: '#000' }} />
            </button>

            {/* Header */}
            <div style={{ 
              fontSize: 20, 
              fontWeight: 700, 
              color: '#000', 
              marginBottom: 24, 
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <Gamepad2 size={24} />
              Game Room Access
            </div>
            
            <div style={{ textAlign: 'left' }}>
              {/* Room ID */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600,
                  color: '#000', 
                  marginBottom: 8
                }}>
                  Room ID
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  padding: '12px',
                  background: '#f5f5f5',
                  border: '1px solid #000',
                  fontFamily: 'monospace',
                  fontSize: 16,
                  color: '#000',
                  borderRadius: 8
                }}>
                  <span style={{ flex: 1 }}>{tournament.roomId}</span>
                  <button
                    onClick={() => tournament.roomId && navigator.clipboard.writeText(tournament.roomId)}
                    style={{
                      padding: '6px 10px',
                      background: '#000',
                      color: '#fff',
                      border: '1px solid #000',
                      fontSize: 12,
                      cursor: 'pointer',
                      borderRadius: 6
                    }}
                    title="Copy Room ID"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              
              {/* Room Password */}
              {(tournament.roomPassword || true) && (
                <div>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600,
                    color: '#000', 
                    marginBottom: 8
                  }}>
                    Room Password
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    padding: '12px',
                    background: '#f5f5f5',
                    border: '1px solid #000',
                    fontFamily: 'monospace',
                    fontSize: 16,
                    color: '#000',
                    borderRadius: 8
                  }}>
                    <span style={{ flex: 1 }}>
                      {showPassword ? (tournament.roomPassword || '') : maskPassword(tournament.roomPassword || '')}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        padding: '6px 10px',
                        background: '#000',
                        color: '#fff',
                        border: '1px solid #000',
                        fontSize: 12,
                        cursor: 'pointer',
                        borderRadius: 6
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={handleCopyPassword}
                      style={{
                        padding: '6px 10px',
                        background: copySuccess ? '#333' : '#000',
                        color: '#fff',
                        border: '1px solid #000',
                        fontSize: 12,
                        cursor: 'pointer',
                        borderRadius: 6
                      }}
                      title="Copy password"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              background: '#f9f9f9', 
              border: '1px solid #ddd',
              borderRadius: 8,
              fontSize: 12,
              color: '#666',
              lineHeight: 1.6
            }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#000' }}>How to join:</div>
              <div>1. Copy the Room ID and Password above</div>
              <div>2. Open your game and find the tournament/room section</div>
              <div>3. Enter the Room ID and Password to join</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}