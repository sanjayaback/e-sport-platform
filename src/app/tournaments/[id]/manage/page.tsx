'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/components/AuthProvider'
import { ITournament } from '@/types'
import {
  Trophy, Users, Calendar, Zap, QrCode, Image as ImageIcon,
  CheckCircle, XCircle, Crown, Loader2, ArrowLeft, Eye, EyeOff,
  Gamepad2, DollarSign, Play, Upload, X, ChevronDown, Edit2
} from 'lucide-react'
import Link from 'next/link'

// Main Manage Tournament Page
export default function ManageTournamentPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const [tournament, setTournament] = useState<ITournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [winnerId, setWinnerId] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')
  const [imageTitle, setImageTitle] = useState('')

  const fetchTournament = useCallback(async () => {
    try {
      const res = await axios.get(`/api/tournaments/${id}`)
      const tournamentData = res.data.data.tournament
      
      // Check if user is authorized to manage this tournament
      const host = tournamentData.hostId as any
      if (user?.role !== 'admin' && host?._id !== user?._id && tournamentData.hostId !== user?._id) {
        router.push('/tournaments')
        return
      }
      
      setTournament(tournamentData)
    } catch (err) {
      setError('Tournament not found or access denied')
    } finally {
      setLoading(false)
    }
  }, [id, user, router])

  useEffect(() => {
    if (user) fetchTournament()
  }, [user, fetchTournament])

  async function updateStatus(status: string) {
    setUpdatingStatus(true)
    setError('')
    try {
      await axios.patch(`/api/tournaments/${id}`, { status })
      setMessage(`Tournament status updated to ${status}`)
      await fetchTournament()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function selectWinner() {
    if (!winnerId) {
      setError('Please select a winner')
      return
    }
    setError('')
    try {
      await axios.patch(`/api/tournaments/${id}`, { winnerId })
      setMessage('Winner selected successfully!')
      setWinnerId('')
      await fetchTournament()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to select winner')
    }
  }

  async function approvePlayer(playerId: string, approved: boolean) {
    setError('')
    try {
      await axios.patch(`/api/tournaments/approve/${id}`, { playerId, approved })
      setMessage(`Payment ${approved ? 'approved' : 'rejected'} successfully`)
      await fetchTournament()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update payment status')
    }
  }

  function viewImage(imageUrl: string | undefined, title: string) {
    if (!imageUrl) return
    setSelectedImage(imageUrl)
    setImageTitle(title)
    setShowImageModal(true)
  }

  if (loading) {
    return (
      <div className="ad-loading-guard">
        <div className="kp-spinner" />
      </div>
    )
  }

  if (!tournament) {
    return (
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
  }

  const host = tournament.hostId as unknown as { username: string; _id: string }
  const spotsLeft = tournament.maxPlayers - tournament.players.length

  return (
    <div className="kp-page" style={{ minHeight: '100vh', paddingTop: 108, paddingBottom: 80 }}>
      <div className="kp-wrap">

        {/* Header */}
        <div className="ad-page-header animate-in-d0">
          <div>
            <div className="ad-page-eyebrow">Manage Tournament</div>
            <h1 className="ad-page-title">
              {tournament.title}
              <em className="kp-headline-em">Management</em>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--kp-ink3)', marginTop: 4 }}>
              Hosted by {host?.username || 'System'} · {tournament.gameName}
            </p>
          </div>
          <Link href={`/tournaments/${id}`} className="btn-secondary">
            <Eye size={14} /> View Tournament
          </Link>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="hd-error-banner animate-in" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}
        {message && (
          <div className="hd-msg-success animate-in" style={{ marginBottom: 20 }}>
            {message}
          </div>
        )}

        {/* Tournament Info Cards */}
        <div className="ad-stat-grid animate-in-d1" style={{ marginBottom: 20 }}>
          <div className="card-clean ad-stat-card">
            <div className="ad-stat-icon"><Users size={16} /></div>
            <div className="ad-stat-value">{tournament.players.length}/{tournament.maxPlayers}</div>
            <div className="ad-stat-label">Players</div>
          </div>
          <div className="card-clean ad-stat-card">
            <div className="ad-stat-icon"><Trophy size={16} /></div>
            <div className="ad-stat-value">${tournament.prizePool.toLocaleString()}</div>
            <div className="ad-stat-label">Prize Pool</div>
          </div>
          <div className="card-clean ad-stat-card">
            <div className="ad-stat-icon"><DollarSign size={16} /></div>
            <div className="ad-stat-value">${tournament.entryFee}</div>
            <div className="ad-stat-label">Entry Fee</div>
          </div>
          <div className="card-clean ad-stat-card">
            <div className="ad-stat-icon"><Calendar size={16} /></div>
            <div className="ad-stat-value">{new Date(tournament.scheduledAt).toLocaleDateString()}</div>
            <div className="ad-stat-label">Scheduled</div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="card-clean animate-in-d2" style={{ padding: '24px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit2 size={18} /> Tournament Controls
          </h2>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {tournament.status === 'upcoming' && (
              <button 
                onClick={() => updateStatus('live')} 
                disabled={updatingStatus}
                className="btn-primary"
                style={{ opacity: updatingStatus ? 0.6 : 1 }}
              >
                {updatingStatus ? <Loader2 size={14} style={{ animation: 'ringSpin 0.8s linear infinite' }} /> : <Play size={14} style={{ marginRight: 6 }} />}
                Start Tournament
              </button>
            )}
            
            {tournament.status === 'live' && !tournament.winnerId && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select 
                  value={winnerId} 
                  onChange={e => setWinnerId(e.target.value)} 
                  className="input-clean"
                  style={{ minWidth: 150 }}
                >
                  <option value="">Select Winner</option>
                  {tournament.players.map(p => {
                    const pu = p.playerId as any
                    return (
                      <option key={pu?._id || String(p.playerId)} value={pu?._id || String(p.playerId)}>
                        {pu?.username || p.gameID}
                      </option>
                    )
                  })}
                </select>
                <button 
                  onClick={selectWinner}
                  className="btn-primary"
                  style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                >
                  <Crown size={14} style={{ marginRight: 6 }} />
                  Set Winner
                </button>
              </div>
            )}
            
            {tournament.status === 'finished' && (
              <div style={{ padding: '8px 16px', background: '#f3f4f6', borderRadius: 8, fontSize: 13, color: '#6b7280' }}>
                <Crown size={14} style={{ display: 'inline', marginRight: 6 }} />
                Tournament Finished
              </div>
            )}
          </div>
        </div>

        {/* Players Management */}
        <div className="card-clean animate-in-d3">
          <div className="ad-table-header">
            <div>
              <div className="ad-table-title">Players Management</div>
              <div className="ad-table-sub">{tournament.players.length} players joined</div>
            </div>
          </div>

          {tournament.players.length === 0 ? (
              <div className="kp-empty-state" style={{ padding: '48px 24px' }}>
                <div className="kp-empty-icon"><Users size={20} /></div>
                <div className="kp-empty-title">No players yet</div>
                <div className="kp-empty-desc">Players haven&apos;t joined this tournament yet</div>
              </div>
          ) : (
            <div style={{ padding: 16 }}>
              {tournament.players.map((player, index) => {
                const playerUser = player.playerId as any
                const playerId = playerUser?._id || String(player.playerId)
                const isExpanded = expandedPlayer === playerId
                const isWinner = tournament.winnerId === playerId

                return (
                  <div key={playerId} className="card-surface" style={{ marginBottom: 12, borderRadius: 10 }}>
                    {/* Player Header */}
                    <div 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                        cursor: 'pointer', transition: 'background 0.2s'
                      }}
                      onClick={() => setExpandedPlayer(isExpanded ? null : playerId)}
                    >
                      {/* Player Number */}
                      <div style={{ 
                        width: 32, height: 32, borderRadius: 8, background: 'var(--kp-sl)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14, color: 'var(--kp-ink2)'
                      }}>
                        {index + 1}
                      </div>

                      {/* Player Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--kp-ink)', marginBottom: 2 }}>
                          {playerUser?.username || 'Player'}
                          {isWinner && (
                            <span style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 8,
                              fontSize: 11, fontWeight: 700, color: '#d97706', background: '#fffbeb',
                              border: '1px solid #fde68a', borderRadius: 6, padding: '2px 7px'
                            }}>
                              <Crown size={10} /> Winner
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--kp-ink3)' }}>
                          Game ID: {player.gameID}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {player.paymentScreenshot && !player.paymentApproved && (
                          <span style={{ 
                            padding: '4px 8px', fontSize: 11, fontWeight: 600,
                            background: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.2)',
                            color: '#ea580c', borderRadius: 6
                          }}>
                            <DollarSign size={10} style={{ display: 'inline', marginRight: 3 }} />
                            Payment Pending
                          </span>
                        )}
                        {player.paymentApproved && (
                          <span style={{ 
                            padding: '4px 8px', fontSize: 11, fontWeight: 600,
                            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                            color: '#059669', borderRadius: 6
                          }}>
                            <CheckCircle size={10} style={{ display: 'inline', marginRight: 3 }} />
                            Paid
                          </span>
                        )}
                        {player.screenshotURL && (
                          <span style={{ 
                            padding: '4px 8px', fontSize: 11, fontWeight: 600,
                            background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
                            color: '#2563eb', borderRadius: 6
                          }}>
                            <ImageIcon size={10} style={{ display: 'inline', marginRight: 3 }} />
                            Screenshot
                          </span>
                        )}
                        <ChevronDown size={16} style={{ 
                          color: 'var(--kp-ink3)', transition: 'transform 0.2s',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                        }} />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div style={{ 
                        padding: '0 16px 16px', borderTop: '1px solid var(--kp-border)',
                        marginTop: 8, paddingTop: 16
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          {/* Payment Section */}
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--kp-ink2)' }}>
                              <DollarSign size={12} style={{ display: 'inline', marginRight: 4 }} />
                              Payment Status
                            </h4>
                            
                            {player.paymentScreenshot ? (
                              <div>
                                <button
                                  onClick={() => viewImage(player.paymentScreenshot, 'Payment Screenshot')}
                                  className="btn-secondary"
                                  style={{ fontSize: 12, padding: '6px 12px', marginBottom: 8 }}
                                >
                                  <Eye size={12} style={{ marginRight: 4 }} />
                                  View Payment Screenshot
                                </button>
                                
                                {!player.paymentApproved && (
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                      onClick={() => approvePlayer(playerId, true)}
                                      className="btn-primary"
                                      style={{ fontSize: 12, padding: '6px 12px' }}
                                    >
                                      <CheckCircle size={12} style={{ marginRight: 4 }} />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => approvePlayer(playerId, false)}
                                      className="btn-secondary"
                                      style={{ 
                                        fontSize: 12, padding: '6px 12px',
                                        background: '#ef4444', borderColor: '#ef4444', color: 'white'
                                      }}
                                    >
                                      <XCircle size={12} style={{ marginRight: 4 }} />
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: 'var(--kp-ink3)' }}>
                                No payment screenshot uploaded
                              </div>
                            )}
                          </div>

                          {/* Game Screenshot Section */}
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--kp-ink2)' }}>
                              <ImageIcon size={12} style={{ display: 'inline', marginRight: 4 }} />
                              Game Screenshot
                            </h4>
                            
                            {player.screenshotURL ? (
                              <button
                                onClick={() => viewImage(player.screenshotURL, 'Game Screenshot')}
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: '6px 12px' }}
                              >
                                <Eye size={12} style={{ marginRight: 4 }} />
                                View Screenshot
                              </button>
                            ) : (
                              <div style={{ fontSize: 12, color: 'var(--kp-ink3)' }}>
                                No game screenshot submitted
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Image Modal */}
        {showImageModal && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 9999, padding: 20
            }}
            onClick={() => setShowImageModal(false)}
          >
            <div 
              className="card-clean"
              style={{ 
                maxWidth: '90vw', maxHeight: '90vh', position: 'relative',
                background: 'white', borderRadius: 12, padding: 16
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowImageModal(false)}
                style={{
                  position: 'absolute', top: 8, right: 8, background: 'transparent',
                  border: 'none', cursor: 'pointer', padding: 4, zIndex: 1
                }}
              >
                <X size={20} style={{ color: '#000' }} />
              </button>
              
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>
                {imageTitle}
              </h3>
              
              <img
                src={selectedImage}
                alt={imageTitle}
                style={{
                  maxWidth: '100%', maxHeight: '70vh',
                  objectFit: 'contain', borderRadius: 8
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
